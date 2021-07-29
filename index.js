// HiddePlayer GPL-3.0 License

//Packages
//Mineflayer bot
const mineflayer = require('mineflayer');
const cmd = require('mineflayer-cmd').plugin;
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const pvpBot = require('mineflayer-pvp').plugin;

//Fs
const fs = require('fs');

//request
const request = require("request");

//mysql
const mysql = require('mysql');

//Discord
const Discord = require('discord.js');

//Create discord client
let client = new Discord.Client();

//configuration file
let conf = fs.readFileSync('config.json');
let config = JSON.parse(conf);

//debug enabled/disabled
let debug = config['debug']['enabled'];

//databes conf
let db_enable = config['database']['enabled'];
let db_host = config['database']['host'];
let db_user = config['database']['user'];
let db_pass = config['database']['pass'];
let db_name = config['database']['database'];

//messages file
//messages null check
if (config['messages'] == null) {
    console.error('[Error - Config] Can\'t load messages file');
    process.exit(0);
}

//parse messages file
let messages = JSON.parse(fs.readFileSync(config['messages']));

//messages file version check
if(messages['version'] != config['version']) {
    console.error('[Error - Config] Config version doesn\'t match messages file version');
    process.exit(0);
}

//config version
const configVersion = config['version'];

//Discord connected false
var discordConnected = false;
//Database connected null
var conn = null;

//Parse reloaded config file
function parse (url = null){
    //success pre variable
    var success = false;

    //use external or internal file
    if(url != null){
        if(debug) console.log('[Log - Config] '+messages['reload_config']['external']);

        //Promise config response
        success = new Promise(resolve => {request({
                url: url,
                json: true
            }, function (error, response, body) {

                //check response status
                if (!error && response.statusCode === 200) {
                    //response body
                    body_conf = null;
                    body_config = body;
                    
                    if(debug) {
                        console.log(body_config);
                    }

                    //get response config version
                    var confV = body_config['version'];

                    //throw error when versions doesn't match
                    if(configVersion != confV) {
                        console.error('[Error - Config] '+messages['reload_config']['different_versions']);
                    } else {
                        success = true;
                    }

                    //change config contents
                    config = body_config;

                    //debug enabled/disabled
                    let debug = config['debug']['enabled'];

                    //databes conf
                    let db_enable = config['database']['enabled'];
                    let db_host = config['database']['host'];
                    let db_user = config['database']['user'];
                    let db_pass = config['database']['pass'];
                    let db_name = config['database']['database'];

                    //messages file
                    //messages null check
                    if (config['messages'] == null) {
                        console.error('[Error - Config] Can\'t load messages file');
                        process.exit(0);
                    }

                    //parse messages file
                    let messages = JSON.parse(fs.readFileSync(config['messages']));

                    //messages file version check
                    if(messages['version'] != config['version']) {
                        console.error('[Error - Config] Config version doesn\'t match messages file version');
                        process.exit(0);
                    }

                    if(debug) console.log('[Log - Config] '+messages['reload_config']['success']);
                } else{
                    console.log(body);
                    if(debug) console.error('[Error - Config] '+messages['reload_config']['failed']+': '+error);
                    success = false;
                }

                //success callback
                if(success){
                    //restart all proccesses
                    connectDB();
                    if(config['discord']['enabled']) DiscordBot();
                    if(config['player']['enabled']) newBot();
                }

                //return success
                return success;
            });
        });
        
    } else{
        //response body
        let body_conf = fs.readFileSync('config.json');
        let body_config = JSON.parse(body_conf);
        
        if(debug) {
            console.log('[Log - Config] '+messages['reload_config']);
            console.log(body_config);
        }

        //get config version
        var confV = body_config['version'];

        //throw error when versions doesn't match
        if(configVersion != confV) {
            console.error('[Error - Config] '+messages['reload_config']['different_versions']);
        } else{
            success = true;
        }

        //change config contents
        config = body_config;

        //debug enabled/disabled
        let debug = config['debug']['enabled'];

        //databes conf
        let db_enable = config['database']['enabled'];
        let db_host = config['database']['host'];
        let db_user = config['database']['user'];
        let db_pass = config['database']['pass'];
        let db_name = config['database']['database'];

        //messages file
        //messages null check
        if (config['messages'] == null) {
            console.error('[Error - Config] Can\'t load messages file');
            process.exit(0);
        }

        //parse messages file
        let messages = JSON.parse(fs.readFileSync(config['messages']));

        //messages file version check
        if(messages['version'] != config['version']) {
            console.error('[Error - Config] Config version doesn\'t match messages file version');
            process.exit(0);
        }

        if(debug) console.log('[Log - Config] '+messages['reload_config']['success']);
    }
}

//debug mode enabled/disabled log
if(debug) console.log('[Log - Debug Mode] '+messages['logging']['enabled']);
if(!debug) console.log('[Log - Debug Mode] '+messages['logging']['disabled']);

//Global functions
function escapeRegExp(string) {
    return string.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}
function replaceAll(str, find, replace) {
    return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
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
function findValueOfProperty(obj, propertyName){
    let reg = new RegExp(propertyName, "i"); // "i" to make it case insensitive
    return Object.keys(obj).reduce((result, key) => {
        if( reg.test(key) ) result.push(obj[key]);
        return result;
    }, []);
}

//Main Functions

//Minecraft bot function
function newBot(){
    //movements
    var actions = ['forward', 'back', 'left', 'right'];
    var jump = true;

    //login
    var logged = false;
    var connected = false;

    //entities
    var entity = null;
    var target = null;

    if(debug) console.log('[Log - Mincraft Bot] '+messages['minecraft_bot']['starting']);

    if(connected && logged) {
        if(debug) console.log('[Log - Mincraft Bot] '+messages['minecraft_bot']['disconnected_bot']);

        connected = false;
        logged = false;

        if(bot){
            bot.quit();
            bot.end();
        }
    }

    if(!config['player']['enabled']){
        if(debug) console.log('[Log - Mincraft Bot] '+messages['minecraft_bot']['disabled']);
        return;
    }

    if(debug) console.log('[Log - Mincraft Bot] '+messages['minecraft_bot']['proccessing']);
    
    var player = config['player']['name'];
    
    if(debug && config['debug']['prefix'] != null || debug && config['debug']['suffix'] != null){
        player = config['debug']['prefix'] + player + config['debug']['suffix'];
    
        if(debug) console.log('[Log - Mincraft Bot] '+messages['minecraft_bot']['prefix_and_suffix_enabled']);
    
        if(player.length > 16 || player.length < 3){
            console.error('[Error - Mincraft Bot] '+messages['minecraft_bot']['invalid_name']+': '+player.length); 
            process.exit();
        }
    }
    //make bot
    var port = parseInt(config['server']['port']);
    var ip = config['server']['ip'];

    if (typeof port != 'null' && isNaN(port) || typeof port != 'undefined' && isNaN(port)) { 
        console.error('[Error - Mincraft Bot] '+messages['minecraft_bot']['invalid_port']+': '+port); 
        process.exit(0);        
    }

    var bot = mineflayer.createBot({
        host: ip,
        port: port,
        username: player,
        version: config['player']['version']
    });

    if(debug) console.log('[Log - Mincraft Bot] IP: '+ip+'; Port: '+port+'; PlayerName: '+player+'; Prefix: '+config['debug']['prefix']+'; suffix: '+config['debug']['suffix']+'; Version: '+config['player']['version']);

    bot.loadPlugin(cmd);
    bot.loadPlugin(pathfinder);
    bot.loadPlugin(pvpBot);


    //first spawn
    bot.once('spawn', () => {
        if(debug) console.log('[Log - Mincraft Bot] '+messages['minecraft_bot']['first_spawn']);
        if(config['autosave']['enbled']){
            saveAll();
        }
    });

    //login message
    bot.on('spawn', () => {
        if(debug) console.log('[Log - Mincraft Bot] '+messages['minecraft_bot']['spawned']);
        if(connected == false && logged == false){
            connected = true;
            bot.chat(config['player']['message']);
            logged = true;
            if(debug) console.log('[Log - Mincraft Bot] connected = '+connected+'; logged = '+logged);
        }
    });

    //respawn
    bot.on('death',function() {
        bot.emit("respawn");

        if(debug) console.log('[Log - Mincraft Bot] '+messages['minecraft_bot']['died']);
    });

    //on chat
    bot.on('chat', function (username, message){
        var admin = false;
        if(username == player || username == 'you') { return; }

        if(config['staffs'][username] != undefined && config['staffs'][username] == 'admin') { 
            admin = true; console.log('[Log - Mincraft Bot] '+username+' is an admin'); 
        } else{ 
            console.log('[Log - Mincraft Bot] '+username+' is not an admin'); 
        }

        if(message.substr(0,1) == '!'){
            var args = message.slice(1).trim().split(/ +/);
            var command = args.shift().toLowerCase();

            if(debug) console.log('[Log - Mincraft Bot] '+messages['minecraft_bot']['command_execute']+': '+command);
            
            //commands
            if(command == ''){
                bot.chat(messages['minecraft_bot']['chats']['command_invalid']);
            } else if (admin && command == 'reloadonlineconfig' || admin && command == 'restartconfig'){
                bot.chat("Reloading Bot Config");
                var reload = new Promise(resolve => (parse(config['onlineConfig'])));
                if(reload){
                    bot.chat(messages['reload_config']['success']);
                } else{
                    bot.chat(messages['reload_config']['success']);
                }
            } else if (admin && command == 'restartbot' || admin && command == 'reloadbot'){
                bot.chat(messages['minecraft_bot']['chats']['command_restarting']);
                bot.quit();
                bot.end();
            } else if (admin && command == 'kill') {
                if(bot.players.includes(args[0].trim())){
                    bot.chat(`/minecraft:kill `+args[0].trim());
                    bot.chat(username+` killed `+args[0].trim());
                } else{
                    bot.chat('Player '+args[0].trim()+' not found');
                }
            } else if (admin == false){
                bot.chat(messages['minecraft_bot']['chats']['command_failed']);
            } else{
                bot.chat(messages['minecraft_bot']['chats']['invalid']);
            }

        } else{
            if (debug) console.log('[Log - Mincraft Bot] Player chat recieved from '+username+' > '+message);

            var reply = null;

            message = message.trim();
                    message = replaceAll(message,"'",'');
                    message = replaceAll(message,".",'');
                    message = replaceAll(message,"/",'');
                    message = replaceAll(message,"\\",'');
                    message = replaceAll(message,",",'');
                    message = replaceAll(message,"  ",' ');
                    message = replaceAll(message,"?",'');
                    message = replaceAll(message,"!",'').trim();
                    msg = message;
            removeMensions = replaceAll(message,player,"").trim();
                            rmsg = removeMensions;

            //lower
            lmsg = message.toLowerCase();
            lrmsg = removeMensions.toLowerCase();

            var randommizer = randomInteger(0,5);

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
            }

            reply = replaceAll(reply, "%player%", username);
            reply = replaceAll(reply, "%player_lowercase%", username.toLowerCase());
            reply = replaceAll(reply, "%player_uppercase%", username.toUpperCase());
            reply = replaceAll(reply, "%bot%", botName);
            reply = replaceAll(reply, "%bot_lowercase%", botName.toLowerCase());
            reply = replaceAll(reply, "%bot_uppercase%", botName.toUpperCase());

            //summon reply
            if(reply != null) {
                setTimeout(() => {
                    bot.chat(reply);
                }, config['chat']['chatDelay']);
            }
        }
    });

    //moves
    var lasttime = -1;
    var moveinterval = 5;
    var maxrandom = 5;
    var moving = false;
    var jump = false;
    var onPVP = false;

    function saveAll(){
        if (!bot) return;
        if (!config['player']['enabled']) return;

        if(debug) console.log("[Log - Mincraft Bot] "+messages['minecraft_bot']['saved']);

        if(logged && connected) bot.chat(`/minecraft:save-all`);

        setTimeout(() => {
            saveAll();
        }, config['autosave']['interval']);
    }

    bot.on('time',function (time){
        if(config['player']['enabled'] == false) {
            bot.quit();
            bot.end();
            return;
        }

        if(logged != true && connected != true) { return; }

        entity = bot.nearestEntity();
        if(entity != null && entity.position != null && entity.isValid && entity.type == 'mob' || entity != null && entity.position != null && entity.isValid && entity.type == 'player') bot.lookAt(entity.position.offset(0, 1.6, 0));

        if(entity && entity.kind && entity.isValid && entity.type == 'mob' && entity.kind.toLowerCase() == 'hostile mobs' && pvpBot){
            onPVP = true;
            bot.pvp.attack(entity);
            bot.setQuickBarSlot(1);
        } else {
            onPVP = false;
            bot.pvp.stop();
            bot.setQuickBarSlot(0);
        }

        if (lasttime < 0) {
            lasttime = bot.time.age;
            if(debug) console.log('[Log - Mincraft Bot] '+messages['minecraft_bot']['set_last_time']);
        } else{
            var randomadd = Math.random() * maxrandom * 50;
            var interval = moveinterval * 20 + randomadd;

            if (bot.time.age - lasttime > interval) {
                if (onPVP) return;

                if (moving){
                    bot.setControlState(lastaction,false);
                    bot.deactivateItem();
                    moving = false;
                    if(debug && config['debug']['movements']) console.log('[Log - Mincraft Bot] age = '+bot.time.age+'; moving = '+moving);
                } else{
                    lastaction = actions[Math.floor(Math.random() * actions.length)];
                    bot.setControlState(lastaction,true);
                    moving = true;
                    lasttime = bot.time.age;
                    bot.activateItem();
                    if(debug && config['debug']['movements']) console.log('[Log - Mincraft Bot] age = '+bot.time.age+'; moving = '+moving);
                }
            }

            if(jump){
                bot.setControlState('jump', true)
                bot.setControlState('jump', false)
                jump = false
            } else {
                bot.setControlState('jump', false)
                setTimeout(() => {
                    jump = true;
                }, 1000);
            }
        }
    });

    //if bot end
    bot.on('error kicked',function (reason){
        if(debug) console.log('[Log - Mincraft Bot] '+messages['minecraft_bot']['disconnected']+': '+reason);
        bot.quit();
        bot.end();
    });
    bot.on('end', () => {
        if(!connected && !logged) return;

        connected = false;
        logged = false;

        setTimeout(() => {
            if(config['player']['enabled'] == false) return;
            newBot();
            if(debug) console.log('[Log - Mincraft Bot] '+messages['minecraft_bot']['bot_end']);
        }, config['server']['reconnectTimeout']);
    });
}

//Discord bot function
function DiscordBot(){
    if(discordConnected){
        if(client){
            client.destroy();
        }
        discordConnected = false;
    }
    
    if(config['discord']['enabled'] == false){
        if(debug) console.log('[Log - Discord Bot] '+messages['discord_bot']['disabled']);
        return;
    }

    client.login(config['discord']['token']);

    if(debug) console.log("[Log - Discord Bot] "+messages['discord_bot']['enabled']);

    client.on('ready', () => {
        discordConnected = true;
        if(debug) console.log("[Log - Discord Bot] "+messages['discord_bot']['ready']+": "+client.user.tag+"; "+client.user.id);

        //actions
        var emotes = null;
        var reacts = null;
        var motivations = null;
        var factslist = null;

        if(config['discord']['emotes']['enabled']){
            emotes = fs.readFileSync(config['discord']['emotes']['src']);
            emotes = JSON.parse(emotes);
        }

        if(config['discord']['react']['enabled']){
            reacts = fs.readFileSync(config['discord']['react']['src']);
            reacts = JSON.parse(reacts);
        }

        if(config['discord']['motivate']['enabled']){
            motivations = fs.readFileSync(config['discord']['motivate']['src']);
            motivations = JSON.parse(motivations);
        }

        if(config['discord']['facts']['enabled']){
            factslist = fs.readFileSync(config['discord']['facts']['src']);
            factslist = JSON.parse(factslist);
        }

        client.on('message', message => {
            //disconnect
            if(config['discord']['enabled'] == false){
                client.destroy();
                return;
            }

            //Placeholders
            var rawMessage = message.content;
            var lowerMessage = message.content.toLowerCase()
                        lowerMessage = replaceAll(lowerMessage,'!','')
                        lowerMessage = replaceAll(lowerMessage,'?','')
                        lowerMessage = replaceAll(lowerMessage,'.','')
                        lowerMessage = replaceAll(lowerMessage,',','')
                        lowerMessage = replaceAll(lowerMessage,'\'','')
                        lowerMessage = replaceAll(lowerMessage,'"','')
                        lowerMessage = replaceAll(lowerMessage,'\\','')
                        lowerMessage = replaceAll(lowerMessage,'/','').trim();

            var botAvatar = client.user.displayAvatarURL();
            var botName = client.user.tag;
            var botUser_id = client.user.id;
            var userAvatar = message.author.displayAvatarURL({ format: 'png', dynamic: true });

            var taggedUser = message.mentions.users.first();
            var taggedUsername = null;
            var pinged = '<@!'+taggedUser+'>';
                //prevent user error: !message.mentions.users.size
                if (message.mentions.users.size) taggedUsername = taggedUser.username;

            var author = message.author.username;
            var user_id = message.author.id;

            var mension = '<@!'+user_id+'>';

            var channelName = message.channel.name;
            var channelID = message.channel.id;

            var command = false;
            var args = null;
            

            //bot utility functions
            function findName (string) {
                if(string == null) return;

                string = string.toLowerCase();
                string = replaceAll(string,'!','');
                string = replaceAll(string,'?','');
                string = replaceAll(string,'.','');
                string = replaceAll(string,',','');
                string = replaceAll(string,'\'','');
                string = replaceAll(string,'"','');
                string = replaceAll(string,'\\','');
                string = replaceAll(string,'/','').trim();

                found = false;

                for (var i=0; i < config['discord']['prefix'].length; i++) {
                    if (string.indexOf(' '+config['discord']['prefix'][i].toLowerCase()+' ') > -1 || string.indexOf(config['discord']['prefix'][i].toLowerCase()+' ') > -1 || string.indexOf(' '+config['discord']['prefix'][i].toLowerCase()) > -1 || config['discord']['prefix'][i].toLowerCase() == string){
                        return found = true;
                    }
                }

                return found;
            }

            function removeMensions (string) {
                if(string == null) return;

                string = string.toLowerCase().trim();

                for (var i=0; i < config['discord']['prefix'].length; i++) {
                    if (string.indexOf(' '+config['discord']['prefix'][i]+' ') > -1 || string.indexOf(config['discord']['prefix'][i]+' ') > -1 || string.indexOf(' '+config['discord']['prefix'][i]) > -1 || string.startsWith(config['discord']['prefix'][i]+' ')){
                        string = replaceAll(string,' '+config['discord']['prefix'][i]+' ','');
                        string = replaceAll(string,config['discord']['prefix'][i]+' ','');
                        string = replaceAll(string,' '+config['discord']['prefix'][i],'');
                        string = string.trim();
                    }
                }

                string = replaceAll(string,'!','');
                string = replaceAll(string,'?','');
                string = replaceAll(string,'.','');
                string = replaceAll(string,',','');
                string = replaceAll(string,'\'','');
                string = replaceAll(string,'"','');
                string = replaceAll(string,'\\','');
                string = replaceAll(string,'/','');
                string = string.trim();

                return string;
            }

            function actionFind (message, get = false){
                if(message == null) return;
                if(!findName(message)) return;

                var actions = Object.keys(emotes);
                var found = null;

                if(get == false) 
                    found = false;
                
                for (var i=0; i < actions.length; i++) {
                    if(removeMensions(message).toLowerCase().startsWith(actions[i].toLowerCase())){
                        var found = true;

                        if(get) return actions[i].toLowerCase();

                    }
                }

                return found;
            }

            //random INT response
            randomResponse = randomInteger(0, 5);

            if(author.bot) return;

            //CMD or STRING parser
            if (!rawMessage.startsWith(config['discord']['command-prefix'])){
                if(debug) console.log("[Log - Discord Bot] "+messages['discord_bot']['message_sent']+": "+author);
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
                        var emoteName = actionFind(lowerMessage, true);
                        var emote = emotes[emoteName];

                        var selfPing = false;
                        if(taggedUser == user_id) selfPing = true;

                        var phrase = null;
                        var RandomImage = null;
                        
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

                        if(selfPing != true){
                            RandomImage = emote['sources'][Math.floor(Math.random() * Object.keys(emote.sources).length)];
                        }

                        if (RandomImage != null) {
                            var embed = new Discord.MessageEmbed()
                                .setColor('#0099ff')
                                .setAuthor(phrase, userAvatar)
                                .setImage(RandomImage);

                            message.channel.send(embed);
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
                        var randomKey = Math.floor(Math.random() * Object.keys(motivations).length);
                        
                        var msg = Object.keys(motivations)[randomKey];
                        var author = motivations[msg]['author'];


                        var embed = new Discord.MessageEmbed()
                            .setColor('#0099ff')
                            .setTitle(`By: `+author)
                            .setDescription('> '+msg);
                        message.channel.send(embed);
                    }
                } else if (findName(rawMessage) && removeMensions(lowerMessage).substr(0,11).replace('tell','').replace('me','').trim() == 'random fact') {
                    
                } else if (removeMensions(lowerMessage).indexOf('im') > -1 && removeMensions(lowerMessage).indexOf('sick') > -1 && removeMensions(lowerMessage).indexOf('not') < 0) {
                    
                    if(randomResponse == 0)
                        message.reply('Get rest :thumbsup:');
                    else if (randomResponse == 1)
                        message.reply('Stay Healthy and get rest :)');
                    else
                        message.reply('Stay safe <3');

                } else if(findName(rawMessage) || taggedUser == botUser_id) {
                    message.react('854320612565450762');
                }
            } else {
                if(debug) console.log("[Log - Discord Bot] "+messages['discord_bot']['command_execute']+": "+command+" by "+author);

                var args = rawMessage.slice(config['discord']['command-prefix'].length).trim().split(/ +/);
                var command = args.shift().toLowerCase();

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
                        .setColor('#0099ff')
                        .setAuthor(author, userAvatar);
                    message.channel.send(embed);
                } else if (command == 'you') {

                    if(randomResponse == 0)
                        message.channel.send('I don\'t give my personal info to others :disappointed:');
                    else if(randomResponse == 1)
                        message.channel.send('Are you a stalker?');
                    else if (randomResponse == 2)
                        message.channel.send('I need privacy :smirk:');
                    else
                        var bot = new Discord.MessageEmbed()
                        .setColor('#0099ff')
                        .setAuthor(botName, botAvatar)
                        .setTimestamp();
                        message.channel.send(bot);

                } else if (command == 'embed' && config['discord']['embed_messages']) {
                    if(message.member.hasPermission("ADMINISTRATOR")) {
                        message.delete();

                        var title = rawMessage.slice(config['discord']['command-prefix'].length).substr(command.length + 1).split(" ",1)[0];
                            title = replaceAll(title,"_"," ").trim();
                        var content = rawMessage.slice(config['discord']['command-prefix'].length).substr(command.length + 1).slice(title.length);

                        var embed = new Discord.MessageEmbed()
                            .setColor('#0099ff')
                            .setTitle(title)
                            .setAuthor('HiddenPlayer', botAvatar)
                            .setDescription(content)
                            .setTimestamp()
                        message.channel.send(embed);
                    } else {
                        message.reply(messages['discord_bot']['chats']['command_no_perm']).then(msg => {
                            setTimeout(() => { msg.delete(); message.delete() }, 5000);
                        });
                    }
                } else if (command == 'send' && config['discord']['send_bot_messages']) {
                    if(message.member.hasPermission("ADMINISTRATOR")) {
                        message.delete();
                        message.channel.send(rawMessage.slice(config['discord']['command-prefix'].length).substr(command.length + 1).trim());
                    } else {
                        message.reply(messages['discord_bot']['chats']['command_no_perm']).then(msg => {
                            setTimeout(() => { msg.delete(); message.delete() }, 5000);
                        });
                    }
                } else if (command == 'spam' && config['discord']['spam']['enabled']) {
                    
                    var count = 10;
                    var msg = '';

                    if(message.member.hasPermission("ADMINISTRATOR")) {
                        for (var i = 0; i < args.length; i++) {
                            msg += ' '+args[i];
                        }

                        if(args.length > 1 && !isNaN(parseInt(args[0]))){
                            msg = '';
                            count = args[0];
                            for (var i = 1; i < args.length; i++) {
                                msg += ' '+args[i];
                            }
                        }

                        var disabled_channels = config.discord.spam.disabled_channels;
                        
                        msg = msg.trim();

                        if (count > 0 && count <= config['discord']['spam']['max']){
                            if(!disabled_channels.includes(channelID)){
                                if(msg != null && msg != ''){
                                    if(!config['discord']['spam']['player_ping'] && !message.mentions.users.size && !message.mentions.roles.size  && !message.mentions.everyone || config['discord']['spam']['player_ping']){
                                        for (let spam = 0; spam < count; spam++) {
                                            message.channel.send(`\`spam:\` `+msg);
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
                    if(message.member.hasPermission("ADMINISTRATOR")) {
                        var embed = new Discord.MessageEmbed()
                            .setColor('#0099ff')
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
                        message.channel.send(embed);
                    } else {
                        message.reply(messages['discord_bot']['chats']['command_no_perm']).then(msg => {
                            setTimeout(() => { msg.delete(); message.delete() }, 5000);
                        });
                    }
                } else if (command == 'reloadall' || command == 'reloadassets') {
                    if(message.member.hasPermission("ADMINISTRATOR")) {
                        message.reply(`Reloading assets`);
                        if(config['discord']['emotes']['enabled']){
                            emotes = fs.readFileSync(config['discord']['emotes']['src']);
                            emotes = JSON.parse(emotes);

                            if(debug) console.log('[Log] '+messages['discord_bot']['reload_complete']+': Emotes');
                        }
                
                        if(config['discord']['react']['enabled']){
                            reacts = fs.readFileSync(config['discord']['react']['src']);
                            reacts = JSON.parse(reacts);

                            if(debug) console.log('[Log - Discord Bot] '+messages['discord_bot']['reload_complete']+': Reacts');
                        }
                
                        if(config['discord']['motivate']['enabled']){
                            motivations = fs.readFileSync(config['discord']['motivate']['src']);
                            motivations = JSON.parse(motivations);

                            if(debug) console.log('[Log - Discord Bot] '+messages['discord_bot']['reload_complete']+': Motivations');
                        }
                        message.channel.send(messages['discord_bot']['reload_complete']+': Assets');
                    } else {
                        message.reply(messages['discord_bot']['chats']['command_no_perm']).then(msg => {
                            setTimeout(() => { msg.delete(); message.delete() }, 5000);
                        });
                    }
                } else if (command == 'reload') {
                    if(message.member.hasPermission("ADMINISTRATOR")) {
                        message.reply(messages['discord_bot']['reloading']);
                        var reload = new Promise(resolve => (parse(config['onlineConfig'])));

                        if(reload){
                            message.reply(messages['discord_bot']['chats']['reloaded']);
                        } else{
                            message.reply(messages['discord_bot']['chats']['reload_failed']);
                        }
                    } else {
                        message.reply(messages['discord_bot']['chats']['command_no_perm']).then(msg => {
                            setTimeout(() => { msg.delete(); message.delete() }, 5000);
                        });
                    }
                }
            }

            if(debug) {
                console.log("[Log - Discord Bot] "+messages['discord_bot']['message_received']+": "+limitText(message.content));
                //console.log('[Log - Discord Bot] Raw Message: '+limitText(rawMessage)+'; LowerRemoveMensions: '+limitText(removeMensions(lowerMessage))+'; BotFind: '+limitText(findName(lowerMessage)));
            }
        });
    });
}

//Database function
function connectDB(){
    if(debug) console.log('[Log - Discord Bot] '+messages['database']['connecting']);

    if(db_enable == false){
        if(debug) console.log('[Log - Discord Bot] '+messages['database']['disabled']);
        return;
    }

    conn = mysql.createConnection({
        host: db_host,
        user: db_user,
        password: db_pass,
        database: db_name
    });

    conn.connect(function(error) {
        if (error) {
            console.error('[Error - Database] '+messages['database']['connect_failed']);
            return;
        }

        if(debug) console.log('[Log - Database] '+messages['database']['connected']+' name: '+db_name+'; host: '+db_host+'; pass: '+db_pass+'; user: '+db_user);

        conn.query("INSERT INTO `connection` VALUES('','"+Date.now()+"')", function(){
            if(debug) console.log('[Log - Database] '+messages['database']['connection_logged']);
        });
    });
}

//Start all proccess
if(db_enable) connectDB();
if(config['discord']['enabled']) DiscordBot();
if(config['player']['enabled']) newBot();

// if(conn) connection.end();