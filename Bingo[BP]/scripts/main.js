import { world } from 'mojang-minecraft';
import * as Game from './game.js';

const overworld = world.getDimension('overworld');
let host;
let gameStarted = false;
let infoBookGiven = false;
let gameMode = 'line';

world.events.beforeChat.subscribe( chatData => {
    if (!gameStarted) {
        switch (chatData.message) {
            case '$mode line':
                chatData.cancel = true;
                gameMode = 'line';
                overworld.runCommand(`say Bingo mode has been set to §l§5${gameMode}`);
                break;
            case '$mode blackout':
                chatData.cancel = true;
                gameMode = 'blackout';
                overworld.runCommand(`say Bingo mode has been set to §l§5${gameMode}`);
                break;
            case '$startgame':
                chatData.cancel = true;
                Game.setUpGame(gameMode, host.location);
                gameStarted = true;
                break;
        }
    }
    else if (chatData.message.startsWith('$mode') || chatData.message == '$startgame') {
        chatData.cancel = true;
        overworld.runCommand(`w "${chatData.sender.nameTag}" §b§lSorry, you can't run that command while there's a game running`)
    }
});

world.events.itemUse.subscribe( itemUseData => {
    let item = itemUseData.item;
    let player = itemUseData.source;
    if(item.id === 'fond:bingo_card' && player.getItemCooldown('card') === 0) {
        switch (gameStarted) {
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
});

world.events.tick.subscribe( tickData => {
    if(gameStarted){
        Game.gameLoop(tickData.currentTick);
    }
    if(!infoBookGiven && tickData.currentTick%100 == 0){
        for(let p of world.getPlayers()) {
            host = p;
            break;
        }
        host.runCommand('execute @s ~~~ loot spawn ~~~ loot info_book');
        infoBookGiven = true;
    }
});