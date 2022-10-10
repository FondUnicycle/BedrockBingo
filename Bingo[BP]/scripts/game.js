import { world } from 'mojang-minecraft';
import { Card, CardRows, CardCols } from './card.js';
import { emoji_ids, cardMarker } from './emoji_ids.js';
import { SETTINGS } from './ui_screens.js'


const playerInvSize = 36;
const ticksPerRun = 3;
const overworld = world.getDimension('overworld');

let gameMode = SETTINGS.mode; // 'Line' = single-line bingo (default), 'Blackout' = full card
let spawnLoc;
let winner;

export let winnerFound = false;
let celebrationCounter = 0;
export let gameRunning = false;

let invSlot = 0;

function setWinner(player) {
    winnerFound = true;
    winner = player;
    // tp players to spawn
    winner.teleport(spawnLoc, overworld, 0, 0);
    winner.runCommand(`tp @a @s`);
}

function checkBingo(player) {
    switch (gameMode) {
        case 'Line':
            const card = player.card.itemGrid;
            // Checks diagonals
            let topLeftBingo = card.filter((elm, idx) => elm[idx] == cardMarker);
            if(topLeftBingo.length == CardRows) {
                setWinner(player);
                break;
            }
            let topRightBingo = card.filter((elm, idx) => elm[(CardRows-1) - idx] == cardMarker);
            if(topRightBingo.length == CardRows) {
                setWinner(player);
                break;
            }
            let hBingo;
            let vBingo;
            for (let i = 0; i < card.length; i++) {
                // Checks horizontals
                hBingo = card[i].filter((elm) => elm == cardMarker);
                if(hBingo.length == CardCols) {
                    setWinner(player);
                    break;
                }
                // Checks verticals
                vBingo = card.filter((elm) => elm[i] == cardMarker);
                if(vBingo.length == CardRows) {
                    setWinner(player);
                    break;
                }
            }
            break;
        case 'Blackout':
            let markerCount = 0;
            let item;
            for (const row in player.card.itemGrid) {
                for (const col in player.card.itemGrid[row]) {
                    item = player.card.itemGrid[row][col];
                    if(item == cardMarker) markerCount++;
                    if(markerCount == CardRows*CardCols) setWinner(player);
                }
            }
            break;
    }
}

function checkInvs() {
    /** CHECKS IF THE GIVEN ITEM IS IN THE CARD, IF SO TAKES 1 OF THAT ITEM, AND UPDATES THE CARD ACCORDINGLY. THEN CHECKS FOR BINGO*/
    let container;
    let item;
    let cardItem;
    for (const p of [...world.getPlayers()]) {
        container = p.getComponent('inventory').container;
        item = container.getItem(invSlot);
        if(!item) continue;
        for (let r = 0; r < p.card.itemGrid.length; r++) {
            for (let c = 0; c < p.card.itemGrid[r].length; c++) {
                cardItem = emoji_ids[p.card.itemGrid[r][c]];
                if ((cardItem == item.id) || (cardItem?.id == item.id && cardItem?.data == item.data)) {
                    item.amount--;
                    container.setItem(invSlot, item);
                    p.card.update(r, c);
                    p.runCommand('playsound random.levelup @s');
                    checkBingo(p);
                }
            }
        }
    }
    invSlot++
    if(invSlot == playerInvSize) invSlot = 0;
    
}

export function setUpGame(location) {
    spawnLoc = location;
    overworld.runCommand(`say Spawn set to ( ${Math.floor(spawnLoc.x)}, ${Math.floor(spawnLoc.y)}, ${Math.floor(spawnLoc.z)} )`)

    overworld.runCommand('title @a title §o§gLoading...');
    for (const p of [...world.getPlayers()]) {
        if(!p.card) {
            setNewCard(p);
        }
    }
    overworld.runCommand('title @a clear');
    
    // Clearing the inventory
    overworld.runCommand('clear @a'),
    overworld.runCommand('give @a fond:bingo_card 1 0 {"minecraft:keep_on_death":{},"minecraft:item_lock":{"mode":"lock_in_inventory"}}'),
    overworld.runCommand('give @a fond:info_book');
    
    // Resetting World Settings
    overworld.runCommand('gamemode survival @a')
    // overworld.runCommand('difficulty hard');
    overworld.runCommand('gamerule doDaylightCycle true');
    
    
    overworld.runCommand(`spreadplayers ${spawnLoc.x} ${spawnLoc.z} 32 512 @a`);
    overworld.runCommand('effect @a slow_falling 60 1');
    
    // winnerFound = false; // To be able to play another game.
    // celebrationCounter = 0;  // To be able to play another game.
    gameRunning = true; 
}

export function setGameMode() {
    gameMode = SETTINGS.mode;
}

// function isUsedCard(card) {
//     for (let r = 0; r < card.itemGrid.length; r++) {
//         for (let c = 0; c < card.itemGrid[r].length; c++) {
//             if(card[r][c] == cardMarker) {
//                 return true;
//             }
//         }
//     }
//     return false;
// }

export function setNewCard(player) {
    let newCard = new Card(player);
    player['card'] = newCard;
    player.card.cardToText();
    player.card.display(true);
}

export function gameLoop(tick) {
    if(!gameRunning) {
        return;
    }
    if(!winnerFound) {
        if(tick % ticksPerRun == 0) {
            checkInvs();
        }
    }
    else if( tick % ticksPerRun == 0 ) {
        if(celebrationCounter == 2) {
            // Show title
            overworld.runCommand(`title @a title §6${winner.nameTag}`);
            overworld.runCommand(`title @a subtitle §6got BINGO!!`);
            // Play challenge sound
            overworld.runCommand('playsound bingo.win @a');
        }
        // Throw fireworks
        if(celebrationCounter < 20) {
            winner.runCommand('summon fireworks_rocket');
            celebrationCounter++;
        }
        else {
            gameRunning = false;
        }
    }
    
}
