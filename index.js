//HiddePlayer
const mineflayer = require('mineflayer');
const cmd = require('mineflayer-cmd').plugin;
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const pvpBot = require('mineflayer-pvp').plugin;
const fs = require('fs');
const request = require("request");
const mysql = require('mysql');

//Discord
const Discord = require('discord.js');
let client = new Discord.Client();

//configuration
let conf = fs.readFileSync('config.json');
let config = JSON.parse(conf);

//debug
let debug = config['debug']['enabled'];

//databes conf
let db_enable = config['database']['enabled'];
let db_host = config['database']['host'];
let db_user = config['database']['user'];
let db_pass = config['database']['pass'];
let db_name = config['database']['database'];

const configVersion = config['version'];

//Other Connections
var discordConnected = false;
var conn = null;

function parse (url = null){
    if(url != null){
        if(debug) console.log('[Log - Config] Config triggered');

        var success = false;

        request({
			url: url,
			json: true
		}, function (error, response, body) {

            if (!error && response.statusCode === 200) {
                body_conf = null;
                body_config = body;
                
                if(debug) {
                    console.log('[Log - Config] Config Requested from: '+config['onlineConfig']);
                    console.log(body_config);
                }

                var confV = body_config['version'];

                if(configVersion != confV) {
                    console.error('[Error - Config] Config reload failed: Different config versions');
                    process.exit();
                }

                config = body_config;

                //debug
                debug = config['debug']['enabled'];

                //databes conf
                db_enable = config['database']['enabled'];
                db_host = config['database']['host'];
                db_user = config['database']['user'];
                db_pass = config['database']['pass'];
                db_name = config['database']['database'];

                if(debug) console.log('[Log - Config] Config reload success');
                success = true;
            } else{
                if(debug) console.log('[Log - Config] Config reload failed error - '+error);
                if(debug) console.log('[Log - Config] Config reload body - '+body);
                success = false;
            }

            connectDB();

            if(config['discord']['enabled']) DiscordBot();
            if(config['player']['enabled']) newBot();
            return success;
        });
        
    } else{
        let body_conf = fs.readFileSync('config.json');
        let body_config = JSON.parse(conf);
        
        if(debug) {
            console.log('[Log - Config] Config Requested from: '+config['onlineConfig']);
            console.log(body_config);
        }

        var confV = body_config['version'];

        if(configVersion != confV) {
            console.error('[Error - Config] Config reload failed: Different config versions');
            process.exit();
        }

        config = body_config;

        //debug
        debug = config['debug']['enabled'];

        //databes conf
        db_enable = config['database']['enabled'];
        db_host = config['database']['host'];
        db_user = config['database']['user'];
        db_pass = config['database']['pass'];
        db_name = config['database']['database'];

        if(debug) console.log('[Log - Config] Config reload success');
    }
}

//debug mode
if(debug) console.log('[Log - Debug Mode] Debug mode enabled');
if(!debug) console.log('[Log - Debug Mode] Debug mode disabled');

//Other functions
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

//Main bot [MC / Discord] functions and databases
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

    if(debug) console.log('[Log - Mincraft Bot] Making new minecraft session');

    if(connected && logged) {
        
        if(bot){
            bot.quit();
            bot.end();
        }

        if(debug) console.log('[Log - Mincraft Bot] Disconnecting Minecraft bot');

        connected = false;
        logged = false;
    }

    if(!config['player']['enabled']){
        if(debug) console.log('[Log - Mincraft Bot] Minecraft player is turned off');
        return;
    }

    if(debug) console.log('[Log - Mincraft Bot] Start');
    
    var player = config['player']['name'];
    
    if(debug && config['debug']['prefix'] != null || debug && config['debug']['sufix'] != null){
        player = config['debug']['prefix'] + player + config['debug']['sufix'];
    
        if(debug) console.log('[Log - Mincraft Bot] Prefix and Sufix enabled');
    
        if(debug && player.length > 16){
            console.error('[Error - Mincraft Bot] Name length expected 16 or less. '+player.length+' requested'); 
            process.exit();
        }
    }
    //make bot
    var port = parseInt(config['server']['port']);
    var ip = config['server']['ip'];

    if (isNaN(port)) { 
        console.error('[Error - Mincraft Bot] Invalid Port'); 
        process.exit();        
    }

    var bot = mineflayer.createBot({
        host: ip,
        port: port,
        username: player
    });

    if(debug) console.log('[Log - Mincraft Bot] IP: '+ip+'; Port: '+port+'; PlayerName: '+player+'; Prefix: '+config['debug']['prefix']+'; Sufix: '+config['debug']['sufix']);

    bot.loadPlugin(cmd);
    bot.loadPlugin(pathfinder);
    bot.loadPlugin(pvpBot);


    //first spawn
    bot.once('spawn', () => {
        if(debug) console.log('[Log - Mincraft Bot] First Spawn');
        if(config['autosave']['enbled']){
            saveAll();
        }
    });

    //login message
    bot.on('spawn', () => {
        if(debug) console.log('[Log - Mincraft Bot] Spawned');
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

        if(debug) console.log('[Log - Mincraft Bot] Died');
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

            if(debug) console.log('[Log - Mincraft Bot] Player Command Executed');
            
            //commands
            if(command == ''){
                bot.chat('invalid command type !help to get help');
            } else if (admin && command == 'reloadonlineconfig' || admin && command == 'restartconfig'){
                bot.chat("Reloading Bot Config");
                parse(config['onlineConfig']);
            } else if (admin && command == 'restartbot' || admin && command == 'reloadbot'){
                bot.chat("Restarting Bot");
                bot.quit();
                bot.end();
            } else if (admin && command == 'kill') {
                if(findValueOfProperty(bot.players, args[0].trim()).length > 0){
                    bot.chat(`/minecraft:kill `+args[0].trim());
                    bot.chat(username+` killed `+args[0].trim());
                } else{
                    bot.chat('Player '+args[0].trim()+' not found');
                }
            } else if (admin == false){
                bot.chat('You can\'t execute this command');
            } else{
                bot.chat('Invalid command argument type !help to get help');
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
                reply = 'Hello '+username+'!';
            } else if (lmsg == player.toLowerCase() + 'hello' || lmsg == 'hello ' + player.toLowerCase() || lrmsg == 'hello guys' || lmsg == player.toLowerCase()){
                reply = 'Hi '+username+'!';
            } else if (lrmsg.replace('hello','').replace('hi','').trim() == 'im new' || lrmsg.replace('hello','').replace('hi','').trim() == 'im new here' || lrmsg.replace('hello','').replace('hi','').trim() == 'new here'){
                reply = 'Welcome '+username+'!';
            } else if (lmsg.indexOf("who") > -1 && lmsg.indexOf("is") > -1 && lmsg.indexOf(player.toLowerCase()) > -1 || lmsg == 'whos '+player.toLowerCase() || lmsg == player.toLowerCase()+' who are you'){
                reply = 'I\'m a bot!';
            } else if (lmsg.indexOf("what") > -1 && lmsg.indexOf("is") > -1 && lmsg.indexOf("bot") > -1 || lmsg.indexOf("what") > -1 && lmsg.indexOf("are") > -1 && lmsg.indexOf("bot") > -1){
                reply = 'Bots are players controlled by a program or artificial intellegence or AI in short they\'re not human.';
            } else if (lrmsg == 'a government spy' && lmsg.indexOf(player.toLowerCase()) > -1){
                
                if(randommizer == 0)
                    reply = 'I\'m not a govenment spy ;( [Cries]';
                else if (randommizer == 2)
                    reply = 'I\'m not a spy! You don\'t have a proof :>';
                else if (randommizer == 3)
                    reply = 'I\'m not a spy! Why are you like that :(';
                else 
                    reply = 'I\'m not a spy! I just jump and eat roasted chicken lol :>';

            } else if (lmsg.indexOf("kill "+player.toLowerCase()) > -1){
                
                if(randommizer == 0)
                    reply = 'Dont kill me :<';
                else if (randommizer == 2)
                    reply = 'Kill me! I can ban :)';
                else if (randommizer == 3)
                    reply = 'You can\'t kill me!';
                else
                    reply = 'kill me! I\'ll tell the owner';

            }

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

        if(debug) console.log("[Log - Mincraft Bot] Saved the game");

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
            if(debug) console.log('[Log - Mincraft Bot] last Time set');
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
        if(debug) console.log('[Log - Mincraft Bot] Bot left the game - reason: '+reason);
        bot.quit();
        bot.end();
    });
    bot.on('end', () => {
        connected = false;
        logged = false;

        setTimeout(() => {
            if(config['player']['enabled'] == false) return;
            newBot();
            if(debug) console.log('[Log - Mincraft Bot] End');
        }, config['server']['reconnectTimeout']);
    });
}
function DiscordBot(){
    if(discordConnected){
        if(client){
            client.destroy();
        }
        discordConnected = false;
    }
    
    if(config['discord']['enabled'] == false){
        if(debug) console.log('[Log - Discord Bot] Discord bot is turned off');
        return;
    }

    client.login(config['discord']['token']);

    if(debug) console.log("[Log - Discord Bot] Discord bot enabled");

    client.on('ready', () => {
        discordConnected = true;
        if(debug) console.log("[Log - Discord Bot] Discord bot is ready: "+client.user.tag+"; "+client.user.id);

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
                if(debug) console.log("[Log - Discord Bot] Discord message sent by: "+author);
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
                if(debug) console.log("[Log - Discord Bot] Executed Discord bot command: "+command+" by "+author);

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
                        message.reply('You don\'t have permission to do that').then(msg => {
                            setTimeout(() => { msg.delete(); message.delete() }, 3000);
                        });
                    }
                } else if (command == 'send' && config['discord']['send_bot_messages']) {
                    if(message.member.hasPermission("ADMINISTRATOR")) {
                        message.delete();
                        message.channel.send(rawMessage.slice(config['discord']['command-prefix'].length).substr(command.length + 1).trim());
                    } else {
                        message.reply('You don\'t have permission to do that').then(msg => {
                            setTimeout(() => { msg.delete(); message.delete() }, 3000);
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
                        
                        msg = msg.trim();

                        if (count > 0 && count <= 30){
                            if(!findValueOfProperty(config['discord']['spam']['disabled_channels'],channelID)){
                                for (let spam = 0; spam < count; spam++) {
                                    message.channel.send(`\`spam:\` `+msg);
                                }
                            } else {
                                message.reply(`Spam command is disabled in this channel :no_entry_sign:`).then(msg => {
                                    setTimeout(() => { msg.delete(); message.delete() }, 3000);
                                });;
                            }
                        } else{
                            message.reply(`Spam chat count is too small or too large :no_entry_sign:`).then(msg => {
                                setTimeout(() => { msg.delete(); message.delete() }, 3000);
                            });;
                        }
                    } else{
                        message.reply(`This command is only for Admins :no_entry_sign:`).then(msg => {
                            setTimeout(() => { msg.delete(); message.delete() }, 3000);
                        });;
                    }

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
                        message.reply('You don\'t have permission to do that').then(msg => {
                            setTimeout(() => { msg.delete(); message.delete() }, 3000);
                        });
                    }
                } else if (command == 'reloadall' || command == 'reloadassets') {
                    if(message.member.hasPermission("ADMINISTRATOR")) {
                        message.reply(`Reloading assets`);
                        if(config['discord']['emotes']['enabled']){
                            emotes = fs.readFileSync(config['discord']['emotes']['src']);
                            emotes = JSON.parse(emotes);

                            if(debug) console.log('[Log] Emotes reloaded');
                        }
                
                        if(config['discord']['react']['enabled']){
                            reacts = fs.readFileSync(config['discord']['react']['src']);
                            reacts = JSON.parse(reacts);

                            if(debug) console.log('[Log - Discord Bot] Reacts reloaded');
                        }
                
                        if(config['discord']['motivate']['enabled']){
                            motivations = fs.readFileSync(config['discord']['motivate']['src']);
                            motivations = JSON.parse(motivations);

                            if(debug) console.log('[Log - Discord Bot] Motivations reloaded');
                        }
                        message.channel.send(`Assets Reloaded`);
                    } else {
                        message.reply('You don\'t have permission to do that').then(msg => {
                            setTimeout(() => { msg.delete(); message.delete() }, 3000);
                        });
                    }
                } else if (command == 'reload') {
                    if(message.member.hasPermission("ADMINISTRATOR")) {
                        message.delete();
                        message.reply('Reloading Minecraft and Discord bots');
                        parse(config['onlineConfig']);
                    } else {
                        message.reply('You don\'t have permission to do that').then(msg => {
                            setTimeout(() => { msg.delete(); message.delete() }, 3000);
                        });
                    }
                }
            }

            if(debug) {
                console.log("[Log - Discord Bot] Discord message: "+limitText(message.content));
                console.log('[Log - Discord Bot] Raw Message: '+limitText(rawMessage)+'; LowerRemoveMensions: '+limitText(removeMensions(lowerMessage))+'; BotFind: '+limitText(findName(lowerMessage)));
            }
        });
    });
}
function connectDB(){
    if(debug) console.log('[Log - Discord Bot] Connecting to databse');

    if(conn){
        if(conn.end()){
            if(debug) console.log('[Log - Discord Bot] Previous Database Connection has closed');
        } else{
            console.error('[Error - Discord Bot] Unable to disconnect to database!');
            process.exit();
        }
    }

    if(db_enable == false){
        if(debug) console.log('[Log - Discord Bot] Database is disabled');
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
            console.error('[Error - Database] Unable to connect to database!');
            return;
        }
       
        if(debug) console.log('[Log - Database] Database connected! name: '+db_name+'; host: '+db_host+'; pass: '+db_pass+'; user: '+db_user);

        conn.query("INSERT INTO `connection` VALUES('','"+Date.now()+"')", function(){
            if(debug) console.log('[Log - Database] MySQL connection logged!');
        });
    });
}

if(db_enable) connectDB();
if(config['discord']['enabled']) DiscordBot();
if(config['player']['enabled']) newBot();

// if(conn) connection.end();