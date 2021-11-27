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

// Configure the bot
const log = new Util.Logger("Main");
let config = new Config('./config/config.yml').parse().testmode().prefill().getConfig();
let language = new Language('./config/language.yml').parse().getLanguage();

// Create the bot
function createBot() {
    // Create the bot
    log.log("Creating bot...");
    const bot = new CreateBot()
                .setBotName(config.player.username)
                .setBotVersion(config.player.version)
                .setServerHost(config.server.host)
                .setServerPort(config.server.port)
                .createBot();

    // Check bot
    if(!bot) (() => (Util.ask("Bot creation error! would you like to create a new? (y/n)") == 'y' ? createBot() : process.exit(0)))();
    log.log("Bot created!");

    // Events
    bot.on('spawn', () => {
        log.log("Bot Spawned!");
    });

    // Exit events
    bot.on('end', () => {
        log.warn("Bot Ended!");

        // Reconnect
        if(!config.server.reconnect.enabled) return;
        log.log(`Reconnecting in ${config.server.reconnect.timeout / 1000}s`);
        setTimeout(() => createBot(), config.server.reconnect.timeout);
    })
}

createBot();