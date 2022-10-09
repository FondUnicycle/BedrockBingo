import { EntityQueryOptions, GameMode, world } from 'mojang-minecraft';
import * as Game from './game.js';
import * as BookUI from './ui_screens.js';

const overworld = world.getDimension('overworld');
let host;
let hostSelected = false;
const excludeJoinedPlayers = new EntityQueryOptions();
      excludeJoinedPlayers.excludeTags = ['joined'];


world.events.itemUse.subscribe( itemUseData => {
    let item = itemUseData.item;
    let player = itemUseData.source;
    if(item.id === 'fond:bingo_card' && player.getItemCooldown('card') === 0) {
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
                    overworld.runCommand(`w "${player.nameTag}" §b§lSorry, players can't set a card while a game is running.`)
                }
                break;
        }
    }
    if (item.id === 'fond:info_book' && !Game.gameRunning) {
        BookUI.mainScreen(player);
    }
});

world.events.tick.subscribe( tickData => {
    if(Game.gameRunning){
        Game.gameLoop(tickData.currentTick);
    }
    if(!hostSelected && tickData.currentTick%100 == 0){
        try {
            for(const p of [...world.getPlayers()]) {
                p.addTag('host');
                host = p;
                break;
            }
            overworld.runCommand('gamerule doDaylightCycle false');
            if(host) hostSelected = true;
        } catch {}
    }
    if(!Game.gameRunning) {
        try {
            for (const player of [...world.getPlayers(excludeJoinedPlayers)]) {
                player.runCommand('gamemode adventure');
                player.runCommand('give @a fond:bingo_card 1 0 {"minecraft:keep_on_death":{},"minecraft:item_lock":{"mode":"lock_in_inventory"}}');
                player.runCommand('give @s fond:info_book');
                player.addTag('joined');
            }
        } catch {}
    }
});
