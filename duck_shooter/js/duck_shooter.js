import { app } from "../../../scripts/app.js";

// Duck Hunt Game Panel Integration - Direct DOM Embed (no iframe)
// This loads game HTML directly into ComfyUI DOM for true transparency
// Game is placed inside the graph-canvas-container to stay within workflow area

// Module-level references for cleanup
let _resizeHandler = null;

app.registerExtension({
    name: "Comfy.DuckHunt.Game.Panel",

    async setup() {
        let gamePanel = null;
        let gameButton = null;

        // Game dimensions (not currently used - game scales to container)
        // Kept for potential future use
        // const GAME_WIDTH = 960;
        // const GAME_HEIGHT = 540;
        // const GAME_SCALE = 1;

        // Get canvas container bounds (workflow area, excluding panels)
        function getCanvasBounds() {
            // Try to find the graph canvas container
            const canvasContainer = document.getElementById('graph-canvas-container')
                || document.querySelector('.graph-canvas-container')
                || document.querySelector('canvas')?.parentElement;

            // Full-screen game area, but sprites stay at native size (no scaling)
            if (canvasContainer) {
                const rect = canvasContainer.getBoundingClientRect();
                // Container fills full canvas, but sprites inside remain at native size
                return {
                    x: 0,
                    y: 0,
                    width: rect.width,
                    height: rect.height,
                    scale: 1, // No transform scale - sprites stay native size
                    container: canvasContainer,
                    containerRect: rect
                };
            }

            // Fallback to viewport if container not found
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            return {
                x: 0,
                y: 0,
                width: viewportWidth,
                height: viewportHeight,
                scale: 1,
                container: null
            };
        }

        // Load CSS file into document
        function loadCSS(href) {
            return new Promise((resolve, reject) => {
                // Check if already loaded
                if (document.querySelector(`link[href="${href}"]`)) {
                    resolve();
                    return;
                }
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = href;
                link.onload = resolve;
                link.onerror = reject;
                document.head.appendChild(link);
            });
        }

        // Add preconnect links for Google Fonts
        function addGoogleFontsPreconnect() {
            const preconnect1 = document.createElement('link');
            preconnect1.rel = 'preconnect';
            preconnect1.href = 'https://fonts.googleapis.com';
            if (!document.querySelector('link[href="https://fonts.googleapis.com"]')) {
                document.head.appendChild(preconnect1);
            }

            const preconnect2 = document.createElement('link');
            preconnect2.rel = 'preconnect';
            preconnect2.href = 'https://fonts.gstatic.com';
            preconnect2.crossOrigin = 'anonymous';
            if (!document.querySelector('link[href="https://fonts.gstatic.com"]')) {
                document.head.appendChild(preconnect2);
            }
        }

        // Load JS file into document
        function loadJS(src) {
            return new Promise((resolve, reject) => {
                // Check if already loaded
                if (document.querySelector(`script[src="${src}"]`)) {
                    resolve();
                    return;
                }
                const script = document.createElement('script');
                script.src = src;
                script.onload = resolve;
                script.onerror = reject;
                document.body.appendChild(script);
            });
        }

        // Create game panel with direct HTML embed
        async function createGamePanel() {
            const bounds = getCanvasBounds();

            // Create container - positioned within canvas area
            const panel = document.createElement("div");
            panel.id = "duckhunt-game-panel";
            panel.style.setProperty('--duck-scale', 1); // Sprites stay native size

            // If we found the canvas container, position relative to it
            if (bounds.container) {
                panel.style.cssText = `
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                    height: 100%;
                    background: transparent;
                    display: none;
                    overflow: hidden;
                    z-index: 50;
                    pointer-events: none;
                `;
            } else {
                // Fallback to fixed positioning
                panel.style.cssText = `
                    position: fixed;
                    left: 0;
                    top: 0;
                    width: 100vw;
                    height: 100vh;
                    background: transparent;
                    display: none;
                    overflow: hidden;
                    z-index: 100;
                    pointer-events: none;
                `;
            }

            // Create game container - full screen, but sprites stay native size
            const gameContainer = document.createElement("div");
            gameContainer.id = "duckhunt-game-container";
            gameContainer.style.cssText = `
                position: absolute;
                left: ${bounds.x}px;
                top: ${bounds.y}px;
                width: ${bounds.width}px;
                height: ${bounds.height}px;
                background: transparent;
                pointer-events: auto;
            `;

            // Game HTML content (from index.html)
            gameContainer.innerHTML = `
                <div id="startScreen">
                    <div class="startScreen__content">
                        <br><br>
                        <div class="startScreen__content__box" id="startGameButton">
                            <h2 id="startButton">START GAME</h2>
                        </div>
                        <div class="startScreen__content__box" id="modeSelect">
                            <div class="arrow" id="prevMode">⏴</div>
                            <div class="selection">CLASSIC</div>
                            <div class="arrow" id="nextMode">⏵</div>
                        </div>
                    </div>
                </div>

                <div id="sky" class="sky">
                    <div class="comboMessage"></div>
                    <div class="dog" id="dog1"></div>
                    <div class="dog" id="dog2"></div>
                    <div id="pointsCounter">
                        <h2 id="levelCount">1</h2>
                    </div>
                    <div class="bushes">
                        <div class="barRow">
                            <div class="rowCell ammunitionCell" id="shots">
                                <div class="ammunitionCell__info">
                                    <h2 id="ammunitionAmmount">0</h2>
                                    <h2>SHOT</h2>
                                </div>
                                <div class="ammunitionCell__gunIcon">
                                    <img id="gunIcon" src="/duck_shooter/resources/sprites/weapons/gun.png" alt="">
                                </div>
                            </div>
                            <div class="rowCell" id="hit">
                                <div class="lifesIcons">
                                    <img id="life1" src="/duck_shooter/resources/sprites/scoreImages/life.png" alt="Life 1">
                                    <img id="life2" src="/duck_shooter/resources/sprites/scoreImages/life.png" alt="Life 2">
                                    <img id="life3" src="/duck_shooter/resources/sprites/scoreImages/life.png" alt="Life 3">
                                </div>
                                <div class="progress">
                                    <div id="roundProgress" class="progress-bar progress-bar-striped active" role="progressbar"
                                    aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" aria-label="Round progress" style="width:0%">
                                        0%
                                    </div>
                                </div>
                            </div>
                            <div class="rowCell scoreCell" id="score">
                                <h2 id="scoreCount">0</h2>
                                <h2>SCORE</h2>
                            </div>
                        </div>
                    </div>
                </div>

                <div id="shootBlocker"></div>

                <div id="overlay">
                    <div class="resultsBox">
                        <h3 class="game-over-title">Game Over!</h3>
                        <table>
                            <tr><td>YOUR POINTS</td><td id="pointsSummary"></td></tr>
                            <tr><td>ROUND</td><td id="roundSummary"></td></tr>
                            <tr><td>SUCCESSFUL SHOTS</td><td id="shotsSummary"></td></tr>
                            <tr><td>ACCURACY</td><td id="accuracySummary"></td></tr>
                        </table>
                        <h3 id="playAgainButton" class="cursorChange">PLAY AGAIN</h3>
                    </div>
                </div>
            `;

            panel.appendChild(gameContainer);
            gamePanel = panel;

            // Add to canvas container if found, otherwise to body
            if (bounds.container) {
                // Make sure container has relative positioning for absolute children
                const containerStyle = window.getComputedStyle(bounds.container);
                if (containerStyle.position === 'static') {
                    bounds.container.style.position = 'relative';
                }
                bounds.container.appendChild(panel);
            } else {
                document.body.appendChild(panel);
            }

            // Add Google Fonts preconnect links
            addGoogleFontsPreconnect();

            // Load Google Fonts first
            await Promise.all([
                loadCSS('https://fonts.googleapis.com/css2?family=Bungee&family=Righteous&display=swap')
            ]);

            // Load CSS files
            await Promise.all([
                loadCSS('/duck_shooter/CSS/styles.css'),
                loadCSS('/duck_shooter/CSS/bar.css'),
                loadCSS('/duck_shooter/CSS/overlays.css'),
                loadCSS('/duck_shooter/CSS/startScreen.css')
            ]);

            // Minimal scoped styles to avoid leaking, without wiping panel backgrounds
            const scopedStyle = document.createElement('style');
            scopedStyle.id = 'duckhunt-scoped-styles';
            scopedStyle.textContent = `
                #duckhunt-game-container {
                    font-family: 'Bungee', 'Righteous', cursive, sans-serif;
                    -webkit-font-smoothing: antialiased;
                    -moz-osx-font-smoothing: grayscale;
                    text-rendering: optimizeLegibility;
                }
                #duckhunt-game-container * {
                    box-sizing: border-box;
                }
            `;
            document.head.appendChild(scopedStyle);

            // Load jQuery first (required by game)
            await loadJS('https://code.jquery.com/jquery-3.3.1.min.js');

            // Load game JS files in order
            const gameScripts = [
                '/duck_shooter/js/sounds.js',
                '/duck_shooter/js/DogClass.js',
                '/duck_shooter/js/DuckClass.js',
                '/duck_shooter/js/PointsHandler.js',
                '/duck_shooter/js/ShotHandler.js',
                '/duck_shooter/js/DucksHandler.js',
                '/duck_shooter/js/View.js',
                '/duck_shooter/js/Game.js',
                '/duck_shooter/js/StartScreen.js',
                '/duck_shooter/js/Application.js'
            ];

            for (const src of gameScripts) {
                await loadJS(src);
            }

            // Initialize StartScreen immediately so mode selection buttons work
            if (typeof StartScreen !== 'undefined') {
                window.startScreenInstance = new StartScreen();
            }

            // Setup start game button
            const startGameBtn = gameContainer.querySelector('#startGameButton');
            if (startGameBtn) {
                startGameBtn.addEventListener('click', () => {
                    if (typeof launchApplication === 'function') {
                        launchApplication();
                    }
                });
            }

            // Setup play again button
            const playAgainBtn = gameContainer.querySelector('#playAgainButton');
            if (playAgainBtn) {
                playAgainBtn.addEventListener('click', () => {
                    // Clean up current game instance before restart
                    if (typeof window.game !== 'undefined' && window.game) {
                        // Stop auto-shooting if ExtremeGame
                        if (window.game.stopAutoShooting && typeof window.game.stopAutoShooting === 'function') {
                            window.game.stopAutoShooting();
                        }
                        // Stop all intervals and timeouts
                        if (window.game.roundEndCountdown) {
                            window.clearTimeout(window.game.roundEndCountdown);
                        }
                        if (window.game.newRoundTimeout) {
                            window.clearTimeout(window.game.newRoundTimeout);
                        }
                        if (window.game._startGameTimeout) {
                            window.clearTimeout(window.game._startGameTimeout);
                        }
                        if (window.game.shooting) {
                            clearInterval(window.game.shooting);
                        }
                        // Clean up ducks (DOM elements, animations, intervals)
                        if (window.game.ducksHandler && typeof window.game.ducksHandler.cleanup === 'function') {
                            window.game.ducksHandler.cleanup();
                        }
                        // Clean up dog animations using cleanup method
                        if (window.game.dog1 && typeof window.game.dog1.cleanup === 'function') {
                            window.game.dog1.cleanup();
                        }
                        if (window.game.dog2 && typeof window.game.dog2.cleanup === 'function') {
                            window.game.dog2.cleanup();
                        }
                        // Disable shooting and restore node colors
                        if (window.game.shotHandler) {
                            if (typeof window.game.shotHandler.disableShooting === 'function') {
                                window.game.shotHandler.disableShooting();
                            }
                            if (typeof window.game.shotHandler.restoreAllNodeColors === 'function') {
                                window.game.shotHandler.restoreAllNodeColors();
                            }
                        }
                        // Remove event listeners from sky element
                        jQuery(".sky").off("mousedown mouseup mousemove click");
                    }
                    // Reset game state and reload
                    gameContainer.querySelector('#overlay').style.display = 'none';
                    gameContainer.querySelector('#startScreen').style.display = 'block';
                    // Clear game reference
                    if (typeof window.game !== 'undefined') {
                        delete window.game;
                    }
                    // Re-initialize StartScreen for mode selection
                    if (typeof StartScreen !== 'undefined') {
                        window.startScreenInstance = new StartScreen();
                    }
                });
            }

            return panel;
        }

        // Update panel position on resize
        function updatePanelPosition() {
            if (!gamePanel || gamePanel.style.display === 'none') return;

            const bounds = getCanvasBounds();
            const container = gamePanel.querySelector('#duckhunt-game-container');
            if (container) {
                container.style.left = `${bounds.x}px`;
                container.style.top = `${bounds.y}px`;
                container.style.width = `${bounds.width}px`;
                container.style.height = `${bounds.height}px`;
            }
            gamePanel.style.setProperty('--duck-scale', 1); // Sprites stay native size
        }

        // Create control button
        function createControlButton() {
            const button = document.createElement("button");
            button.id = "duck-hunt-toggle-button";
            button.textContent = "🦆";
            button.style.cssText = `
                position: fixed;
                top: 80px;
                right: 20px;
                bottom: auto;
                z-index: 10000;
                width: 48px;
                height: 48px;
                padding: 0;
                background: rgba(30, 30, 30, 0.9);
                color: #fff;
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 8px;
                cursor: pointer;
                font-size: 24px;
                font-weight: normal;
                box-shadow: 0 2px 8px rgba(0,0,0,0.4);
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                backdrop-filter: blur(10px);
            `;

            // Create tooltip element
            const tooltip = document.createElement("div");
            tooltip.id = "duck-hunt-tooltip";
            tooltip.textContent = "Duck Hunt";
            tooltip.style.cssText = `
                position: absolute;
                top: -30px;
                right: 0;
                bottom: auto;
                background: rgba(0, 0, 0, 0.9);
                color: #fff;
                padding: 6px 12px;
                border-radius: 4px;
                font-size: 12px;
                white-space: nowrap;
                pointer-events: none;
                opacity: 0;
                transition: opacity 0.2s ease;
                z-index: 10001;
            `;
            button.appendChild(tooltip);

            button.onmouseover = () => {
                button.style.background = "rgba(40, 40, 40, 0.95)";
                button.style.borderColor = "rgba(255, 255, 255, 0.4)";
                button.style.transform = "scale(1.05)";
                tooltip.style.opacity = "1";
            };
            button.onmouseout = () => {
                button.style.background = "rgba(30, 30, 30, 0.9)";
                button.style.borderColor = "rgba(255, 255, 255, 0.2)";
                button.style.transform = "scale(1)";
                tooltip.style.opacity = "0";
            };

            button.onclick = toggleGamePanel;
            document.body.appendChild(button);
            gameButton = button;
            return button;
        }

        // Toggle game panel
        async function toggleGamePanel() {
            if (!gamePanel) {
                await createGamePanel();
            }

            if (gamePanel.style.display === "none" || gamePanel.style.display === "") {
                gamePanel.style.display = "block";
                if (gameButton) {
                    gameButton.textContent = "✕";
                    const tooltip = gameButton.querySelector("#duck-hunt-tooltip");
                    if (tooltip) tooltip.textContent = "Close Duck Hunt";
                }
                updatePanelPosition();
            } else {
                gamePanel.style.display = "none";
                if (gameButton) {
                    gameButton.textContent = "🦆";
                    const tooltip = gameButton.querySelector("#duck-hunt-tooltip");
                    if (tooltip) tooltip.textContent = "Duck Hunt";
                }
                
                // Restore node colors when game panel is closed
                // Try multiple ways to access game instance
                let gameInstance = null;
                if (typeof window.game !== 'undefined') {
                    gameInstance = window.game;
                } else if (typeof game !== 'undefined') {
                    gameInstance = game;
                } else {
                    // Try to get from Application.js global
                    const gameContainer = document.getElementById('duckhunt-game-container');
                    if (gameContainer && gameContainer._gameInstance) {
                        gameInstance = gameContainer._gameInstance;
                    }
                }
                
                if (gameInstance && gameInstance.shotHandler && typeof gameInstance.shotHandler.restoreAllNodeColors === 'function') {
                    gameInstance.shotHandler.restoreAllNodeColors();
                }
            }
        }

        // Initialize
        createControlButton();

        // Listen for resize and store reference for cleanup
        _resizeHandler = updatePanelPosition;
        window.addEventListener('resize', _resizeHandler);
    },

    async beforeUnload() {
        // Clean up resize event listener
        if (_resizeHandler) {
            window.removeEventListener('resize', _resizeHandler);
            _resizeHandler = null;
        }

        // Clean up game state if exists
        if (typeof game !== 'undefined' && game) {
            // Stop all intervals and timeouts
            if (game.shotHandler) {
                game.shotHandler.disableShooting();
                game.shotHandler.restoreAllNodeColors();
            }
            if (game.roundEndCountdown) {
                window.clearTimeout(game.roundEndCountdown);
            }
            if (game.newRoundTimeout) {
                window.clearTimeout(game.newRoundTimeout);
            }
            if (game._startGameTimeout) {
                window.clearTimeout(game._startGameTimeout);
            }
            // Clean up ducks (DOM, animations, intervals)
            if (game.ducksHandler && typeof game.ducksHandler.cleanup === 'function') {
                game.ducksHandler.cleanup();
            }
            // Clean up dog animations using cleanup method
            if (game.dog1 && typeof game.dog1.cleanup === 'function') {
                game.dog1.cleanup();
            }
            if (game.dog2 && typeof game.dog2.cleanup === 'function') {
                game.dog2.cleanup();
            }
            // Stop auto shooting if ExtremeGame
            if (game.shooting) {
                clearInterval(game.shooting);
            }
        }
        
        // Remove DOM elements
        const panel = document.getElementById("duckhunt-game-panel");
        const button = document.getElementById("duck-hunt-toggle-button");
        const scopedStyle = document.getElementById("duckhunt-scoped-styles");

        if (panel) panel.remove();
        if (button) button.remove();
        if (scopedStyle) scopedStyle.remove();
        
        // Clear global references
        if (typeof window.game !== 'undefined') {
            delete window.game;
        }
        if (typeof window.startScreenInstance !== 'undefined') {
            delete window.startScreenInstance;
        }
    }
});
