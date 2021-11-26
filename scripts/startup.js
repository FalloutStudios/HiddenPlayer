const Version = require('./version');
const { Logger, loopString } = require('fallout-utility');

const log = new Logger('startup');

module.exports = () => {
    log.log(`ooooo   ooooo  o8o        .o8        .o8                       `);
    log.log(`.888'    888'   "'       "888       "888                       `);
    log.log(`.888     888  oooo   .oooo888   .oooo888   .ooooo.  ooo. .oo.  `);
    log.log(`.888ooooo888   888  d88'  888  d88'  888  d88'  88b  888P"Y88b `);
    log.log(`.888     888   888  888   888  888   888  888ooo888  888   888 `);
    log.log(`.888     888   888  888   888  888   888  888    .o  888   888 `);
    log.log(`o888o   o888o o888o  Y8bod88P"  Y8bod88P"  Y8bod8P' o888o o888o`);

    const length = 63;
    const version = 'v' + Version;
    const bar = loopString((length / 2) - (version.length - 2), '=');

    log.warn(`${bar} ${version} ${bar}`);
}