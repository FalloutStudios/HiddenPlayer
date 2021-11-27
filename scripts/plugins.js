const Util = require('fallout-utility');
const cmd = require('mineflayer-cmd').plugin;
const Fs = require('fs');
const Path = require('path');

const log = new Util.Logger("Plugins");

module.exports = function(Bot, config, language) {
    log.log("Loading plugins...");

    // Load minified plugins
    Bot.loadPlugin(cmd);

    // Load plugins
    const files = readDir(config.plugins.pluginsFolder);

    console.log(files);
}

function readDir(folder) {
    const path = Path.join(__dirname, folder);
    if(!Fs.existsSync(path)) Fs.mkdirSync(path, { recursive: true }); 

    return Fs.readdirSync(path).filter(file => (file.endsWith('.js') && !file.startsWith('_')));
}