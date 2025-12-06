// Cache frequently used jQuery selectors
const $comboMessage = () => jQuery(".comboMessage");
const $roundProgress = () => jQuery("#roundProgress");

// Track combo message timeout for cleanup
let _comboTimeout = null;

function showComboMessage(posX, posY, comboValue){
    // Clear any existing timeout
    if (_comboTimeout) {
        clearTimeout(_comboTimeout);
    }

    $comboMessage()
        .html(`COMBO ${comboValue}!`)
        .css("top", posY)
        .css("left", posX)
        .css("display", "block");

    _comboTimeout = setTimeout(() => {
        _comboTimeout = null;
        hideComboMessage();
    }, 1000);
}

function hideComboMessage(){
    $comboMessage().css("display", "none");
}

// Clean up combo message timeout
function cleanupComboMessage() {
    if (_comboTimeout) {
        clearTimeout(_comboTimeout);
        _comboTimeout = null;
    }
    hideComboMessage();
}

function displayProgressOnProgressBar(percent){
    $roundProgress()
        .css("width", `${percent}%`)
        .attr("aria-valuenow", percent)
        .text(`${percent}%`);
    changeProgressBarColor(percent);
}

function changeProgressBarColor(percent) {
    let gradientValue = "linear-gradient(90deg, rgba(189, 0, 0, 0.9) 0%, rgba(200, 20, 20, 0.9) 50%, rgba(189, 0, 0, 0.9) 100%)";
    let shadowValue = "0 0 12px rgba(189, 0, 0, 0.5), 0 0 6px rgba(200, 20, 20, 0.3)";

    if (percent >= 90) {
        gradientValue = "linear-gradient(90deg, rgba(51, 219, 0, 0.9) 0%, rgba(80, 240, 30, 0.9) 50%, rgba(51, 219, 0, 0.9) 100%)";
        shadowValue = "0 0 12px rgba(51, 219, 0, 0.5), 0 0 6px rgba(80, 240, 30, 0.3)";
    }
    else if (percent >= 80){
        gradientValue = "linear-gradient(90deg, rgba(255, 200, 0, 0.9) 0%, rgba(255, 220, 50, 0.9) 50%, rgba(255, 200, 0, 0.9) 100%)";
        shadowValue = "0 0 12px rgba(255, 200, 0, 0.5), 0 0 6px rgba(255, 220, 50, 0.3)";
    }
    $roundProgress().css({
        "background": gradientValue,
        "box-shadow": shadowValue
    });
}

function displayEndScreen(pointsHandler, totalSuccessfulHits, accuracy){
    jQuery("#pointsSummary").text(pointsHandler.pointsNumber);
    jQuery("#roundSummary").text(pointsHandler.level);
    jQuery("#shotsSummary").text(totalSuccessfulHits);
    jQuery("#accuracySummary").text(`${accuracy}%`);
    jQuery("#overlay").show();
}

function disableLifeIcon(lifeNumber){
    playSound("miss");
    jQuery(`#life${lifeNumber}`).css("filter", "grayscale(100%)");
}

