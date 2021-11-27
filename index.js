/**
 * 
 * 
 * ██   ██ ██ ██████  ██████  ███████ ███    ██ ██████  ██       █████  ██    ██ ███████ ██████  
 * ██   ██ ██ ██   ██ ██   ██ ██      ████   ██ ██   ██ ██      ██   ██  ██  ██  ██      ██   ██ 
 * ███████ ██ ██   ██ ██   ██ █████   ██ ██  ██ ██████  ██      ███████   ████   █████   ██████  
 * ██   ██ ██ ██   ██ ██   ██ ██      ██  ██ ██ ██      ██      ██   ██    ██    ██      ██   ██ 
 * ██   ██ ██ ██████  ██████  ███████ ██   ████ ██      ███████ ██   ██    ██    ███████ ██   ██
 * 
 * 
*/

require('./scripts/startup')();

const Util = require('fallout-utility');
const CreateBot = require('./scripts/createBot');
const Config = require('./scripts/config');
const Language = require('./scripts/language');
const Plugins = require('./scripts/plugins');

// Configure the bot
const log = new Util.Logger("Main");
let config = new Config('./config/config.yml').parse().testmode().prefill().getConfig();
let language = new Language('./config/language.yml').parse().getLanguage();

// Create the bot
function createBot() {
    const consolePrefix = `Bot`;
    let error = false;
    let plugins = {};

    // Create the bot
    log.log("Creating bot...", consolePrefix);
    const bot = new CreateBot()
                .setBotName(config.player.username)
                .setBotVersion(config.player.version)
                .setServerHost(config.server.host)
                .setServerPort(config.server.port)
                .createBot();
    
    // Load plugins
    log.log("Bot created!", consolePrefix);
    plugins = config.plugins.enabled ? Plugins(bot, config, language) : null;
    bot.HiddenPlayer = {
        config: config,
        language: language,
        plugins: plugins
    }

    // Events
    bot.on('spawn', () => {
        log.log("Bot Spawned!", consolePrefix);
    });

    // Exit events
    bot.on('kicked', reason => log.warn(`Bot was kicked:\n${JSON.parse(reason)?.text}`, `${consolePrefix} Kicked`));
    bot.on('error', err => {
        if(config.server.reconnect.autoReconnectOnError || error) return;

        log.error(`Bot error occured:\n${err}`, `${consolePrefix} Error`);
        if(Util.ask("Bot error has occured! Would you like to continue? (y/n) >>> ").toString().toLowerCase() !== "y") {
            process.exit(0);
        }

        error = true;
    });
    bot.on('end', () => {
        log.warn("Bot Ended!", consolePrefix);

        // Reconnect
        if(!config.server.reconnect.enabled) return;
        log.log(`Reconnecting in ${config.server.reconnect.timeout / 1000}s`, consolePrefix);
        setTimeout(() => createBot(), config.server.reconnect.timeout);
    })
}

createBot();