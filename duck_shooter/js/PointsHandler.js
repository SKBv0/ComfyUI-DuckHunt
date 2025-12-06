class PointsHandler{
    static POINTS_SINGLE_HIT = 10;
    static POINTS_MULTI_HIT_MULTIPLIER = 20;
    
    // Cache jQuery selectors
    static $levelCount = () => jQuery("#levelCount");
    static $scoreCount = () => jQuery("#scoreCount");

    constructor(){
        this.pointsNumber = 0;
        this.level = 0;
    }

    addPoints(successfulHits){
        if (successfulHits === 1) {
            this.pointsNumber += PointsHandler.POINTS_SINGLE_HIT;
            this.displayUpdatedPointsNumber();
        }
        else if (successfulHits > 1){
            this.pointsNumber += PointsHandler.POINTS_MULTI_HIT_MULTIPLIER * successfulHits;
            this.displayUpdatedPointsNumber();
        }
    }

    addLevel(){
        this.level += 1;
        this.displayUpdatedLevelNumber();
    }

    displayUpdatedLevelNumber(){
        PointsHandler.$levelCount().html(this.level);
    }

    displayUpdatedPointsNumber(){
        PointsHandler.$scoreCount().html(this.pointsNumber);
    }
}