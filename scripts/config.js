const Yml = require('yaml');
const Version = require('./version');
const Commander = require('commander');
const { ask } = require('fallout-utility');
const MakeConfig = require('./makeConfig');

const commands = new Commander.Command;
    commands.option('-T, --testmode', 'Enable test mode');
    commands.option('-h, --host <ip>', 'Minecraft server host');
    commands.option('-p, --port <port>', 'Minecraft server port');
    commands.option('-P, --playername <username>', 'Minecraft bot username');
    commands.option('-V, --version <version>', 'Minecraft server version');
    commands.parse();

module.exports = class {
    /**
     * 
     * @param {string} location - Config file location
     */
    constructor(location) {
        this.location = location;
        this.config = null;
    }

    parse() {
        if(!this.location || this.location == null) throw new Error('No config file path provided');

        const config = Yml.parse(MakeConfig(this.location, generateConfig()));
        
        if(config.version != Version) throw new Error('Config version isn\'t compatible. Version: ' + config.version + '; Supported: ' + Version);
        this.config = config;

        return this;
    }

    testmode() {
        if(!commands.opts().testmode) return this;

        this.config.server.host = commands.opts().host              ?    commands.opts().host          :    'localhost';
        this.config.server.port = commands.opts().port              ?    commands.opts().port          :    25565;
        this.config.player.version = commands.opts().version        ?    commands.opts().version       :    this.config.player.version;
        this.config.player.username = commands.opts().playername    ?    commands.opts().playername    :    this.config.player.username;

        return this;
    }

    prefill() {
        this.config.server.host = !this.config.server.host            ?    ask(`Server IP (No Port) >>> `)    :    this.config.server.host;
        this.config.server.port = !this.config.server.port            ?    ask(`Server Port >>> `)            :    this.config.server.port;
        this.config.player.version = !this.config.player.version      ?    ask(`Server Version >>> `)         :    this.config.player.version;
        this.config.player.username = !this.config.player.username    ?    ask(`Player Name >>> `)            :    this.config.player.username;

        return this;
    }

    getConfig() {
        return this.config;
    }
}

function generateConfig() {
    return `# Server configuration
server:
  # Server IP address
  host: localhost

  # Server port
  port: 25565

  # Timeout for reconnecting to server (Milliseconds)
  reconnectTimeout: 5000


# Player configuration
player:
  # Bot player username
  username:

  # Minecraft server version (Will use latest version if empty)
  version:

# Bot plugins configuration
plugins:
  # Enable bot plugins
  enable: true

  # Bot commands from plugins
  commands:
    # Admin only commands (Only admins can use them)
    adminOnlyCommands: ['command1', 'command2']

    # Admin names list
    admins: ['yourname', 'adminname']
    

# DANGER ZONE! DON'T MODIFY VALUES BELOW IF YOU DON'T KNOW WHAT YOU'RE DOING

# Config file version (Don't modify! it might cause errors)
version: ${Version}`;
}