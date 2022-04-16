import { emoji_ids, cardMarker } from './emoji_ids.js';

export const CardRows = 5;
export const CardCols = 5;

const keys = Object.keys(emoji_ids);

const maxBeds = 1;
const maxCandles = 1;

export class Card {
    constructor(player){
        this.player = player;
        this.itemGrid = this.genCard();
        this.rawtextObj = { "rawtext": [] };
        this.isDisplaying = false;
        this.bedCounter = maxBeds;
        this.candleCounter = maxCandles;
    }
    
    genCard() {
        const selections = new Set();
        let randomKey;
        let item;
        do {
            randomKey = keys[Math.floor(Math.random() * keys.length)];
            item = emoji_ids[randomKey];
            if (item?.id == 'minecraft:bed') {
                if (this.bedCounter < 0) {
                    selections.add(randomKey);
                    this.bedCounter--;
                }
            }
            else if (item.toString().endsWith('candle')) {
                if (this.candleCounter < 0) {
                    selections.add(randomKey);
                    this.candleCounter--;
                }
            }
            else {
                selections.add(randomKey);
            }
        } while (selections.size < CardRows*CardCols);
        
        const setIter = selections.values();
        let result = new Array(CardRows);
        for (let r = 0; r < result.length; r++) {
            result[r] = new Array(CardCols);
            for (let c = 0; c < result[r].length; c++) {
                result[r][c] = setIter.next().value;
                //this.player.runCommand(`say ${JSON.stringify(emoji_ids[result[r][c]])}`);
            }
        }
        this.bedCounter = maxBeds;
        this.candleCounter = maxCandles;
        return result;
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
    }

    display(show) {
        if(show) {
            this.player.runCommand(`titleraw @s actionbar ${JSON.stringify(this.rawtextObj)}`);
            this.isDisplaying = true;
        }
        else {
            this.player.runCommand('titleraw @s actionbar {\"rawtext\": [{\"text\": \"§c§r \"}]}');
            this.isDisplaying = false;
        }
        
    }

    update(row, col) {
        this.itemGrid[row][col] = cardMarker;
        this.cardToText();
        this.display(this.isDisplaying);
    }
}