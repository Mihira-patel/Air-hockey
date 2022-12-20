
// Client-side parser for .npy files
// See the specification: http://docs.scipy.org/doc/numpy-dev/neps/npy-format.html
var NumpyLoader = (function () {
  function asciiDecode(buf) {
      return String.fromCharCode.apply(null, new Uint8Array(buf));
  }

  function readUint16LE(buffer) {
      var view = new DataView(buffer);
      var val = view.getUint8(0);
      val |= view.getUint8(1) << 8;
      return val;
  }

  function fromArrayBuffer(buf) {
    // Check the magic number
    var magic = asciiDecode(buf.slice(0,6));
    if (magic.slice(1,6) != 'NUMPY') {
        throw new Error('unknown file type');
    }

    var version = new Uint8Array(buf.slice(6,8)),
        headerLength = readUint16LE(buf.slice(8,10)),
        headerStr = asciiDecode(buf.slice(10, 10+headerLength));
        offsetBytes = 10 + headerLength;
        //rest = buf.slice(10+headerLength);  XXX -- This makes a copy!!! https://www.khronos.org/registry/typedarray/specs/latest/#5

    // Hacky conversion of dict literal string to JS Object
    eval("var info = " + headerStr.toLowerCase().replace('(','[').replace('),',']'));
  
    // Intepret the bytes according to the specified dtype
    var data;
    if (info.descr === "|u1") {
        data = new Uint8Array(buf, offsetBytes);
    } else if (info.descr === "|i1") {
        data = new Int8Array(buf, offsetBytes);
    } else if (info.descr === "<u2") {
        data = new Uint16Array(buf, offsetBytes);
    } else if (info.descr === "<i2") {
        data = new Int16Array(buf, offsetBytes);
    } else if (info.descr === "<u4") {
        data = new Uint32Array(buf, offsetBytes);
    } else if (info.descr === "<i4") {
        data = new Int32Array(buf, offsetBytes);
    } else if (info.descr === "<f4") {
        data = new Float32Array(buf, offsetBytes);
    } else if (info.descr === "<f8") {
        data = new Float64Array(buf, offsetBytes);
    } else {
        throw new Error('unknown numeric dtype')
    }

    return {
        shape: info.shape,
        fortran_order: info.fortran_order,
        data: data
    };
  }

  function open(file, callback) {
      var reader = new FileReader();
      reader.onload = function() {
          // the file contents have been read as an array buffer
          var buf = reader.result;
          var ndarray = fromArrayBuffer(buf);
          callback(ndarray);
      };
      reader.readAsArrayBuffer(file);
  }

  function ajax(url) {
    return new Promise(function(resolve, reject) {
      var xhr = new XMLHttpRequest();
  
      xhr.onload = function(e) {
        var buf = xhr.response; // not responseText
        var ndarray = fromArrayBuffer(buf);
        resolve(ndarray);
      };
  
      xhr.onerror = function(e) {
        reject(e);
      };
  
      xhr.open("GET", url, true);
      xhr.responseType = "arraybuffer";
      xhr.send(null);
    });
  }
  
  return {
      open: open,
      ajax: ajax
  };
})();

// keep track of all our game objects...
// we are calling them pucks
let numPucks = 3;
let pucks = [];

// properties of our puck and ice
let spring = 0.05;
let gravity = 0;
let friction = -0.9;

// scoring
var p1Score = 0;
var p2Score = 0;
var player2hasScored = false;
var player1hasScored = false;

// color to look for (set with mouse click)
var colorToMatch1 = [48, 83, 133, 255];
var colorToMatch2 = [195, 59, 58, 255];
let tolerance = 10;
var hasColor = false;

// camera feed for color tracking
let video;
let song;

var gotTrackedColor1;
var gotTrackedColor2;

// calibrating, playgame, gameover
var gameState = "playGame";

// debug variables
var hideVideo = false;

let myFont;

//serial communication
var serial;          // variable to hold an instance of the serialport library
var portName = '/dev/tty.usbserial-1110'; // fill in your serial port name here
var inData;  
var incomingByte;                            // for incoming serial data
var outByte = 0; 

function preload() {
  myFont = loadFont('fonts/Arialn.ttf');
  song = loadSound('asset/mixkit-arcade-video-game-bonus-2044.wav');
}

async function loadMatrix(path) {
  return NumpyLoader.ajax(path);
}

let inverse_newcam;
let inverse_R;
let s_arr;
let tvec1;

let inverse_newcam_mtx;
let inverse_R_mtx;
let s_arr_mtx;
let tvec1_mtx;

// Solve: From Image Pixels, find World Points
function calculate_XYZ(u,v) {
  let uv_1 = nj.array([[u,v,1]], dtype=nj.Float64Array);
  uv_1 = uv_1.T;
  let scaling_factor=s_arr_mtx.selection.data[0];
  let suv_1 = uv_1.multiply(scaling_factor);
  let xyz_c = inverse_newcam_mtx.dot(suv_1)
  xyz_c = xyz_c.subtract(tvec1_mtx);
  let XYZ= inverse_R_mtx.dot(xyz_c)
  return XYZ
}


async function setup() {
  createCanvas(1920, 1080);
  portSetup();
  video = createCapture(VIDEO);
  video.size(1920, 1080);

  console.log(video.width, video.height)
  video.hide();

  

  inverse_newcam = await loadMatrix("./matrices/inverse_newcam_mtx.npy");
  inverse_R = await loadMatrix("./matrices/inverse_R_mtx.npy");
  s_arr = await loadMatrix("./matrices/s_arr.npy");
  tvec1 = await loadMatrix("./matrices/tvec1.npy");

  inverse_newcam_mtx = nj.array([inverse_newcam.data]).reshape(inverse_newcam.shape);
  inverse_R_mtx = nj.array([inverse_R.data]).reshape(inverse_R.shape);
  s_arr_mtx = nj.array([s_arr.data]).reshape(s_arr.shape);
  tvec1_mtx = nj.array([tvec1.data]).reshape(tvec1.shape);

  // console.log("inverse_newcam_mtx ", inverse_newcam_mtx);
  // console.log("inverse_R_mtx ", inverse_R_mtx);
  // console.log("s_arr_mtx ", s_arr_mtx);
  // console.log("tvec1_mtx ", tvec1_mtx);

  
  setupPucks();
  
}

function portSetup() { 
  serial = new p5.SerialPort();    // make a new instance of the serialport library
  //serial.on('data', serialEvent);  // callback for when new data arrives
  //serial.on('error', serialError); // callback for errors
  //serial.on('list', printList);       // set a callback function for the serialport list event
  //serial.list();                   // list the serial ports
  
  serial.open(portName);           // open a serial port
}

function setupPucks() {
  // the game puck
  pucks[0] = new Puck(width/2, height/2, 100, 0, pucks, false, 255);
  
  // player 1
  pucks[1] = new Puck(0, height/2, 125, 1, pucks, true, colorToMatch1);
  
  // player 2
  pucks[2] = new Puck(width, height/2, 125, 2, pucks, true, colorToMatch2);

}

function draw() {
  // draw our background
  background(20,20,20);


  drawGameBoard();
 

  // // get camera data
  trackPlayersByColor(); // get their positions from the camera
  

  // // draw our video to debug
  if (gameState == "calibratePlayer1" || gameState == "calibratePlayer2") {
    push();
      // Display at half opacity
      // over the game board
      tint(255); 
      
      //to flip video we translate
      translate(1920, 0);
      //then scale it by -1 in the x-axis
      //to flip the image
      scale(-1, 1);
      image(video, 0,0, 1920, 1080);
    pop();
  }
  
  moveTrackedPlayers(); // apply it to the p5 sketch

  // move the puck around
  pucks[0].move();
  pucks[0].collide();
  pucks[0].display();

  

  // check if we score
  checkForScoring();  
  highScore();
}

function moveTrackedPlayers() {
    // move objects around according to camera data
    // we check if we "gotTrackedColor" to make sure
    // the camera is working before we try drawing anything
    if (gotTrackedColor1) {    
      pucks[1].smoothPosition();
      pucks[1].collide();
      pucks[1].display();
    
    }
    
    if (gotTrackedColor2) {
      pucks[2].smoothPosition();
      pucks[2].collide();
      pucks[2].display();
    }
}


function checkForScoring() {

  

  //player 1 score
  if (pucks[0].x > 1920-100 && player1hasScored == false) {
      p1Score = p1Score + 1;
      player1hasScored == true;

      serial.write ('a');
      push();
      song.play();
      pop();

      // reset the ball
      pucks[0].x = width / 2;
      pucks[0].y = height / 2;

      
      

  } else if (pucks[0].x < 1920-100) { // if the ball bounces back
    player1hasScored == false;
  }



  //player 2 score
  if (pucks[0].x < 100 && player2hasScored == false) {
      p2Score = p2Score + 1;
      player2hasScored == true;

      serial.write ('b');
      push();
      song.play();
      pop();

      pucks[0].x = width / 1;
      pucks[0].y = height / 1;

    

  } else if (pucks[0].x > 100 ) { // if the ball bounces back
    player2hasScored == false;
  }
}

function highScore(){
if (p2Score >= 5){
    print('Player 2 wins!', 600, 500);
    console.log('know');
    serial.write ('a');
    serial.write ('b'); 
    // reset();
  }

  else if(p1Score >= 5){
    print("Player 1 wins!", 600, 500);
    serial.write ('a');
    serial.write ('b');
    // reset()
  }
  
}




function keyPressed() {
  switch (key) {
      case 'c':
          gameState = "calibrateCamera"
          
          break;
      case 'p':
        gameState = "playGame";
        break;
      case 'f':
          // enter/ exit fullscreen mode
          let fs = fullscreen();
          fullscreen(!fs);
          break;
      case '1':
          gameState = "calibratePlayer1";
          break;
      case '2':
          gameState = "calibratePlayer2";
          break;
      case 's':
        break;
      case 'm':
        gameState = "map";
        break;
  }
}

// use the mouse to select a color to track
function mousePressed() {
  loadPixels();

  let selection = get(mouseX, mouseY);
  console.log("selection",selection);

  if (gameState == "calibratePlayer1") {
    colorToMatch1 = [selection[0], selection[1], selection[2], selection[3]];
  } else if (gameState == "calibratePlayer2") {
    colorToMatch2 = [selection[0], selection[1], selection[2], selection[3]];
  } else {
    colorToMatch1 = [48, 83, 133, 255];
    colorToMatch2 = [195, 59, 58, 255];
  }

  pucks[1].inColor = colorToMatch1;
  pucks[2].inColor = colorToMatch2;

}

//function windowResized() {
  //resizeCanvas(windowWidth, windowHeight);
//}