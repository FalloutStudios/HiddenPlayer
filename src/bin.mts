#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { Logger, LogLevels } from 'fallout-utility';
import { Config } from './lib/types/config.js';
import { fileURLToPath } from 'url';
import { Command } from 'commander';
import chalk from 'chalk';
import path from 'path';
import yml from 'yaml';
import { HiddenPlayer } from './lib/index.js';

var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var __version = JSON.parse(readFileSync(path.join(__dirname, '../../package.json'), 'utf-8')).version;

const cli = new Command()
    .name('hiddenplayer')
    .description('HiddenPlayer afk bot cli')
    .version(__version, '-v, --version')
    .option('-c, --config <file>', 'Config file path', './config.yml')
    .parse();

const configPath = cli.opts().config;
const config: Config = yml.parse(!existsSync(configPath) ? (() => {
    const defaultConfig = readFileSync(path.join(__dirname, '../../static/config.yml'), 'utf-8');

    mkdirSync(path.dirname(configPath), { recursive: true });
    writeFileSync(configPath, defaultConfig);

    return defaultConfig;
})() : readFileSync(configPath, 'utf-8'));

const console = new Logger({
    addPrefixToAllNewLines: true,
    enableDebugMode: config.logs.debugMode,
    ObjectInspectColorized: true,
    ObjectInspectDepth: 3,
    stringifyJSON: true,
    loggerName: 'HiddenPlayer',
    prefixes: {
        [LogLevels.INFO]: (name?: string) => `[${new Date().toLocaleTimeString(undefined, { hour12: false })}][${(name ? name + '/' : '') + 'INFO'}]`,
        [LogLevels.WARN]: (name?: string) => `[${chalk.yellow(new Date().toLocaleTimeString(undefined, { hour12: false }))}][${chalk.yellow((name ? name + '/' : '') + 'WARN')}]`,
        [LogLevels.ERROR]: (name?: string) => `[${chalk.red(new Date().toLocaleTimeString(undefined, { hour12: false }))}][${chalk.red((name ? name + '/' : '') + 'ERROR')}]`,
        [LogLevels.DEBUG]: (name?: string) => `[${chalk.blue(new Date().toLocaleTimeString(undefined, { hour12: false }))}][${chalk.blue((name ? name + '/' : '') + 'DEBUG')}]`,
    },
    formatMessages: {
        [LogLevels.INFO]: message => message,
        [LogLevels.WARN]: message => chalk.yellow(message),
        [LogLevels.ERROR]: message => chalk.red(message),
        [LogLevels.DEBUG]: message => chalk.cyan(message),
    }
});

if (config.logs.enabled) console.logFile(config.logs.latestLog);

// Start

const bot = new HiddenPlayer({
    ...config.auth,
    version: config.auth.version || undefined,
    reconnectTimeout: config.connection.reconnect.enabled ? config.connection.reconnect.timeout : undefined
});

console.log(`Starting hiddenplayer v${__version}`);

bot.on('ready', (_bot) => {
    console.log(`Bot is ready!`);

    _bot.bot.on('error', err => console.error(`An error occured:`, err));
    _bot.bot.on('kicked', reason => console.warn(`Bot has been kicked: `, reason));
    _bot.bot.on('chat', (username, message) => console.log(`${chalk.blue(username)} ${chalk.gray('>')} ${message}`))
});

bot.on('reconnect', () => {
    console.warn(`Bot is reconnecting`);
});

await bot.login();