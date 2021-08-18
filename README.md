# HiddenPlayer Bot
Simple Minecraft player bot and and Discord bot.

Pre-requirement:
- [x] Node.js

If you haven't `node.js` installed yet you can download it here: https://nodejs.org/

This is my practice project sorry for low quality code lol.

## config/config.yml

This is the default `config.yml` contents.

```yml
# Server Information
server:
  # Server IP address without port (Ask if empty)
  ip:
  
  # Server port (Ask if empty)
  port:
  
  # Reconnect interval timout when player disconnects
  reconnectTimeout: 5000

# Player Config
player:
  # Enable Player
  enabled: true
  
  # Player Name (Ask if empty)
  name:
  
  # Minecraft version (Supported latest version when empty)
  version:

  # Log death counts
  countdeaths:
    enabled: true # Enable death count logging
    src: config/deathcount.txt # Source file
  
  message: hello # Message on join
  
  # Attack hostile mobs
  pvp:
    enabled: false # Enable hostile mobs attack
  
    # Some bot commands
  commands:
    kill: false # Enable !kill <PlayerName>
    reload: true # Enable !reload
    restart: true # Enable !restart

# Player chat delay
chat:
  chatDelay: 500

# Enable Game autosave (OP permission required)
autosave:
  enabled: false # Enable autosave
  interval: 60000 # Autosave interval

# Admins for Player commands
staffs: 

# Discord Configuration
discord:
  # Enable discord bot
  enabled: true
  
  # Discord bot token
  token: 
  
  # Discord bot status
  presence:
    enable: true # Enable Discord bot status
    status: online # Bot status ( online, idle, dnd )
    type: PLAYING # Bot activity ( PLAYING, LISTENING, WATCHING )
    name: Minecraft # Bot activity name
    url: https://minecraft.net # Bot activity url
  
  # Bot on message call prefixes
  prefix:
  - hiddenplayer
  - hidden
  - hd
  
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
    # make sure the disabled channel id is between single quotes [ ' ]
    disabled_channels:
    
  
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
version: 1.5.18
```
### Discord not working?

Try Replacing `token: ...` with your bot's valid client token: 
```yml
discord:
  token: # Discord bot client token
```
