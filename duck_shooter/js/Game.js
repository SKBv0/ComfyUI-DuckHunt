class Game{
    static ROUND_PASS_THRESHOLD = 90; // Percentage of ducks to kill to pass round
    static INITIAL_LIVES = 3;
    static QUICK_RESTART_DELAY = 500; // ms
    static INTRO_ANIMATION_DURATION = 7300; // ms
    static ROUND_END_DELAY = 2000; // ms

    constructor(gameParameters){
        this.dog1 = new Dog("dog1");
        this.dog2 = new Dog("dog2");
        this.duckMovesNumber = gameParameters.movesNumber;
        this.shotHandler = new ShotHandler(gameParameters.initialAmmo);
        this.pointsHandler = new PointsHandler();
        this.ducksHandler = new DucksHandler(gameParameters.ducksNumber, gameParameters.movesNumber);
        this.roundEndCountdown = null;
        this.percentProgress = 0;
        this.lives = Game.INITIAL_LIVES;
        this.newRoundTimeout = null;
        this._startGameTimeout = null; // Track startGame timeout for cleanup
        this.totalSuccessfulHits = 0;
        this.totalShotsNumber = 0;
    }

    startGame(skipIntro = false){
        // Clear any existing start timeout
        if (this._startGameTimeout) {
            clearTimeout(this._startGameTimeout);
        }

        if (skipIntro) {
            // Skip dog animation for quick restart
            this._startGameTimeout = setTimeout(() => {
                this._startGameTimeout = null;
                this.startNewRound();
            }, Game.QUICK_RESTART_DELAY);
        } else {
            this.dog1.launchWalkoutAnimation();
            this._startGameTimeout = setTimeout(() => {
                this._startGameTimeout = null;
                this.startNewRound();
            }, Game.INTRO_ANIMATION_DURATION);
        }
    }

    shoot(mouseX, mouseY, evt){
        this.totalShotsNumber ++;
        let successfulHits = this.shotHandler.checkIfHitSuccessful(this.ducksHandler.ducks, mouseX, mouseY, evt);
        this.ducksHandler.ducksKilledInRound += successfulHits;

        if (successfulHits > 0) {
            this.totalSuccessfulHits += successfulHits;
            this.pointsHandler.addPoints(successfulHits);
            this.percentProgress = this.ducksHandler.countPercentOfDucksKilled();
            displayProgressOnProgressBar(this.percentProgress);
        }
        this.checkIfRoundIsFinished();
    }

    checkIfRoundIsFinished(){
        if (this.ducksHandler.checkAllDucksAreShot()) {
            this.finishRound();
        } else if (this.shotHandler.checkIsNoAmmoLeft()) {
            playSound("empty");
            this.finishRound();
        }
    }

    finishRound(){
        this.stopCountdownToRoundEnd();
        this.shotHandler.disableShooting();
        this.ducksHandler.removeRemainingDucks();
        this.dog2.showDogWithKilledDucks(this.ducksHandler.ducksKilledInRound);
        this.newRoundTimeout = setTimeout(() => this.startNewRound(), Game.ROUND_END_DELAY);        
        this.checkIfRoundIsPassed();
    }

    checkIfRoundIsPassed(){
        if (this.percentProgress < Game.ROUND_PASS_THRESHOLD) {
            this.subtractLives();
        }
    }

    subtractLives(){
        disableLifeIcon(this.lives);
        this.lives--;
        if (this.lives < 1) {this.finishGame();}
    }
    
    finishGame(){
        window.clearTimeout(this.newRoundTimeout);
        if (this._startGameTimeout) {
            clearTimeout(this._startGameTimeout);
            this._startGameTimeout = null;
        }
        this.stopCountdownToRoundEnd();
        this.shotHandler.disableShooting();
        // Stop auto-shooting if ExtremeGame
        if (this.stopAutoShooting && typeof this.stopAutoShooting === 'function') {
            this.stopAutoShooting();
        }
        playSound("level");
        // Prevent division by zero
        const accuracy = this.totalShotsNumber > 0
            ? Math.round(this.totalSuccessfulHits / this.totalShotsNumber * 100)
            : 0;
        displayEndScreen(this.pointsHandler, this.totalSuccessfulHits, accuracy);
    }
    
    startNewRound(){
        displayProgressOnProgressBar(0);
        this.percentProgress = 0;
        this.pointsHandler.addLevel();
        this.setCountdownToRoundEnd();
        this.ducksHandler.startDucksFlight();
        this.shotHandler.enableShooting();
        this.shotHandler.resetAmmo();
    }

    stopCountdownToRoundEnd(){
        window.clearTimeout(this.roundEndCountdown);
    }

    setCountdownToRoundEnd(){
        const MILLISECONDS_PER_SECOND = 1000;
        let timeToRoundEnd = this.duckMovesNumber * MILLISECONDS_PER_SECOND;
        this.roundEndCountdown = setTimeout(() => this.finishRound(), timeToRoundEnd);
    }
}


class ExtremeGame extends Game{
    static AUTO_SHOOT_INTERVAL = 100; // ms
    static MAX_DUCKS_EXTREME = 20;

    constructor(gameParameters){
        super(gameParameters);
        this.initializeCurrentModeSettings();
        this.shooting;
        this.mouseX;
        this.mouseY;
    }

    initializeCurrentModeSettings(){
        // Remove any existing event listeners first to prevent duplicates
        jQuery(".sky").off("mousedown mouseup mousemove");
        jQuery(".sky").css("backgroundImage", "none");
        jQuery(".sky").mousedown((e) => this.startAutoShooting(e));
        jQuery(".sky").mouseup((e) => this.stopAutoShooting(e));
        jQuery("#gunIcon").attr("src", "/duck_shooter/resources/sprites/weapons/auto.png");
    }

    saveCurrentCoordinates(e){
        if (!e) return;
        this.mouseX = e.clientX;
        this.mouseY = e.clientY;
        this.lastEvent = e; // Store the event for later use
    }

    startAutoShooting(event){
        if (event) {
            this.mouseX = event.clientX;
            this.mouseY = event.clientY;
            this.lastEvent = event;
        }
        jQuery(".sky").on("mousemove", (e) => this.saveCurrentCoordinates(e));
        this.shooting = setInterval(() => this.shoot(), ExtremeGame.AUTO_SHOOT_INTERVAL);
    }

    stopAutoShooting(){
        jQuery(".sky").off("mousemove");
        clearInterval(this.shooting);
    }

    shoot(){
        this.totalShotsNumber ++;
        let successfulHits = this.shotHandler.checkIfHitSuccessful(this.ducksHandler.ducks, this.mouseX, this.mouseY, this.lastEvent);
        this.ducksHandler.ducksKilledInRound += successfulHits;
        if (successfulHits > 0) {
            this.totalSuccessfulHits += successfulHits;
            this.pointsHandler.addPoints(successfulHits);
            this.percentProgress = this.ducksHandler.countPercentOfDucksKilled();
            displayProgressOnProgressBar(this.percentProgress);
        }
        this.checkIfRoundIsFinished();
    }

    finishRound(){
        this.stopAutoShooting();
        this.stopCountdownToRoundEnd();
        this.shotHandler.disableShooting();
        this.ducksHandler.removeRemainingDucks();
        this.dog2.showDogWithKilledDucks(this.ducksHandler.ducksKilledInRound);
        this.newRoundTimeout = setTimeout(() => this.startNewRound(), Game.ROUND_END_DELAY);   
        this.checkIfRoundIsPassed();
        this.addNewDuck();
    }

    addNewDuck(){
        if (this.ducksHandler.numberOfDucks < ExtremeGame.MAX_DUCKS_EXTREME) {
            this.ducksHandler.createNewDuck();
        }
    }
}


class ModernGame extends Game{
    
    constructor(gameParameters){
        super(gameParameters);
        this.changeBackgroundsForCurrentMode();
    }

    changeBackgroundsForCurrentMode(){
        jQuery(".sky").css("backgroundImage", "none");
        jQuery(".bushes").css("backgroundImage", "url(/duck_shooter/resources/sprites/background/bushes.png)");
        jQuery("#gunIcon").attr("src", "/duck_shooter/resources/sprites/weapons/shotgun.png");
    }
}


class ClassicGame extends Game{
    constructor(gameParameters){
        super(gameParameters);
        this.changeBackgroundsForCurrentMode();
    }

    changeBackgroundsForCurrentMode(){
        jQuery(".sky").css("backgroundImage", "none");
    }
}