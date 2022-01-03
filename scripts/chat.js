const { getRandomKey } = require('fallout-utility');

module.exports = async (bot) => {
    const config = bot.config;
    const print = bot.logger;
    
    bot.on('chat', (username, message) => {
        if(config.actions.message.logMessages.enabled) print.log(`${username}: ${message}`);

        if(config.actions.message.messageAutoResponse.enabled && username != bot.username) {
            const find = config.actions.message.messageAutoResponse.responses.find(m => !m.matchCase && m.phrase?.toLowerCase().trim() === message.toLowerCase().trim() || m.matchCase && m.phrase?.trim() === message.trim());

            if(find?.reply) bot.chat(getRandomKey(find.reply));
        }
    });

    if(config.actions.message.onJoinMessage.enabled) {
        const messages = config.actions.message.onJoinMessage.messages;
        const delay = config.actions.message.onJoinMessage.sendTimeout;

        for (const message of messages) {
            bot.chat(message);
            await sleep(delay);
        }
    }

    function sleep (ms) { return new Promise(resolve => setTimeout(resolve, ms)); };
}