const { resolve } = require("path");
const readline = require("readline");
const rl = readline.createInterface(process.stdin, process.stdout);
// Define a function `ask` that asks the user a question and returns their answer.
function ask(questionText) {
  // Return a promise that resolves with the user's answer.
  return new Promise((resolve, reject) => {
    rl.question(questionText, (input) => resolve(input.toLowerCase().trim()));
  });
}
//These are variables that will help print out colors on the console for hints
let blueText = "\x1b[94m";
let resetText = "\x1b[0m";
let yellowText = "\x1b[0;33m"

//Initialization of the map
const gameMap = {
  hallway: {
    description:
      `\nYour are currently in the hallway. You just escaped the zombies outside. \nActually, you don't even know what that was, but you couldn't stay to find out. \nyou need to find a snack to not pass out, and it's dark HINT: there's a ${blueText} lighter ${resetText} on the floor`,
    direction: {
      north: "kitchen",
      east: "den",
      south: "garage",
      west: "office",
    },//items[1] are the actual objects you can pick items[0] are only there for verification if such act as pick or use can be done
    items: ["pick", "lighter"],
    actionTaken: false,//if user picks or uses an item from this or in this room this changes
    visited: false,//this is to keep track of which room was visited so that the user can follow a certain patterns some room are dangerous without proper tools
  },
  kitchen: {
    description:
      `\nThis is the kitchen. There is no ${yellowText}food${resetText} anywhere, but It seems like there's a \ndoor a head, the problem is you can't see clearly. HINT: you can use some \n${yellowText}light${resetText}`,
    direction: {
      back: "hallway",
      further: "storage",
    },
    items: ["use", "snack"],
    actionTaken: false,
    visited: false,
  },
  storage: {
    description:
      `\nThis is the storage room. It was raided. there is nothi- OH WAIT!There is a \n${blueText}snack${resetText} in the corner of the bottom shelf,.......(few minutes later that was yummy!) \noh no, you can't go any further`,
    direction: {
      back: "kitchen",
    },
    items: ["pick", "snack"],
    actionTaken: false,
    visited: false,
  },
  den: {
    description:
      `\nThis is the den. the windows have been smashed-in the opening needs to be \npatched, quick find some ${yellowText}woods planks${resetText} or a ${yellowText}board${resetText} and repair those opening we \ndon't want some uninvited guests`,
    direction: {
      back: "hallway",
      ahead: "bunker",
    },
    items: ["use", "boards"],
    actionTaken: false,
    visited: false,
  },
  bunker: {
    description:
      `AAAAAARRRGGGGHHH why does nothing work? the door is locked and it only \nhas a ${yellowText}keypad!${resetText}`,
    direction: {
      back: "den",
    },
    items: ["use", "code"],
    actionTaken: false,
    visited: false,
  },
  garage: {
    description:
      `\nThis is the garage. Ooops, the garage door is stuck you can't do much here, \nhold on are those wood ${blueText}boards${resetText}??HINT: I wonder where I can use those?`,
    direction: {
      back: "hallway",
    },
    items: ["pick", "boards"],
    actionTaken: false,
    visited: false,
  },
  office: {
    description:
      `\nThis is the office, there is nothing to eat here, hang on is that..a .... \n${blueText}code${resetText}..?? The actual code to the Bunker?`,
    direction: {
      back: "hallway",
    },
    items: ["pick", "code"],
    actionTaken: false,
    visited: false,
  },
};

let currentRoom = gameMap.hallway; //initialization on user position once he starts the game

//user object instance
class player {
  constructor(name) {
    this.name = name;
    this.collection = [];
  }

  addToCollection(collectedItem) {
    this.collection.push(collectedItem);
    console.log(`\nItem: ${collectedItem} was added to your collection`);
  }

  removeFromCollection(collectedItem) {
    this.collection = this.collection.filter((item) => item !== collectedItem);
    console.log(`\nItem: ${collectedItem} was removed from your collection`);
  }

  dropFromCollection() {
    console.log(
      `\nItem: ${
        this.collection[this.collection.length - 1]
      } was dropped from your collection`
    );
    this.collection.pop();
  }
}

let newPlayer = new player();//initialization of user/player

async function managePlayerCollection(item, caseNum) {
  if(caseNum === 2 && item == "lighter"){//conditional to make sure user to loose the lighter as it is needed to finish the game
    return true
  }
  if (newPlayer.collection.length <= 2 || caseNum !== 1) {//conditional to keep tabs and update the user picked items
    switch (caseNum) {
      case 1:
        newPlayer.addToCollection(item);
        return true;
      case 2:
        newPlayer.removeFromCollection(item);
        return true;
      case 3:
        newPlayer.dropFromCollection();
        return true;
      default:
        return false;
    }
  } else {
    console.log(
      `your hands are full you only carry 3 items at a time \n(one item per hand and one item in your bag)`
    );
    console.table(newPlayer.collection);
    return false;
  }
}

function changeRooms(path) { //A function that performs the changes of state form one room to another.
  if (currentRoom.direction[path]) {
    currentRoom = gameMap[currentRoom.direction[path]];
    ///////////////////////////////////>>>>>>>>>>>>>>>>>>>>>>
    if (currentRoom == gameMap.den){ //this room is vital to the game and that is why it's the only one being observed, you can only visit it after you picked the boards to fix it
      gameMap.den.visited = true
    }
    return true;
  }
  console.log(`\nSorry, this path is not available.`);
  return false;
}

function winingOrLoosingDecider(testCase){ //this function checks all the requirement needed to either win or loose the game. 
  if(newPlayer.collection[0]!= "defense kit"){// if user drops their defense kit they loose
    console.log(`\nYou can't survive without a defense kit. GAME LOST!`)
    return true
  }
  //
  if(newPlayer.collection[1] != "lighter" && testCase > 2){// you loose if you loose your lighter too and keep on changing rooms
    console.log(`\nYou can't survive with no lighter it's too dark to see. GAME LOST!`)
    return true
  }
  if(gameMap.bunker.actionTaken){//if you the code and you have it you win the game
    console.log(`\nYOU HAVE REACHED SAFETY!!! GAME WON!`)
    return true
  }
  if(gameMap.den.visited && !gameMap.garage.actionTaken){//if you visit the den before picking up the boards you get eaten
    console.log(`\nYou can't visit this room without wooden boards to patch the windows . GAME LOST!`)
    return true
  }
  if(!gameMap.kitchen.actionTaken && gameMap.garage.actionTaken){//if you pick the boards in the garage before eating a snack you loose by exhaustion 
    console.log(`\nYou can't carry wooden boards without eating you are too weak. GAME LOST!`)
    return true
  }
  return false

}


async function handleInput(userInput) { //the main function that calls other functions and keeps track of everything
  let playerName = await ask(`\nPlease enter your preferred game name\n>_ `);
  newPlayer.name = playerName;
  newPlayer.addToCollection("defense kit");
  let count = 0;
  let addOrRemove = 0;// a value that informs another function that an time should be removed if used or added if picked
  let userChoiceArray; //an array that splits the user's command
  let didUserMove = false;// a boolean that follows your item use in rooms that matters
  let didUserAct = false; // a boolean that follows your actions/item picking in rooms that matters
  let exitLoop = false; // this is the loop controller to exit if you will or lose
  
  while (!exitLoop) {
    console.log(`\n${currentRoom.description}`);
    console.log(`\nAvailable paths:`);
    console.table(currentRoom.direction);
    userInput = await ask(
      `What do you want to do next? HINT: you can type \n\n[>_ check inventory], \n[>_ drop last], \n[>_move north], \n[>_Q:to quit game], \n[>_use item], \n[>_pick item]\n\n>_ `
    );
    userChoiceArray = userInput.split(" ");
    if (userChoiceArray[0] == "move") {
      didUserMove = changeRooms(userChoiceArray[1]);
    } else if (userChoiceArray[0] == "pick" && currentRoom.items[0] == "pick") {
      addOrRemove = 1;//the number 1 means item should be added
      didUserAct = managePlayerCollection(userChoiceArray[1], addOrRemove);
      /////////////////////////////>>>>>>>>>>>>>>>>>>>>>>>>>
      if (currentRoom == gameMap.garage){
        gameMap.garage.actionTaken = true
      }    
    } else if (userChoiceArray[0] == "use" && currentRoom.items[0] == "use") {
      if (newPlayer.collection.includes(userChoiceArray[1])) {
        addOrRemove = 2;//the number 2 means item should be removed
        didUserAct = managePlayerCollection(userChoiceArray[1], addOrRemove);
        ///////////////////////////>>>>>>>>>>>>>>>>>>>>>>>>>>>>
        if (currentRoom == gameMap.kitchen){
          gameMap.kitchen.actionTaken = true
        }
        if (currentRoom == gameMap.garage){
          gameMap.garage.actionTaken = true
        }
        if (currentRoom == gameMap.bunker){
          gameMap.bunker.actionTaken = true
        }
      }else{
        console.log(`sorry you can't use ${userChoiceArray[1]} because you don't have it`)
      }
    } else if (userChoiceArray[0] == "drop") {
      addOrRemove = 3;//the number 3 means last item should be dropped
      didUserAct = managePlayerCollection(userChoiceArray[1], addOrRemove);
    } else if (userChoiceArray[0] == "check") {
      console.log(`${newPlayer.name}'s inventory\n`);
      console.table(newPlayer.collection);
    } else if (userChoiceArray[0] == "q") {
      exitLoop = true;
    } else {
      console.log(`you can't perform ${userChoiceArray[0]} or don't have access to ${userChoiceArray[1]} from this room`);
    }
    ////////////////>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
    exitLoop = winingOrLoosingDecider(count);
    //console.log(exitLoop)
    count++;
    //console.log(`the count: ${count}`);
  }
}

start();

async function start() {
  const welcomeMessage = `182 Main St.
You are standing on Main Street between Church and South Winooski.
There is a door here. A keypad sits on the handle.
Do you want want to open the door and start the game? [Y] or [N]: `;
  let answer = await ask(welcomeMessage);
  if (answer === "y") {
    await handleInput(answer);
  } else {
    console.log("\nSorry to see you go.");
    process.exit();
  }
  //console.log("Now write your code to make this work!");
  //displayUpdate();
  process.exit();
}
