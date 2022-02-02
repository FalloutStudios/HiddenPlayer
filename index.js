const Util = require('fallout-utility');
const Mineflayer = require('mineflayer');
const Pathfinder = require('mineflayer-pathfinder');
const Config = require('./scripts/config');

const ms = require('ms');
const chats = require('./scripts/chat');
const movement = require('./scripts/movement');
const createBot = require('./scripts/createBot');
const config = new Config().parse().validate().toJson();

const pathfinder = require('./scripts/pathfinder');

const print = new Util.Logger('Main').logFile(config.logFile);

makeBot();

function makeBot() {
    print.info('Creating bot...');
    print.info(createBot(config));

    const bot = new Mineflayer.createBot(createBot(config));

    bot.loadPlugin(Pathfinder.pathfinder);

    bot.config = config;
    bot.logger = print;

    pathfinder(bot, Pathfinder);

    bot.once('spawn', () => {
        print.warn('Bot spawned');
        chats(bot);
    });

    bot.on('spawn', () => {
        movement(bot);
    });

    bot.on('error', (err) => {
        print.error(`Error: ${err}`);
        bot.end();
    });
    bot.on('kicked', (reason) => {
        print.warn(`Kicked: ${reason}`);
        bot.end();
    });

    bot.on('end', () => {
        print.warn('Bot disconnected');

        if(config.actions.disconnect.reconnect.enabled) {
            print.log(`Reconnecting ${ms(config.actions.disconnect.reconnect.reconnectTimeout, { long: true })}...`);
            setTimeout(() => {
                makeBot();
            }, config.actions.disconnect.reconnect.reconnectTimeout);
        } else {
            print.log('Exiting...');
        }
    });
}

process.on('uncaughtException', (err) => {
    print.error(err);
    setTimeout(() => process.exit(1), 10);
});
process.on('unhandledRejection', (err) => {
    print.error(err);
    setTimeout(() => process.exit(1), 10);
});