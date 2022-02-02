const Yml = require('yaml');
const Fs = require('fs');
const Path = require('path');
const { getRandomKey } = require('fallout-utility');

let moving = false;
let time = -1;
let actionTimeout = -1;
let jumpTimeout = -1;
let entity = null;
let activeHeldItem = false;
let stopped = false;

module.exports = (bot, Pathfinder) => {
    const botConfig = getConfig('./config/movements.yml');

    if(botConfig.playerLocationMovements.enabled) {
        playerMovements(bot, Pathfinder, botConfig);
    }
}

function playerMovements(bot, Pathfinder, botConfig) {
    const mcData = require('minecraft-data')(bot.version);
    const defaultMove = configureMovements(new Pathfinder.Movements(bot, mcData), botConfig);

    bot.on('time', () => {
        time = bot.time.age;

        if((bot.pathfinder.isMoving() || bot.pathfinder.isMining() || bot.pathfinder.isBuilding()) && botConfig.playerLocationMovements.cancelOnPathfinderMovement) {
            if(!stopped) {
                bot.setControlState('jump', false);
                bot.deactivateItem();
                for (const action of  botConfig.playerLocationMovements.actions) { bot.setControlState(action, false); }

                moving = false;
                stopped = true;
            }

            return;
        }

        entity = bot.nearestEntity((e) => botConfig.playerLocationMovements.lookAt.players && e.type === 'player' && e.name !== bot.username || botConfig.playerLocationMovements.lookAt.mobs && e.type !== 'player');
        if(entity && (botConfig.playerLocationMovements.lookAt.players || botConfig.playerLocationMovements.lookAt.mobs)) bot.lookAt(entity.position.offset(0, 1.6, 0));

        if(moving) {
            if(time >= actionTimeout) {
                moving = false;

                for (const action of  botConfig.playerLocationMovements.actions) { bot.setControlState(action, false); }

                toggleHeldItem();
            }
        } else {
            actionTimeout = time + secToTicks(botConfig.playerLocationMovements.movementTimoutSeconds);

            const randomAction = getRandomKey(botConfig.playerLocationMovements.actions);
            
            bot.setControlState(randomAction, true);
            moving = true;

            toggleHeldItem();
        }

        if(botConfig.jumpMovements.enabled) botJump();
    });

    function botJump() {
        if(time >= jumpTimeout) {
            jumpTimeout = time + secToTicks(botConfig.jumpMovements.jumpIntervalSeconds);
            bot.setControlState('jump', true);
        } else {
            bot.setControlState('jump', false);
        }
    }
    function toggleHeldItem(){
        if(!botConfig.useHeldItem.enabled) return;

        if(activeHeldItem) {
            bot.deactivateItem();
            activeHeldItem = false;
        } else {
            bot.activateItem();
            activeHeldItem = true;
        }
    }
    function secToTicks(sec) {
        return sec * 20;
    }
}

function getConfig(configLocation) {
    const config = {
        log: {
            enabled: true
        },
        playerLocationMovements: {
            enabled: true,
            cancelOnPathfinderMovement: true,
            actions: ['forward', 'back', 'left', 'right'],
            lookAt: {
                players: true,
                mobs: true,
            },
            movementIntervalSeconds: 5,
            movementTimoutSeconds: 3,
        },
        useHeldItem: {
            enabled: true,
        },
        jumpMovements: {
            enabled: true,
            jumpIntervalSeconds: 3,
        }
    }

    if(!Fs.existsSync(configLocation)) {
        Fs.mkdirSync(Path.dirname(configLocation), { recursive: true });
        Fs.writeFileSync(configLocation, Yml.stringify(config));
    }

    return Yml.parse(Fs.readFileSync(configLocation, 'utf8'));
}