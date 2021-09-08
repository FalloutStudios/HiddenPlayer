# HiddenPlayer Bot [![Build Status](https://app.travis-ci.com/FalloutStudios/Grigora.svg?branch=master)](https://app.travis-ci.com/FalloutStudios/Grigora)
Simple Minecraft player bot and and Discord bot.

### WARNING! 
- Using this bot may violate some server hosting Terms of Service and EULA.
- Use this bot only on your own server `Use it on other server at your own risk`

### Requirement
- [x] Node.js

If you haven't `node.js` installed yet you can download it here (**requires Node 16.7.x or higher**): https://nodejs.org/

This is my practice project.

## config/config.yml

This is the default `config.yml` contents.

```yml
# Server Information
server:
  # Server IP address without port (Ask if empty)
  ip: play.ourmcworld.ml
  
  # Server port (Ask if empty)
  port: 39703
  
  # Reconnect interval timout when player disconnects
  reconnectTimeout: 5000

# Player Config
player:
  # Enable Player
  enabled: true
  
  # Player Name (Ask if empty)
  name: HiddenPlayer
  
  # Minecraft version (Will use supported latest version when empty)
  version:

  # Web viewer
  # Still not implemented
  Viewer:
    enabled: false
    port: 300

  # Log death counts
  countdeaths:
    enabled: true # Enable death count logging
    src: config/deathcount.txt # Source file
  
  message: '/login hello' # Message on join
  
  # Attack hostile mobs
  pvp:
    enabled: true # Enable mobs attack
  
  # Some bot commands
  commands:
    reload: true # Enable !reload
    restart: true # Enable !restart
  
    # Admins for Player commands
  admin: ['GhexterCortes']

  # Player chat delay
  chatDelay: 500

  # Enable Game autosave (OP permission required)
  autosave:
    enabled: false # Enable autosave
    interval: 60000 # Autosave interval

    
# Discord Configuration
discord:
  # Enable discord bot
  enabled: true
  
  # Discord bot token
  token: 
  
  # Discord bot status
  presence:
    enable: true # Enable Discord bot status
    status: dnd # Bot status ( online, idle, dnd )
    type: PLAYING # Bot activity ( PLAYING, LISTENING, WATCHING, STREAMING )
    name: Minecraft # Bot activity name
    url: https://minecraft.net # Bot activity url
  
  # Bot on message call prefixes
  prefix:
  - hiddenplayer
  - hidden
  
  command-prefix: ">" # Bot command prefix
  
  # Embed Command
  embed:
    enabled: true # Enable Embed
    color: "#0099ff" # Embed Color
  
  # Enable !send command
  send-command: true
  
  # Enable !spam (count) <Message> command
  spam:
    enabled: true # Enable spam command
    player_ping: true # Allow pings in spam messages
    max: 100 # Spam limit 

    # Disabled channels
    # make sure the disabled channel id is valid
    disabled_channels: []
  
  # Show player death count on Discord via command !deathcount
  deathcount:
    enabled: false
  
  # Enable random quotes message call
  motivate:
    enabled: false
    src: config/motivate.yml
  
  # Enable random facts message call
  facts:
    enabled: false
    src: config/facts.yml
  # Enable random gifs emote message call
  emotes:
    enabled: true
    src: config/emotes.yml

  # Enable random reaction gifs message call
  react:
    enabled: true
    src: config/reacts.yml

  # Ignored channels
  # make sure the ignored channel id is valid
  ignored_channels: []

  # make ignored channels to channel whitelist
  ignored_to_whitelist: false

  # Ignored users
  # make sure the ignored user id is valid
  ignored_users: []

# Database Configuration (Still unused)
database:
  enabled: false # Database enabled
  host: 127.0.0.1 # Database host
  user: root # Database username
  pass: '' # Database password
  database: bot # Database name

# Debugging log
debug:
  enabled: true  # Enable logs
  movements: false # Log player movements
  discord_chats: true # Show discord chats
  minecraft_chats: true # Show in-game chats
  prefix: '' # Debug mode playername prefix
  suffix: '' # Debug mode playername suffix

language: config/language.yml # Language file 
responses: config/response.yml # Custom reponse file

# Config version (Please don't modify)
version: 1.8.4
```
### Discord not working?

Try Replacing `token: ...` with your bot's valid client token: 
```yml
discord:
  token: # Discord bot client token
```
