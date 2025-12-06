class Dog {
    constructor(id) {
        this.dogId = `#${id}`;
        this._showTimeout = null; // Track showDogWithKilledDucks timeout
    }

    launchWalkoutAnimation() {
        playSound("dogwalk");
        let walkBackground = "url(/duck_shooter/resources/sprites/dog/dogeWalking.gif)";
        let sniffBackground = "url(/duck_shooter/resources/sprites/dog/snif.gif)";
        let stopBackground = "url(/duck_shooter/resources/sprites/dog/found.png)";
        let jumpBackground = "url(/duck_shooter/resources/sprites/dog/pawelJumper.gif)";

        jQuery(this.dogId)
            .animate({ left: "20%" }, 2000, function() {
                jQuery(this).css("background-image", sniffBackground)
            })
            .animate({ left: "20%" }, 1000, function() {
                jQuery(this).css("background-image", walkBackground);
            })
            .animate({ left: "40%" }, 2000, function() {
                jQuery(this).css("background-image", sniffBackground);
            })
            .animate({ left: "40%" }, 1000, function() {
                jQuery(this).css("background-image", stopBackground);
            })
            .animate({ left: "40%" }, 500, function() {
                jQuery(this).css("background-image", jumpBackground)
                    .css("animation-name", "dogJump")
                    .css("animation-duration", "0.7s")
                    .css("animation-iteration-count", "1")
                    .css("animation-timing-function", "linear")
            })
            .animate({ opacity: "0.4" }, 700, function() {
                jQuery(this).css("display", "none");
            })
    }

    showDogWithKilledDucks(killedDucks) {
        if (killedDucks === 0) {
            playSound("gotZero");
            jQuery(this.dogId).css("backgroundImage", 'url(/duck_shooter/resources/sprites/dog/bk.gif)');
        } else if (killedDucks === 1) {
            playSound("gotOne");
            jQuery(this.dogId).css("backgroundImage", 'url(/duck_shooter/resources/sprites/dog/gotOne.png)');
        } else {
            playSound("gotOne");
            jQuery(this.dogId).css("backgroundImage", 'url(/duck_shooter/resources/sprites/dog/gotTwo.png)');
        }

        // Show dog2 and trigger animation
        jQuery(this.dogId).css("display", "block").addClass("easingOut");

        // Clear any existing timeout
        if (this._showTimeout) {
            clearTimeout(this._showTimeout);
        }

        // After animation completes, hide the dog
        this._showTimeout = setTimeout(() => {
            this._showTimeout = null;
            jQuery(this.dogId).removeClass("easingOut").css("display", "none");
        }, 2000);
    }

    // Clean up animations and timeouts
    cleanup() {
        if (this._showTimeout) {
            clearTimeout(this._showTimeout);
            this._showTimeout = null;
        }
        jQuery(this.dogId).stop(true, true).css("display", "none").removeClass("easingOut");
    }
}