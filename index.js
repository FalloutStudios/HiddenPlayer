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
const Mineflayer = require('mineflayer');

const Config = require('./scripts/config');
// const Language = require('./scripts/language');

// Configure the bot
let config = new Config('./config/config.yml').parse().testmode().prefill().getConfig();