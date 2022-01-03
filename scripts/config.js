const Yml = require('yaml');
const Fs = require('fs');
const Path = require('path');
const Version = require('../scripts/version');

module.exports = class Config {
    constructor(configLocation = './config/config.yml') {
        this.configLocation = configLocation;
        this.config = '---\n';
    }

    parse() {
        if(!Fs.existsSync(this.configLocation)) {
            Fs.mkdirSync(Path.dirname(this.configLocation), { recursive: true });
            Fs.writeFileSync(this.configLocation, this.getDefaultConfig());
        }

        this.config = Fs.readFileSync(this.configLocation, 'utf8');
        return this;
    }

    validate() {
        const config = this.config ? this.toJson() : null;
        if(!config) throw new Error('Config file is empty');

        if(!config.version || config.version !== Version) throw new Error('Config version is not set');
        
        if(!config.server) throw new Error('Server config is not set');
        switch (config.server) {
            case (!config.server?.host): throw new Error('Server host is not set');
            case (!config.server?.port): throw new Error('Server port is not set');
        }

        if(!config.player) throw new Error('Player config is not set');
        switch (config.player) {
            case (this.validateUsername(config.player?.username)): throw new Error('Player username is not valid');
            case (config.player?.password):
                if(!config.player?.auth || config.player?.auth && (!config.player?.auth !== 'mojang' || !config.player?.auth !== 'microsoft')) throw new Error('Player auth is not valid');
                break;
        }

        if(!config.actions) throw new Error('Actions config is not set');
        switch (config.actions) {
            case (!config.actions?.message): throw new Error('Actions message is not set');
            case (!config.actions?.message?.logMessages): throw new Error('Actions message logMessages is not set');
            case (!config.actions?.message?.onJoinMessage): throw new Error('Actions message onJoinMessage is not set');
            case (!config.actions?.message?.messageAutoResponse): throw new Error('Actions message messageAutoResponse is not set');
            case (!config.actions?.disconnect): throw new Error('Actions disconnect is not set');
            case (!config.actions?.disconnect?.reconnect): throw new Error('Actions disconnect reconnect is not set');
        }

        return this;
    }

    validateUsername(username) {
        if(!username) return false;
        if(isEmail(username)) return true;

        const regex = /([a-zA-Z0-9_]{3,16})|(\*[a-zA-Z0-9_]{4,17})/;;
        
        return regex.test(username) ? true : false;

        
        function isEmail(str) {
            const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            return emailRegex.test(String(str).toLowerCase());
        }
    }

    toJson() {
        return Yml.parse(this.config);
    }

    getDefaultConfig() {
        return `# Server Configuration
server:
  # Server IP without port
  host: 127.0.0.1

  # Server port
  port: 25565

  # Set server version (Empty to use the supported version)
  version:

# Player Configuration
player:
  # Player display Name (To use Mojang/Microsoft account put your email here)
  username: HiddenPlayer

  # For Mojang/Microsoft account authentication
  # ===========================================

  # Set Mojang/Microsoft account password (Empty if you want to use cracked)
  password:

  # Set account authentication this can be (mojang) or (microsoft)
  auth: 'mojang'

# Actions
actions:
  # Actions for server messages
  message:
    # Log messages
    logMessages:
      # Toggle message logging
      enabled: true
    
    # Join message
    onJoinMessage:
      # Toggle on join messages
      enabled: true

      # Timout before sending each messages
      sendTimeout: 5000

      # Messages eg: ['/register password password', '/login password']
      messages: ['Hello!']

    # Auto response messages
    messageAutoResponse:
      # Toggle message auto response
      enabled: false

      # Responses
      responses:
      # - phrase: 'hello'    (Reply to this message)
      #   reply: 'hi'       (Response to the given message, for ransom response use "reply: ['reply1','reply2']" without quotes)
      #   matchCase: false  (If true messages should match capital and lowercase letters)
        - phrase: hi
          reply: hello
          matchCase: false
  
  # Actions for player disconnect
  disconnect:
    # Reconnect bot on disconnect
    reconnect:
      # Toggle reconnect
      enabled: true
      
      # Timeout before reconnect
      reconnectTimeout: 5000


# ==========================
# DON't MODIFY VALUES BELLOW
# ==========================

# Latest log file location
logFile: './logs/latest.log'

# supported config version
version: '2.0.0'`;
    }
}