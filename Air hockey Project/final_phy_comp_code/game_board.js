var player1x = 3;
var player1y = 133;
var player1w = 40;
var player1h = 283;

var player2x = 1700;
var player2y = 133;
var player2w = 40;
var player2h = 283;

function drawGameBoard() {
  
  
  player2x = width - 40;

    // game boardx`x  
    push();
    noFill();
    stroke(0,255,0);
    strokeWeight(4);
    ellipseMode(CENTER);
    ellipse(width/2, height/2, 208, 208);
    line(width/2, 0, width/2, height);
    stroke(0,255,0);
    rect(player1x, height/2-player1h/2, player1w, player1h);
    stroke(255,0,0);
    rect(player2x, height/2-player2h/2, player2w, player2h);
    pop();

    push();
    
    //translate(-width/2,-height/2,0); //moves our drawing origin to the top left corner
    textFont(myFont);
    //score board
    fill(255);
    textSize(40);
    text(p1Score, width/4, 50);
    textSize(40);
    text(p2Score, width/1.5, 50);
    // keep track of gamestate
    text(gameState, 20, 50);

    if (gameState == "calibratePlayer1" || gameState == "calibratePlayer2") {
      text(windowWidth + "," + windowHeight, 20, 100);
      fill(255);
      noStroke();
      text(round(frameRate()), 20, 150);
    }
    pop();
}
