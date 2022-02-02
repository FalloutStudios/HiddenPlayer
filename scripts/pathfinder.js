const Yml = require('yaml');
const Fs = require('fs');
const Path = require('path');
const Util = require('fallout-utility');

module.exports = (bot, Pathfinder) => {
    const botConfig = getConfig('./config/pathfinder.yml');

    if(botConfig.enablePathfinder) {
        pathFinder(bot, Pathfinder, botConfig);
    }
}

function pathFinder(bot, Pathfinder, botConfig) {
    const mcData = require('minecraft-data')(bot.version);
    const defaultMove = configureMovements(new Pathfinder.Movements(bot, mcData), botConfig);

    bot.on('whisper', (username, message, rawMessage) => { 
        if(username === bot.username) return;

        const commandData = Util.detectCommand(message, botConfig.pathFinderCommandPrefix) ? Util.getCommand(message, botConfig.pathFinderCommandPrefix) : null;
        if(!commandData) return;

        const command = commandData.command.toLowerCase();
        const args = commandData.args;
        
        if(!Object.values(botConfig.commands).find(c => c.name === command)?.enabled) return bot.whisper(username, `${command} is disabled.`);

        if(botConfig.commandAccessPermissions.enabled) {
            const allowedPlayer = !botConfig.commandAccessPermissions.invertAllowedToDisallowed ? botConfig.commandAccessPermissions.allowedPlayers.includes(username) : !botConfig.commandAccessPermissions.allowedPlayers.includes(username);
            if(!allowedPlayer) return bot.whisper(username, `You are not allowed to use ${command}`);
        }

        if((bot.pathfinder.isMoving() || bot.pathfinder.isMining() || bot.pathfinder.isBuilding()) && command !== 'stop') return bot.whisper(username, 'I am already pathfinding! Stop it first!');
        bot.pathfinder.setMovements(defaultMove);
        switch(command) {
            case 'goto':
                if(args.length <= 2 || (!parseInt(args[0]) || !parseInt(args[1]) || !parseInt(args[2]))) return bot.whisper(username, `Usage: ${command} <x> <y> <z>`);
                bot.whisper(username, `Pathfinding to ${args[0]} ${args[1]} ${args[2]}`);

                bot.pathfinder.setGoal(new Pathfinder.goals.GoalBlock(args[0], args[1], args[2]));
                break;
            case 'gotome':
                const player = bot.players[username] ? bot.players[username].entity : null;
                if(!player) return bot.whisper(username, 'I can\'t find you!');

                bot.whisper(username, `Pathfinding to ${player.position.x} ${player.position.y} ${player.position.z}`);
                bot.pathfinder.setGoal(new Pathfinder.goals.GoalNear(player.position.x, player.position.y, player.position.z, 1));
                break;
            case 'gotonear':
                const entity = bot.nearestEntity(e => e.type !== 'player');
                if(!entity) return bot.whisper(username, 'I can\'t find any nearby entities!');

                bot.whisper(username, `Pathfinding to ${entity.position.x} ${entity.position.y} ${entity.position.z}`);
                bot.pathfinder.setGoal(new Pathfinder.goals.GoalNear(entity.position.x, entity.position.y, entity.position.z, 1));
                break;
            case 'gotonearplayer':
                const playerEntity = bot.nearestEntity(e => e.type === 'player');
                if(!playerEntity) return bot.whisper(username, 'I can\'t find any nearby players!');

                bot.whisper(username, `Pathfinding to ${playerEntity.position.x} ${playerEntity.position.y} ${playerEntity.position.z}`);
                bot.pathfinder.setGoal(new Pathfinder.goals.GoalNear(playerEntity.position.x, playerEntity.position.y, playerEntity.position.z, 1));
                break;
            case 'stop':
                bot.whisper(username, 'Stopping pathfinding');
                bot.pathfinder.stop();
                break;
        }
    }); 

    bot.on('death', () => {
        if(bot.pathfinder.isMoving() || bot.pathfinder.isMining() || bot.pathfinder.isBuilding()) {
            if(botConfig.events.announceOnDeathWhilePathfinding.enabled) {
                bot.chat(botConfig.events.announceOnDeathWhilePathfinding.message);
                bot.pathfinder.stop();
            }
        }
    });
}

function configureMovements(movements, botConfig) {
    movements.canDig = botConfig.events.breakBlocksWhilePathfinding ? true : false;
    movements.maxDropDown = botConfig.pathfinder.maxDropDown || 4;
    movements.infiniteLiquidDropdownDistance = botConfig.pathfinder.infiniteLiquidDropdownDistance ? true : false;
    movements.dontCreateFlow = botConfig.pathfinder.dontCreateFlow ? true : false;
    movements.dontMineUnderFallingBlock = botConfig.pathfinder.dontMineUnderFallingBlock ? true : false;
    movements.allow1by1towers = botConfig.pathfinder.allow1by1towers ? true : false;
    movements.allowFreeMotion = botConfig.pathfinder.allowFreeMotion ? true : false;
    movements.allowParkour = botConfig.pathfinder.allowParkour ? true : false;
    movements.allowSprinting = botConfig.pathfinder.allowSprinting ? true : false;

    return movements;
}

function getConfig(configLocation) {
    const config = {
        enablePathfinder: false,
        pathFinderCommandPrefix: '.',
        commands: {
            goto: {
                name: 'goto',
                enabled: true,
                description: 'Pathfind to a coordinate',
            },
            gotoMe: {
                name: 'gotome',
                enabled: true,
                description: 'Pathfind to your current location',
            },
            gotoNear: {
                name: 'gotonear',
                enabled: true,
                description: 'Pathfind to a nearby entity',
            },
            gotoNearPlayer: {
                name: 'gotonearplayer',
                enabled: true,
                description: 'Pathfind to a nearby player',
            },
            stop: {
                name: 'stop',
                enabled: true,
                description: 'Stop pathfinding',
            }
        },
        commandAccessPermissions: {
            enabled: true,
            invertAllowedToDisallowed: false,
            allowedPlayers: ['Notch', 'Jhelaii']
        },
        events: {
            announceOnDeathWhilePathfinding: {
                enabled: false,
                message: 'I died while pathfinding!',
            },
            breakBlocksWhilePathfinding: true
        },
        pathfinder: {
            maxDropDown: 4,
            infiniteLiquidDropdownDistance: true,
            dontCreateFlow: true,
            dontMineUnderFallingBlock: true,
            allow1by1towers: true,
            allowFreeMotion: false,
            allowParkour: true,
            allowSprinting: true,
        },
        log: {
            enabled: true
        },
    }

    if(!Fs.existsSync(configLocation)) {
        Fs.mkdirSync(Path.dirname(configLocation), { recursive: true });
        Fs.writeFileSync(configLocation, Yml.stringify(config));
    }

    return Yml.parse(Fs.readFileSync(configLocation, 'utf8'));
}