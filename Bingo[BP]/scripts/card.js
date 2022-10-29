import { emoji_ids, cardMarker } from './emoji_ids.js';
import { createItemList } from './difficulties.js';
import { SETTINGS } from './ui_screens.js'

export const CardRows = 5;
export const CardCols = 5;

let itemList = createItemList(SETTINGS.difficulty);

const maxBeds = 1;
const maxCandles = 1;
const maxDyes = 2;
const maxNetherite = 1;
const maxDiamond = 2
const maxGold = 2;
const maxIron = 3;
const maxLeather = 2;
const maxChainmail = 1;
const maxBoats = 1;
const maxDoors = 1;
const maxSigns = 1;
const maxFlowers = 2;


export function setCardDifficulty() {
    itemList = createItemList(SETTINGS.difficulty);
};

export class Card {
    constructor(player){
        this.player = player;
        this.itemGrid = this.genCard();
        this.rawtextObj = { "rawtext": [] };
        this.isDisplaying = false;

        this.bedCounter;
        this.candleCounter;
        this.dyeCounter;
        this.netheriteCounter;
        this.diamondCounter;
        this.goldCounter;
        this.ironCounter;
        this.leatherCounter;
        this.chainmailCounter;
        this.boatCounter;
        this.doorCounter;
        this.signCounter;
        this.flowerCounter;
    }
    
    /**
     * @returns {string[]} The generated Card array
     */
    genCard() {
        this.resetCounters();
        const selections = new Set();
        let randomKey;
        let item;
        do {
            randomKey = itemList[Math.floor(Math.random() * itemList.length)];
            item = emoji_ids[randomKey];

            if(this.canAddItem(item)) {
                selections.add(randomKey);
            }
        } while (selections.size < CardRows*CardCols);
        
        const setIter = selections.values();
        let result = new Array(CardRows);
        for (let r = 0; r < result.length; r++) {
            result[r] = new Array(CardCols);
            for (let c = 0; c < result[r].length; c++) {
                result[r][c] = setIter.next().value;
            }
        }
        return result;
    }

    resetCounters(){
        this.bedCounter = maxBeds;
        this.candleCounter = maxCandles;
        this.dyeCounter = maxDyes;
        this.netheriteCounter = maxNetherite;
        this.diamondCounter = maxDiamond;
        this.goldCounter = maxGold;
        this.ironCounter = maxIron;
        this.leatherCounter = maxLeather;
        this.chainmailCounter = maxChainmail;
        this.bedCounter = maxBoats;
        this.doorCounter = maxDoors;
        this.signCounter = maxSigns;
        this.flowerCounter = maxFlowers;
    }

    /**
     * Checks if the selected item can be added to the generated Card
     * @param {string|object} item The item ID and optional Data Value
     * @returns {boolean} Wether or not the item can be added to generated Card
     */
    canAddItem(item) {
		if (item?.id == 'minecraft:bed') {
			if (this.bedCounter == 0) return false;
			this.bedCounter--;
			return true;
		}
		else if (item.toString().includes('candle')) {
            if (this.candleCounter == 0) return false;
            if(Math.random() < 0.5){
                this.candleCounter--;
                return true;
            }
            return false;
		}
		else if (item.toString().includes('netherite') || item.toString().includes('debris')) {
			if (this.netheriteCounter == 0) return false;
			this.netheriteCounter--;
			return true;
		}
		else if (item.toString().includes('diamond')) {
			if (this.diamondCounter == 0) return false;
			this.diamondCounter--;
			return true;
		}
		else if (item.toString().includes('gold') || item.toString().includes('golden')) {
			if (this.goldCounter == 0) return false;
			this.goldCounter--;
			return true;
		}
		else if (item.toString().includes('iron')) {
			if(this.ironCounter == 0) return false;
			this.ironCounter--;
			return true;
		}
		else if (item.toString().includes('leather')) {
			if(this.leatherCounter == 0) return false;
			this.leatherCounter--;
			return true;
		}
		else if (item.toString().includes('chainmail')) {
			if(this.chainmailCounter == 0) return false;
			this.chainmailCounter--;
			return true;
		}
		else if (item.toString().includes('boat')) {
			if(this.boatCounter == 0) return false;
			this.boatCounter--;
			return true;
		}
		else if (item.toString().includes('door')) {
			if(this.doorCounter == 0) return false;
			this.doorCounter--;
			return true;
		}
		else if (item.toString().includes('sign')) {
			if(this.signCounter == 0) return false;
			this.signCounter--;
			return true;
		}
		else if (item.toString().includes('dye')) {
			if(this.dyeCounter == 0) return false;
			this.dyeCounter--;
			return true;
		}
		else if (item?.id?.toString()?.includes('flower') || item?.id?.toString()?.includes('plant')) {
			if(this.flowerCounter == 0) return false;
			this.flowerCounter--;
			return true;
		}
		else {
			return true;
		}
	}

    cardToText() {
        this.rawtextObj.rawtext[0] = {"text":"§b§c§r"};
        let element;
        let textOfRow;
        let text;
        for (let r = 0; r < this.itemGrid.length; r++) {
            element = this.itemGrid[r];
            textOfRow = element.join('') + '\n\n\n';
            text = { "text": `${textOfRow}`};
            this.rawtextObj.rawtext[r+1] = text;
        }
        // Full String length: 146 chars 
        // {"rawtext":[{"text":"§b§c§r"},{"text":"00000\n\n\n"},{"text":"00000\n\n\n"},{"text":"00000\n\n\n"},{"text":"00000\n\n\n"},{"text":"00000\n\n\n"}]}
    }

    /**
     * Displays the Card on screen
     * @param {boolean} show Wether or not the Card will be shown
     */
    display(show) {
        if(show) {
            this.player.runCommandAsync(`titleraw @s actionbar ${JSON.stringify(this.rawtextObj)}`);
            this.isDisplaying = true;
        }
        else {
            this.player.runCommandAsync('titleraw @s actionbar {\"rawtext\": [{\"text\": \"§c§r \"}]}');
            this.isDisplaying = false;
        }
        
    }

    /**
     * Updated the marked items on Card
     * @param {number} row The row number
     * @param {number} col The column number
     */
    update(row, col) {
        let cardItem = this.itemGrid[row][col];
        let markedItem = String.fromCharCode(cardItem.charCodeAt() + 0x1000);
        this.itemGrid[row][col] = markedItem;
        this.cardToText();
        this.display(this.isDisplaying);
    }
}
