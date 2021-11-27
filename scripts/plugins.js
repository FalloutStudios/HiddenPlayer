const Util = require('fallout-utility');
const cmd = require('mineflayer-cmd').plugin;
const Fs = require('fs');
const Path = require('path');

const log = new Util.Logger("Plugins");

module.exports = async (Bot, location, config, language) => {
    log.warn("Loading plugins...");

    let scripts = [];
    location = Path.join(location, config.plugins.pluginsFolder);

    // Load minified plugins
    Bot.loadPlugin(cmd);

    // Load plugins
    const files = readDir(config.plugins.pluginsFolder);

    log.warn(`found ${files.length} plugin(s).`);
    for (const file of files) {
        const constructor = require(Path.join(location, file));

        try {
            if(constructor?.versions && !constructor.versions.find(version => version === config.version)) throw new Error(`Unsupported plugin version: ${config.version} (supported: ${config.version})`);

            switch (constructor?.start) {
                case constructor?.start.constructor.name === 'AsyncFunction':
                    await constructor.start(Bot, config, language);
                    break;
                case constructor?.start.constructor.name === 'Function':
                    constructor.start(Bot, config, language);
                    break;
                default:
                    throw new Error(`Invalid plugin start function: ${constructor.start}`);
            }

            scripts.push(constructor);
            log.log(`Plugin ${file}.js loaded!`);
        } catch (err) {
            log.error(`Error loading plugin ${file}: ${err}`, `${file}.js`);
            log.error(err, `${file}.js`);
        }
    }

    return scripts;
}

function readDir(path) {
    if(!Fs.existsSync(path)) Fs.mkdirSync(path, { recursive: true }); 

    return Fs.readdirSync(path).filter(file => (file.endsWith('.js') && !file.startsWith('_')));
}