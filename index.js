const Util = require('fallout-utility');
const Mineflayer = require('mineflayer');
const Config = require('./scripts/config');

const ms = require('ms');
const chats = require('./scripts/chat');
const createBot = require('./scripts/createBot');
const config = new Config().parse().validate().toJson();

const print = new Util.Logger('Main');

makeBot();

function makeBot() {
    print.info('Creating bot...');
    print.info(createBot(config));

    const bot = new Mineflayer.createBot(createBot(config));

    bot.config = config;
    bot.logger = print;

    bot.once('spawn', () => {
        print.warn('Bot spawned');
        chats(bot);
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