var hit = new Audio('/duck_shooter/resources/sounds/hit.wav');
var miss = new Audio('/duck_shooter/resources/sounds/miss.wav');
var emptyMag = new Audio('/duck_shooter/resources/sounds/emptyMag.wav');
var shootSound = new Audio('/duck_shooter/resources/sounds/shoot.wav');
var gotOne = new Audio('/duck_shooter/resources/sounds/gotOne.wav');
var gotZero = new Audio('/duck_shooter/resources/sounds/gotZero.wav');
var duck = new Audio('/duck_shooter/resources/sounds/duck.wav');
var level = new Audio('/duck_shooter/resources/sounds/level.mp3');
var intro = new Audio('/duck_shooter/resources/sounds/intro.mp3');
var dogwalk = new Audio('/duck_shooter/resources/sounds/dogwalk.mp3')
var duckfall = new Audio('/duck_shooter/resources/sounds/duckfall.wav')

// Flag to track if user has interacted with the page
var userInteracted = false;

// Set up user interaction listeners
document.addEventListener('click', function() {
    userInteracted = true;
}, { once: true });

document.addEventListener('keydown', function() {
    userInteracted = true;
}, { once: true });

function playSound(name) {
    // Don't play sounds until user has interacted with the page
    if (!userInteracted) {
        return;
    }
    
    var sound;

    if (name === "shoot") {
        sound = shootSound;
    }
    else if (name === "duckfall") {
        sound = duckfall;
    }
    else if (name === "dogwalk") {
        intro.pause();
        sound = dogwalk;
    }
    else if (name === "miss") {
        sound = miss;
    }
    else if (name === "level") {
        sound = level;
    }
    else if (name === "empty") {
        sound = emptyMag;
    }
    else if (name === "hit") {
        sound = hit;
    }
    else if (name === "gotOne") {
        sound = gotOne;
        duck.pause();
        duck.currentTime = 0;
    }
    else if (name === "gotZero") {
        sound = gotZero;
        duck.pause();
        duck.currentTime = 0;
    }
    else if (name === "intro") {
        sound = intro;
    }
    else {
        sound = duck;
    }

    sound.currentTime = 0;
    sound.play().catch(function(error) {
        // Only log in development/debug mode
        if (typeof DEBUG !== 'undefined' && DEBUG) {
            console.log("Sound play failed:", error);
        }
    });
}