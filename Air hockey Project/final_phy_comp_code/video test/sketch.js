function setup() {
  createCanvas(1920, 1080);

  let constrains = {
    video: {
      minWidth: 1920,
      minHeight: 1080
    }
    }
  
  //portSetup();
  video = createCapture(constrain);

  //video.size(1920, 1080);
}

function draw() {
  image(video, 0,0);
  //background(220);
}
