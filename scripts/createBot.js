module.exports = (config) => {
    let bot = {};

    bot.host = config.server.host;
    bot.port = config.server.port;
    bot.username = config.player.username;

    if(config.player.password) bot.password = config.player.password;
    if(config.player.password && config.player.auth) bot.auth = config.player.auth;
    if(config.server.version) bot.version = config.server.version;

    return bot;
}