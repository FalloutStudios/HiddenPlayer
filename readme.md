# HiddenPlayer Bot
Simple Minecraft player bot and and Discord bot.

## Config.json

Config file explanation: `Don't use this in your config.json (Comments are not allowed)`
```jsonc
{
	"server": {
		"ip": "127.0.0.1", //server ip
		"port": 25565, //server port
		"reconnectTimeout": 5000 //reconnect delay timeout
	},
	"player": {
		"enabled": true, //enable Minecraft bot
		"name": null, //Minecraft bot name (if null console will ask for name)
		"version": null, //Minecraft version
		"countdeaths": {
			"enabled": true, //Count deaths
			"src": "assets/deathcount.txt" //death count fole source (.txt)
		},
		"message": "hello", //On join message
		"pvp": {
			"enabled": true //Fight hostile mobs
		},
		"commands": {
			"kill": true, //enable !kill command
			"reload": true, //enable !reload command
			"restart": true //enable !restartbot command
		}
	},
	"chat": {
		"chatDelay": 500 //chat response delay
	},
	"autosave": {
		"enabled": false, //enable autosave game 
		"interval": 60000 //save-all command interval
	},
	"staffs": {
		"GhexterCortes": "admin", //admin
		"GhescaCortes": "admin"  //admin
	},
	"discord": {
		"enabled": true, //enable discord bot
		"token": "BOT_KEY_HERE", //bot key
		"user_id": "854230366088200233", //bot user_id
		"presence": {
			"enable": true, //enable bot presence
			"status": "online", //status ONLINE, IDLE, DND (Do not disturb)
			"type": "PLAYING", //type PLAYING, LISTENING, WATCHING
			"name": "Minecraft", //name any
			"url": null //url any
		},
		"prefix": ["hiddenplayer", "hidden", "hd"], //discord message call prefix
		"command-prefix": ">", //discord command prefix
		"embed_messages": true, //enable >embed command
		"embed": {
			"color": "#0099ff" //embed theme color
		},
		"send_bot_messages": true, //enable >send command
		"spam": {
			"enabled": true, //enable >spam command
			"player_ping": true, //allow pings on >spam command
			"max": 30, //max spam rate
			"disabled_channels": [] //disable channels for >spam command
		},
		"motivate": {
			"enabled": true, //enable motivate quotes
			"src": "assets/motivate.json" //motivate quotes source
		},
		"emotes": {
			"enabled": true, //enable emotes
			"src": "assets/emotes.json" //emotes source
		},
		"react": {
			"enabled": true, //enable reacts
			"src": "assets/reacts.json" //reacts source
		},
		"facts": {
			"enabled": true, //enable facts
			"src": "assets/facts.json" //facts source
		}
	},
	"database": {
		"enabled": true, //enable database
		"host": "127.0.0.1", //database host
		"user": "root", //databse username
		"pass": "", //database password
		"database": "bot" //database name
	},
	"debug": {
		"enabled": true, //enable debug logs
		"movements": false, //enable movement logs
		"discord_chats": true, //show discord chats
		"minecraft_chats": true, //show minecraft chats
		"prefix": "", //debug mode Mincraft bot prefix
		"suffix": "" //debug mode Minecraft bot suffix
	},
	"messages": "assets/messages.json", //messages source file
	"responses": "assets/response.json", //message response source file
	"version": "1.5.17" //config version (Don't change)
}
```

## Default config.json

This is the default `config.json` contents. You can use this in your `config.json` file

```json
{
	"server": {
		"ip": "127.0.0.1",
		"port": 25565,
		"reconnectTimeout": 5000
	},
	"player": {
		"enabled": true,
		"name": null,
		"version": null,
		"countdeaths": {
			"enabled": true,
			"src": "assets/deathcount.txt"
		},
		"message": "hello",
		"pvp": {
			"enabled": true
		},
		"commands": {
			"kill": true,
			"reload": true,
			"restart": true
		}
	},
	"chat": {
		"chatDelay": 500
	},
	"autosave": {
		"enabled": false,
		"interval": 60000
	},
	"staffs": {
		"GhexterCortes": "admin",
		"GhescaCortes": "admin"
	},
	"discord": {
		"enabled": true,
		"token": "Discord_bot_token_here",
		"user_id": "854230366088200233",
		"presence": {
			"enable": true,
			"status": "online",
			"type": "PLAYING",
			"name": "Minecraft",
			"url": null
		},
		"prefix": ["hiddenplayer", "hidden", "hd"],
		"command-prefix": ">",
		"embed_messages": true,
		"embed": {
			"color": "#0099ff"
		},
		"send_bot_messages": true,
		"spam": {
			"enabled": true,
			"player_ping": true,
			"max": 30,
			"disabled_channels": []
		},
		"motivate": {
			"enabled": true,
			"src": "assets/motivate.json"
		},
		"emotes": {
			"enabled": true,
			"src": "assets/emotes.json"
		},
		"react": {
			"enabled": true,
			"src": "assets/reacts.json"
		},
		"facts": {
			"enabled": true,
			"src": "assets/facts.json"
		}
	},
	"database": {
		"enabled": true,
		"host": "127.0.0.1",
		"user": "root",
		"pass": "",
		"database": "bot"
	},
	"debug": {
		"enabled": true,
		"movements": false,
		"discord_chats": true,
		"minecraft_chats": true,
		"prefix": "",
		"suffix": ""
	},
	"messages": "assets/messages.json",
	"responses": "assets/response.json",
	"version": "1.5.17"
}
```
### Discord not working?

Try Replacing `"token": ...` with your bot's valid client secret: 
```
"discord": {
	...,
	"token": "Your_discord_bot_token_here", //get your client secret(token) from https://discord.com/developers/applications/BOT_ID/oauth2
	...
}
```
