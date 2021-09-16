// HiddePlayer GPL-3.0 License

//Packages
const mineflayer = require('mineflayer');
const cmd = require('mineflayer-cmd').plugin;
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const pvpBot = require('mineflayer-pvp').plugin;
const prompt = require("prompt-sync")();
const Discord = require('discord.js');
const commander = require('commander');
const yml = require('yaml');
const fs = require('fs');
const mysql = require('mysql');

const program = new commander.Command;
    
    program
            .option('--testmode', 'Enable testmode')
            .option('--minecraft-player-name <playername>', 'Player name for testmode Minecraft bot')
            .option('--minecraft-server-ip <ip>', 'Server IP for testmode server')
            .option('--minecraft-server-port <port>', 'Server port for testmode server')
            .option('--minecraft-player-join-msg <message>', 'test mode on join message')
            .option('--discord <token>', 'Testmode discord bot')
            .option('--testmode-timeout <timeout>', 'Test mode timeout in milliseconds')
    program.parse();

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

const configlocation = 'config/config.yml';
let configVersion = null;
let config = {};
let debug = false;
let messages = {
    reload_config: {
        start: "Reading config file...",
        success: "Config is ready!",
        failed: "Config error!",
        different_versions: "Config error: different versions"
    }
};
let messageResponseFile = {};
parse();

var discordConnected = false;
var BotUsed = false;
var conn = null;

var fullname = config['debug']['prefix']+config['player']['name']+config['debug']['suffix'];
console.log('============================ '+fullname+' '+configVersion+' ===========================');
console.log("");
console.log('GitHub: https://github.com/FalloutStudios/HiddenPlayer');
console.log();
console.log('=========================================================='+loop(fullname.length, '=')+loop(configVersion.length, '='));
console.log("\n\n");

//debug mode enabled/disabled log
if(debug) console.log('\x1b[32m%s\x1b[0m','[Log - Debug Mode] '+messages['logging']['enabled']);
if(!debug) console.log('\x1b[32m%s\x1b[0m','[Log - Debug Mode] '+messages['logging']['disabled']);

//Global functions
function startUpScreen() {
    console.log("\n\n");
    console.log(' __    __    ________    ________     ________     ______   ______     __');
    console.log('|  |  |  |  |__    __|  |   ___  \\   |   ___  \\   |   ___|  |     \\   |  |');
    console.log('|  |__|  |     |  |     |  |   |  |  |  |   |  |  |  |___   |  |\\  \\  |  |');
    console.log('|   __   |     |  |     |  |   |  |  |  |   |  |  |   ___|  |  | \\  \\ |  |');
    console.log('|  |  |  |   __|  |__   |  |___|  |  |  |___|  |  |  |___   |  |  \\  \\|  |');
    console.log('|__|  |__|  |________|  |________/   |________/   |______|  |__|   \\_____|');
    console.log();
}
function parse(){
    startUpScreen();
    //success pre variable
    var success = false;

    //parse default config
    var body_conf = fs.readFileSync(configlocation, 'utf8');

    //parse JSON
    var body_config = yml.parse(body_conf);

    if(debug) {
        console.log('\x1b[32m%s\x1b[0m','[Log - Config] '+messages['reload_config']['start']);
        console.log(body_config);
    }

    //get config version
    var confV = body_config['version'];

    //throw error when versions doesn't match
    if(configVersion != null && configVersion != confV) {
        console.error('\x1b[31m%s\x1b[0m', '[Error - Config] '+messages['reload_config']['different_versions']);
        return success;
    } else{
        configVersion = confV;
        success = true;
    }

    //change config contents
    config = body_config;

    //debug enabled/disabled
    debug = config['debug']['enabled'];

    //inline edit config
    testMode();
    inlineInteractions();

    //messages and response files
    switch (true){
        case (config['language'] == null):
            console.error('\x1b[31m%s\x1b[0m', '[Error - Config] Can\'t load messages file');
            process.exit(0);
        case (config['responses'] == null):
            console.error('\x1b[31m%s\x1b[0m', '[Error - Config] Can\'t load response messages file');
            process.exit(0);
    }   

    //parse messages and response files
    messages = yml.parse(fs.readFileSync(config['language'], 'utf-8'));
    messageResponseFile = yml.parse(fs.readFileSync(config['responses'], 'utf8'));

    //messages and reponse files version check
    switch (true){
        case (messages['version'] != config['version']):
            console.error('\x1b[31m%s\x1b[0m', '[Error - Config] Config version doesn\'t match messages file version');
            process.exit(0);
        case (messageResponseFile['version'] != config['version']):
            console.error('\x1b[31m%s\x1b[0m', '[Error - Config] Config version doesn\'t match response messages file version');
            process.exit(0);
    }

    if(debug) console.log('\x1b[32m%s\x1b[0m','[Log - Config] '+messages['reload_config']['success']);

    if (config['player']['name'] == null || config['player']['name'] == ''){
        config['player']['enabled'] = false;
    } else if (config['discord']['token'] == null){
        config['discord']['enabled'] = false;
    }

    if(success){
        //restart all proccesses
        connectDB();
        if(config['discord']['enabled']) DiscordBot(config['discord']['token']);
        if(config['player']['enabled']) newBot(config['player']['name'], config['server']['ip'], config['server']['port'], config['server']['version']);
    }
    return success;
}
function testMode(){
    if(!program.opts().testmode) return;
    if(debug) console.log('\x1b[33m%s\x1b[0m', '[Log - TestMode] Test mode enabled');

    config['server']['ip'] = 'play.ourmcworld.ml';
    config['server']['port'] = 39703;
    config['player']['name']= 'HiddenPlayer';

    let timeout = 300000;

    switch (true) {
        case (program.opts().minecraftServerIp != null):
            config['server']['ip'] = program.opts().minecraftServerIp
            break;
        case (program.opts().minecraftServerPort != null):
            config['server']['port'] = program.opts().minecraftServerPort
            break;
        case (program.opts().minecraftPlayerName != null):
            config['player']['name'] = program.opts().minecraftPlayerName
            break;        
        case (program.opts().minecraftPlayerJoinMsg != null):
            config['player']['message'] = program.opts().minecraftPlayerJoinMsg
            break;
        case (program.opts().discord != null):
            config['discord']['token'] = program.opts().discord
            break;
        case (program.opts().testmodeTimeout != null):
            timeout = parseInt(program.opts().testmodeTimeout, 10)
            break;        
        default:
            break;
    }

    setTimeout(() => {
        if(debug) console.log('\x1b[33m%s\x1b[0m', '[Log - TestMode] Test mode timeout');
        process.exit(0);
    }, timeout);
}
function inlineInteractions(){
    switch (true){
        case (config['player']['enabled'] && config['player']['name'] == null || config['player']['enabled'] && config['player']['name'] == ''):
            config['player']['name'] = prompt("Enter Player Name >>> ");    
            break;
        case (config['player']['enabled'] && config['server']['ip'] == null || config['player']['enabled'] && config['server']['ip'] == ''):
            config['server']['ip'] = prompt("Enter Server IP (Don't include Port) >>> ");
            break;
        case (config['player']['enabled'] && config['server']['port'] == null || config['player']['enabled'] && config['server']['port'] == ''):
            config['server']['port'] = prompt("Enter Server Port (Enter to use default) >>> ");
        
            if(!isNumber(parseInt(config['server']['port']))){
                config['server']['port'] = null;
            }
        break;
    }
}
function customResponse(message = null, get = true, source = "minecraft") {
    if(message == null) {return;}
    message = trimUnicode(message).toLowerCase();

    if(!Object.keys(messageResponseFile[source]).includes(message)) {return;}

    if(config['player']['name'] != null){
        message = replaceAll(message, config['player']['name'].toLowerCase(), "").trim();
    }

    if(messageResponseFile[source][message].isArray()) {
        if(get) {return true;}

        return messageResponseFile[source][message][Math.floor(Math.random() * Object.keys(messageResponseFile[source][message]).length)];
    } else if (typeof messageResponseFile[source][message] == 'string' || isNumber(parseInt(messageResponseFile[source][message]))) {
        if(get) {return true;}

        return messageResponseFile[source][message];
    }

    return false;
}
function loop(num = 0, str = ''){
    var returnVal = '';
    for (let i = 0; i < num; i++) {
        returnVal += str;
    }
    return returnVal;
}
function replaceAll(str, find, replace) {
    if(str == null) { return; }
    return str.toString().replace(new RegExp(escapeRegExp(find), 'g'), replace);
}
function randomInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function limitText(text = null){
	if(text != null && text.length >= 100){
		text = text.substr(0,100) + "...";
	}
	return text;
}
function trimUnicode(text) {
    if(text == null) {return true;}
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
function escapeRegExp(string) {
    return string.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}
function isNumber(n){
    return !isNaN(parseFloat(n)) && isFinite(n);
}

//Main Functions
function newBot(player = "", ip = '127.0.0.1', port = 25565, version = null){
    //movements
    let actions = ['forward', 'back', 'left', 'right'];
    var lasttime = -1;
    var moveinterval = 5;
    var maxrandom = 5;
    var moving = false;
    var jump = true;
    var onPVP = false;
    var lastaction = null;
    var deathCount = 0;
    let mcData = null;
    let defaultMove = null;

    //login
    let logged = false;
    let connected = false;

    //entities
    let entity = null;
    let target = null;

    //mcdata ready
    let mcDataEnabled = false;

    //parseint port
    port = parseInt(port, 10);

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
        return true;
    }

    if(debug) console.log('\x1b[32m%s\x1b[0m','[Log - Mincraft Bot] '+messages['minecraft_bot']['proccessing']);
    
    //set bot prefix and suffix
    if(debug && config['debug']['prefix'] != null || debug && config['debug']['suffix'] != null){
        //join prefix and suffix to name
        player = config['debug']['prefix'] + player + config['debug']['suffix'];
    
        if(debug) console.log('\x1b[32m%s\x1b[0m','[Log - Mincraft Bot] '+messages['minecraft_bot']['prefix_and_suffix_enabled']);
    
        //check name lenght
        if(player == '' || player == null || player.length > 16 || player.length < 4){
            console.error('\x1b[31m%s\x1b[0m', '[Error - Mincraft Bot] '+messages['minecraft_bot']['invalid_name']+': '+player.length); 
            process.exit();
        }
    }

    //validate port
    if (!isNumber(port) || typeof port != 'undefined' && !isNumber(port) || port > 65535 || port < 1) { 
        console.error('\x1b[31m%s\x1b[0m', '[Error - Mincraft Bot] '+messages['minecraft_bot']['invalid_port']+': '+port); 
        process.exit(0);        
    }

    //check if minecraft bot already connected
    if(BotUsed) {
        console.log('[Error - Minecraft Bot] '+messages['minecraft_bot']['already_connected']);
        return true;
    }
    
    BotUsed = true;
    //summon bot
    var bot = mineflayer.createBot({
        host: ip,
        port: port,
        username: player,
        version: version
    });

    if(debug) console.log('[Log - Mincraft Bot] IP: '+ip+'; Port: '+port+'; PlayerName: '+player+'; Prefix: '+config['debug']['prefix']+'; suffix: '+config['debug']['suffix']+'; Version: '+config['player']['version']);

    //load mineflayer plugins
    bot.loadPlugin(cmd);
    bot.loadPlugin(pathfinder);
    bot.loadPlugin(pvpBot);

    //check if death counts enabled
    if(config['player']['countdeaths']['enabled'] && fs.existsSync(config['player']['countdeaths']['src'])) {
        //read death count file
        deathCount = parseInt(fs.readFileSync(config['player']['countdeaths']['src'])) || 0;

        //check for valid number
        if(deathCount == null || typeof deathCount == 'undefined' || !isNumber(deathCount)){
            //set new number when invalid
            deathCount = 0;

            //write new valid number to the file
            fs.writeFileSync(config['player']['countdeaths']['src'], deathCount + '');
        }
    }

    //Check pvp
    if(debug && config['player']['pvp']['enabled']) console.log('\x1b[32m%s\x1b[0m','[Log - Mincraft Bot] '+messages['minecraft_bot']['pvp-enabled']);
    if(debug && !config['player']['pvp']['enabled']) console.log('\x1b[32m%s\x1b[0m','[Log - Mincraft Bot] '+messages['minecraft_bot']['pvp-disabled']);

    bot.on('chat', function (username, message){
        //set admin var
        let admin = false;

        //check if player is the bot
        if(username == player || username == 'you') { return true; }

        //check for admin perms
        if(config['player']['admin'].includes(username.toString())) { 
            admin = true; 
            console.log('[Log - Mincraft Bot] '+username+' is an admin'); 
        } else{ 
            console.log('[Log - Mincraft Bot] '+username+' is not an admin'); 
        }

        //check for commands in chat
        if(message.substr(0,1) == '!'){
            //split command and args
            let args = message.slice(1).trim().split(/ +/);
            let command = args.shift().toLowerCase().trim();

            if(debug) console.log('\x1b[32m%s\x1b[0m','[Log - Mincraft Bot] '+messages['minecraft_bot']['command_execute']+': '+command);
            
            //commands
            if(command == ''){
                //invalid command: null
                bot.chat(messages['minecraft_bot']['chats']['command_invalid']);
            } else if (admin && command == 'reloadconfig' && config['player']['commands']['reload'] || admin && command == 'reload' || admin && command == 'restartconfig' && config['player']['commands']['reload']){
                //reload config
                bot.chat("Reloading Bot Config");
                
                //reload function
                let reloadConfig = parse();

                //parse config
                if(reloadConfig){
                    //reload success
                    bot.chat(messages['reload_config']['success']);
                } else{
                    //reload failed
                    bot.chat(messages['reload_config']['failed']);
                }
            } else if (admin && command == 'restartbot' && config['player']['commands']['restart'] || admin && command == 'reloadbot'&& config['player']['commands']['restart']){
                //restart mineflayer bot
                bot.chat(messages['minecraft_bot']['chats']['command_restarting']);

                //quit and restart
                bot.quit();
                bot.end();
            } else if (command == 'deathcount' && config['player']['countdeaths']['enabled']) {
                bot.chat(`I died `+deathCount.toLocaleString()+` times`);
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
                }, config['player']['chatDelay']);
            }
        }
    });

    bot.on('spawn', () => {
        if(debug) console.log('\x1b[32m%s\x1b[0m','[Log - Mincraft Bot] '+messages['minecraft_bot']['spawned']);

        //check if connected and logged status is true
        if(!connected && !logged){
            if(debug) console.log('\x1b[32m%s\x1b[0m','[Log - Mincraft Bot] '+messages['minecraft_bot']['first_spawn']);

            if(config['player']['autosave']['enbled']){
                saveAll();
            }

            bot.chat(config['player']['message']);
            console.log('MMM');

            setTimeout(() => {
                connected = true;
                logged = true;
                mcDataEnabled = true;
                if(debug) console.log('\x1b[32m%s\x1b[0m','[Log - Mincraft Bot] connected = '+connected+'; logged = '+logged);
            }, 500);
        }

        //set all to default
        lasttime = -1;
        bot.pvp.stop();
        if (lastaction != null) bot.setControlState(lastaction,false);
        bot.deactivateItem();
        moving = false;
        
        // Hmmmmm... so basically database is useless wtf
    });

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

    bot.on('time',function (time){
        //check if bot has been disabled
        if(!config['player']['enabled']) {
            //disconnect bot
            bot.quit();
            bot.end();
            return true;
        }

        //check if bot was logged and connected
        if(!logged && !connected) { return true; }

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
            let randomadd = Math.random() * maxrandom * 50;
            let interval = moveinterval * 20 + randomadd;

            //movements
            if (bot.time.age - lasttime > interval) {
                if (onPVP) { return true; }

                if (moving){
                    bot.setControlState(lastaction,false);
                    bot.deactivateItem();

                    moving = false;
                } else{
                    lastaction = actions[Math.floor(Math.random() * actions.length)];
                    bot.setControlState(lastaction,true);
                    bot.activateItem();
                    
                    moving = true;
                    lasttime = bot.time.age;
                }

                if(debug && config['debug']['movements']) console.log('\x1b[33m%s\x1b[0m','[Log - Mincraft Bot] age: '+bot.time.age+'; lasttime: '+lasttime+'; interval: '+interval+'; lastaction: '+lastaction+'; follow: '+config['player']['follow']['enabled']+'; moving: '+moving+'; pvp: '+onPVP);
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

    bot.on('disconnect',function (){
        if(debug) console.log('\x1b[33m%s\x1b[0m','[Log - Mincraft Bot] '+messages['minecraft_bot']['disconnected']);

        //end bot
        if (connected) { bot.quit(); bot.end(); }
    });
    bot.on('error', reason => {
        if(debug) console.log('\x1b[33m%s\x1b[0m', '[Log - Minecraft Bot] Minecraft bot Error'+reason);

        //end bot
        if (connected) { bot.quit(); bot.end(); }
    });
    bot.on('banned', reason => {
        if(debug) console.log('\x1b[33m%s\x1b[0m', '[Log - Minecraft Bot] Banned:'+reason);

        //end bot
        if (connected) { bot.quit(); bot.end(); }
    });
    bot.on('kicked', reason => {
        if(debug) console.log('\x1b[33m%s\x1b[0m', '[Log - Minecraft Bot] kicked:'+reason);

        //end bot
        if (connected) { bot.quit(); bot.end(); }
    });

    bot.on('end', (reason) => {
        //reconnect timeout
        setTimeout(() => {
            //set status to false
            connected = false;
            logged = false;
            BotUsed = false;

            //check if minecraft player was enabled
            if(!config['player']['enabled']) { return true; }

            //request new bot
            newBot(player, ip, port, version);
            if(debug) console.log('\x1b[33m%s\x1b[0m','[Log - Mincraft Bot] '+messages['minecraft_bot']['bot_end']+': '+reason);
        }, config['server']['reconnectTimeout']);
    });

    //auto save interval
    function saveAll(){
        if (!bot) { return true; }
        if (!config['player']['enabled']) { return true; }

        if(debug) console.log('\x1b[32m%s\x1b[0m',"[Log - Mincraft Bot] "+messages['minecraft_bot']['saved']);

        if(logged && connected) bot.chat(`/minecraft:save-all`);

        setTimeout(() => {
            saveAll();
        }, config['player']['autosave']['interval']);
    }
}
function DiscordBot(token = null){
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
        return true;
    }

    //set bot token
    console.log(token);
    client.login(token);
    
    if(debug) console.log('\x1b[32m%s\x1b[0m',"[Log - Discord Bot] "+messages['discord_bot']['enabled']);

    //on bot ready
    client.once('ready', async () => {
        //set bot status to true
        discordConnected = true;
        if(debug) console.log('\x1b[32m%s\x1b[0m',"[Log - Discord Bot] "+messages['discord_bot']['ready']+": "+client.user.tag+"; "+client.user.id);

        let inviteURL = 'Bot Invite Link: https://discord.com/api/oauth2/authorize?client_id='+client.user.id+'&permissions=8&scope=bot';

        console.log();
        console.log(loop(inviteURL.length, '='));
        console.log("\n"+inviteURL+"\n");
        console.log(loop(inviteURL.length, '='));
        console.log();

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
                return true;
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
            let AdminPerms = false;
            if(message.member && message.member.permissions.has(Discord.Permissions.FLAGS.ADMINISTRATOR)) AdminPerms = true;
            
            //return if the author is bot
            if(author.bot || botUser_id == user_id) { return true; }

            //ignored channels
            var ignored_channels = config['discord']['ignored_channels'];
            var ignored_to_whitelist = config['discord']['ignored_to_whitelist'];

            //ignored users
            var ignored_users = config['discord']['ignored_users'];

            //Check discord ignore list
            if(ignored_to_whitelist && !ignored_channels.includes(channelID.toString()) || !ignored_to_whitelist && ignored_channels.includes(channelID.toString())){
                return true;
            }

            //Check player ignore list
            if(ignored_users.includes(user_id.toString())) { return true; }

            //bot utility functions
            //find bot name in message
            function findName (string) {
                //return if null
                if(string == null) { return true; }

                //trim string
                string = trimUnicode(string.toLowerCase());

                //start finding
                for (let val of config.discord.prefix) {
                    if (string.indexOf(' '+val.toLowerCase()+' ') > -1 || string.startsWith(val.toLowerCase()+' ') || string.endsWith(' '+val.toLowerCase()) || val.toLowerCase() == string){
                        return true;
                    }
                }

                //return result
                return false;
            }

            //remove bot mensions
            function removeMensions (string) {
                //return if null
                if(string == null) { return true; }

                //make lowercase
                string = string.toLowerCase().trim();

                //start removing name
                for (let i=0; i < config.discord.prefix.length; i++) {
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
                if(message == null) { return true; }

                //return if bot doesn't mensionned
                if(!findName(message)) { return true; }

                //get all emotes list
                let actions = Object.keys(emotes);

                //predeclare found var
                let found = null;

                //get action name is false
                if(!get) found = false;
                
                //check for action name
                for (let val of actions) {
                    if(removeMensions(message).toLowerCase().startsWith(val.toLowerCase())){
                        found = true;

                        if(get) return val.toLowerCase();
                    }
                }

                return found;
            }

            //random INT response
            var randomResponse = randomInteger(0, 5);

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
                            return true;
                        }
                        message.channel.send(phrase);
                    } else{
                        message.reply(':no_entry_sign: Invalid arguments! type `>help emotes` for help').then(sentMessage => {
                            setTimeout( () => sentMessage.delete(), 5000);
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
                let command = args.shift().toLowerCase().trim();

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
                    
                } else if (command == 'version' && config['discord']['version-command']) {
                    var embed = new Discord.MessageEmbed()
                        .setColor(config['discord']['embed']['color'])
                        .setAuthor(botName, botAvatar)
                        .setTitle('Version')
                        .setDescription(config['version'])
                        .setTimestamp();
                    message.reply({ embeds: [embed] });
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
                    if(typeof readDeathcountFile == 'null' || typeof readDeathcountFile == 'undefined' || !isNumber(readDeathcountFile)){
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
                        message.reply(messages['discord_bot']['chats']['command_no_perm']).then(sentMessage => {
                            setTimeout(() => { sentMessage.delete(); message.delete(); }, 5000);
                        });
                    }
                } else if (command == 'send' && config['discord']['send-command']) {
                    if(AdminPerms) {
                        message.delete();
                        message.channel.send(rawMessage.slice(config['discord']['command-prefix'].length).substr(command.length + 1).trim());
                    } else {
                        message.reply(messages['discord_bot']['chats']['command_no_perm']).then(sentMessage => {
                            setTimeout(() => { sentMessage.delete(); message.delete(); }, 5000);
                        });
                    }
                } else if (command == 'spam' && config['discord']['spam']['enabled']) {
                    
                    let count = 10;
                    let msg = '';

                    if(AdminPerms) {
                        for (let val of args) {
                            msg += ' '+ val;
                        }

                        if(args.length > 1 && isNumber(parseInt(args[0]))){
                            msg = '';
                            count = parseInt(args[0]);
                            for (let i = 1; i < args.lenght; i++) {
                                msg += ' '+args[i];
                            }
                        }

                        var disabled_channels = config.discord.spam.disabled_channels;
                        
                        msg = msg.trim();

                        let Continue = true;

                        switch (true){
                            case (count <= 0 && count > config['discord']['spam']['max']):
                                message.reply(messages['discord_bot']['spam']['invalid_lenght']).then(sentMessage => {
                                    setTimeout(() => { sentMessage.delete(); message.delete(); }, 5000);
                                });
                                Continue = false;
                                break;
                            case (disabled_channels.includes(channelID.toString())):
                                message.reply(messages['discord_bot']['command_disabled']).then(sentMessage => {
                                    setTimeout(() => { sentMessage.delete(); message.delete(); }, 5000);
                                });
                                Continue = false;
                                break;
                            case (msg == null && msg == ''):
                                message.reply(messages['discord_bot']['spam']['empty']).then(sentMessage => {
                                    setTimeout(() => { sentMessage.delete(); message.delete(); }, 5000);
                                });
                                Continue = false;
                                break;
                            case (config['discord']['spam']['player_ping'] && message.mentions.users.size && message.mentions.roles.size  && message.mentions.everyone):
                                message.reply(messages['discord_bot']['spam']['no_ping']).then(sentMessage => {
                                    setTimeout(() => { sentMessage.delete(); message.delete(); }, 5000);
                                });
                                Continue = false;
                                break;
                        }

                        if(Continue){
                            for (let i=0; i < count; i++){
                                message.channel.send(messages['discord_bot']['spam']['prefix']+msg);
                            }
                        }
                    } else{
                        message.reply(messages['discord_bot']['chats']['command_no_perm']).then(sentMessage => {
                            setTimeout(() => { sentMessage.delete(); message.delete(); }, 5000);
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
                        message.reply(messages['discord_bot']['chats']['command_no_perm']).then(sentMessage => {
                            setTimeout(() => { sentMessage.delete(); message.delete(); }, 5000);
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
                        message.reply(messages['discord_bot']['chats']['command_no_perm']).then(sentMessage => {
                            setTimeout(() => { sentMessage.delete(); message.delete(); }, 5000);
                        });
                    }
                } else if (command == 'reload') {
                    if(AdminPerms) {
                        message.reply(messages['discord_bot']['reloading']);
                        let reload = parse();
                        if(reload){
                            message.reply(messages['reload_config']['success']);
                        } else {
                            message.reply(messages['reload_config']['failed']);
                        }
                    } else {
                        message.reply(messages['discord_bot']['chats']['command_no_perm']).then(sentMessage => {
                            setTimeout(() => { sentMessage.delete(); message.delete(); }, 5000);
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
function connectDB(){
    // This part is useless
    if(debug) console.log('\x1b[32m%s\x1b[0m','[Log - Discord Bot] '+messages['database']['connecting']);

    //return if database was disabled
    if(!config['database']['enabled']){
        if(debug) console.log('\x1b[32m%s\x1b[0m','[Log - Discord Bot] '+messages['database']['disabled']);
        return true;
    }

    //execute connection
    conn = mysql.createConnection({
        host: config['database']['host'],
        user: config['database']['user'],
        password: config['database']['pass'],
        database: config['database']['database']
    });

    //connect to database
    conn.connect(function(error) {
        //on error return
        if (error) {
            console.error('\x1b[31m%s\x1b[0m', '[Error - Database] '+messages['database']['connect_failed']);
            return true;
        }

        if(debug) console.log('\x1b[32m%s\x1b[0m', '[Log - Database] '+messages['database']['connected']+' name: '+db_name+'; host: '+db_host+'; pass: '+db_pass+'; user: '+db_user);

        //log connection
        conn.query("INSERT INTO `connection` VALUES('','"+Date.now()+"')", function(){
            if(debug) console.log('\x1b[32m%s\x1b[0m','[Log - Database] '+messages['database']['connection_logged']);
        });
    });
}