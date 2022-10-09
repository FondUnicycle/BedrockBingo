import { ActionFormData, ModalFormData } from 'mojang-minecraft-ui';
import { setGameMode, setUpGame, winnerFound } from './game.js';
import { setCardDifficulty } from './card.js';

const cardDifficultyTypes = {
    'Easy': 0,
    'Normal': 1,
    'Hard': 2,
    'Insane': 3
};
Object.freeze(cardDifficultyTypes);

const gameModeTypes = {
    'Line': 0,
    'Blackout': 1
};
Object.freeze(gameModeTypes);

export const SETTINGS = {
    'mode': 'Line',
    'difficulty': 'Normal'
};

const mainScreenText = "                   Welcome to\n\n                   §l§2BEDROCK§r\n                     §l§2BINGO§r\n\n                    §oMade by§r\n               §l§9FondUnicycle§r\n";
export function mainScreen(player) {
    let mainScreen = new ActionFormData()
        .title('Main Menu')
        .body(mainScreenText)
        .button('Information', 'textures/ui/infobulb_darkborder_small');
    if(player.hasTag('host') && !winnerFound) {
        mainScreen.button('Settings', 'textures/ui/icon_setting')
            .button('Start Game', 'textures/ui/icon_random');
    };
    mainScreen.show(player)
        .then(response => {
            switch (response.selection) {
                case 0:
                    infoScreen(player);
                    break;
                case 1:
                    settingsScreen(player);
                    break;
                case 2:
                    startgameScreen(player);
                    break;
            }
        });
};

function settingsScreen(player) {
    let modeOptions = Object.keys(gameModeTypes);
    let difficultyOptions = Object.keys(cardDifficultyTypes);
    let settingsScreen = new ModalFormData()
        .title('Settings')
        .dropdown( 'Bingo Game Mode', modeOptions, gameModeTypes[SETTINGS.mode] )
        .dropdown( 'Bingo Card Difficulty', difficultyOptions, cardDifficultyTypes[SETTINGS.difficulty] );
    settingsScreen.show(player)
        .then(response => {
            SETTINGS.mode = modeOptions[response.formValues[0]];
            SETTINGS.difficulty = difficultyOptions[response.formValues[1]];
            setGameMode();
            setCardDifficulty();
            mainScreen(player);
            }
        );
};

function infoScreen(player) {
    let infoScreen = new ActionFormData()
        .title('Information')
        .body('Select a topic.')
        .button('Bingo Card', 'textures/ui/icon_map')
        .button('Card Difficulties', 'textures/ui/Ping_Green')
        .button('Game Modes', 'textures/ui/item_container_transfer_mode')
        .button('How the game works', 'textures/ui/missing_item')
        .button('Back to Main Menu', 'textures/ui/icon_book_writable');
    infoScreen.show(player)
        .then(response => {
            switch (response.selection) {
                case 0:
                    cardInfoScreen(player);
                    break;
                case 1:
                    difficultyInfoScreen(player);
                    break;
                case 2:
                    modeInfoScreen(player);
                    break;
                case 3:
                    mechanicsScreen(player);
                    break;
                case 4:
                    mainScreen(player);
                    break;
            }
        });
};

const cardInfoText = 
    "Every player gets a §lBingo Card§r item when joining the world. This item can't be dropped nor lost on death.\n\nBefore the game starts, §lusing§r the item creates a new card. Repeat this until you are happy with it.\n\nOnce the game has started, you won't be able to change it, so choose wisely.\n\nAfter the game has started, §lusing§r the item let you hide or show your card from the screen.";

function cardInfoScreen(player) {
    let cardScreen = new ActionFormData()
        .title('Bingo Card')
        .body(cardInfoText)
        .button('Back to Information Menu');
    cardScreen.show(player)
        .then( () => infoScreen(player) );
};

const difficultyInfoText = "There are 4 levels of difficulty:\n\n-§lEasy§r\nAdds Overworld Items except for hostile mob drops and items related to deep underground ores.\n\n-§lNormal§r: (the default setting)\nAdds the overworld hostile mob drops and ore related items.\n\n-§lHard§r:\nAdds Diamond items and Nether items except Netherite/Ancient Debris related ones.\n\n-§lInsane§r:\nAdd Netherite items and items from the End.\n\n\nEach level adds everything from previous levels."

function difficultyInfoScreen(player) {
    let difficultyScreen = new ActionFormData()
        .title('Card Difficulties')
        .body(difficultyInfoText)
        .button('Back to Information Menu');
    difficultyScreen.show(player)
        .then( () => infoScreen(player) );
};

const modeInfoText = 
    "There are 2 modes to play:\n\n-§lLine Mode§r: classic BINGO, just one line to win (horizontal, vertical, or diagonal).\n\n-§lBlackout Mode§r: you will need to fill the whole card to win.\n\n§lLine Mode§r is the the default mode.";

function modeInfoScreen(player) {
    let modeScreen = new ActionFormData()
        .title('Game Modes')
        .body(modeInfoText)
        .button('Back to Information Menu');
    modeScreen.show(player)
        .then( () => infoScreen(player) );
};

const mechInfoText =
    "When the game starts, all players will get spread out around the world.\n\nEverytime you get an item that is in your card, it will be marked out, and the item will be taken from your inventory.\n\n§o§7(TIP: if you are quick enough, you might be able to equip armor without loosing it towards your card.)§r\n\nOnce someone gets Bingo, the game will alert everyone that there is a winner, and will teleport everyone back to spawn.";

function mechanicsScreen(player) {
    let mechScreen = new ActionFormData()
        .title('How the game works')
        .body(mechInfoText)
        .button('Back to Information Menu');
    mechScreen.show(player)
        .then( () => infoScreen(player) );
};

function startgameScreen(player) {
    let startgameScreen = new ActionFormData()
        .title('Start Game')
        .body("Are you sure you want to start the game now? You won't be able to change settings nor Bingo Cards if you continue.")
        .button('Start Game', 'textures/ui/confirm')
        .button('Cancel', 'textures/ui/cancel');
    startgameScreen.show(player)
        .then(response => {
            switch (response.selection) {
                case 0:
                    setUpGame(player.location);
                    break;
                case 1:
                    mainScreen(player);
                    break;
            }
        });
};