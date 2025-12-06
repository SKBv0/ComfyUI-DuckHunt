class DucksHandler{

    constructor(numberOfDucks, duckMovesNumber){
        this.duckMovesNumber = duckMovesNumber;
        this.initialDucksNumber = numberOfDucks;
        this.numberOfDucks = 0;
        this.ducks = [];
        this.ducksKilledInRound = 0;
        this.duckIdCounter = 0; // Unique ID counter to prevent ID conflicts
        this.createDucks();
    }

    startDucksFlight(){
        this.ducksKilledInRound = 0;
        this.ducks.forEach(duck => {
            duck.startFlight();
        });
    }

    removeRemainingDucks(){
        this.ducks.forEach(duck => {
            if (duck.isAlive) {
                duck.flyOut();
            }
        });
    }

    // Clean up all duck DOM elements and stop animations
    cleanup(){
        this.ducks.forEach(duck => {
            // Use Duck's cleanup method
            if (typeof duck.cleanup === 'function') {
                duck.cleanup();
            }
            // Remove DOM element
            duck.$().remove();
            // Clear jQuery cache
            duck.$duck = null;
        });
        this.ducks = [];
        this.numberOfDucks = 0;
        this.ducksKilledInRound = 0;
    }

    checkAllDucksAreShot(){
        if (this.ducksKilledInRound === this.numberOfDucks) {
            return true;
        }
        return false;
    }

    countPercentOfDucksKilled(){
        // Prevent division by zero
        if (this.numberOfDucks === 0) {
            return 0;
        }
        const percent = Math.round(this.ducksKilledInRound / this.numberOfDucks * 100);
        return percent;
    }

    createNewDuck(){
        this.numberOfDucks++;
        const id = `duck_${this.duckIdCounter++}`;
        this.ducks.push(new Duck(id, this.duckMovesNumber));
        jQuery("#sky").append(`<div id="${id}" class="duck"></div>`);
    }

    createDucks(){
        for (let i = 0; i < this.initialDucksNumber; i++) {
            this.createNewDuck();
        }
    }
}