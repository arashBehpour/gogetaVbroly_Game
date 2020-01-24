var sketchProc=function(processingInstance){ with (processingInstance){
var canvasWidth = 500, canvasHeight = 400;
size(canvasWidth, canvasHeight); 
frameRate(60);
//ProgramCodeGoesHere

// Resources:
// https://www.deviantart.com/orumaitoobeso/art/gogeta-ssjblue-sprite-swl-782244083
// https://www.deviantart.com/orumaitoobeso/art/Broly-Full-Power-SWL-Sprite-Sheet-811840836
// https://www.deviantart.com/dsp27/art/Dbz-Sprites-Backgrounds-2-3-764594135
// http://la94022.com/~blyon/Javascript/Imagenator/
// https://forum.code.org/t/clearing-background-around-sprites/11607/3
// Artist Credit: Orumaito obeso, dsp27

// Description of game and objects: Goku(Kakarot) was not able to defeat Broly 
// by himself. He was able to persuade his friend Vegeta to fuse with him 
// and become Gogeta! Hopefully now they have enough strength to fight off Broly
// from destroying Kakarot along with the Earth. The user will play as Gogeta
// to fight and defeat Broly!
angleMode = "radians";
var one_degree = TWO_PI / 360;
var GameState = { START: -2, INSTR_MENU: -1, INGAME: 0, GAMEOVER: 1};
var CharacterState = { MOVEMENT: 0, CHARGING_KI: 1, KI_BLASTS: 2, MELEE: 3, SPECIAL: 4};

var keyArray = [];
var curGameState = GameState.START;
var waterParticles = [];
var yourAWinner = false;
var userClickedPlay = false;
var Gogeta, Broly;

var startBackground, fightBackground; // PIMAGE
startBackground = loadImage("sprites/startingScreenBackground.PNG");
fightBackground = loadImage("sprites/fightingBackground.PNG");

// ********************************** State Objects ***************************************
var wanderState = function(){
    this.wanderAngle = random(0, PI); // in radians 
    this.wanderDir = 0;
    this.step = new PVector(0, 0);// direction to wander towards
    this.wanderDist = random(50, 100);
};

var chaseState = function(){
    this.step = new PVector(0, 0);
    this.curFrameCount = 0;
};

/** For ki blasts, special, charging ki, or melee kicks for Broly
 */
var usingMoveState = function(){
    // Nothing needed
};

/**
 * Empty b/c this state is a stagnant state that will stay here forever
 */ 
var deadState = function(){ };

// *************************** Object Definition/properties ********************************
var kiBlastObj = function(x, y, kiBlastOwner){
    this.position = new PVector(x, y);
    this.velocity = new PVector(0, 0);
    this.fire = false;
    this.size = 16;
    this.owner = kiBlastOwner;
};

var kamehamehaObj = function(x, y){
    this.position = new PVector(x, y);
    this.origPosition = new PVector(0, 0);
    this.velocity = new PVector(0, 0);
    this.damageSize = 30;
    this.angle = 0;
    this.dir = new PVector(0, 0);
    this.fire = false;
};

var kiExplosionObj = function(x, y){
    this.position = new PVector(x, y);
    this.innerSize = 114;
    this.explosionSize = this.innerSize;
    this.maxExplosionSize = 300;
    this.curFrameCount = 0;
    this.fire = false;
};

var gogetaObj = function(x, y){
    this.position = new PVector(x, y); 
    this.prevPosition = new PVector(x, y);

    // Note: center located at middle of sprites
    this.movementSprites = [loadImage("sprites/Gogeta/movement/standing.png"), loadImage("sprites/Gogeta/movement/leftAndRight.png"),
    loadImage("sprites/Gogeta/movement/ascending.png"), loadImage("sprites/Gogeta/movement/descending.png")];
    this.curMovementState = 0;
    this.lastLookedLeft = false; // Tells me wether to scale(-1,1) the sprite

    this.chargingKiSprites = [loadImage("sprites/Gogeta/chargeKi/chargeKi0.png"), loadImage("sprites/Gogeta/chargeKi/chargeKi1.png"),
    loadImage("sprites/Gogeta/chargeKi/chargeKi2.png")];
    this.curChargingKiState = 0;
    this.chargeKiFrameCount = -1;

    this.kiBlastsSprites = [loadImage("sprites/Gogeta/kiBlast/shootKi0.png"), loadImage("sprites/Gogeta/kiBlast/shootKi1.png"),
    loadImage("sprites/Gogeta/kiBlast/shootKi2.png"), loadImage("sprites/Gogeta/kiBlast/shootKi3.png")];
    this.curKiBlastsState = 0;
    this.kiBlastsFrameCount = -1;

    this.meleeSprites = [loadImage("sprites/Gogeta/melee/melee0.png"), loadImage("sprites/Gogeta/melee/melee1.png")];
    this.curMeleeState = 0;
    this.meleeFrameCount = -1;

    this.specialMoveSprites = [loadImage("sprites/Gogeta/special/special0.png"), loadImage("sprites/Gogeta/special/special1.png"),
    loadImage("sprites/Gogeta/special/special2.png"), loadImage("sprites/Gogeta/special/special3.png")];
    this.curSpecialMoveState = 0;
    this.specialMoveFrameCount = -1;

    this.curCharacterState = CharacterState.MOVEMENT;

    this.kiBlasts = []; // Gogeta has 20 kiBlastObjs
    this.shootKiBlastsFrameCount = -1;
    this.nextKiBlastIndex = 0;
    for(var i = 0; i < 20; i++){
        this.kiBlasts.push(new kiBlastObj(0, 0, "gogeta"));
    }
    this.specialKamehameha = new kamehamehaObj(0, 0);

    this.health = 150; // hit by special(broly explosion) = -2 + (-3) per frame ki blast = -8, melee kick = -30
    this.ki = 150; // 8 ki per ki blast, 80 ki per special
    this.hitBox = 33;
    this.curFrameCount = 0;

    // Note: center located at top left corner for power up sprites
    this.powerUpSprites = [loadImage("sprites/Gogeta/powerUpStartingScreen/powerUp0.PNG"), 
    loadImage("sprites/Gogeta/powerUpStartingScreen/powerUp1.PNG"), loadImage("sprites/Gogeta/powerUpStartingScreen/powerUp2.PNG"),
    loadImage("sprites/Gogeta/powerUpStartingScreen/powerUp3.PNG"), loadImage("sprites/Gogeta/powerUpStartingScreen/powerUp4.PNG"),
    loadImage("sprites/Gogeta/powerUpStartingScreen/powerUp5.PNG"), loadImage("sprites/Gogeta/powerUpStartingScreen/powerUp6.PNG"),
    loadImage("sprites/Gogeta/powerUpStartingScreen/powerUp7.PNG"), loadImage("sprites/Gogeta/powerUpStartingScreen/powerUp8.PNG"),
    loadImage("sprites/Gogeta/powerUpStartingScreen/powerUp9.PNG")];
    this.curPowerUpState = 0;
    this.powerUpFrameCount = 0;

    this.faceImg = loadImage("sprites/Gogeta/gogetaFace.png");
};


var brolyObj = function(x, y){
    this.position = new PVector(x, y);
    this.prevPosition = new PVector(x, y);

    this.keyArray_NPC = [];
    this.resetKeyArray_NPC();
    this.state = [new wanderState(), new chaseState(), new usingMoveState(), new deadState()]; //Maybe: harder game -> add dodgeState
    this.currState = 0;

    // Note: center located at middle of sprites
    this.movementSprites = [loadImage("sprites/Broly/movement/standing.png"), loadImage("sprites/Broly/movement/leftAndRight.png"),
    loadImage("sprites/Broly/movement/ascending.png"), loadImage("sprites/Broly/movement/descending.png")];
    this.curMovementState = 0;
    this.lastLookedLeft = true; // Tells me wether to scale(-1,1) the sprite

    
    this.chargingKiSprites = [loadImage("sprites/Broly/chargeKi/chargeKi0.png"), loadImage("sprites/Broly/chargeKi/chargeKi1.png"),
    loadImage("sprites/Broly/chargeKi/chargeKi2.png")];
    this.curChargingKiState = 0;
    this.chargeKiFrameCount = -1;
    this.chargingAmount = -1;
    
    this.kiBlastsSprites = [loadImage("sprites/Broly/kiBlast/shootKi0.png")];
    this.curKiBlastsState = 0;
    this.kiBlastsFrameCount = -1;
    this.kiBlastingAmount = -1;
    
    this.meleeSprites = [loadImage("sprites/Broly/melee/kickMelee0.png"), loadImage("sprites/Broly/melee/kickMelee1.png")];
    this.curMeleeState = 0;
    this.meleeFrameCount = -1;
    this.meleeDone = false;
    
    this.specialMoveSprites = [loadImage("sprites/Broly/special/special0.png"), loadImage("sprites/Broly/special/special1.png"),
    loadImage("sprites/Broly/special/special2.png"), loadImage("sprites/Broly/special/special3.png")];
    this.curSpecialMoveState = 0;
    this.specialMoveFrameCount = -1;


    this.curCharacterState = CharacterState.MOVEMENT;

    this.kiBlasts = []; // Broly has 40 kiBlastObjs
    this.shootKiBlastsFrameCount = -1;
    this.nextKiBlastIndex = 0;
    for(var i = 0; i < 40; i++){
        this.kiBlasts.push(new kiBlastObj(0, 0, "broly"));
    }

    this.specialKiExplosion = new kiExplosionObj(0, 0);

    this.health = 150; // if gets hit by a special = -30, ki blasts = -5, melee = -10
    this.ki = 150; // 8 ki per ki blast, 100 ki per special
    this.hitBox = 50;
    this.curFrameCount = 0;

    // Note: center located at top left corner of sprites
    this.powerUpSprites = [loadImage("sprites/Broly/powerUpInstrScreen/powerUp0.PNG"), 
    loadImage("sprites/Broly/powerUpInstrScreen/powerUp1.PNG"), loadImage("sprites/Broly/powerUpInstrScreen/powerUp2.PNG"),
    loadImage("sprites/Broly/powerUpInstrScreen/powerUp3.PNG"), loadImage("sprites/Broly/powerUpInstrScreen/powerUp4.PNG"),
    loadImage("sprites/Broly/powerUpInstrScreen/powerUp5.PNG"), loadImage("sprites/Broly/powerUpInstrScreen/powerUp6.PNG"),
    loadImage("sprites/Broly/powerUpInstrScreen/powerUp7.PNG"), loadImage("sprites/Broly/powerUpInstrScreen/powerUp8.PNG"),
    loadImage("sprites/Broly/powerUpInstrScreen/powerUp9.PNG"), loadImage("sprites/Broly/powerUpInstrScreen/powerUp10.PNG"),
    loadImage("sprites/Broly/powerUpInstrScreen/powerUp11.PNG"), loadImage("sprites/Broly/powerUpInstrScreen/powerUp12.PNG"),
    loadImage("sprites/Broly/powerUpInstrScreen/powerUp13.PNG")];
    this.powerUpFrameCount = 0;
    this.curPowerUpState = 0;
    this.donePoweringUp = false;

    this.faceImg = loadImage("sprites/Broly/brolyFace.png");
};

var menuObj = function(x, y){
    this.position = new PVector(x, y);
    this.curSelectPos = new PVector(-1, -1);
    this.curMenuSelection = "none";
};

var monteCarlo = function(n1, n2, opposite) {
    if(n1 == n2){ return(n1); }

    var v1 = random(n1, n2);
    var v2 = random(n1, n2);
    if(opposite === false){
        while (v2 > v1) {
            v1 = random(n1, n2);
            v2 = random(n1, n2);
        }
    }
    else{
        while (v2 < v1) {
            v1 = random(n1, n2);
            v2 = random(n1, n2);
        }
    }
    return(v1);
};

var waterParticleObj = function(x, y) {
    this.position = new PVector(x, y);
    this.velocity = new PVector(random(-0.03, 0.03), random(0.5, 1));
    this.size = random(1, 2);
    this.position.y -= (18 - this.size);
    this.c1 = monteCarlo(150, 255, false);
    this.timeLeft = 255;
};

var chatBoxObj = function(x, y){
    this.position = new PVector(x, y);
    this.chatBoxFrameCount = 0;
    this.points = []; // temp variable for new subdivided points
    this.box = [new PVector(-46, -58), new PVector(-66, -41), new PVector(-67, 23), new PVector(-53, 37),
        new PVector(7, 39),new PVector(23, 22),new PVector(40, 35),new PVector(64, 28),new PVector(46, 22),
        new PVector(28, 6), new PVector(27, -45), new PVector(2, -64)];
    this.on = true;
}

var gameTitleObj = function(x, y){
    this.position = new PVector(x, y);
    this.curFrameCount = 0;
    this.xdist = 0;
    this.increasing = true;
    this.explosionParticles = [];
}

var explosionParticleObj = function(x, y) {
    this.position = new PVector(x, y);
    this.velocity = new PVector(random(0, TWO_PI), random(-0.5, 0.5));
    this.size = random(1, 10);
    this.c1 = random(200, 255);
    this.c2 = random(0, 255);
    this.timeLeft = 120;
};

var flyingGohanObj = function(x, y){
    // Note: center located at middle of sprite
    this.position = new PVector(x, y);
    this.origPosition = new PVector(x, y);
    this.sprite = loadImage("sprites/superGohan.png");
};

// **************************** State Changes/executions **********************************

wanderState.prototype.execute = function(me, enemy){
    me.prevPosition.x = me.position.x;
    me.prevPosition.y = me.position.y;
    
    // grabs the distance required to step towards the goal location
    this.step.set(cos(this.wanderAngle), sin(this.wanderAngle));
    this.step.normalize();

    me.position.add(this.step);
    // go towards goal location with some side wandering
    //this.wanderAngle += random(-10 * one_degree, 10 * one_degree);
    
    this.wanderDist--;
    if (this.wanderDist < 0) { // chose another direction to go towards too
        this.wanderDist = random(50, 100);
        this.wanderAngle += random(-120 * one_degree, 120 * one_degree);
    }

    // NPC "key presses"
    if(me.position.x - me.prevPosition.x > 0){
        me.keyArray_NPC[68] = 1; // D
    }
    if(me.position.x - me.prevPosition.x < 0){
        me.keyArray_NPC[65] = 1; // A
    }
    if(me.position.y - me.prevPosition.y < 0){
        me.keyArray_NPC[87] = 1; // W
    }
    if(me.position.y - me.prevPosition.y > 0){
        me.keyArray_NPC[83] = 1; // S
    }
    
    // NPC wants to get closer to user
    if(dist(enemy.position.x, enemy.position.y, me.position.x, me.position.y) > 100){
        me.currState = 1;
    }

    // NPC wants to use move?
    var distance = dist(me.position.x, me.position.y, enemy.position.x, enemy.position.y);
    if(distance < me.specialKiExplosion.maxExplosionSize - enemy.hitBox - 170 &&
         me.ki >= 100 && random(0, 1000) < 10){ // special 1% chance
        me.currState = 2;
        me.keyArray_NPC[82] = 1; // R
    }
    if(distance < enemy.hitBox && random(0, 1000) < 10){ // melee kick 1% chance
        me.currState = 2;
        me.keyArray_NPC[69] = 1; // E
    }
    if(me.ki < 110 && random(0, 1000) < 15){ // charge ki 1.5% chance
        me.currState = 2;
        me.keyArray_NPC[88] = 1; // X
    }
    if(me.ki >= 8 && random(0, 1000) < 10){ // ki blast 1% chance 
        me.currState = 2;
        me.keyArray_NPC[67] = 1; // C
    }

    //if(me.health <= 0){
        //me.currState = 3;
    //}
};

chaseState.prototype.execute = function(me, enemy){
    me.prevPosition.x = me.position.x;
    me.prevPosition.y = me.position.y;

    //text(str(this.step.x), 200, 200);
    if (dist(enemy.position.x, enemy.position.y, me.position.x, me.position.y) > 30) {
        this.curFrameCount = frameCount;
        this.step.x = enemy.position.x - me.position.x;
        this.step.y = enemy.position.y - me.position.y;
        this.step.normalize();
        me.position.add(this.step);
    }
    else {
        if(frameCount - this.curFrameCount > 30){
            me.currState = 0;
        }
    }

    // NPC "key presses"
    if(me.position.x - me.prevPosition.x > 0){
        me.keyArray_NPC[68] = 1; // D
    }
    if(me.position.x - me.prevPosition.x < 0){
        me.keyArray_NPC[65] = 1; // A
    }
    if(me.position.y - me.prevPosition.y < 0){
        me.keyArray_NPC[87] = 1; // W
    }
    if(me.position.y - me.prevPosition.y > 0){
        me.keyArray_NPC[83] = 1; // S
    }

    // NPC wants to use move?
    var distance = dist(me.position.x, me.position.y, enemy.position.x, enemy.position.y);
    if(distance < me.specialKiExplosion.maxExplosionSize - enemy.hitBox - 170 &&
         me.ki >= 100 && random(0, 1000) < 10){ // special 1% chance
        me.currState = 2;
        me.keyArray_NPC[82] = 1; // R
    }
    if(distance < enemy.hitBox && random(0, 1000) < 10){ // melee kick 1% chance
        me.currState = 2;
        me.keyArray_NPC[69] = 1; // E
    }
    if(me.ki < 110 && random(0, 1000) < 15){ // charge ki 1.5% chance
        me.currState = 2;
        me.keyArray_NPC[88] = 1; // X
    }
    if(me.ki >= 8 && random(0, 1000) < 10){ // ki blast 1% chance 
        me.currState = 2;
        me.keyArray_NPC[67] = 1; // C
    }

    //if(me.health <= 0){
        //me.currState = 3;
    //}
};

usingMoveState.prototype.execute = function(me, enemy){
    if(me.curCharacterState === CharacterState.MOVEMENT){
        me.currState = 0;
    }
    //if(me.health <= 0){
        //me.currState = 3;
    //}
}

deadState.prototype.execute = function(me, enemy){ 
}; // Once stuck in this state, the object me can never leave

// ********************************** Object Drawings **************************************

waterParticleObj.prototype.draw = function() {
    noStroke();
    fill(this.c1, this.c1, this.c1, this.timeLeft);
    ellipse(this.position.x, this.position.y, this.size, this.size*2);
};

chatBoxObj.prototype.draw = function(){
    pushMatrix();
    translate(this.position.x, this.position.y);
    
    stroke(0, 0, 0);
    strokeWeight(1);
    fill(250, 250, 250, 200);
    beginShape(); // chat box
    for(var i = 0; i < this.box.length; i++){
        vertex(this.box[i].x, this.box[i].y);
    }
    vertex(this.box[0].x, this.box[0].y);
    endShape();
    noStroke();

    popMatrix();
};

menuObj.prototype.draw = function(){
    if(mouseX >= this.position.x && mouseX <= this.position.x + 100 &&
       mouseY >= this.position.y && mouseY <= this.position.y+ 60 && userClickedPlay === false){

        this.curSelectPos.x = this.position.x + 15;
        fill(255, 255, 255);
        if(mouseY < this.position.y + 30){
        this.curMenuSelection = "play";
        this.curSelectPos.y = this.position.y + 16;
        textSize(13); 
        text("Play", this.position.x + 31, this.position.y + 20);
        textSize(12); 
        text("Instructions", this.position.x + 31, this.position.y + 45);
        }
        else{
            this.curMenuSelection = "instructions";
            this.curSelectPos.y = this.position.y + 40;
            textSize(12); 
            text("Play", this.position.x + 31, this.position.y + 20);
            textSize(13); 
            text("Instructions", this.position.x + 31, this.position.y + 45);
        }
        
        fill(240, 135, 8); // draw 1 star dragonball
        ellipse(this.curSelectPos.x, this.curSelectPos.y, 20, 20);
        fill(230, 7, 7);
        pushMatrix()
        translate(this.curSelectPos.x, this.curSelectPos.y);
        beginShape();
        vertex(0, -6);
        vertex(1, -2);
        vertex(6, -1);
        vertex(2, 1);
        vertex(3, 5);
        vertex(0, 3);
        vertex(-3, 5);
        vertex(-2, 1);
        vertex(-6, -1);
        vertex(-1, -2);
        endShape(CLOSE);
        popMatrix();
    }
    else{
        this.curMenuSelection = "none";
        fill(255, 255, 255);
        textSize(12); 
        text("Play", this.position.x + 31, this.position.y + 20);
        text("Instructions", this.position.x + 31, this.position.y + 45);
    }
};

gameTitleObj.prototype.draw = function(){
    fill(26, 103, 235);
    textSize(30 + this.xdist/8);
    text("Gogeta", this.position.x - this.xdist - 5, this.position.y);
    fill(0, 0, 0);
    textSize(40);
    text("V", this.position.x + 100, this.position.y);
    fill(39, 235, 29);
    textSize(30 + this.xdist/8);
    text("Broly", this.position.x + 130 + this.xdist, this.position.y);
    
    for (var i=0; i < this.explosionParticles.length; i++) {
        if (this.explosionParticles[i].timeLeft > 0) {
            this.explosionParticles[i].draw();
            this.explosionParticles[i].move();
        }
        else {
            this.explosionParticles.splice(i, 1);
        }
    }
    
    // moving title back and forth with explosion
    if(frameCount - this.curFrameCount > 1){
        this.curFrameCount = frameCount;
        if(this.increasing){
            this.xdist++;
        }
        else{
            this.xdist--;
        }
        
        if(this.xdist === 0){
            for (var i=0; i<800; i++) {
                this.explosionParticles.push(new explosionParticleObj(this.position.x + 113, this.position.y - 17));
            }
        }
    }
    if(this.xdist > 100 && this.increasing){
        this.xdist--;
        this.increasing = false;
    }
    if(this.xdist < 0 && !this.increasing){
        this.xdist++;
        this.increasing = true;
    }
};

explosionParticleObj.prototype.draw = function() {
    noStroke();
    fill(0, this.c2, this.c1,  this.timeLeft);
    ellipse(this.position.x, this.position.y, this.size, this.size);
};

flyingGohanObj.prototype.draw = function (){
    image(this.sprite, this.position.x - 15, this.position.y - 25);
    this.position.x--;
    if(this.position.x < -100){
        this.position.x = this.origPosition.x;
    }
};

gogetaObj.prototype.drawPowerUp = function(){
    pushMatrix();
    translate(this.position.x, this.position.y);
    if(this.curPowerUpState >= this.powerUpSprites.length){
        image(this.powerUpSprites[this.powerUpSprites.length - 1], 2, 2);
    }
    else if(this.curPowerUpState == 1){
        image(this.powerUpSprites[1], 0, 3);
    }
    else if(this.curPowerUpState == 2 || this.curPowerUpState == 5){
        image(this.powerUpSprites[this.curPowerUpState], -25, -26);
    }
    else if(this.curPowerUpState == 3){
        image(this.powerUpSprites[3], -22, 0);
    }
    else if(this.curPowerUpState == 4){
        image(this.powerUpSprites[4], -30, -19);
    }
    else if(this.curPowerUpState == 6){
        image(this.powerUpSprites[6], -43, -42);
    }
    else if(this.curPowerUpState == 7){
        image(this.powerUpSprites[7], 3, -7);
    }
    else{
        image(this.powerUpSprites[this.curPowerUpState], 0, 0);
    }
    popMatrix();
 };

 brolyObj.prototype.drawPowerUp = function(){
    
    pushMatrix();
    translate(this.position.x, this.position.y);
    if(this.curPowerUpState == 0){
        image(this.powerUpSprites[0], 0, 0);
    }
    else if(this.curPowerUpState == 1 || this.curPowerUpState == 2){
        image(this.powerUpSprites[this.curPowerUpState], -10, 0);
    }
    else if(this.curPowerUpState == 3) {
        image(this.powerUpSprites[3], -13, -7);
    }
    else if(this.curPowerUpState == 4) {
        image(this.powerUpSprites[4], -30, -12);
    } 
    else if(this.curPowerUpState == 5) {
        image(this.powerUpSprites[5], -30, -25);
    }
    else if(this.curPowerUpState == 6) {
        image(this.powerUpSprites[6], -28, -35);
    }
    else if(this.curPowerUpState == 7) {
        image(this.powerUpSprites[7], -31, -32);
    }
    else if(this.curPowerUpState == 8) {
        image(this.powerUpSprites[8], -52, -50);
    }
    else if(this.curPowerUpState == 9 || this.curPowerUpState == 10) {
        image(this.powerUpSprites[this.curPowerUpState], -64, -56);
    } 
    else if(this.curPowerUpState == 11) {
        image(this.powerUpSprites[11], -41, -36);
    } 
    else if(this.curPowerUpState == 12) {
        image(this.powerUpSprites[12], -50, -36);
    } 
    else if(this.curPowerUpState == 13) {
        image(this.powerUpSprites[13], -13, -12);
    }
    popMatrix();
 };

 gogetaObj.prototype.draw = function(){
    pushMatrix();
    translate(this.position.x, this.position.y);
    if(this.lastLookedLeft === true){
        scale(-1,1);
    }

    switch(this.curCharacterState){
        case CharacterState.MOVEMENT:
            if(this.curMovementState === 0){
                image(this.movementSprites[0], -17, -35);
            }
            else if(this.curMovementState === 1){
                image(this.movementSprites[1], -32, -24);
            }
            else if(this.curMovementState === 2){
                image(this.movementSprites[2], -23, -32);
            }
            else if(this.curMovementState === 3){
                image(this.movementSprites[3], -17, -32);
            }
            break;

        case CharacterState.CHARGING_KI:
            if(this.curChargingKiState === 0){
                image(this.chargingKiSprites[0], -52, -33);
            }
            else if(this.curChargingKiState === 1){
                image(this.chargingKiSprites[1], -46, -66);
            }
            else if(this.curChargingKiState === 2){
                image(this.chargingKiSprites[2], -52, -68);
            }
            break;

        case CharacterState.KI_BLASTS:
            if(this.curKiBlastsState === 0){
                image(this.kiBlastsSprites[0], -16 , -33);
            }
            else if(this.curKiBlastsState === 1){
                image(this.kiBlastsSprites[1], -21, -33);
            }
            else if(this.curKiBlastsState === 2){
                image(this.kiBlastsSprites[2], -19, -32);
            }
            else if(this.curKiBlastsState === 3){
                image(this.kiBlastsSprites[3], -14, -33);
            }
            break;

        case CharacterState.MELEE:
            if(this.curMeleeState === 0){
                image(this.meleeSprites[0], -22, -25);
            }
            else if(this.curMeleeState === 1){
                image(this.meleeSprites[1], -19, -28);
            }
            break;

        case CharacterState.SPECIAL:
            if(this.curSpecialMoveState === 0){
                image(this.specialMoveSprites[0], -38, -30);
            }
            else if(this.curSpecialMoveState === 1){
                image(this.specialMoveSprites[1], -36, -30);
            }
            else if(this.curSpecialMoveState === 2){
                image(this.specialMoveSprites[2], -34, -29);
            }
            else if(this.curSpecialMoveState === 3){
                image(this.specialMoveSprites[3], -25, -30);
            }
            break;
    }
    /*
    fill(0, 0, 255); // for center of Gogeta object
    ellipse(0, 0, 3, 3);
    stroke(0, 0, 255);
    strokeWeight(1);
    noFill();
    ellipse(0, 0, 33, 33);
    noStroke();
    */
    popMatrix();
 };

 brolyObj.prototype.draw = function(){
    pushMatrix();
    translate(this.position.x, this.position.y);
    if(this.lastLookedLeft === true){
        scale(-1,1);
    }

    switch(this.curCharacterState){
        case CharacterState.MOVEMENT:
            if(this.curMovementState === 0){
                image(this.movementSprites[0], -26, -40);
            }
            else if(this.curMovementState === 1){
                image(this.movementSprites[1], -33, -33);
            }
            else if(this.curMovementState === 2){
                image(this.movementSprites[2], -30, -42);
            }
            else if(this.curMovementState === 3){
                image(this.movementSprites[3], -42, -45);
            }
            break;

        case CharacterState.CHARGING_KI:
            if(this.curChargingKiState === 0){
                image(this.chargingKiSprites[0], -67, -56);
            }
            else if(this.curChargingKiState === 1){
                image(this.chargingKiSprites[1], -77, -78);
            }
            else if(this.curChargingKiState === 2){
                image(this.chargingKiSprites[2], -73, -74);
            }
            break;

        case CharacterState.KI_BLASTS:
            if(this.curKiBlastsState === 0){
                image(this.kiBlastsSprites[0], -32, -41);
            }  
            break;

        case CharacterState.MELEE:
            if(this.curMeleeState === 0){
                image(this.meleeSprites[0], -32, -38);
            }
            else if(this.curMeleeState === 1){
                image(this.meleeSprites[1], -18, -36);
            }
            break;

        case CharacterState.SPECIAL:
            if(this.curSpecialMoveState === 0){
                image(this.specialMoveSprites[0], -26, -31);
            }
            else if(this.curSpecialMoveState === 1){
                image(this.specialMoveSprites[1], -25, -35);
            }
            else if(this.curSpecialMoveState === 2){
                image(this.specialMoveSprites[2], -24, -37);
            }
            else if(this.curSpecialMoveState === 3){
                image(this.specialMoveSprites[3], -58, -64);
            }
            break;
    }

    /*
    fill(255, 0, 0);
    ellipse(0, 0, 3, 3);

    stroke(255, 0, 0);
    strokeWeight(1);
    noFill();
    ellipse(0, 0, 50, 50);
    noStroke();
    */
    popMatrix();
 };

 kiBlastObj.prototype.draw = function(){
    switch(this.owner){
        case "gogeta":
            stroke(10, 80, 194);
            strokeWeight(1);
            fill(30, 161, 209);
            break;
        case "broly":
            stroke(19, 189, 10);
            strokeWeight(1);
            fill(39, 235, 29);
            break;
    }
    ellipse(this.position.x, this.position.y, this.size, this.size);
    noStroke();
    fill(255, 255, 255, 30);
    ellipse(this.position.x, this.position.y, this.size - 4, this.size - 4);
    fill(255, 255, 255, 80);
    ellipse(this.position.x, this.position.y, this.size - 8, this.size - 8);
 };

kamehamehaObj.prototype.draw = function(){
    // Leftover from kamehameha
    var dist = this.origPosition.dist(this.position);
    pushMatrix();
    translate(this.origPosition.x, this.origPosition.y);
    rotate(this.angle);
    fill(30, 161, 209);
    rect(0, - 8, dist, 20);
    fill(255, 255, 255, 100);
    rect(0, -2, dist, 6);
    popMatrix();

    stroke(10, 80, 194);// Origin circle/blast in  kamehameha
    strokeWeight(1);
    fill(30, 161, 209); 
    ellipse(this.origPosition.x, this.origPosition.y, 50, 50);
    noStroke();
    fill(255, 255, 255, 30);
    ellipse(this.origPosition.x, this.origPosition.y, 40, 40);
    fill(255, 255, 255, 100);
    ellipse(this.origPosition.x, this.origPosition.y, 25, 25);

    stroke(10, 80, 194); // Moving circular blast in kamehameha --> inflicts dmg on collision
    strokeWeight(1);
    fill(30, 161, 209); 
    ellipse(this.position.x, this.position.y, this.damageSize, this.damageSize);
    noStroke();
    fill(255, 255, 255, 30);
    ellipse(this.position.x, this.position.y, this.damageSize - 10, this.damageSize - 10);
    fill(255, 255, 255, 100);
    ellipse(this.position.x, this.position.y, this.damageSize - 15, this.damageSize - 15);
};

kiExplosionObj.prototype.draw = function(){
    fill(39, 235, 29, 120);
    ellipse(this.position.x, this.position.y, this.explosionSize, this.explosionSize);
};

//*********************************** Object Movements *************************************

waterParticleObj.prototype.move = function() {
    this.position.add(this.velocity);
    this.timeLeft--;
};

explosionParticleObj.prototype.move = function() {
    var v = new PVector(this.velocity.y*cos(this.velocity.x), this.velocity.y*sin(this.velocity.x));
    this.position.add(v);	
    this.timeLeft--;
};

brolyObj.prototype.resetKeyArray_NPC = function(){
    this.keyArray_NPC[65] = 0; // A
    this.keyArray_NPC[67] = 0; // C
    this.keyArray_NPC[68] = 0; // D
    this.keyArray_NPC[69] = 0; // E
    this.keyArray_NPC[82] = 0; // R
    this.keyArray_NPC[83] = 0; // S
    this.keyArray_NPC[87] = 0; // W
    this.keyArray_NPC[88] = 0; // X
};

kiBlastObj.prototype.update = function(){
    this.position.add(this.velocity);
    
    if (this.position.y < -20 || this.position.y > 420 || 
        this.position.x < -20 || this.position.x > 520) {
        this.fire = false;
    }
};

kamehamehaObj.prototype.update = function(){
    this.position.add(this.velocity);
    
    if (this.position.y < -20 || this.position.y > 420 || 
        this.position.x < -20 || this.position.x > 520) {
        this.fire = false;
    }
};

kiExplosionObj.prototype.update = function(){

    if(this.explosionSize + 2 <= this.maxExplosionSize && frameCount - this.curFrameCount > 1){
        this.curFrameCount = frameCount;
        this.explosionSize += 2;
    }

    if(this.explosionSize + 2 > this.maxExplosionSize && frameCount - this.curFrameCount > 100){
        this.fire = false;
    }
};

/** Using ASCII Code for the keyArray[*]  below
 */
gogetaObj.prototype.update = function(enemy){
    this.prevPosition.x = this.position.x;
    this.prevPosition.y = this.position.y;
    // 1) Update States based on keyboard presses
    if(keyArray[88] === 1){ // charge ki -> 'X'
        if(this.curCharacterState !== CharacterState.CHARGING_KI){ // if(NOT holding down key)
            this.curCharacterState = CharacterState.CHARGING_KI;
            this.curChargingKiState = 0;
            this.chargeKiFrameCount = frameCount;   
        }
    }
    else if(keyArray[82] === 1){ // special move attack -> 'R' && enough ki
        if(this.curCharacterState !== CharacterState.SPECIAL && this.ki - 80 >= 0){
            this.curCharacterState = CharacterState.SPECIAL;
            this.curSpecialMoveState = 0;
            this.specialMoveFrameCount = frameCount;
        }
    }
    else if(keyArray[67] === 1 && this.ki - 8 >= 0){ // shoot ki blasts -> 'C' && enough ki
        if(this.curCharacterState !== CharacterState.KI_BLASTS){
            this.curCharacterState = CharacterState.KI_BLASTS;
            this.curKiBlastsState = 0;
            this.kiBlastsFrameCount = frameCount;
            this.shootKiBlast(enemy); 
            this.ki -= 8;
        }
    }
    else{
        if(keyArray[68] === 1 && keyArray[65] === 0){ // right -> 'D'
            this.lastLookedLeft = false;
            this.curCharacterState = CharacterState.MOVEMENT;
            this.curMovementState = 1;
            this.position.x += 2;
        }
        else if(keyArray[65] === 1 && keyArray[68] === 0){ // left -> 'A'
            this.lastLookedLeft = true;
            this.curCharacterState = CharacterState.MOVEMENT;
            this.curMovementState = 1;
            this.position.x -= 2;
        }
        else{
            this.curCharacterState = CharacterState.MOVEMENT;
            this.curMovementState = 0;
        }
        
        if(keyArray[87] === 1 && keyArray[83] === 0){ // up -> 'W'
            this.curCharacterState = CharacterState.MOVEMENT;
            this.curMovementState = 2;
            this.position.y -= 2;
        }
        else if(keyArray[83] === 1 && keyArray[87] === 0){ // down -> 'S'
            this.curCharacterState = CharacterState.MOVEMENT;
            this.curMovementState = 3;
            this.position.y += 2;
        }

        if(keyArray[69] === 1){ // melee attacks -> 'E'
            this.curCharacterState = CharacterState.MELEE;
            if(this.meleeFrameCount === -1){
                this.curMeleeState = 0;
                this.meleeFrameCount = frameCount;
            }
        }  
    }

    if(keyArray[69] === 0){ // Cycle Gogeta's standing still melee attacks
        this.meleeFrameCount = -1;
    }

    // 2) If certain keys have continued to be pressed -> more action sprites
    if(this.curCharacterState === CharacterState.CHARGING_KI && frameCount - this.chargeKiFrameCount > 20){
        if(frameCount - this.chargeKiFrameCount > 30){
            this.chargeKiFrameCount = frameCount - 18;
            if(this.ki + 1 <= 150){
                this.ki++;
            }  
        }
        else if(frameCount - this.chargeKiFrameCount > 25){
            this.curChargingKiState = 2;
            if(this.ki + 1 <= 150){
                this.ki++;
            }
        }
        else if(frameCount - this.chargeKiFrameCount > 20){
            this.curChargingKiState = 1;
            if(this.ki + 1 <= 150){
                this.ki++;
            }
        }
    }
    else if(this.curCharacterState === CharacterState.SPECIAL && this.curSpecialMoveState !== 3){
        if(frameCount - this.specialMoveFrameCount > 45){
            this.curSpecialMoveState = 3;
            this.shootSpecialMove(enemy);
            this.ki -= 80; //Once --> user can hold on to 'R' or let go, wont effect mechanics of special move
        }
        else if(frameCount - this.specialMoveFrameCount > 30){
            this.curSpecialMoveState = 2;
        }
        else if(frameCount - this.specialMoveFrameCount > 15){
            this.curSpecialMoveState = 1;
        }
    }
    else if(this.curCharacterState === CharacterState.KI_BLASTS){
        if(frameCount - this.kiBlastsFrameCount > 60){
            this.curKiBlastsState = 0;
            this.kiBlastsFrameCount = frameCount - 15;
            this.shootKiBlast(enemy);
            this.ki--;
        }
        else if(frameCount - this.kiBlastsFrameCount > 45){
            this.curKiBlastsState = 3;
            this.shootKiBlast(enemy);
            this.ki--;
        }
        else if(frameCount - this.kiBlastsFrameCount > 30){
            this.curKiBlastsState = 2;
            this.shootKiBlast(enemy);
            this.ki--;
        }
        else if(frameCount - this.kiBlastsFrameCount > 15){
            this.curKiBlastsState = 1;
            this.shootKiBlast(enemy);
            this.ki--;
        }
    }
    else if(this.curCharacterState === CharacterState.MELEE){
        if(frameCount - this.meleeFrameCount > 30){
            this.curMeleeState = 0;
            this.meleeFrameCount = frameCount;
        }
        else if(frameCount - this.meleeFrameCount > 15){
            this.curMeleeState = 1;
        }
    }

    /* Maybe: if I want to make game harder-> makes user hold kamehameha
    if(this.curCharacterState !== CharacterState.SPECIAL){
        this.specialKamehameha.fire = false;
    }
    */
};

brolyObj.prototype.update = function(enemy){
    // Note: want to use Broly as a character, remove states, replace keyArray_NPC with keyArray,
    //       and add movement in x and y direction for each key press
    this.state[this.currState].execute(this, enemy);

    // 1) Update States based on keyboard presses
    if(this.curCharacterState === CharacterState.SPECIAL){ // In motion of special move attack
        if(this.curSpecialMoveState === 3 && this.specialKiExplosion.fire === false){
            this.curCharacterState = CharacterState.MOVEMENT;
            this.curMovementState = 0;
        } 
    }
    else if(this.keyArray_NPC[82] === 1){ // special move attack -> 'R' && enough ki
        if(this.ki - 100 >= 0){
            this.curCharacterState = CharacterState.SPECIAL;
            this.curSpecialMoveState = 0;
            this.specialMoveFrameCount = frameCount;
        }
    }

    else if(this.curCharacterState === CharacterState.MELEE){
        if(this.meleeDone === true){
            this.curCharacterState = CharacterState.MOVEMENT;
            this.curMovementState = 0;
        }
    }
    else if(this.keyArray_NPC[69] === 1) { // melee attacks -> 'E'
        this.curCharacterState = CharacterState.MELEE;
        this.curMeleeState = 0;
        this.meleeFrameCount = frameCount;
        this.meleeDone = false;
    } 

    else if(this.curCharacterState === CharacterState.CHARGING_KI){
        if(this.chargingAmount <= 0){
            this.curCharacterState = CharacterState.MOVEMENT;
            this.curMovementState = 0;
        }
    }
    else if(this.keyArray_NPC[88] === 1){ // charge ki -> 'X'
        this.curCharacterState = CharacterState.CHARGING_KI;
        this.curChargingKiState = 0;
        this.chargeKiFrameCount = frameCount;   
        this.chargingAmount = monteCarlo(0, 150 - this.ki, false);
    }

    else if(this.curCharacterState === CharacterState.KI_BLASTS){
        if(this.kiBlastingAmount <= 0){
            this.curCharacterState = CharacterState.MOVEMENT;
            this.curMovementState = 0;
        }
        else{
            if(frameCount - this.kiBlastsFrameCount > 15){
                this.kiBlastsFrameCount = frameCount; 
                this.shootKiBlast(enemy); 
                this.ki -= 8;
                this.kiBlastingAmount--;
            }
        }
    }
    else if(this.keyArray_NPC[67] === 1 && this.ki - 8 >= 0){ // shoot ki blasts -> 'C' && enough ki
        this.curCharacterState = CharacterState.KI_BLASTS;
        this.curKiBlastsState = 0;
        this.kiBlastsFrameCount = frameCount;
        this.kiBlastingAmount = monteCarlo(1, Math.floor(this.ki / 8), true);

        this.shootKiBlast(enemy); 
        this.ki -= 8;
        this.kiBlastingAmount--;
    }

    else{
        if(this.keyArray_NPC[68] === 1 && this.keyArray_NPC[65] === 0){ // right -> 'D'
            this.lastLookedLeft = false;
            this.curCharacterState = CharacterState.MOVEMENT;
            this.curMovementState = 1;
        }
        else if(this.keyArray_NPC[65] === 1 && this.keyArray_NPC[68] === 0){ // left -> 'A'
            this.lastLookedLeft = true;
            this.curCharacterState = CharacterState.MOVEMENT;
            this.curMovementState = 1;
        }
        else{
            this.curCharacterState = CharacterState.MOVEMENT;
            this.curMovementState = 0;
        }
        
        if(this.keyArray_NPC[87] === 1 && this.keyArray_NPC[83] === 0){ // up -> 'W'
            this.curCharacterState = CharacterState.MOVEMENT;
            this.curMovementState = 2;
        }
        else if(this.keyArray_NPC[83] === 1 && this.keyArray_NPC[87] === 0){ // down -> 'S'
            this.curCharacterState = CharacterState.MOVEMENT;
            this.curMovementState = 3;
        }
    }

    // 2) If certain keys have continued to be pressed -> more action sprites
    if(this.curCharacterState === CharacterState.CHARGING_KI && frameCount - this.chargeKiFrameCount > 20){
        if(frameCount - this.chargeKiFrameCount > 30){
            this.chargeKiFrameCount = frameCount - 18;
            if(this.ki + 1 <= 150){
                this.ki++;
                this.chargingAmount--;
            }  
        }
        else if(frameCount - this.chargeKiFrameCount > 25){
            this.curChargingKiState = 2;
            if(this.ki + 1 <= 150){
                this.ki++;
                this.chargingAmount--;
            }
        }
        else if(frameCount - this.chargeKiFrameCount > 20){
            this.curChargingKiState = 1;
            if(this.ki + 1 <= 150){
                this.ki++;
                this.chargingAmount--;
            }
        }
    }
    else if(this.curCharacterState === CharacterState.SPECIAL && this.curSpecialMoveState !== 3){
        if(frameCount - this.specialMoveFrameCount > 45){
            this.curSpecialMoveState = 3;
            this.shootSpecialMove(enemy);
            this.ki -= 100;
        }
        else if(frameCount - this.specialMoveFrameCount > 30){
            this.curSpecialMoveState = 2;
        }
        else if(frameCount - this.specialMoveFrameCount > 15){
            this.curSpecialMoveState = 1;
        }
    }
    else if(this.curCharacterState === CharacterState.MELEE && this.meleeDone === false){
        if(frameCount - this.meleeFrameCount > 30){
            this.meleeDone = true;
        }
        else if(frameCount - this.meleeFrameCount > 15){
            this.curMeleeState = 1;
        }
    }
};

gogetaObj.prototype.shootKiBlast = function(enemy){

    if(this.nextKiBlastIndex >= this.kiBlasts.length){
        this.nextKiBlastIndex = 0;
    } 

    if(this.ki - 5 >= 0 && (frameCount - this.shootKiBlastsFrameCount) > 20){

        var offset;
        if(!this.lastLookedLeft){
            offset = 20;
        }
        else{
            offset = -20;
        }

        this.shootKiBlastsFrameCount = frameCount;
        this.kiBlasts[this.nextKiBlastIndex].fire = true;
        this.kiBlasts[this.nextKiBlastIndex].position.x = this.position.x + offset;
        this.kiBlasts[this.nextKiBlastIndex].position.y = this.position.y - 3;
        this.kiBlasts[this.nextKiBlastIndex].velocity.x = enemy.position.x - this.kiBlasts[this.nextKiBlastIndex].position.x;
        this.kiBlasts[this.nextKiBlastIndex].velocity.y = enemy.position.y - this.kiBlasts[this.nextKiBlastIndex].position.y;
        this.kiBlasts[this.nextKiBlastIndex].velocity.normalize();
        this.kiBlasts[this.nextKiBlastIndex].velocity.mult(4);
        this.nextKiBlastIndex++;
    } 
};

brolyObj.prototype.shootKiBlast = function(enemy){
    if(this.nextKiBlastIndex >= this.kiBlasts.length){
        this.nextKiBlastIndex = 0;
    } 

    if(this.ki - 5 >= 0 && (frameCount - this.shootKiBlastsFrameCount) > 20){

        var offset;
        if(!this.lastLookedLeft){
            offset = 34;
        }
        else{
            offset = -34;
        }

        this.shootKiBlastsFrameCount = frameCount;
        this.kiBlasts[this.nextKiBlastIndex].fire = true;
        this.kiBlasts[this.nextKiBlastIndex].position.x = this.position.x + offset;
        this.kiBlasts[this.nextKiBlastIndex].position.y = this.position.y - 5;
        this.kiBlasts[this.nextKiBlastIndex].velocity.x = enemy.position.x - this.kiBlasts[this.nextKiBlastIndex].position.x;
        this.kiBlasts[this.nextKiBlastIndex].velocity.y = enemy.position.y - this.kiBlasts[this.nextKiBlastIndex].position.y;
        this.kiBlasts[this.nextKiBlastIndex].velocity.normalize();
        this.kiBlasts[this.nextKiBlastIndex].velocity.mult(4);
        this.nextKiBlastIndex++;
    } 
};

gogetaObj.prototype.shootSpecialMove = function(enemy){
    if(this.ki - 80 >= 0){
        
        var offset;
        if(!this.lastLookedLeft){
            offset = 37;
        }
        else{
            offset = -37;
        }

        this.specialKamehameha.fire = true;
        this.specialKamehameha.position.x = this.position.x + offset;
        this.specialKamehameha.position.y = this.position.y;
        this.specialKamehameha.origPosition.x = this.position.x + offset;
        this.specialKamehameha.origPosition.y = this.position.y;
        this.specialKamehameha.velocity.x = enemy.position.x - this.specialKamehameha.position.x;
        this.specialKamehameha.velocity.y = enemy.position.y - this.specialKamehameha.position.y;
        this.specialKamehameha.velocity.normalize();
        this.specialKamehameha.velocity.mult(5);
        
        this.specialKamehameha.dir.set(enemy.position.x - this.specialKamehameha.position.x, 
                                       enemy.position.y - this.specialKamehameha.position.y);
        this.specialKamehameha.angle = this.specialKamehameha.dir.heading();
    }
};

brolyObj.prototype.shootSpecialMove = function(enemy){
    if(this.ki - 100 >= 0){

        this.specialKiExplosion.fire = true;
        this.specialKiExplosion.position.x = this.position.x;
        this.specialKiExplosion.position.y = this.position.y;
        this.specialKiExplosion.explosionSize = this.specialKiExplosion.innerSize;
        this.specialKiExplosion.curFrameCount = frameCount;
    }
};

//*********************************** Check Collisions *************************************
gogetaObj.prototype.checkCollision = function(enemy){
    //0) border
    if (this.position.y < 5 || this.position.y > 395 || 
        this.position.x < 5 || this.position.x > 495) {
        this.position.x = this.prevPosition.x;
        this.position.y = this.prevPosition.y;
    }
    
    // 1) Ki blasts
    for(var i = 0; i < this.kiBlasts.length; i++){
        
        if(this.kiBlasts[i].fire === true){
            var distance = dist(this.kiBlasts[i].position.x, this.kiBlasts[i].position.y,
                                enemy.position.x, enemy.position.y);

            if(frameCount - this.curFrameCount > 20 && distance < enemy.hitBox - 35){
                this.curFrameCount = frameCount;
                enemy.health -= 5;
                this.kiBlasts[i].fire = false;
            }
        }
    }
    // 2) gogeta special
    if(this.specialKamehameha.fire === true){
        var distance = dist(this.specialKamehameha.position.x, this.specialKamehameha.position.y, 
            enemy.position.x, enemy.position.y);
        
        if(frameCount - this.curFrameCount > 20 && distance < enemy.hitBox - this.specialKamehameha.damageSize - 8){
            this.curFrameCount = frameCount;
            enemy.health -= 30;
            this.specialKamehameha.fire = false;
        }
    }

    // 3) gogeta melee
    if(this.curCharacterState === CharacterState.MELEE){
        var distance = dist(this.position.x, this.position.y, enemy.position.x, enemy.position.y);
        
        if(frameCount - this.curFrameCount > 20 && distance < enemy.hitBox){
            this.curFrameCount = frameCount;
            enemy.health -=3;
        }
    }
    
    //Maybe: Knockdown(fall to ground level ~x=350)/Interrupt
    //Ex: Interrupt gogeta special if lost > 10 health, knockdown getting broly kicked,
    //    hit with special -> knockdown
};

brolyObj.prototype.checkCollision = function(enemy){
    // 0)border 
    if (this.position.y < 5 || this.position.y > 395 || 
        this.position.x < 5 || this.position.x > 495) {
        this.position.x = this.prevPosition.x;
        this.position.y = this.prevPosition.y;
    }

    // 1) ki blasts
    for(var i = 0; i < this.kiBlasts.length; i++){
        
        if(this.kiBlasts[i].fire === true){
            var distance = dist(this.kiBlasts[i].position.x, this.kiBlasts[i].position.y,
                                enemy.position.x, enemy.position.y);

            if(frameCount - this.curFrameCount > 20 && distance < enemy.hitBox - 10){
                this.curFrameCount = frameCount;
                enemy.health -= 5;
                this.kiBlasts[i].fire = false;
            }
        }
    }
    // 2) broly special
    if(this.specialKiExplosion.fire === true){
        var distance = dist(this.specialKiExplosion.position.x, this.specialKiExplosion.position.y, 
            enemy.position.x, enemy.position.y);

        if(frameCount - this.curFrameCount > 20 && (distance * 2) < this.specialKiExplosion.explosionSize){
            this.curFrameCount = frameCount;
            enemy.health -= 2;

            if(distance < this.specialKiExplosion.innerSize - enemy.hitBox + 2){
                enemy.health -= 3;
            }
        }
    }
    
    // 3) broly melee
    if(this.curCharacterState === CharacterState.MELEE && this.curMeleeState === 1){
        var distance = dist(this.position.x, this.position.y, enemy.position.x, enemy.position.y);
        
        if(frameCount - this.curFrameCount > 20 && distance < enemy.hitBox){
            this.curFrameCount = frameCount;
            enemy.health -= 30;
        }
    }
    
};

//*********************************** Global Functions*************************************
var mouseClicked = function() {
    switch(curGameState){
        case GameState.START:

            if(menu.curMenuSelection === "play"){
                userClickedPlay = true;
            }
            else if(menu.curMenuSelection === "instructions"){
                curGameState = GameState.INSTR_MENU;
            }
            break;

        case GameState.INSTR_MENU:
            if(menu.curMenuSelection === "back"){
                curGameState = GameState.START;
                Broly.curPowerUpState = 0;
            }
            break;
            
        case GameState.INGAME: break;
            
        case GameState.GAMEOVER:
            // Re-initalize Objects
            waterParticles = [];
            menu = new menuObj(208, 218);
            brolyChatBox = new chatBoxObj(440, 310);
            title = new gameTitleObj(160, 140);
            gohan = new flyingGohanObj(600, 60);
            startScreenBrolyKiBlast = new kiBlastObj(530, 350, "broly");
            subdivide(brolyChatBox, 5, "box");
            Gogeta = new gogetaObj(40, 320);
            Broly = new brolyObj(50, 150);
            initAllKeyBoardValues();

            userClickedPlay = false;
            yourAWinner = false;
            curGameState = GameState.START;
            break;
    }
};

var keyPressed = function() {
    keyArray[keyCode] = 1;
};

var keyReleased = function() {
    keyArray[keyCode] = 0;
};

var initAllKeyBoardValues = function(){
    keyArray[65] = 0; // A
    keyArray[67] = 0; // C
    keyArray[68] = 0; // D
    keyArray[69] = 0; // E
    keyArray[82] = 0; // R
    keyArray[83] = 0; // S
    keyArray[87] = 0; // W
    keyArray[88] = 0; // X
}

var subdivide = function(obj, numOfIter, objPart) {
    var iterations = 0;
    while(iterations < numOfIter){
        
        var p2 = obj.points;
        var points;
        if(objPart === "box"){ points = obj.box; }

        // 1) Split points
        p2.splice(0, p2.length);
        for (var i = 0; i < points.length - 1; i++) {
            p2.push(new PVector(points[i].x, points[i].y));
            p2.push(new PVector((points[i].x+ points[i+1].x)/2, (points[i].y+points[i+1].y)/2));
        }  
        p2.push(new PVector(points[i].x, points[i].y));
        p2.push(new PVector((points[0].x + points[i].x)/2, (points[0].y + points[i].y)/2));
        
        // 2) Average
        for (var i = 0; i < p2.length - 1; i++) {
            var x = (p2[i].x + p2[i+1].x)/2;
            var y = (p2[i].y + p2[i+1].y)/2;
            p2[i].set(x, y);
        } 
        var x = (p2[i].x + points[0].x)/2;
        var y = (p2[i].y + points[0].y)/2;
        points.splice(0, points.length);
        for (i = 0; i < p2.length; i++) {
            points.push(new PVector(p2[i].x, p2[i].y));   
        }
        // re-establish new points to object
        if(objPart === "box"){ obj.box = points; }

        iterations++;
    }
}; 

var drawKiBar = function(x, y, character){
    if(character instanceof gogetaObj){
        fill(30, 161, 209); // Draw ki
        rect(x, y, character.ki, 20);
    }
    else {
        fill(39, 235, 29);
        rect(x + (150 - character.ki), y, character.ki, 20);
    }

    stroke(0, 0 ,0); // Draw border of ki bar
    strokeWeight(2);
    noFill();
    rect(x, y, 150, 20);
    strokeWeight(1);
    noStroke();
 };

var drawHealthBar = function(x, y, character){
    if(character.health > 0){
        fill(227, 9, 9);
        if(character instanceof gogetaObj){
            if(character.health >= 75){
                rect(x, y, 150, 20);   
            }
            else{
                rect(x, y, character.health * 2, 20); 
            }

            if(character.health >= 75){
                fill(14, 128, 4); 
                rect(x, y, (character.health - 75) * 2, 20);
            }
        }
        else{
            if(character.health >= 75){
                rect(x, y, 150, 20);   
            }
            else{
                rect(x + (150 - (character.health * 2)), y, character.health * 2, 20); 
            }

            if(character.health >= 75){
                fill(14, 128, 4); 
                rect(x + (150 - ((character.health - 75) * 2)), y, (character.health - 75) * 2, 20);
            }
        }
    }

    stroke(0, 0 ,0);
    strokeWeight(2);
    noFill();
    rect(x, y, 150, 20);
    strokeWeight(1);
    noStroke();
 };

//****************************** Declare Game Objects/vars *********************************
var menu = new menuObj(208, 218);
var brolyChatBox = new chatBoxObj(440, 310);
var title = new gameTitleObj(160, 140);
var gohan = new flyingGohanObj(600, 60);
var startScreenBrolyKiBlast = new kiBlastObj(530, 350, "broly");
subdivide(brolyChatBox, 5, "box");
Gogeta = new gogetaObj(40, 320);
Broly = new brolyObj(50, 150);
initAllKeyBoardValues();

// ************************************ Game Loop *****************************************
draw = function() {
    switch(curGameState){
        case GameState.START:
            image(startBackground, 0, 0, canvasWidth, canvasHeight); // background
            Gogeta.drawPowerUp();
            noStroke();
            
            // Broly Random Ki Blasts
            startScreenBrolyKiBlast.draw();
            startScreenBrolyKiBlast.update();

            fill(230, 7, 7); // Artist Credits and Author of game
            textSize(13);
            text("Artist Credits:", 10, 20);
            text("Orumaito Obeso, dsp27", 10, 35);
            fill(0, 0, 0);
            textSize(15);
            text("Author:", 395, 20);
            text("Arash Behpour", 395, 35);
            
            fill(255, 255, 255); // Menu
            rect(menu.position.x, menu.position.y, 100, 60);
            fill(22, 112, 4);
            rect(menu.position.x + 1, menu.position.y + 1, 98, 58);

            // Menu Selection
            menu.draw();
             
            // Waterfall on clif
            if (waterParticles.length < 400) { 
                waterParticles.push(new waterParticleObj(random(382,385), 178));
                waterParticles.push(new waterParticleObj(random(382,385), 178)); 
                waterParticles.push(new waterParticleObj(random(382,385), 178));
            }
            for (var i=0; i<waterParticles.length; i++) {
                if ((waterParticles[i].timeLeft > 0) && (waterParticles[i].position.y < 253)) {
                    waterParticles[i].draw();
                    waterParticles[i].move();
                }
                else {
                    waterParticles.splice(i, 1);
                }
            }

            // Title with animation && flying gohan animation
            title.draw();
            gohan.draw();

            // Broly Chat Box
            if(frameCount - brolyChatBox.chatBoxFrameCount > 240){
                brolyChatBox.chatBoxFrameCount = frameCount;
                brolyChatBox.on = !brolyChatBox.on;
            }
            if(brolyChatBox.on === true){
                brolyChatBox.draw();
                fill(0, 0 ,0)
                textSize(14); 
                text("uuuAhhhhh",  brolyChatBox.position.x - 55, brolyChatBox.position.y - 20);
                text("Kakarotto!!!",  brolyChatBox.position.x - 55, brolyChatBox.position.y);
                
                // Random Broly ki blasts pt.2
                if(startScreenBrolyKiBlast.fire === false){
                    startScreenBrolyKiBlast.position.x = 530;
                    startScreenBrolyKiBlast.position.y = 350;
                    var newXPos = startScreenBrolyKiBlast.position.x - 2;
                    var newYpos = startScreenBrolyKiBlast.position.y - random(1, 3);
                    startScreenBrolyKiBlast.velocity.x = newXPos - startScreenBrolyKiBlast.position.x;
                    startScreenBrolyKiBlast.velocity.y = newYpos - startScreenBrolyKiBlast.position.y;
                    startScreenBrolyKiBlast.velocity.normalize();
                    startScreenBrolyKiBlast.velocity.mult(5);
                    startScreenBrolyKiBlast.fire = true;
                }   
            }

            // Gogeta Power up Animation
            if(userClickedPlay === true){
                if(frameCount - Gogeta.powerUpFrameCount > 40){
                    Gogeta.powerUpFrameCount = frameCount;
                    Gogeta.curPowerUpState = Gogeta.curPowerUpState + 1;
                }
                if(Gogeta.curPowerUpState > Gogeta.powerUpSprites.length){  // Transition to Play game state
                    curGameState = GameState.INGAME;
                    Gogeta.curPowerUpState = 0;

                    Gogeta.position.set(40, 320);
                    Broly.position.set(450, 320);
                }
            }
            break;
        
        case GameState.INSTR_MENU:
            fill(255, 255, 255); // Instructions border Menu
            rect(menu.position.x - 200, menu.position.y - 180, 485, 355);
            fill(22, 112, 4);
            rect(menu.position.x - 200 + 1, menu.position.y - 180 + 1, 483, 353);

            // Back arrow
            var weightOfStroke = 1;
            menu.curMenuSelection = "none";
            if(mouseX >= menu.position.x - 200 + 20 && mouseX <= menu.position.x - 200 + 30 + 30 &&
                mouseY >= menu.position.y - 180 + 5 && mouseY <= menu.position.y - 180 + 31){
                weightOfStroke = 3;
                menu.curMenuSelection = "back";
            }
            stroke(250, 250, 250);
            strokeWeight(weightOfStroke);
            fill(186, 180, 186);
            triangle(menu.position.x - 200 + 20, menu.position.y - 180 + 18, menu.position.x - 200 + 30, 
                menu.position.y - 180 + 5, menu.position.x - 200 + 30,  menu.position.y - 180 + 31);
            rect(menu.position.x - 200 + 30, menu.position.y - 180 + 10, 30, 15);
            noStroke();
            rect(menu.position.x - 200 + 26, menu.position.y - 180 + 12, 10, 12);
            
            fill(255, 255, 255); // Game Instructions
            textSize(17); 
            text("Instructions", menu.position.x - 200 + 81, menu.position.y - 180 + 20);
            text("_________", menu.position.x - 200 + 81, menu.position.y - 180 + 23);
            text("Control Keys -", menu.position.x - 200 + 81, menu.position.y - 180 + 70);
            text("'A', 'W', 'S', 'D' to move character", menu.position.x - 200 + 200, menu.position.y - 180 + 70);
            text("'X' to charge Ki", menu.position.x - 200 + 200, menu.position.y - 180 + 95);
            text("'C' to shoot Ki blasts", menu.position.x - 200 + 200, menu.position.y - 180 + 120); 
            text("'E' to melee attack", menu.position.x - 200 + 200, menu.position.y - 180 + 145);
            text("'R' to shoot special attack", menu.position.x - 200 + 200, menu.position.y - 180 + 170);
            text("Fight and defeat broly before he destroys Earth.", menu.position.x - 200 + 81, menu.position.y - 180 + 205);
            text("Deplete Broly's health bar to 0 using Ki blasts", menu.position.x - 200 + 81, menu.position.y - 180 + 230);
            text("(low damage=dmg), melee attacks (mid dmg), or", menu.position.x - 200 + 81, menu.position.y - 180 + 255);
            text("special attacks (high dmg). Attack dir. is automatic", menu.position.x - 200 + 81, menu.position.y - 180 + 280);
            text("Note: do not stay in melee combat with Broly too", menu.position.x - 200 + 81, menu.position.y - 180 + 320);
            text("long since he is a physically stronger foe.", menu.position.x - 200 + 81, menu.position.y - 180 + 345);
           
            Broly.drawPowerUp();
            if(frameCount - Broly.powerUpFrameCount > 60 && Broly.donePoweringUp === false){
                Broly.powerUpFrameCount = frameCount;
                Broly.curPowerUpState = Broly.curPowerUpState + 1;
            }
            if(Broly.curPowerUpState >= Broly.powerUpSprites.length){
                Broly.curPowerUpState = Broly.powerUpSprites.length - 1;
                Broly.donePoweringUp = true;
            }
            break;
        
            
        case GameState.INGAME:
            image(fightBackground, 0, 0, canvasWidth, canvasHeight); // background
            image(Gogeta.faceImg, 40, 0);
            image(Broly.faceImg, 420, 0);

            Broly.checkCollision(Gogeta); // Collision checking
            Gogeta.checkCollision(Broly);

            //draw Ki bar's, names, and labels
            drawHealthBar(85, 3, Gogeta);
            drawKiBar(85, 28, Gogeta);
            fill(0, 0 ,0);
            text("Gogeta", 85, 60);

            drawHealthBar(270, 3, Broly); 
            drawKiBar(270, 28, Broly);
            fill(0, 0 ,0);
            text("Broly", 390, 60);

            fill(255, 149, 0);
            textSize(19);
            text("HP", 240, 18);
            text("KI", 243, 45);

            // Draw and update Characters
            Broly.resetKeyArray_NPC(); // Broly 
            Broly.draw();
            Broly.update(Gogeta);

            Gogeta.draw(); // Gogeta
            Gogeta.update(Broly);

            // Draw any Gogeta ki blasts or Gogeta special move attack
            for (var i = 0; i < Gogeta.kiBlasts.length; i++) { 
                if (Gogeta.kiBlasts[i].fire === true) {
                    Gogeta.kiBlasts[i].draw();
                    Gogeta.kiBlasts[i].update();
                }
            }
            if(Gogeta.specialKamehameha.fire === true){
                Gogeta.specialKamehameha.draw();
                Gogeta.specialKamehameha.update();
            }
            

            // Draw any Broly ki blasts or Broly special move attack
            for (var i = 0; i < Broly.kiBlasts.length; i++) { 
                if (Broly.kiBlasts[i].fire === true) {
                    Broly.kiBlasts[i].draw();
                    Broly.kiBlasts[i].update();
                }
            }
            if(Broly.specialKiExplosion.fire === true){
                Broly.specialKiExplosion.draw();
                Broly.specialKiExplosion.update();
            }
            
            //Check Game Over status
            if(Gogeta.health <= 0){
                curGameState = GameState.GAMEOVER;
                yourAWinner = false;
            }
            if(Broly.health <= 0){
                curGameState = GameState.GAMEOVER;
                yourAWinner = true;
            }
            break;
            
        case GameState.GAMEOVER:

            textSize(40);
            if(yourAWinner){
                fill(16, 255, 3);
                text("Game Over", 150, 200);
                text("You Won!", 150, 250);
            }
            else{
                fill(255, 0, 0);
                text("Game Over", 150, 200);
                text("You lost :(", 150, 250);
            }
            break;
    }
};


}};
