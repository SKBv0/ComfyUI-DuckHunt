class Duck {
    constructor(id, duckMovesNumber) {
        this.duckMovesNumber = duckMovesNumber;
        this.duckId = `#${id}`;
        this.$duck = null; // Cached jQuery element
        this.isAlive = true;
        this.moveCount = 0;
        this.duckFlight = null;
        this._fallTimeout = null; // Track fallDown timeout for cleanup
        this.currentWidth = 48;
        this.currentHeight = 20;
    }
    
    // Get or cache jQuery element
    $() {
        if (!this.$duck) {
            this.$duck = jQuery(this.duckId);
        }
        return this.$duck;
    }

    startFlight() {
        this.resurrect();
        playSound("duck");
        this.duckFlight = setInterval(() => this.fly(), 1000);
    }

    resurrect() {
        this.isAlive = true;
        this.moveCount = 0;
        this.currentWidth = 48;
        this.currentHeight = 20;
        this.moveToInitialPosition();
    }

    stopFlightAnimation() {
        clearInterval(this.duckFlight);
        this.$().stop(true);
    }

    moveToInitialPosition() {
        this.$().css("bottom", "0px");
    }

    flyOut() {
        this.stopFlightAnimation();
        const destWidth = this.getRandomWidth(10, 85);
        this.changeDuckBackground(destWidth, 100);
        this.$().animate({ bottom: `100%`, left: `${destWidth}%` }, 500, function() {});
    }

    fallDown() {
        this.isAlive = false;
        const self = this;
        this.stopFlightAnimation();
        playSound("hit");
        this.$().css("background-image", "url(/duck_shooter/resources/sprites/duck/hit.png)");

        // Clear any existing fall timeout
        if (this._fallTimeout) {
            clearTimeout(this._fallTimeout);
        }

        this._fallTimeout = setTimeout(function() {
            self._fallTimeout = null;
            playSound("duckfall");
            self.$()
                .css("background-image", "url(/duck_shooter/resources/sprites/duck/falling.gif)")
                .animate({ bottom: `0px` }, 650);
        }, 150);
    }

    // Clean up all timeouts and animations
    cleanup() {
        if (this.duckFlight) {
            clearInterval(this.duckFlight);
            this.duckFlight = null;
        }
        if (this._fallTimeout) {
            clearTimeout(this._fallTimeout);
            this._fallTimeout = null;
        }
        this.$().stop(true, true);
    }

    fly() {
        this.moveCount++;
        const destWidth = this.getRandomWidth(10, 85);
        const destHeight = this.getRandomHeight(35, 85);
        this.changeDuckBackground(destWidth, destHeight);
        this.$().animate({ bottom: `${destHeight}%`, left: `${destWidth}%` }, 1000);
        this.currentWidth = destWidth;
        this.currentHeight = destHeight;
    }

    changeDuckBackground(destWidth, destHeight) {
        const $duck = this.$();
        if (destWidth > this.currentWidth) {
            $duck.css("background-image", "url(/duck_shooter/resources/sprites/duck/flyright.gif)");
            if (destHeight - this.currentHeight > 20) {
                $duck.css("background-image", "url(/duck_shooter/resources/sprites/duck/flyrightup.gif)");
            }
            if (destHeight - this.currentHeight < -20) {
                $duck.css("background-image", "url(/duck_shooter/resources/sprites/duck/flyrightdown.gif)");
            }
        } else {
            $duck.css("background-image", "url(/duck_shooter/resources/sprites/duck/flyleft.gif)");

            if (destHeight - this.currentHeight > 20) {
                $duck.css("background-image", "url(/duck_shooter/resources/sprites/duck/flyleftup.gif)");
            }
            if (destHeight - this.currentHeight < -20) {
                $duck.css("background-image", "url(/duck_shooter/resources/sprites/duck/flyleftdown.gif)");
            }
        }
    }

    getRandomWidth(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    getRandomHeight(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}