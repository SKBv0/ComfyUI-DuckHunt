// Game state - scoped to avoid global pollution
(function() {
    'use strict';
    let startScreen;
    let game;
    let hasPlayedBefore = false;
    
    // Add jQuery to window object for global access
    window.jQuery = window.$ = window.jQuery || window.$;
    
    function launchApplication() {
        // Make sure jQuery is available
        if (typeof jQuery === 'undefined') {
            // Critical error - always log
            console.error('Duck Shooter: jQuery is not loaded');
            return;
        }

        // Clean up previous game instance if exists
        if (game) {
            // Stop auto-shooting if ExtremeGame
            if (game.stopAutoShooting && typeof game.stopAutoShooting === 'function') {
                game.stopAutoShooting();
            }
            // Stop all intervals and timeouts
            if (game.roundEndCountdown) {
                window.clearTimeout(game.roundEndCountdown);
            }
            if (game.newRoundTimeout) {
                window.clearTimeout(game.newRoundTimeout);
            }
            if (game._startGameTimeout) {
                window.clearTimeout(game._startGameTimeout);
            }
            if (game.shooting) {
                clearInterval(game.shooting);
            }
            // Clean up ducks (DOM elements, animations, intervals)
            if (game.ducksHandler && typeof game.ducksHandler.cleanup === 'function') {
                game.ducksHandler.cleanup();
            }
            // Clean up dog animations
            if (game.dog1 && typeof game.dog1.cleanup === 'function') {
                game.dog1.cleanup();
            }
            if (game.dog2 && typeof game.dog2.cleanup === 'function') {
                game.dog2.cleanup();
            }
            // Remove event listeners from sky element
            jQuery(".sky").off("mousedown mouseup mousemove click");
            // Clean up combo message
            if (typeof cleanupComboMessage === 'function') {
                cleanupComboMessage();
            }
            // Restore node colors from previous game if any
            if (game.shotHandler && typeof game.shotHandler.restoreAllNodeColors === 'function') {
                game.shotHandler.restoreAllNodeColors();
            }
        }

        // Use existing StartScreen instance if available, otherwise create new one
        startScreen = window.startScreenInstance || new StartScreen();
        let gameParameters = startScreen.getGameParametersFromUserSelect();
        let selectedModeName = gameParameters.modeName;

        if (selectedModeName === "EXTREME") {
            game = new ExtremeGame(gameParameters);
        }
        else if(selectedModeName === "MODERN"){
            game = new ModernGame(gameParameters);
        }
        else{
            game = new ClassicGame(gameParameters);
        }

        startScreen.hideStartScreen();

        // Skip intro animation on replay for faster restart
        game.startGame(hasPlayedBefore);
        hasPlayedBefore = true;
        
        // Store game reference for cleanup
        window.game = game;
    }
    
    // Expose launchApplication globally for onclick handlers
    window.launchApplication = launchApplication;
})();
