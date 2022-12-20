class Puck {
  constructor(xin, yin, din, idin, oin, isPaddle, inColor) {
    this.x = xin;
    this.y = yin;
    this.targetX = 0;
    this.targetY = 0;
    this.vx = 0;
    this.vy = 0;
    this.diameter = din;
    this.id = idin;
    this.others = oin;
    this.easing = 0.3;
    this.isPaddle = isPaddle;
    this.inColor = inColor;
  }

  collide() {
    for (let i = this.id + 1; i < numPucks; i++) {
      // console.log(others[i]);
      let dx = this.others[i].x - this.x;
      let dy = this.others[i].y - this.y;
      let distance = sqrt(dx * dx + dy * dy);
      let minDist = this.others[i].diameter / 2 + this.diameter / 2;
      // console.log(distance);
      //console.log(minDist);
      if (distance < minDist) {
        // console.log("2");
        let angle = atan2(dy, dx);
        let targetX = this.x + cos(angle) * minDist;
        let targetY = this.y + sin(angle) * minDist;
        let ax = (targetX - this.others[i].x) * spring;
        let ay = (targetY - this.others[i].y) * spring;
        this.vx -= ax;
        this.vy -= ay;
        this.others[i].vx += ax;
        this.others[i].vy += ay;
      }
    }
  }

  move() {
    // do gravity if it is not a paddle
    if (this.isPaddle == false) {
      this.vy += gravity;
      this.x += this.vx;
      this.y += this.vy;
      if (this.x + this.diameter / 2 > width) {
        this.x = width - this.diameter / 2;
        this.vx *= friction;
      } else if (this.x - this.diameter / 2 < 0) {
        this.x = this.diameter / 2;
        this.vx *= friction;
      }
      if (this.y + this.diameter / 2 > height) {
        this.y = height - this.diameter / 2;
        this.vy *= friction;
      } else if (this.y - this.diameter / 2 < 0) {
        this.y = this.diameter / 2;
        this.vy *= friction;
      }
    }
  }

  smoothPosition() {
    // smooth position of the camera data
    if (this.isPaddle) {
      let targetX = this.targetX;
      let dx = targetX - this.x;
      this.x += dx * this.easing;

      let targetY = this.targetY
      let dy = targetY - this.y;
      this.y += dy * this.easing;
    }
  }

  display() {
      fill(127);
      strokeWeight(2);
      stroke(0);
      ellipse(this.x, this.y, this.diameter);
      noStroke();
  }
}
