                                    
function trackPlayersByColor() {

  if (hasColor == false) {
    loadPixels();
    colorToMatch1 = [48, 83, 133, 255];
    colorToMatch2 = [195, 59, 58, 255];
    hasColor = true;
    // print("we have a color: ");
    // print("why", colorToMatch);
  }

  if (hasColor) {
    // get the first matching pixel
    // in the image
    gotTrackedColor1 = findColor(video, colorToMatch1, tolerance);
    gotTrackedColor2 = findColor(video, colorToMatch2, tolerance);

    if (gotTrackedColor1) {
      let realWorldXY = calculate_XYZ(gotTrackedColor1.x, gotTrackedColor1.y);
      // console.log("puck 1 realWorldXY", realWorldXY.selection.data[0], realWorldXY.selection.data[1]);
      let realWorldX = realWorldXY.selection.data[0];
      let realWorldY =realWorldXY.selection.data[1];
      // console.log("puck1 x,y", realWorldX, realWorldY);
      let newX = map(realWorldX, 0, 35, 0, 1920); 
      newX = map(newX, 0, 1920, 1920, 0); 
      let newY = map(realWorldY, 0, 23, 0, 1080); 
      console.log("puck1 newX", newX, "oldX", gotTrackedColor1.x);
      console.log("puck1 newY", newY, "oldY", gotTrackedColor1.y);
      pucks[1].targetX = newX;// gotTrackedColor1.x;
      pucks[1].targetY = newY;// gotTrackedColor1.y;
    }
    
    if (gotTrackedColor2) {
      let realWorldXY = calculate_XYZ(gotTrackedColor2.x, gotTrackedColor2.y);
      // console.log("puck 2realWorldXY", realWorldXY.selection.data[0], realWorldXY.selection.data[1]);
      let realWorldX = realWorldXY.selection.data[0];
      let realWorldY =realWorldXY.selection.data[1];
      console.log("puck2 x,y", realWorldX, realWorldY);
      let newX = map(realWorldX, 0, 35, 0, 1920); 
      newX = map(newX, 0, 1920, 1920, 0); 
      let newY = map(realWorldY, 0, 23, 0, 1080); 
      console.log("puck2 newX", newX, "oldX", gotTrackedColor1.x);
      console.log("puck2 newY", newY, "oldY", gotTrackedColor1.y);
      pucks[2].targetX = newX;//gotTrackedColor2.x;
      pucks[2].targetY = newY;//gotTrackedColor2.y;
    }
  }
}

// find the first instance of a color
// in an image and return the location
function findColor(input, c, tolerance) {
  // if we don't have video yet (ie the sketch
  // just started), then return undefined
  if (input.width === 0 || input.height === 0) {
    return undefined;
  }
  // grab rgb from color to match
  let matchR = c[0];
  let matchG = c[1];
  let matchB = c[2];

  // look for the color!
  // in this case, we look across each row
  // working our way down the image – depending
  // on your project, you might want to scan
  // across instead

  input.loadPixels();
  for (let y = 0; y < input.height; y++) {
    for (let x = 0; x < input.width; x++) {
      // current pixel color
      let index = (y * input.width + x) * 4;
      let r = input.pixels[index];
      let g = input.pixels[index + 1];
      let b = input.pixels[index + 2];
      if (
        r >= matchR - tolerance &&
        r <= matchR + tolerance &&
        g >= matchG - tolerance &&
        g <= matchG + tolerance &&
        b >= matchB - tolerance &&
        b <= matchB + tolerance
      ) {
        // send back the x/y location immediately
        // (faster, since we stop the loop)
        return createVector(width-x, y);
      }
    }
  }

  // if no match was found, return 'undefined'
  return undefined;
}
