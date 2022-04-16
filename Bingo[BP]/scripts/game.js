import { world } from 'mojang-minecraft';
import { Card, CardRows, CardCols } from './card.js';
import { emoji_ids, cardMarker } from './emoji_ids.js';


const playerInvSize = 36;
const ticksPerRun = 3;
const overworld = world.getDimension('overworld');

let spawnLoc;
let winner;

let winnerFound = false;
let gameRunning = false;
let gameMode = 'line'; // 'line' = single-line bingo, 'blackout' = full card

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
        case 'line':
            const card = player.card.itemGrid;
            // Checks diagonals
            let dBingo = card.filter((elm, idx) => elm[idx] == cardMarker || elm[(CardRows-1) - idx] == cardMarker);
            if(dBingo.length == CardRows) {
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
        case 'blackout':
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
    for (const p of world.getPlayers()) {
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

export function setUpGame(mode, location) {
    gameMode = mode;
    spawnLoc = location;
    overworld.runCommand(`say Spawn set to ( ${Math.floor(spawnLoc.x)}, ${Math.floor(spawnLoc.y)}, ${Math.floor(spawnLoc.z)} )`)
    overworld.runCommand('title @a title §o§gLoading...');
    for (const p of world.getPlayers()) {
        if(!p.card) {
            setNewCard(p);
        }
    }
    overworld.runCommand('title @a clear');
    overworld.runCommand(`spreadplayers ${spawnLoc.x} ${spawnLoc.z} 32 512 @a`);
    overworld.runCommand('effect @a slow_falling 30 1');
    gameRunning = true; // THIS IS TO MAKE THE gameLoop WAIT UNTIL ALL CARDS HAVE BEEN GENERATED. (SAFETY MEASURE)
}

export function setNewCard(player) {
    let newCard = new Card(player);
    player['card'] = newCard;
    player.card.cardToText();
    player.card.display(true);
}

let counter = 0;
export function gameLoop(tick) {
    if(!gameRunning) {
        return;
    }
    if(!winnerFound) {
        if(tick % ticksPerRun == 0) {
            checkInvs();
        }
    }
    else {
        if( tick % ticksPerRun == 0 ) {
            if(counter == 2) {
                // Show title
                overworld.runCommand(`title @a title §6${winner.nameTag} got BINGO!!`);
                // Play challenge sound
                overworld.runCommand('playsound bingo.win @a');
            }
            // Throw fireworks
            if(counter < 20) {
                winner.runCommand(`summon fireworks_rocket`);
                counter++;
            }
            else {
                gameRunning = false;
            }
        }
    }
}
