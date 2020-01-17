let video;
let videoSize = 10;
let ready = false;

let pixelBrain;
let label = '';

let slider;

function mousePressed() {
  wave.start();
}

function setup() {
  createCanvas(400, 400);

  wave = new p5.Oscillator();

  wave.setType('sine');
  wave.freq(440);
  wave.amp(0.5);

  slider = createSlider(200, 800, 440);
  slider.input(function () {
    wave.freq(slider.value());
  });

  video = createCapture(VIDEO, videoReady);
  video.size(videoSize, videoSize);
  video.hide();

  let options = {
    task: 'regression',
    // hiddenUnits: 150,
    debug: true
  }
  pixelBrain = ml5.neuralNetwork(options);
  pixelBrain.loadData('pixel_freq2.json', loaded);
}

function loaded() {
  pixelBrain.normalizeData();
  pixelBrain.train({
    epochs: 50
  }, finishedTraining);
}


function finishedTraining() {
  console.log('training complete');
  wave.amp(0.5);
  predictVideo();
}

function predictVideo() {
  let inputs = [];
  video.loadPixels();
  for (let i = 0; i < video.pixels.length; i += 4) {
    let r = video.pixels[i + 0];
    let g = video.pixels[i + 1];
    let b = video.pixels[i + 2];
    inputs.push(r, g, b);
  }
  pixelBrain.predict(inputs, gotResults);
}

function gotResults(error, results) {
  if (error) {
    console.error(error);
    return;
  }
  let value = results[0].value;
  console.log(value);
  wave.freq(value);
  slider.value(value);
  predictVideo();
}

let state = 'waiting';

async function keyPressed() {
  if (key == 't') {
    wave.amp(0);
    pixelBrain.normalizeData();
    pixelBrain.train({
      epochs: 50
    }, finishedTraining);
  } else if (key == 's') {
    pixelBrain.saveData();
  } else if (key == 'd') {
    state = 'collecting';
    await delay(15000);
    state = 'waiting';
  }
}


function addExample() {
  let inputs = [];
  video.loadPixels();
  for (let i = 0; i < video.pixels.length; i += 4) {
    let r = video.pixels[i + 0];
    let g = video.pixels[i + 1];
    let b = video.pixels[i + 2];
    inputs.push(r, g, b);
  }
  let target = [slider.value()];
  console.log("Adding example: " + slider.value());
  pixelBrain.addData(inputs, target);
}




// Video is ready!
function videoReady() {
  ready = true;
}

function draw() {
  background(0);
  if (state == 'collecting') {
    addExample();
  }
  if (ready) {
    // Render the low-res image
    let w = width / videoSize;
    video.loadPixels();
    for (let x = 0; x < video.width; x++) {
      for (let y = 0; y < video.height; y++) {
        let index = (x + y * video.width) * 4;
        let r = video.pixels[index + 0];
        let g = video.pixels[index + 1];
        let b = video.pixels[index + 2];
        noStroke();
        fill(r, g, b);
        rect(x * w, y * w, w, w);
      }
    }
  }

}


function delay(time) {
  return new Promise((resolve, reject) => {
    if (isNaN(time)) {
      reject(new Error('delay requires a valid number.'));
    } else {
      setTimeout(resolve, time);
    }
  });
}
