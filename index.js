// HiddePlayer GPL-3.0 License

//Packages
//Mineflayer bot
const mineflayer = require('mineflayer');
const cmd = require('mineflayer-cmd').plugin;
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const pvpBot = require('mineflayer-pvp').plugin;

//read user input
const prompt = require("prompt-sync")();

//yaml parser
const yml = require('yaml');

//Fs
const fs = require('fs');

//request
const request = require("request");

//mysql
const mysql = require('mysql');

//Discord
const Discord = require('discord.js');

//configuration file
const configlocation = 'config/config.yml';
let conf = fs.readFileSync(configlocation, 'utf8');
let config = yml.parse(conf);

//debug enabled/disabled
let debug = config['debug']['enabled'];

//databes conf
let db_enable = config['database']['enabled'];
let db_host = config['database']['host'];
let db_user = config['database']['user'];
let db_pass = config['database']['pass'];
let db_name = config['database']['database'];

//messages and response files
//messages null check
if (config['language'] == null) {
    console.error('\x1b[31m%s\x1b[0m', '[Error - Config] Can\'t load messages file');
    process.exit(0);
}
if (config['responses'] == null) {
    console.error('\x1b[31m%s\x1b[0m', '[Error - Config] Can\'t load response messages file');
    process.exit(0);
}

//parse messages and response files
let messages = yml.parse(fs.readFileSync(config['language'], 'utf8'));
let messageResponseFile = yml.parse(fs.readFileSync(config['responses'], 'utf8'));

//messages and reponse files version check
if(messages['version'] != config['version']) {
    console.error('\x1b[31m%s\x1b[0m', '[Error - Config] Config version doesn\'t match messages file version');
    process.exit(0);
}
if(messageResponseFile['version'] != config['version']) {
    console.error('\x1b[31m%s\x1b[0m', '[Error - Config] Config version doesn\'t match response messages file version');
    process.exit(0);
}

//config version
const configVersion = config['version'];

//Discord connected false
var discordConnected = false;

//Minecraft bot connected false
var MinecraftConnected = false;

//Database connected null
var conn = null;

//start-up design
console.log();
console.log();

console.log(' __    __    ________    ________     ________     ______   ______     __');
console.log('|  |  |  |  |__    __|  |   ___  \\   |   ___  \\   |   ___|  |     \\   |  |');
console.log('|  |__|  |     |  |     |  |   |  |  |  |   |  |  |  |___   |  |\\  \\  |  |');
console.log('|   __   |     |  |     |  |   |  |  |  |   |  |  |   ___|  |  | \\  \\ |  |');
console.log('|  |  |  |   __|  |__   |  |___|  |  |  |___|  |  |  |___   |  |  \\  \\|  |');
console.log('|__|  |__|  |________|  |________/   |________/   |______|  |__|   \\_____|');
console.log();

//get inline playername when config playername is null
if(config['player']['enabled'] && config['player']['name'] == null || config['player']['enabled'] && config['player']['name'] == ''){

    //ask for playername
    config['player']['name'] = prompt("Enter Player Name >>> ");
}

//get inline server ip when config server ip is null
if(config['player']['enabled'] && config['server']['ip'] == null || config['player']['enabled'] && config['server']['ip'] == ''){
    
    //ask for ip address
    config['server']['ip'] = prompt("Enter Server IP (Don't include Port) >>> ");
}

//get inline server port when config server port is null
if(config['player']['enabled'] && config['server']['port'] == null || config['player']['enabled'] && config['server']['port'] == ''){
    
    //ask for ip address
    config['server']['port'] = prompt("Enter Server Port (Enter to use default) >>> ");
    
    //make null if NaN
    if(isNaN(config['server']['port'])){
        config['server']['port'] = null;
    }
}

//set mincraft player fullname
var fullname = config['debug']['prefix']+config['player']['name']+config['debug']['suffix'];

//add whitespace to look pretty
if(fullname != ''){
    fullname += ' ';
}

console.log('============================ '+fullname+configVersion+' ===========================');
console.log();
console.log();
console.log('GitHub: https://github.com/GhexterCortes/minecraft-bot');
console.log();
console.log('========================================================='+loop(fullname.length, '=')+loop(configVersion.length, '='));

console.log();
console.log();

//disable functions if null in config
//disable minecraft player if name is null
if(config['player']['name'] == null || config['player']['name'] == ''){
    config['player']['enabled'] = false;
}
//disable discord if token is null
if(config['discord']['token'] == null){
    config['discord']['enabled'] = false;
}

//Parse reloaded config file
function parse (url = null){
    //success pre variable
    var success = false;

    //parse default config
    var body_conf = fs.readFileSync(configlocation, 'utf8');

    //parse JSON
    var body_config = yml.parse(body_conf);

    if(debug) {
        console.log('\x1b[32m%s\x1b[0m','[Log - Config] '+messages['reload_config']);
        console.log(body_config);
    }

    //get config version
    var confV = body_config['version'];

    //throw error when versions doesn't match
    if(configVersion != confV) {
        console.error('\x1b[31m%s\x1b[0m', '[Error - Config] '+messages['reload_config']['different_versions']);
        return success;
    } else{
        success = true;
    }

    //change config contents
    config = body_config;

    //debug enabled/disabled
    debug = config['debug']['enabled'];

    //databes conf
    db_enable = config['database']['enabled'];
    db_host = config['database']['host'];
    db_user = config['database']['user'];
    db_pass = config['database']['pass'];
    db_name = config['database']['database'];

    //messages and response files
    //messages null check
    if (config['language'] == null) {
        console.error('\x1b[31m%s\x1b[0m', '[Error - Config] Can\'t load messages file');
        process.exit(0);
    }
    if (config['responses'] == null) {
        console.error('\x1b[31m%s\x1b[0m', '[Error - Config] Can\'t load response messages file');
        process.exit(0);
    }

    //parse messages and response files
    messages = yml.parse(fs.readFileSync(config['language'], 'utf-8'));
    messageResponseFile = yml.parse(fs.readFileSync(config['responses'], 'utf8'));

    //messages and reponse files version check
    if(messages['version'] != config['version']) {
        console.error('\x1b[31m%s\x1b[0m', '[Error - Config] Config version doesn\'t match messages file version');
        process.exit(0);
    }
    if(messageResponseFile['version'] != config['version']) {
        console.error('\x1b[31m%s\x1b[0m', '[Error - Config] Config version doesn\'t match response messages file version');
        process.exit(0);
    }

    if(debug) console.log('\x1b[32m%s\x1b[0m','[Log - Config] '+messages['reload_config']['success']);

    //disable functions if null in config
    //disable minecraft player if name is null
    if(config['player']['name'] == null || config['player']['name'] == ''){
        config['player']['enabled'] = false;
    }
    //disable discord if token is null
    if(config['discord']['token'] == null){
        config['discord']['enabled'] = false;
    }

    if(success){
        //restart all proccesses
        connectDB();
        if(config['discord']['enabled']) DiscordBot();
        if(config['player']['enabled']) newBot();
    }
    return success;
}

//Create discord client
const client = new Discord.Client({ 
    intents: [
        Discord.Intents.FLAGS.GUILDS,
        Discord.Intents.FLAGS.GUILD_INTEGRATIONS,
        Discord.Intents.FLAGS.GUILD_BANS,
        Discord.Intents.FLAGS.GUILD_MEMBERS,
        Discord.Intents.FLAGS.GUILD_MESSAGES,
        Discord.Intents.FLAGS.GUILD_PRESENCES
    ]
});

//debug mode enabled/disabled log
if(debug) console.log('\x1b[32m%s\x1b[0m','[Log - Debug Mode] '+messages['logging']['enabled']);
if(!debug) console.log('\x1b[32m%s\x1b[0m','[Log - Debug Mode] '+messages['logging']['disabled']);

//Global functions
//loop
function loop(num = 0, str = ''){
    var returnVal = '';
    for (let i = 0; i < num; i++) {
        returnVal += str;
    }
    return returnVal;
}
//excape regex in string
function escapeRegExp(string) {
    return string.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

//replace all from a string
function replaceAll(str, find, replace) {
    if(str != null){
        return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
    }
}

//get random
function randomInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

//limit string lenght to 100
function limitText(text = null){
	if(text != null && text.length >= 100){
		text = text.substr(0,100) + "...";
	}
	return text;
}

//find property value from an object
function findValueOfProperty(obj, propertyName){
    let reg = new RegExp(propertyName, "i"); // "i" to make it case insensitive
    return Object.keys(obj).reduce((result, key) => {
        if( reg.test(key) ) result.push(obj[key]);
        return result;
    }, []);
}

//trim some unicodes from stirng
function trimUnicode(text) {
    if(text != null){
        text = text.trim();
        text = replaceAll(text,"'",'');
        text = replaceAll(text,".",'');
        text = replaceAll(text,"/",'');
        text = replaceAll(text,"\\",'');
        text = replaceAll(text,",",'');
        text = replaceAll(text,"  ",' ');
        text = replaceAll(text,"?",'');
        text = replaceAll(text,"!",'').trim();

        return text;
    }
}

//get random response to a message
function customResponse(message = null, get = true, source = "minecraft") {
    if(message != null){
        message = trimUnicode(message).toLowerCase();

        if(config['player']['name'] != null){
            message = replaceAll(message, config['player']['name'].toLowerCase(), "").trim();
        }

        if(Object.keys(messageResponseFile[source]).includes(message)){

            if(typeof messageResponseFile[source][message] == 'object' && messageResponseFile[source][message].length > 0 || typeof messageResponseFile[source][message] == 'string' &&  messageResponseFile[message] != ''){
                
                let response = null;

                if(!get) return true;

                if(typeof messageResponseFile[source][message] == 'object') {
                    response = messageResponseFile[source][message][Math.floor(Math.random() * Object.keys(messageResponseFile[source][message]).length)];
                } else if (typeof messageResponseFile[source][message] == 'string') {
                    response = messageResponseFile[source][message];
                }
                
                return response;
            }
        }
    }

    return false;
}

//Main Functions
//Minecraft bot function
function newBot(){
    //movements
    let actions = ['forward', 'back', 'left', 'right'];

    //login
    let logged = false;
    let connected = false;

    //entities
    let entity = null;
    let target = null;

    if(debug) console.log('\x1b[32m%s\x1b[0m','[Log - Mincraft Bot] '+messages['minecraft_bot']['starting']);

    //get connected and logged status
    if(connected && logged) {
        if(debug) console.log('\x1b[32m%s\x1b[0m','[Log - Mincraft Bot] '+messages['minecraft_bot']['disconnected_bot']);

        //set all status to false
        connected = false;
        logged = false;

        //disconnect bot
        if(bot){
            bot.quit();
            bot.end();
        }
    }

    if(!config['player']['enabled']){
        if(debug) console.log('\x1b[32m%s\x1b[0m','[Log - Mincraft Bot] '+messages['minecraft_bot']['disabled']);
        return;
    }

    if(debug) console.log('\x1b[32m%s\x1b[0m','[Log - Mincraft Bot] '+messages['minecraft_bot']['proccessing']);
    
    //get playername
    let player = config['player']['name'];
    
    //set bot prefix and suffix
    if(debug && config['debug']['prefix'] != null || debug && config['debug']['suffix'] != null){
        //join prefix and suffix to name
        player = config['debug']['prefix'] + player + config['debug']['suffix'];
    
        if(debug) console.log('\x1b[32m%s\x1b[0m','[Log - Mincraft Bot] '+messages['minecraft_bot']['prefix_and_suffix_enabled']);
    
        //check name lenght
        if(player == '' || player == null || player.length > 16 || player.length < 3){
            console.error('\x1b[31m%s\x1b[0m', '[Error - Mincraft Bot] '+messages['minecraft_bot']['invalid_name']+': '+player.length); 
            process.exit();
        }
    }

    //make bot
    let port = parseInt(config['server']['port'], 10);
    let ip = config['server']['ip'];

    //set localhost as ip if ip is null
    if(ip == null || ip == ''){
        ip = 'localhost';
    }

    //set default port if port is null
    if(port == null || isNaN(port)){
        port = 25565;
    }

    //validate port
    if (isNaN(port) || typeof port != 'undefined' && isNaN(port) || port > 65535 || port < 1) { 
        console.error('\x1b[31m%s\x1b[0m', '[Error - Mincraft Bot] '+messages['minecraft_bot']['invalid_port']+': '+port); 
        process.exit(0);        
    }

    //check if minecraft bot already connected
    if(MinecraftConnected) {
        console.log('[Error - Minecraft Bot] '+messages['minecraft_bot']['already_connected']);
        return;
    }
    //summon bot
    var bot = mineflayer.createBot({
        host: ip,
        port: port,
        username: player,
        version: config['player']['version']
    });

    if(debug) console.log('[Log - Mincraft Bot] IP: '+ip+'; Port: '+port+'; PlayerName: '+player+'; Prefix: '+config['debug']['prefix']+'; suffix: '+config['debug']['suffix']+'; Version: '+config['player']['version']);

    //load mineflayer plugins
    bot.loadPlugin(cmd);
    bot.loadPlugin(pathfinder);
    bot.loadPlugin(pvpBot);

    var deathCount = 0;

    //check if death counts enabled
    if(config['player']['countdeaths']['enabled'] && fs.existsSync(config['player']['countdeaths']['src'])) {
        //read death count file
        deathCount = parseInt(fs.readFileSync(config['player']['countdeaths']['src'])) || 0;

        //check for valid number
        if(deathCount == null || typeof deathCount == 'undefined' || isNaN(deathCount)){
            //set new number when invalid
            deathCount = 0;

            //write new valid number to the file
            fs.writeFileSync(config['player']['countdeaths']['src'], deathCount + '');
        }
    }

    //on chat
    bot.on('chat', function (username, message){
        //set admin var
        let admin = false;

        //check if player is the bot
        if(username == player || username == 'you') { return; }

        //check for admin perms
        if(config['staffs'][username] != undefined && config['staffs'][username] == 'admin') { 
            admin = true; 
            console.log('[Log - Mincraft Bot] '+username+' is an admin'); 
        } else{ 
            console.log('[Log - Mincraft Bot] '+username+' is not an admin'); 
        }

        //check for commands in chat
        if(message.substr(0,1) == '!'){
            //split command and args
            let args = message.slice(1).trim().split(/ +/);
            let command = args.shift().toLowerCase();

            if(debug) console.log('\x1b[32m%s\x1b[0m','[Log - Mincraft Bot] '+messages['minecraft_bot']['command_execute']+': '+command);
            
            //commands
            if(command == ''){
                //invalid command: null
                bot.chat(messages['minecraft_bot']['chats']['command_invalid']);
            } else if (admin && command == 'reloadconfig' || admin && command == 'reload' || admin && command == 'restartconfig'){
                //reload config
                bot.chat("Reloading Bot Config");

                //parse config
                if(parse()){
                    //reload success
                    bot.chat(messages['reload_config']['success']);
                } else{
                    //reload failed
                    bot.chat(messages['reload_config']['failed']);
                }
            } else if (admin && command == 'restartbot' || admin && command == 'reloadbot'){
                //restart mineflayer bot
                bot.chat(messages['minecraft_bot']['chats']['command_restarting']);

                //quit and restart
                bot.quit();
                bot.end();
            } else if (admin && command == 'kill') {
                //kill player

                //find player name
                if(bot.players[args[0].trim()]){
                    //execute in-game command
                    bot.chat(`/minecraft:kill `+args[0].trim());
                    bot.chat(username+` killed `+args[0].trim());
                } else{
                    //player not found
                    bot.chat('Player '+args[0].trim()+' not found');
                }
            } else if (command == 'deathcount' && config['player']['countdeaths']['enabled']) {
                bot.chat(`I died `+deathCount.toLocaleString()+` times`);
            } else if (!admin){
                //no perms message
                bot.chat(messages['minecraft_bot']['chats']['command_failed']);
            } else{
                //invalid command
                bot.chat(messages['minecraft_bot']['chats']['command_invalid']);
            }

        } else{
            if (debug && config['debug']['minecraft_chats']) console.log('[Log - Mincraft Bot] Player chat received from '+username+' > '+message);

            //reply var declaration
            let reply = null;

            //trim message
            message = trimUnicode(message);

            //message without bot's name
            var removeMensions = replaceAll(message,player,"").trim();

            //lowercase message
            var lmsg = message.toLowerCase();
            var lrmsg = removeMensions.toLowerCase();

            //bot reply
            if(lmsg == player.toLowerCase() + ' hi'|| lmsg == 'hi ' + player.toLowerCase() || lrmsg == 'hi guys' || lrmsg == 'hi bot' || lrmsg == 'bot hi'){
                reply = messages['minecraft_bot']['response']['hi'];
            } else if (lmsg == player.toLowerCase() + 'hello' || lmsg == 'hello ' + player.toLowerCase() || lrmsg == 'hello guys' || lmsg == player.toLowerCase()){
                reply = messages['minecraft_bot']['response']['hello'];
            } else if (lrmsg.replace('hello','').replace('hi','').trim() == 'im new' || lrmsg.replace('hello','').replace('hi','').trim() == 'im new here' || lrmsg.replace('hello','').replace('hi','').trim() == 'new here'){
                reply = messages['minecraft_bot']['response']['im_new'];
            } else if (lmsg.indexOf("who") > -1 && lmsg.indexOf("is") > -1 && lmsg.indexOf(player.toLowerCase()) > -1 || lmsg == 'whos '+player.toLowerCase() || lmsg == player.toLowerCase()+' who are you'){
                reply = messages['minecraft_bot']['response']['who'];
            } else if (lmsg.indexOf("what") > -1 && lmsg.indexOf("is") > -1 && lmsg.indexOf("bot") > -1 || lmsg.indexOf("what") > -1 && lmsg.indexOf("are") > -1 && lmsg.indexOf("bot") > -1){
                reply = messages['minecraft_bot']['response']['what'];
            } else if (lrmsg == 'a government spy' && lmsg.indexOf(player.toLowerCase()) > -1){
                reply = messages['minecraft_bot']['response']['spy'];
            } else if (lmsg.indexOf("kill "+player) > -1){
                reply = messages['minecraft_bot']['response']['kill'];
            } else if (customResponse(lmsg, false)){
                reply = customResponse(lmsg, true);
            }

            //reply placeholders
            reply = replaceAll(reply, "%player%", username);
            reply = replaceAll(reply, "%player_lowercase%", username.toLowerCase());
            reply = replaceAll(reply, "%player_uppercase%", username.toUpperCase());
            reply = replaceAll(reply, "%bot%", player);
            reply = replaceAll(reply, "%bot_lowercase%", player.toLowerCase());
            reply = replaceAll(reply, "%bot_uppercase%", player.toUpperCase());

            //summon reply
            if(reply != null) {
                //set chat delay
                setTimeout(() => {
                    //execute reply
                    bot.chat(reply);
                }, config['chat']['chatDelay']);
            }
        }
    });

    //movement variables
    let lasttime = -1;
    let moveinterval = 5;
    let maxrandom = 5;
    let moving = false;
    let jump = false;
    let onPVP = false;
    let lastaction = actions[Math.floor(Math.random() * actions.length)];

    //auto save interval
    function saveAll(){
        if (!bot) return;
        if (!config['player']['enabled']) return;

        if(debug) console.log('\x1b[32m%s\x1b[0m',"[Log - Mincraft Bot] "+messages['minecraft_bot']['saved']);

        if(logged && connected) bot.chat(`/minecraft:save-all`);

        setTimeout(() => {
            saveAll();
        }, config['autosave']['interval']);
    }

    //first spawn
    bot.once('spawn', () => {
        if(debug) console.log('\x1b[32m%s\x1b[0m','[Log - Mincraft Bot] '+messages['minecraft_bot']['first_spawn']);
        
        //check if auto save is enabled
        if(config['autosave']['enbled']){
            saveAll();
        }

        //set connection status
        MinecraftConnected = true;
    });

    //every respawn
    bot.on('spawn', () => {
        if(debug) console.log('\x1b[32m%s\x1b[0m','[Log - Mincraft Bot] '+messages['minecraft_bot']['spawned']);

        //check if connected and logged status is true
        if(!connected && !logged){
            //set status to true
            connected = true;
            logged = true;
            
            //chat first message
            bot.chat(config['player']['message']);
            if(debug) console.log('\x1b[32m%s\x1b[0m','[Log - Mincraft Bot] connected = '+connected+'; logged = '+logged);
        } else {
            //set all to default
            lasttime = -1;
            bot.pvp.stop();
            bot.setControlState(lastaction,false);
            bot.deactivateItem();
            moving = false;
        }

        // Hmmmmm... so basically database is useless wtf
    });

    //respawn
    bot.on('death',function() {
        //emit respawn when died
        bot.emit("respawn");

        if(debug) console.log('\x1b[33m%s\x1b[0m','[Log - Mincraft Bot] '+messages['minecraft_bot']['died']);

        //count every deaths
        if(config['player']['countdeaths']['enabled']){
            deathCount++;
            fs.writeFileSync(config['player']['countdeaths']['src'], deathCount + '');
        }
    });

    //on ingame time change
    bot.on('time',function (time){
        //check if bot has been disabled
        if(!config['player']['enabled']) {
            //disconnect bot
            bot.quit();
            bot.end();
            return;
        }

        //check if bot was logged and connected
        if(!logged && !connected) { return; }

        //get nearest entity
        entity = bot.nearestEntity();
        
        //filter entities
        if(entity != null && entity.position != null && entity.isValid && entity.type == 'mob' || entity != null && entity.position != null && entity.isValid && entity.type == 'player') bot.lookAt(entity.position.offset(0, 1.6, 0));

        //hit hostile mobs
        if(config['player']['pvp']['enabled']){
            //check entity type
            if(entity && entity.kind && entity.isValid && entity.type == 'mob' && entity.kind.toLowerCase() == 'hostile mobs'){
                onPVP = true;
                //atack entity
                bot.pvp.attack(entity);
                //change hotbar slot
                bot.setQuickBarSlot(1);
            } else {
                onPVP = false;
                //stop pvp
                bot.pvp.stop();
                //change hotbar slot
                bot.setQuickBarSlot(0);
            }
        }

        //on time movement
        if (lasttime < 0) {
            //set last time
            lasttime = bot.time.age;
            if(debug) console.log('\x1b[32m%s\x1b[0m','[Log - Mincraft Bot] '+messages['minecraft_bot']['set_last_time']);
        } else{
            //count movement interval
            let randomadd = Math.random() * maxrandom * 50;
            let interval = moveinterval * 20 + randomadd;

            //movement age and interval
            if (bot.time.age - lasttime > interval) {
                //disable on pvp
                if (onPVP) return;

                //movements
                if (moving){
                    //disable current movements
                    bot.setControlState(lastaction,false);

                    //deactivate current item
                    bot.deactivateItem();

                    //set moving to false
                    moving = false;
                    if(debug && config['debug']['movements']) console.log('\x1b[33m%s\x1b[0m','[Log - Mincraft Bot] age = '+bot.time.age+'; moving = '+moving);
                } else{
                    //add last action
                    lastaction = actions[Math.floor(Math.random() * actions.length)];

                    //enable movement
                    bot.setControlState(lastaction,true);
                    
                    //set movement to true
                    moving = true;

                    //update last time
                    lasttime = bot.time.age;

                    //activate current item
                    bot.activateItem();
                    if(debug && config['debug']['movements']) console.log('\x1b[33m%s\x1b[0m','[Log - Mincraft Bot] age = '+bot.time.age+'; moving = '+moving);
                }
            }

            //bot jump
            if(jump){
                //enable jump
                bot.setControlState('jump', true);

                //disable jump
                bot.setControlState('jump', false);

                //set jump to false
                jump = false
            } else {
                //disable jump for a while
                bot.setControlState('jump', false);

                //set jump time out
                setTimeout(() => {
                    jump = true;
                }, 1000);
            }
        }
    });

    //if bot end
    bot.on('error kicked banned',function (reason){
        if(debug) console.log('\x1b[33m%s\x1b[0m','[Log - Mincraft Bot] '+messages['minecraft_bot']['disconnected']+': '+reason);

        //end bot
        bot.quit();
        bot.end();
    });

    //reconnect attempt
    bot.on('end', (reason) => {

        //set status to false
        connected = false;
        logged = false;
        MinecraftConnected = false;

        //reconnect timeout
        setTimeout(() => {
            //check if minecraft player was enabled
            if(!config['player']['enabled']) return;

            //request new bot
            newBot();
            if(debug) console.log('\x1b[33m%s\x1b[0m','[Log - Mincraft Bot] '+messages['minecraft_bot']['bot_end']+': '+reason);
        }, config['server']['reconnectTimeout']);
    });
}

//Discord bot function
function DiscordBot(){
    //check if discord bot was connected
    if(discordConnected){
        //get client
        if(client){
            //destroy session
            client.destroy();
        }

        //set status to false
        discordConnected = false;
    }
    
    //check if discord bot is enabled
    if(!config['discord']['enabled']){
        if(debug) console.log('\x1b[32m%s\x1b[0m','[Log - Discord Bot] '+messages['discord_bot']['disabled']);

        //exit bot
        return;
    }

    //set bot token
    client.login(config['discord']['token']);
    
    if(debug) console.log('\x1b[32m%s\x1b[0m',"[Log - Discord Bot] "+messages['discord_bot']['enabled']);

    //on bot ready
    client.once('ready', async () => {
        //set bot status to true
        discordConnected = true;
        if(debug) console.log('\x1b[32m%s\x1b[0m',"[Log - Discord Bot] "+messages['discord_bot']['ready']+": "+client.user.tag+"; "+client.user.id);

        if(config['discord']['presence']['enable']){
            await client.user.setPresence({
                status: config['discord']['presence']['status'],  //You can show online, idle....
                activities: [{
                    name: config['discord']['presence']['name'],  //The message shown
                    type: config['discord']['presence']['type'].toUpperCase(), //PLAYING: WATCHING: LISTENING: STREAMING:
                    url: config['discord']['presence']['url']
                }]
            });
        }
        
        //actions list
        let emotes = null;
        let reacts = null;
        let motivations = null;
        let factslist = null;

        //get action files content
        if(config['discord']['emotes']['enabled']){
            //get emotes json file
            emotes = fs.readFileSync(config['discord']['emotes']['src'], 'utf8');
            emotes = yml.parse(emotes);
        }

        if(config['discord']['react']['enabled']){
            //get react json file
            reacts = fs.readFileSync(config['discord']['react']['src'], 'utf8');
            reacts = yml.parse(reacts);
        }

        if(config['discord']['motivate']['enabled']){
            //get motivate json file
            motivations = fs.readFileSync(config['discord']['motivate']['src'], 'utf8');
            motivations = yml.parse(motivations);
        }

        if(config['discord']['facts']['enabled']){
            //get factslist json file
            factslist = fs.readFileSync(config['discord']['facts']['src'], 'utf8');
            factslist = yml.parse(factslist);
        }

        //on message
        client.on('message', function(message) {
            //disconnect if bot was disabled
            if(!config['discord']['enabled']){
                client.destroy();
                return;
            }

            //Message varialbes
            //raw content
            let rawMessage = message.content;

            //trimmed and lowercase message
            let lowerMessage = trimUnicode(message.content.toLowerCase());


            //bot informations
            let botAvatar = client.user.displayAvatarURL();
            let botName = client.user.tag;
            let botUser_id = client.user.id;
            let userAvatar = message.author.displayAvatarURL({ format: 'png', dynamic: true });


            //message informations
            let taggedUser = message.mentions.users.first();
            let taggedUsername = null;
            let pinged = '<@!'+taggedUser+'>';
                //prevent user error: !message.mentions.users.size
                if (message.mentions.users.size) taggedUsername = taggedUser.username;

            let author = message.author.username;
            let user_id = message.author.id;

            let mension = '<@!'+user_id+'>';

            let channelName = message.channel.name;
            let channelID = message.channel.id;

            //Has admin permission
            let AdminPerms = message.author.permissions.has(Discord.Permissions.FLAGS.ADMINISTRATOR);
            

            //bot utility functions
            //find bot name in message
            function findName (string) {
                //return if null
                if(string == null) return;

                //trim string
                string = trimUnicode(string.toLowerCase());

                //start finding
                for (var i=0; i < config['discord']['prefix'].length; i++) {
                    if (string.indexOf(' '+config['discord']['prefix'][i].toLowerCase()+' ') > -1 || string.startsWith(config['discord']['prefix'][i].toLowerCase()+' ') || string.endsWith(' '+config['discord']['prefix'][i].toLowerCase()) || config['discord']['prefix'][i].toLowerCase() == string){
                        return true;
                    }
                }

                //return result
                return false;
            }

            //remove bot mensions
            function removeMensions (string) {
                //return if null
                if(string == null) return;

                //make lowercase
                string = string.toLowerCase().trim();

                //start removing name
                for (var i=0; i < config['discord']['prefix'].length; i++) {
                    if (string.indexOf(' '+config['discord']['prefix'][i]+' ') > -1 || string.indexOf(config['discord']['prefix'][i]+' ') > -1 || string.indexOf(' '+config['discord']['prefix'][i]) > -1 || string.startsWith(config['discord']['prefix'][i]+' ')){
                        string = replaceAll(string,' '+config['discord']['prefix'][i]+' ','');
                        string = replaceAll(string,config['discord']['prefix'][i]+' ','');
                        string = replaceAll(string,' '+config['discord']['prefix'][i],'');
                        string = string.trim();
                    }
                }

                string = trimUnicode(string);

                //return string
                return string;
            }

            //find action command in message
            function actionFind (message = '', get = false){
                //return if null
                if(message == null) return;

                //return if bot doesn't mensionned
                if(!findName(message)) return;

                //get all emotes list
                let actions = Object.keys(emotes);

                //predeclare found var
                let found = null;

                //get action name is false
                if(!get) found = false;
                
                //check for action name
                for (let i=0; i < actions.length; i++) {
                    if(removeMensions(message).toLowerCase().startsWith(actions[i].toLowerCase())){
                        found = true;

                        if(get) return actions[i].toLowerCase();
                    }
                }

                return found;
            }

            //random INT response
            var randomResponse = randomInteger(0, 5);

            //return if the author is bot
            if(author.bot) return;

            //CMD or STRING check
            if (!rawMessage.startsWith(config['discord']['command-prefix'])){
                if(config['debug']['discord_chats']) console.log("[Log - Discord Bot] "+messages['discord_bot']['message_sent']+": "+author);
                //discord msg

                if(findName(rawMessage) && removeMensions(lowerMessage) == 'hi' || lowerMessage == 'hi guys'){
                    
                    if (randomResponse == 0)
                        message.channel.send('Hello, '+mension);
                    else if (randomResponse == 1)
                        message.channel.send('Hello, '+mension+'!');
                    else if (randomResponse == 2)
                        message.channel.send('Hello, '+mension+' :face_with_hand_over_mouth:');
                    else if (randomResponse == 3)
                        message.channel.send('Helloooooooooo '+mension+'!');
                    else
                        message.channel.send('Hello, '+mension);

                } else if(findName(rawMessage) && removeMensions(lowerMessage) == 'hello' || lowerMessage.indexOf('im') > -1 && lowerMessage.indexOf('new') > -1 && lowerMessage.length <= 19 || lowerMessage.indexOf('i') > -1 && lowerMessage.indexOf('am') > -1 && lowerMessage.indexOf('new') > -1 && lowerMessage.length <= 21){
                    if(lowerMessage.indexOf('im') > -1 && lowerMessage.indexOf('new') > -1){
                        
                        if(randomResponse == 0)
                            message.channel.send('We hope '+mension+' brought us pizza :smiley:');
                        else if (randomResponse == 1)
                            message.channel.send(mension+' is new!');
                        else if (randomResponse == 2)
                            message.channel.send('Hello '+mension+', Good luck with our communities :)');
                        else if (randomResponse == 3)
                            message.channel.send('Give '+mension+' some food! :pizza:');
                        else if (randomResponse == 4)
                            message.channel.send(mension+' Because you\'re new tell us something secret <:666:853195979461361684>');
                        else
                            message.channel.send('I think we have a new born baby. '+mension);
                        
                    } else{
                        
                        if(randomResponse == 0)
                            message.channel.send('Hi, '+mension);
                        else if(randomResponse == 1)
                            message.channel.send('Sup '+mension+'!');
                        else if(randomResponse == 2)
                            message.channel.send('Hi, '+mension+':wave:');
                        else if(randomResponse == 3)
                            message.channel.send('Ohh! Hi '+mension);
                        else
                            message.channel.send('Hi, '+mension);
                    }
                } else if (findName(rawMessage) && removeMensions(lowerMessage).substr(0, 9) == 'tp me to ') {
                    if(removeMensions(lowerMessage).substr(9) != ''){
                        if(taggedUser != client.user.id){
                            if(taggedUser != user_id){

                                if (!message.mentions.users.size)
                                    message.channel.send(removeMensions(lowerMessage).substr(9)+' Would you like me to tp '+mension+' to you in real life :smirk:');
                                else
                                    message.channel.send(pinged+' Would you like me to tp '+mension+' to you in real life :smirk:');
                    
                            } else{

                                if (randomResponse == 0)
                                    message.channel.send('I will not tp '+mension + ' to you because it\'s you :smirk:');
                                else if (randomResponse == 1)
                                    message.channel.send(mension + ' you\'re stupid sometimes');
                                else if (randomResponse == 2)
                                    message.channel.send('something is wrong with '+mension + '\'s head');
                                else
                                    message.channel.send(mension + ' are you ok?');

                            }
                        } else{

                            if (randomResponse == 0)
                                message.channel.send('It\'s me! but no :)');
                            else if (randomResponse == 1)
                                message.channel.send('I don\'t exist physicaly sad :anguished:');
                            else
                                message.channel.send('I don\'t want you to see me, I\'m just a hard drive :desktop:');
                            
                        }
                    } else{
                        message.channel.send('It\'s empty you know :confused:');
                    }
                } else if (removeMensions(lowerMessage).indexOf('im') > -1 && removeMensions(lowerMessage).indexOf('sick') > -1 && removeMensions(lowerMessage).indexOf('not') < 0) {
                    
                    if(randomResponse == 0)
                        message.reply('Get rest :thumbsup:');
                    else if (randomResponse == 1)
                        message.reply('Stay Healthy and get rest :)');
                    else
                        message.reply('Stay safe <3');

                } else if (findName(rawMessage) && actionFind(lowerMessage) && config['discord']['emotes']['enabled']) {
                    if(message.mentions.users.size){
                        let emoteName = actionFind(lowerMessage, true);
                        let emote = emotes[emoteName];

                        let selfPing = false;
                        if(taggedUser == user_id) selfPing = true;

                        let phrase = null;
                        let RandomImage = null;
                        
                        if(selfPing){
                            if(randomResponse == 0 && emote['selfAllow']){
                                phrase = emote['sentences'][Math.floor(Math.random() * Object.keys(emote.sentences).length)];
                            } else{
                                phrase = emote['selfPing'][Math.floor(Math.random() * Object.keys(emote.selfPing).length)];
                            }
                        } else{
                            phrase = emote['sentences'][Math.floor(Math.random() * Object.keys(emote.sentences).length)];
                        }

                        phrase = phrase.replace(/%author%/g, author).replace(/%victim%/g, taggedUsername);

                        if(!selfPing){
                            RandomImage = emote['sources'][Math.floor(Math.random() * Object.keys(emote.sources).length)];
                        }

                        if (RandomImage != null) {
                            var embed = new Discord.MessageEmbed()
                                .setColor(config['discord']['embed']['color'])
                                .setAuthor(phrase, userAvatar)
                                .setImage(RandomImage);

                            message.channel.send({ embeds: [embed] });
                            return;
                        }
                        message.channel.send(phrase);
                    } else{
                        message.reply(':no_entry_sign: Invalid arguments! type `>help emotes` for help').then(msg => {
                            setTimeout(() => msg.delete(), 3000)
                        });
                    }
                } else if (findName(rawMessage) && removeMensions(lowerMessage).substr(0,8) == 'motivate' || findName(rawMessage) && removeMensions(lowerMessage).substr(0,11) == 'motivate me' || findName(rawMessage) && removeMensions(lowerMessage).substr(0,10) == 'motivation' || findName(rawMessage) && removeMensions(lowerMessage).substr(0,5) == 'quote' || removeMensions(lowerMessage).substr(0,11) == 'motivate me') {
                    if(config['discord']['motivate']['enabled']){
                        let randomKey = Math.floor(Math.random() * Object.keys(motivations).length);
                        
                        let msg = Object.keys(motivations)[randomKey];
                        let author = motivations[msg]['author'];

                        if(author == null && author == ''){
                            author = 'Unknown';
                        }

                        var embed = new Discord.MessageEmbed()
                            .setColor(config['discord']['embed']['color'])
                            .setTitle(`By: `+author)
                            .setDescription('> '+msg);
                        message.channel.send({ embeds: [embed] });
                    }
                } else if (findName(rawMessage) && removeMensions(lowerMessage).substr(0,11).replace('tell','').replace('me','').trim() == 'random fact') {
                    if(config['discord']['facts']['enabled']){
                        let randomKey = Math.floor(Math.random() * Object.keys(factslist).length);

                        let msg = Object.keys(factslist)[randomKey];
                        let source = factslist[msg]['source'];

                        if(source == null || source == ''){
                            source = 'Unknown';
                        }

                        var embed = new Discord.MessageEmbed()
                            .setColor(config['discord']['embed']['color'])
                            .setTitle(msg)
                            .setDescription('`Source: '+source+'`');
                        message.channel.send({ embeds: [embed] });
                    }
                } else if (customResponse(rawMessage, false, "discord")) {
                    let reply = customResponse(rawMessage, true, "discord");

                    reply = replaceAll(reply, "%botname%", botName);
                    reply = replaceAll(reply, "%author%", author);
                    reply = replaceAll(reply, "%author_ping%", mension);

                    message.channel.send(reply);
                } else if(findName(rawMessage) || taggedUser == botUser_id) {
                    message.react('854320612565450762');
                }
            } else {
                //get command name and args
                let args = rawMessage.slice(config['discord']['command-prefix'].length).trim().split(/ +/);
                let command = args.shift().toLowerCase();

                if(debug) console.log('\x1b[32m%s\x1b[0m',"[Log - Discord Bot] "+messages['discord_bot']['command_execute']+": "+command+" by "+author);

                //commands
                if (command == 'help'){

                    if(randomResponse == 0)
                        message.channel.send('Get lost :smirk:');
                    else if (randomResponse == 1)
                        message.channel.send('I can\'t help sorry');
                    else if (randomResponse == 2)
                        message.channel.send('I\'m dumb so I can\'t help :laughing:');
                    else
                        message.channel.send('I don\'t help anyone :expressionless:');
                    
                } else if (command == 'me') {
                    var embed = new Discord.MessageEmbed()
                        .setColor(config['discord']['embed']['color'])
                        .setAuthor(author, userAvatar);
                    message.channel.send({ embeds: [embed] });
                } else if (command == 'you') {

                    if(randomResponse == 0)
                        message.channel.send('I don\'t give my personal info to others :disappointed:');
                    else if(randomResponse == 1)
                        message.channel.send('Are you a stalker?');
                    else if (randomResponse == 2)
                        message.channel.send('I need privacy :smirk:');
                    else
                        var embed = new Discord.MessageEmbed()
                            .setColor(config['discord']['embed']['color'])
                            .setAuthor(botName, botAvatar)
                            .setTimestamp();
                        message.channel.send({ embeds: [embed] });

                } else if (command == 'deathcount' && config['discord']['deathcount'] && fs.existsSync(config['player']['countdeaths']['src'])) {
                    let readDeathcountFile = parseInt(fs.readFileSync(config['player']['countdeaths']['src']));
                    let count = 0;
                    if(typeof readDeathcountFile == 'null' || typeof readDeathcountFile == 'undefined' || isNaN(readDeathcountFile)){
                        fs.writeFileSync(config['player']['countdeaths']['src'], '0');
                    } else {
                        count = readDeathcountFile.toLocaleString();
                    }

                    console.log(readDeathcountFile);

                    message.channel.send(replaceAll(messages['discord_bot']['deathcount'], "%count%", count));
                } else if (command == 'embed' && config['discord']['embed']['enabled']) {
                    if(AdminPerms) {
                        message.delete();

                        let title = rawMessage.slice(config['discord']['command-prefix'].length).substr(command.length + 1).split(" ",1)[0];
                            title = replaceAll(title,"_"," ").trim();
                        let content = rawMessage.slice(config['discord']['command-prefix'].length).substr(command.length + 1).slice(title.length);

                        var embed = new Discord.MessageEmbed()
                            .setColor(config['discord']['embed']['color'])
                            .setTitle(title)
                            .setAuthor('HiddenPlayer', botAvatar)
                            .setDescription(content)
                            .setTimestamp()
                        message.channel.send({ embeds: [embed] });
                    } else {
                        message.reply(messages['discord_bot']['chats']['command_no_perm']).then(msg => {
                            setTimeout(() => { msg.delete(); message.delete() }, 5000);
                        });
                    }
                } else if (command == 'send' && config['discord']['send-command']) {
                    if(AdminPerms) {
                        message.delete();
                        message.channel.send(rawMessage.slice(config['discord']['command-prefix'].length).substr(command.length + 1).trim());
                    } else {
                        message.reply(messages['discord_bot']['chats']['command_no_perm']).then(msg => {
                            setTimeout(() => { msg.delete(); message.delete() }, 5000);
                        });
                    }
                } else if (command == 'spam' && config['discord']['spam']['enabled']) {
                    
                    let count = 10;
                    let msg = '';

                    if(AdminPerms) {
                        for (let i = 0; i < args.length; i++) {
                            msg += ' '+args[i];
                        }

                        if(args.length > 1 && !isNaN(parseInt(args[0]))){
                            msg = '';
                            count = args[0];
                            for (let i = 1; i < args.length; i++) {
                                msg += ' '+args[i];
                            }
                        }

                        var disabled_channels = config.discord.spam.disabled_channels;
                        
                        msg = msg.trim();

                        if (count > 0 && count <= config['discord']['spam']['max']){
                            if(!disabled_channels.includes(channelID)){
                                if(msg != null && msg != ''){
                                    if(!config['discord']['spam']['player_ping'] && !message.mentions.users.size && !message.mentions.roles.size  && !message.mentions.everyone || config['discord']['spam']['player_ping']){
                                        for (let i=0; i < count; i++){
                                            message.channel.send('`spam:` '+msg);
                                        }
                                    } else{
                                        message.reply(`Pings are disabled in spam command :no_entry_sign:`).then(msg => {
                                            setTimeout(() => { msg.delete(); message.delete() }, 5000);
                                        });
                                    }
                                } else{
                                    message.reply(`Provide spam message :no_entry_sign:`).then(msg => {
                                        setTimeout(() => { msg.delete(); message.delete() }, 5000);
                                    });
                                }
                            } else {
                                message.reply(`Spam command is disabled in this channel :no_entry_sign:`).then(msg => {
                                    setTimeout(() => { msg.delete(); message.delete() }, 5000);
                                });
                            }
                        } else{
                            message.reply(`Spam chat count is too small or too large :no_entry_sign:`).then(msg => {
                                setTimeout(() => { msg.delete(); message.delete() }, 5000);
                            });
                        }
                    } else{
                        message.reply(`This command is only for Admins :no_entry_sign:`).then(msg => {
                            setTimeout(() => { msg.delete(); message.delete() }, 5000);
                        });
                    }

                } else if (command == 'smap') {
                    message.reply("Did you mean `>spam` :thinking:");
                } else if (command == 'exembed') {
                    if(AdminPerms) {
                        var embed = new Discord.MessageEmbed()
                            .setColor(config['discord']['embed']['color'])
                            .setTitle('Some title')
                            .setURL('https://discord.js.org/')
                            .setAuthor('Some name', 'https://i.imgur.com/wSTFkRM.png', 'https://discord.js.org')
                            .setDescription('Some description here')
                            .setThumbnail('https://i.imgur.com/wSTFkRM.png')
                            .addFields(
                                { name: 'Regular field title', value: 'Some value here' },
                                { name: '\u200B', value: '\u200B' },
                                { name: 'Inline field title', value: 'Some value here', inline: true },
                                { name: 'Inline field title', value: 'Some value here', inline: true },
                            )
                            .addField('Inline field title', 'Some value here', true)
                            .setImage('https://i.imgur.com/wSTFkRM.png')
                            .setTimestamp()
                            .setFooter('Some footer text here', 'https://i.imgur.com/wSTFkRM.png');
                        message.channel.send({ embeds: [embed] });
                    } else {
                        message.reply(messages['discord_bot']['chats']['command_no_perm']).then(msg => {
                            setTimeout(() => { msg.delete(); message.delete() }, 5000);
                        });
                    }
                } else if (command == 'reloadall' || command == 'reloadassets') {
                    if(AdminPerms) {
                        message.reply(`Reloading assets`);
                        if(config['discord']['emotes']['enabled']){
                            emotes = fs.readFileSync(config['discord']['emotes']['src'], 'utf8');
                            emotes = yml.parse(emotes);

                            if(debug) console.log('\x1b[32m%s\x1b[0m','[Log - Discord Bot] '+messages['discord_bot']['reload_complete']+': Emotes');
                        }
                
                        if(config['discord']['react']['enabled']){
                            reacts = fs.readFileSync(config['discord']['react']['src'], 'utf8');
                            reacts = yml.parse(reacts);

                            if(debug) console.log('\x1b[32m%s\x1b[0m','[Log - Discord Bot] '+messages['discord_bot']['reload_complete']+': Reacts');
                        }
                
                        if(config['discord']['motivate']['enabled']){
                            motivations = fs.readFileSync(config['discord']['motivate']['src'], 'utf8');
                            motivations = yml.parse(motivations);

                            if(debug) console.log('\x1b[32m%s\x1b[0m','[Log - Discord Bot] '+messages['discord_bot']['reload_complete']+': Motivations');
                        }
                        message.channel.send(messages['discord_bot']['reload_complete']+': Assets');
                    } else {
                        message.reply(messages['discord_bot']['chats']['command_no_perm']).then(msg => {
                            setTimeout(() => { msg.delete(); message.delete() }, 5000);
                        });
                    }
                } else if (command == 'reload') {
                    if(AdminPerms) {
                        message.reply(messages['discord_bot']['reloading']);
                        let reload = parse(config['onlineConfig']);
                        if(reload){
                            message.reply(messages['reload_config']['success']);
                        } else {
                            message.reply(messages['reload_config']['failed']);
                        }
                    } else {
                        message.reply(messages['discord_bot']['chats']['command_no_perm']).then(msg => {
                            setTimeout(() => { msg.delete(); message.delete() }, 5000);
                        });
                    }
                }
            }

            if(config['debug']['discord_chats']) {
                console.log("[Log - Discord Bot] "+messages['discord_bot']['message_received']+": "+limitText(message.content));
            }
        });
    });
}

//Database function
function connectDB(){
    if(debug) console.log('\x1b[32m%s\x1b[0m','[Log - Discord Bot] '+messages['database']['connecting']);

    //return if database was disabled
    if(!db_enable){
        if(debug) console.log('\x1b[32m%s\x1b[0m','[Log - Discord Bot] '+messages['database']['disabled']);
        return;
    }

    //execute connection
    conn = mysql.createConnection({
        host: db_host,
        user: db_user,
        password: db_pass,
        database: db_name
    });

    //connect to database
    conn.connect(function(error) {
        //on error return
        if (error) {
            console.error('\x1b[31m%s\x1b[0m', '[Error - Database] '+messages['database']['connect_failed']);
            return;
        }

        if(debug) console.log('\x1b[32m%s\x1b[0m', '[Log - Database] '+messages['database']['connected']+' name: '+db_name+'; host: '+db_host+'; pass: '+db_pass+'; user: '+db_user);

        //log connection
        conn.query("INSERT INTO `connection` VALUES('','"+Date.now()+"')", function(){
            if(debug) console.log('\x1b[32m%s\x1b[0m','[Log - Database] '+messages['database']['connection_logged']);
        });
    });
}

//Start all proccess
if(db_enable) connectDB();
if(config['discord']['enabled']) DiscordBot();
if(config['player']['enabled']) newBot();

// if(conn) connection.end();