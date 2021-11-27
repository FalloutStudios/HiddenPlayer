const Mineflayer = require('mineflayer');
const { isNumber } = require('fallout-utility');

module.exports = class Bot {
    constructor() {
        this.botName = null;
        this.botVersion = null;
        this.serverHost = null;
        this.serverPort = null;
    }

    setBotName(botName) {
        if(!validateUsername(botName)) throw new Error("Invalid bot name");
        
        this.botName = botName;
        return this;
    }

    setServerHost(serverHost) {
        if(!serverHost) throw new Error("Invalid server host");

        this.serverHost = serverHost;
        return this;
    }

    setServerPort(serverPort) {
        if(!(isNumber(serverPort) && validatePort(parseInt(serverPort)))) throw new Error("Invalid server port");

        this.serverPort = serverPort;
        return this;
    }

    setBotVersion(botVersion) {
        if(!botVersion) throw new Error("Invalid bot version");

        this.botVersion = botVersion;
        return this;
    }

    createBot() {
        return Mineflayer.createBot({
            host: this.serverHost,
            port: this.serverPort,
            username: this.botName,
            version: this.botVersion,
        });
    }
}

function validateUsername(username) {
    return /^[a-zA-Z0-9_]{3,16}$/.test(username);
}

function validatePort(port) {
    return /^[0-9]{1,5}$/.test(port);
}