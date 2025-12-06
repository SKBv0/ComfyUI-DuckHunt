class ShotHandler{

    constructor(initialAmmo){
        this.initialAmmo = initialAmmo;
        this.ammo = initialAmmo;
        // Store original node colors for restore on game cleanup
        this.nodeOriginalColors = new Map();
    }

    getAmmoNumber(){
        return this.ammo;
    }

    resetAmmo(){
        this.ammo = this.initialAmmo;
        this.changeShootBoxImage();
    }

    checkIsNoAmmoLeft(){
        if (this.ammo === 0) {
            return true;
        }
        return false;
    }

    checkIfHitSuccessful(ducks, mouseX, mouseY, evt = null){
        // Require explicit coordinates to avoid stale clicks
        if (mouseX === undefined || mouseY === undefined) {
            // Only warn in debug mode to avoid console spam
            if (typeof DEBUG !== 'undefined' && DEBUG) {
                console.warn("ShotHandler: No mouse coordinates provided, skipping hit detection");
            }
            return 0;
        }
        let numberOfSuccessfulHits = 0;
        let nodeHit = false;
        // Always consume ammo once per shot
        this.subtractAmmunition();

        // First check for duck hits
        for (let index = 0; index < ducks.length; index++) {
            let duck = ducks[index];
            let duckPosition = jQuery(duck.duckId).offset();

            if(this.isShotOnDuck(mouseX,mouseY,duckPosition) && duck.isAlive){
                duck.fallDown();
                numberOfSuccessfulHits++;
            }   
        }
        
        // If no duck hit, check for ComfyUI node hits (visual only, no score)
        if (numberOfSuccessfulHits === 0) {
            const hitNodeInfo = this.checkIfHitComfyUINode(mouseX, mouseY);
            if (hitNodeInfo) {
                this.animateNodeHit(hitNodeInfo, mouseX, mouseY);
                nodeHit = true; // Do not count as duck hit/score
            }
        }
        
        if (numberOfSuccessfulHits > 0) {
            playSound("hit");
            if (numberOfSuccessfulHits>1) {
                showComboMessage(mouseX,mouseY, numberOfSuccessfulHits);
            }
        } else if (nodeHit) {
            // Node was hit: just a soft hit sound, no score/progress
            playSound("hit");
        } else {
            playSound("miss");
        }
        
        return numberOfSuccessfulHits;
    }

    checkIfHitComfyUINode(mouseX, mouseY) {
        // ComfyUI nodes are drawn on canvas, not as DOM elements
        if (typeof app === 'undefined' || !app.graph) {
            return null;
        }

        const canvas = app.canvas;
        if (!canvas || !canvas.canvas) {
            return null;
        }

        // Get canvas element and its bounding rect
        const canvasEl = canvas.canvas;
        const canvasRect = canvasEl.getBoundingClientRect();

        // Get LiteGraph transform values
        const scale = canvas.ds?.scale || 1;
        const offset = canvas.ds?.offset || [0, 0];
        const offsetX = Number(offset[0]) || 0;
        const offsetY = Number(offset[1]) || 0;

        // Convert screen coordinates to canvas-relative coordinates
        const canvasX = mouseX - canvasRect.left;
        const canvasY = mouseY - canvasRect.top;

        // Use LiteGraph's built-in method to convert canvas to graph coordinates
        // This handles all transform complexities including scale and offset
        let mouseGraphX, mouseGraphY;

        if (canvas.convertEventToCanvasOffset) {
            // Create a fake event object for LiteGraph's method
            const pos = canvas.convertEventToCanvasOffset({ clientX: mouseX, clientY: mouseY });
            mouseGraphX = pos[0];
            mouseGraphY = pos[1];
        } else if (canvas.convertCanvasToOffset) {
            const pos = canvas.convertCanvasToOffset(canvasX, canvasY);
            mouseGraphX = pos[0];
            mouseGraphY = pos[1];
        } else {
            // Fallback: manual calculation
            // LiteGraph coordinate transform: canvasPos = graphPos * scale + offset
            // Inverse: graphPos = (canvasPos - offset) / scale
            mouseGraphX = (canvasX - offsetX) / scale;
            mouseGraphY = (canvasY - offsetY) / scale;
        }

        // Get all nodes
        const allNodes = app.graph._nodes || [];
        if (!Array.isArray(allNodes) || allNodes.length === 0) {
            return null;
        }

        // Check hit in graph coordinates (iterate from top to bottom in z-order)
        for (let i = allNodes.length - 1; i >= 0; i--) {
            const node = allNodes[i];
            if (!node || !node.pos || !node.size) continue;

            const nodeX = Number(node.pos[0]) || 0;
            const nodeY = Number(node.pos[1]) || 0;
            const nodeW = Number(node.size[0]) || 100;
            const nodeH = Number(node.size[1]) || 50;

            // Check if mouse (in graph coords) is within node bounds
            if (mouseGraphX >= nodeX && mouseGraphX <= nodeX + nodeW &&
                mouseGraphY >= nodeY && mouseGraphY <= nodeY + nodeH) {
                return {
                    node,
                    graphX: nodeX,
                    graphY: nodeY,
                    screenX: mouseX,
                    screenY: mouseY
                };
            }
        }

        return null;
    }

    animateNodeHit(hitNodeInfo, mouseX, mouseY) {
        const HIT_OVERLAY_SIZE = 40;
        const HIT_OVERLAY_OFFSET = 20;
        const HIT_ANIMATION_DURATION = 300; // ms
        const HIT_ANIMATION_SCALE_START = 0.5;
        const HIT_ANIMATION_SCALE_END = 2;

        const { node } = hitNodeInfo;
        const screenX = mouseX !== undefined ? mouseX : hitNodeInfo.screenX;
        const screenY = mouseY !== undefined ? mouseY : hitNodeInfo.screenY;

        // Create hit effect overlay at click position
        const hitOverlay = document.createElement('div');
        hitOverlay.style.cssText = `
            position: fixed;
            left: ${screenX - HIT_OVERLAY_OFFSET}px;
            top: ${screenY - HIT_OVERLAY_OFFSET}px;
            width: ${HIT_OVERLAY_SIZE}px;
            height: ${HIT_OVERLAY_SIZE}px;
            background: radial-gradient(circle, rgba(255,0,0,0.8) 0%, rgba(255,0,0,0) 70%);
            border-radius: 50%;
            pointer-events: none;
            z-index: 100000;
            animation: nodeHitPulse ${HIT_ANIMATION_DURATION}ms ease-out;
        `;

        // Add CSS animation if not already added
        if (!document.getElementById('node-hit-animation-style')) {
            const style = document.createElement('style');
            style.id = 'node-hit-animation-style';
            style.textContent = `
                @keyframes nodeHitPulse {
                    0% { transform: scale(${HIT_ANIMATION_SCALE_START}); opacity: 1; }
                    100% { transform: scale(${HIT_ANIMATION_SCALE_END}); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(hitOverlay);

        // Remove overlay after animation (independent of color restore)
        setTimeout(() => {
            hitOverlay.remove();
        }, HIT_ANIMATION_DURATION);

        // Cancel any pending restore timeout for this node
        if (node._hitRestoreTimeout) {
            clearTimeout(node._hitRestoreTimeout);
            node._hitRestoreTimeout = null;
        }

        // Store original colors ONLY if not already stored (first hit)
        // This prevents storing the red color as "original" on rapid hits
        if (!this.nodeOriginalColors.has(node.id)) {
            this.nodeOriginalColors.set(node.id, {
                color: node.color,
                bgcolor: node.bgcolor
            });
        }

        // Flash effect: change to red
        node.color = "#FF0000";
        node.bgcolor = "#CC0000";
        this.forceCanvasRedraw();

        // Get the stored original colors for restore
        const originalColors = this.nodeOriginalColors.get(node.id);

        // Restore node colors after animation
        node._hitRestoreTimeout = setTimeout(() => {
            node._hitRestoreTimeout = null;
            // Restore from stored original colors
            if (originalColors) {
                node.color = originalColors.color;
                node.bgcolor = originalColors.bgcolor;
                this.nodeOriginalColors.delete(node.id);
            }
            this.forceCanvasRedraw();
        }, HIT_ANIMATION_DURATION);
    }

    forceCanvasRedraw() {
        if (typeof app !== 'undefined' && app.canvas) {
            app.canvas.setDirty?.(true, true);
            app.canvas.draw?.(true, true);
        }
    }

    subtractAmmunition(){
        playSound("shoot");
        this.ammo--;
        this.changeShootBoxImage();
    }

    isShotOnDuck(mouseX, mouseY, duckPosition) {
        const DUCK_WIDTH = 78;
        const DUCK_HEIGHT = 73;
        
        const duckX = duckPosition.left;
        const duckY = duckPosition.top;
    
        if ((mouseX >= duckX) && (mouseX <= duckX + DUCK_WIDTH) && 
            (mouseY >= duckY) && (mouseY <= duckY + DUCK_HEIGHT)){
            return true;
        }
        return false;
    }

    changeShootBoxImage() {
        //add displaying images on classic and modern game mode;
        jQuery("#ammunitionAmmount").html(this.ammo)
    }

    enableShooting(){
        jQuery("#shootBlocker").hide();
        // Remove any existing click listeners first to prevent duplicates
        jQuery("#sky, .sky").off("click");
        // Add click event listener to sky for shooting
        jQuery("#sky, .sky").on("click", (e) => {
            if (typeof game !== "undefined" && game.shoot) {
                game.shoot(e.clientX, e.clientY, e);
            }
        });
    }

    disableShooting(){
        jQuery("#shootBlocker").show();
        // Remove click event listener
        jQuery("#sky, .sky").off("click");
    }

    // Restore all node colors to original (call this when game ends)
    restoreAllNodeColors() {
        // Clear any pending hit restore timeouts
        if (typeof app !== 'undefined' && app.graph) {
            const allNodes = app.graph._nodes || [];
            allNodes.forEach(node => {
                if (node && node._hitRestoreTimeout) {
                    clearTimeout(node._hitRestoreTimeout);
                    node._hitRestoreTimeout = null;
                }
            });

            // Restore all nodes that were hit
            this.nodeOriginalColors.forEach((colors, nodeId) => {
                const node = allNodes.find(n => n && n.id == nodeId);
                if (node) {
                    node.color = colors.color;
                    node.bgcolor = colors.bgcolor;
                }
            });
        }

        // Clear the map
        this.nodeOriginalColors.clear();

        // Remove the animation style element
        const animStyle = document.getElementById('node-hit-animation-style');
        if (animStyle) {
            animStyle.remove();
        }

        // Force canvas redraw
        this.forceCanvasRedraw();
    }
}


