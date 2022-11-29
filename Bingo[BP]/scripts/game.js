import { system, world } from '@minecraft/server';
import { Card, CardRows, CardCols } from './card.js';
import { emoji_ids, cardMarker } from './emoji_ids.js';
import { SETTINGS } from './ui_screens.js'

const playerInvSize = 36;
const tickDelay = 3;
const overworld = world.getDimension('overworld');

let gameMode = SETTINGS.mode; // 'Line' = single-line bingo (default), 'Blackout' = full card
let spawnLoc;
let winner;

// 1.19.50 fix
let gameLoopScheduleId;
let celebrationScheduleId;
let celebrationCounter = 0;

export let winnerFound = false;
export let gameRunning = false;

let invSlot = 0;

function launchRockets(){
  celebrationCounter++;
  winner.runCommandAsync('summon fireworks_rocket');
  if(celebrationCounter > 30){
    system.clearRunSchedule(celebrationScheduleId);
  }
}

function celebrationEvent() {
  // Show title
  overworld.runCommandAsync(`title @a title §6${winner.nameTag}`);
  overworld.runCommandAsync(`title @a subtitle §6got BINGO!!`);
  // Play challenge sound
  overworld.runCommandAsync('playsound bingo.win @a');
  
  celebrationScheduleId = system.runSchedule(launchRockets, tickDelay);
}

/**
 @param {Player} player The player Entity object
*/
function setWinner(player) {
  winnerFound = true;
  gameRunning = false;
  
  winner = player;
  
  winner.teleport(spawnLoc, overworld, 0, 0);
  winner.runCommandAsync(`tp @a @s`);
  
  celebrationEvent();
}

/**
  @param {Player} player The player Entity object
*/
function checkBingo(player) {
  switch (gameMode) {
    case 'Line':
      const card = player.card.itemGrid;
      // Checks diagonals
      let topLeftBingo = card.filter((elm, idx) => elm[idx] >= cardMarker);
      if(topLeftBingo.length == CardRows) {
        setWinner(player);
        break;
      }
      let topRightBingo = card.filter((elm, idx) => elm[(CardRows-1) - idx] >= cardMarker);
      if(topRightBingo.length == CardRows) {
        setWinner(player);
        break;
      }
      let hBingo;
      let vBingo;
      for (let i = 0; i < card.length; i++) {
        // Checks horizontals
        hBingo = card[i].filter((elm) => elm >= cardMarker);
        if(hBingo.length == CardCols) {
          setWinner(player);
          break;
        }
        // Checks verticals
        vBingo = card.filter((elm) => elm[i] >= cardMarker);
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
            if(item >= cardMarker) markerCount++;
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
        if ((cardItem == item.typeId) || (cardItem?.id == item.typeId && cardItem?.data == item.data)) {
          item.amount--;
          container.setItem(invSlot, item);
          p.card.update(r, c);
          p.runCommandAsync('playsound random.levelup @s');
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
  overworld.runCommandAsync(`say Spawn set to ( ${Math.floor(spawnLoc.x)}, ${Math.floor(spawnLoc.y)}, ${Math.floor(spawnLoc.z)} )`)
  
  overworld.runCommandAsync('title @a title §o§gLoading...');
  for (const p of [...world.getPlayers()]) {
    if(!p.card) {
      setNewCard(p);
    }
  }
  overworld.runCommandAsync('title @a clear');
  
  overworld.runCommandAsync('gamerule sendCommandFeedback false');
  // Clearing the inventory
  overworld.runCommandAsync('clear @a');
  overworld.runCommandAsync('give @a fond:bingo_card 1 0 {"minecraft:keep_on_death":{},"minecraft:item_lock":{"mode":"lock_in_inventory"}}');
  overworld.runCommandAsync('give @a fond:info_book');
  
  // Resetting World Settings
  overworld.runCommandAsync('gamemode survival @a')
  // overworld.runCommandAsync('difficulty hard');
  overworld.runCommandAsync('gamerule doDaylightCycle true');
  
  overworld.runCommandAsync(`spreadplayers ${spawnLoc.x} ${spawnLoc.z} 32 512 @a`);
  overworld.runCommandAsync('effect @a slow_falling 60 1');
  
  overworld.runCommandAsync('gamerule sendCommandFeedback true');
  // winnerFound = false; // To be able to play another game.
  // celebrationCounter = 0;  // To be able to play another game.
  gameRunning = true; 
  
  // 1.19.50 fix
  gameLoopScheduleId = system.runSchedule(gameLoop, tickDelay);
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

/**
 Generates a new Card and attatches it to the player
 @param {Player} player Player Entity
*/
export function setNewCard(player) {
  let newCard = new Card(player);
  player['card'] = newCard;
  player.card.cardToText();
  player.card.display(true);
}

export function gameLoop(tick) {
  if(!gameRunning) {
    system.clearRunSchedule(gameLoopScheduleId);
    return;
  }
  checkInvs();
}
