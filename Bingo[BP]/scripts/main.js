import { system, world } from '@minecraft/server';
import * as Game from './game.js';
import * as BookUI from './ui_screens.js';

const overworld = world.getDimension('overworld');
const hostTickDelay = 100;
let host;
let hostSelected = false;
const excludeJoinedPlayers = { excludeTags: ['joined'] };
let ticks = 0;

world.events.itemUse.subscribe( itemUseData => {
    let item = itemUseData.item;
    let player = itemUseData.source;
    if(item.typeId === 'fond:bingo_card' && player.getItemCooldown('card') === 0) {
        switch (Game.gameRunning || Game.winnerFound) {
            case false:
                Game.setNewCard(player);
                break;
            case true:
                if(player.card) {
                    if(player.card.isDisplaying) {
                        player.card.display(false);
                    }
                    else {
                        player.card.display(true);
                    }
                }
                else {
                    overworld.runCommandAsync(`w "${player.nameTag}" §b§lSorry, players can't set a card while a game is running.`)
                }
                break;
        }
    }
    if (item.typeId === 'fond:info_book' && !Game.gameRunning) {
        BookUI.mainScreen(player);
    }
});

function joinEvent() {
    // Only for 1.19.40
    if(ticks == 10000) ticks = 0;
    if(Game.gameRunning){
        Game.gameLoop(ticks);
    }

    if(!hostSelected && ticks % hostTickDelay == 0){
        try {
            for(const p of [...world.getPlayers()]) {
                p.addTag('host');
                host = p;
                break;
            }
            overworld.runCommandAsync('gamerule doDaylightCycle false');
            if(host) hostSelected = true;
        } catch {}
    }
    if(!Game.gameRunning) {
        try {
            for (const player of [...world.getPlayers(excludeJoinedPlayers)]) {
                overworld.runCommandAsync('gamerule sendCommandFeedback false');
                player.runCommandAsync('gamemode adventure');
                player.addTag('joined');
                player.runCommandAsync('give @s fond:bingo_card 1 0 {"minecraft:keep_on_death":{},"minecraft:item_lock":{"mode":"lock_in_inventory"}}');
                player.runCommandAsync('give @s fond:info_book');
                overworld.runCommandAsync('gamerule sendCommandFeedback true');
            }
        } catch {}
    }
    // Only for 1.19.40
    ticks++;
    system.run(joinEvent);
};
system.run(joinEvent);
// 1.19.50 fix
// system.runSchedule(joinEvent, 1);
