/*
 * !!!Modified
 * 
 * FaceAPI Demo for Browsers
 * Loaded via `webcam.html`
 */

import * as faceapi from '../dist/face-api.esm.js'; // use when in dev mode

/**
 * Estimates the distance of the face from the camera based on the size of the bounding box.
 * @param {object} box - The bounding box of the detected face.
 * @returns {string} - Estimated distance category.
 */
function estimateDistance(box) {
  const area = box.width * box.height;
  if (area > 200000) return 'Very Close';
  if (area > 115000) return 'Close';
  if (area > 65000) return 'Moderate';
  return 'Far';
}

// import * as faceapi from '@vladmandic/face-api'; // use when downloading face-api as npm

// configuration options
const modelPath = '../model/'; // path to model folder that will be loaded using http
// const modelPath = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/'; // path to model folder that will be loaded using http
const minScore = 0.2; // minimum score
const maxResults = 1; // maximum number of results to return, AKA: maximum number of face can be determined 
let optionsSSDMobileNet;

// helper function to pretty-print json object to string
function str(json) {
  let text = '<font color="lightblue">';
  text += json ? JSON.stringify(json).replace(/{|}|"|\[|\]/g, '').replace(/,/g, ', ') : '';
  text += '</font>';
  return text;
}

// helper function to print strings to html document as a log
function log(...txt) {
  console.log(...txt); // eslint-disable-line no-console
  const div = document.getElementById('log');
  if (div) div.innerHTML += `<br>${txt}`;
}

function calculateEyeCenter(eyePoints) {
  let sumX = 0, sumY = 0;
  eyePoints.forEach(point => {
      sumX += point.x;
      sumY += point.y;
  });
  return { x: sumX / eyePoints.length, y: sumY / eyePoints.length };
}

function calculatePointDistance(pointA, pointB){

  return Math.sqrt(Math.pow(pointA.x - pointB.x, 2) + Math.pow(pointA.y - pointB.y, 2));
}

function findMidpoint(pointA, pointB){
  return{
    x: (pointA.x + pointB.x)/2,
    y: (pointA.y + pointB.y)/2
  };
}

function displayEyeDistance(detections) {
  detections.forEach(detection => {
      const landmarks = detection.landmarks;
      let leftEyeCenter = calculateEyeCenter(landmarks.getLeftEye());
      let rightEyeCenter = calculateEyeCenter(landmarks.getRightEye());

      let distance = Math.sqrt(
          Math.pow(rightEyeCenter.x - leftEyeCenter.x, 2) + 
          Math.pow(rightEyeCenter.y - leftEyeCenter.y, 2)
      );

      // Display the distance on the canvas
      let textPosition = { x: detection.detection.box.x, y: detection.detection.box.y - 10 };
      // ctx.fillStyle = 'lightgreen';
      log(`Eye Distance: ${distance.toFixed(2)}`, textPosition.x, textPosition.y);
  });
}

function displayDistance(result){

  result.forEach(detection => {
    const distance = estimateDistance(detection.detection.box);
    log(`Distance: ${distance}`);
  });
}

function displayFaceDetail(detections){
  let faceShapes = [];
  let recommendations = [];

  detections.forEach(detection => {
    const landmarks = detection.landmarks;
    let foreheadWidth = calculatePointDistance(landmarks.positions[0], landmarks.positions[16]);
    let cheekboneWidth = calculatePointDistance(landmarks.positions[4], landmarks.positions[12]);
    let jawWidth = 2*calculatePointDistance(landmarks.positions[4], landmarks.positions[8]);
    let faceLength = calculatePointDistance(landmarks.positions[27], landmarks.positions[8]);

    log(`Forehead Width: ${foreheadWidth}`);
    log(`Cheekbone Width: ${cheekboneWidth}`);
    log(`jawWidth: ${jawWidth}`);
    log(`Face Length: ${faceLength}`);

    let ratioCheekBone = cheekboneWidth/cheekboneWidth;
    let ratioJaw = jawWidth/cheekboneWidth;
    let ratioLength = faceLength/cheekboneWidth;
    let faceShape = "";
    let recommendation = "";

    log(`All Ratio = ${ratioJaw} : ${ratioCheekBone} : ${ratioLength}`);

    if (ratioLength <= 0.9999 || ratioJaw <= 1.2999) {
      faceShape = "Oval";
    } 
    else if (ratioLength > 0.9999 || ratioJaw > 1.2999) {
      faceShape = "Long";
    }
    else if ( ratioJaw < 1 && ratioLength > 1.2) {
      faceShape = "Diamond";
    }
    /**
     * else if (ratioLength < XXXXX || ratioJaw > XXXX) {}
     * ... ...
     * etc etc ...
     */

    let leftEyeCorner1 = landmarks.positions[36];
    let leftEyeCorner2 = landmarks.positions[39];

    let left_x1 = leftEyeCorner1.x;
    let left_y1 = leftEyeCorner1.y;
    let left_x2 = leftEyeCorner2.x;
    let left_y2 = leftEyeCorner2.y;

    let midpointOfLeftEye = findMidpoint({x: left_x1, y: left_y1}, {x: left_x2, y: left_y2});

    log(`Midpoint of Left Eye: ${JSON.stringify(midpointOfLeftEye)}`);

    let rightEyeCorner1 = landmarks.positions[42];
    let rightEyeCorner2 = landmarks.positions[45];

    let right_x1 = rightEyeCorner1.x;
    let right_y1 = rightEyeCorner1.y;
    let right_x2 = rightEyeCorner2.x;
    let right_y2 = rightEyeCorner2.y;

    let midpointOfRightEye = findMidpoint({x: right_x1, y: right_y1}, {x: right_x2, y: right_y2});

    log(`Midpoint of Right Eye: ${JSON.stringify(midpointOfRightEye)}`);

    let leftEyeBrow = calculatePointDistance(landmarks.positions[19], midpointOfLeftEye);
    log(`Distance between left eye and left eyebrow: ${leftEyeBrow}`);

    let rightEyeBrow = calculatePointDistance(landmarks.positions[24], midpointOfLeftEye);
    log(`Distance between right eye and right eyebrow: ${rightEyeBrow}`);

    let leftEyeNose = calculatePointDistance(landmarks.positions[30],midpointOfLeftEye);
    log(`Distance between left eye and nose: ${leftEyeNose}`);

    let rightEyeNose = calculatePointDistance(landmarks.positions[30], midpointOfRightEye);
    log(`Distance between right eye and nose: ${rightEyeNose}`);

    faceShapes.push(faceShape);
    
  });

  return faceShapes;
}


// helper function to draw detected faces
function drawFaces(canvas, data, fps, shapes, recommendation) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // draw title
  ctx.font = 'normal 20px "Segoe UI"';
  ctx.fillStyle = 'white';
  ctx.fillText(`FPS: ${fps}`, 10, 25);
  for (const person of data) {
    // draw box around each face
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'deepskyblue';
    ctx.fillStyle = 'deepskyblue';
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.rect(person.detection.box.x, person.detection.box.y, person.detection.box.width, person.detection.box.height);
    ctx.stroke();
    ctx.globalAlpha = 1;
    // draw text labels
    const expression = Object.entries(person.expressions).sort((a, b) => b[1] - a[1]);
    ctx.fillStyle = 'black';
    ctx.fillText(`Gender: ${Math.round(100 * person.genderProbability)}% ${person.gender}`, person.detection.box.x, person.detection.box.y - 113);
    ctx.fillText(`Expression: ${Math.round(100 * expression[0][1])}% ${expression[0][0]}`, person.detection.box.x, person.detection.box.y - 95);
    ctx.fillText(`Age: ${Math.round(person.age)} years`, person.detection.box.x, person.detection.box.y - 77);
    ctx.fillText(`Roll: ${person.angle.roll}° Pitch:${person.angle.pitch}° Yaw:${person.angle.yaw}°`, person.detection.box.x, person.detection.box.y - 59);
    ctx.fillText(`Face Shape: ${shapes}`, person.detection.box.x, person.detection.box.y - 41)
    ctx.fillText(`Recommended Frames: `, person.detection.box.x, person.detection.box.y - 23)
    ctx.fillText(`${recommendation}`, person.detection.box.x, person.detection.box.y - 5)
    
    ctx.fillStyle = 'lightblue';
    ctx.fillText(`Gender: ${Math.round(100 * person.genderProbability)}% ${person.gender}`, person.detection.box.x, person.detection.box.y - 114);
    ctx.fillText(`Expression: ${Math.round(100 * expression[0][1])}% ${expression[0][0]}`, person.detection.box.x, person.detection.box.y - 96);
    ctx.fillText(`Age: ${Math.round(person.age)} years`, person.detection.box.x, person.detection.box.y - 78);
    ctx.fillText(`Roll: ${person.angle.roll}° Pitch:${person.angle.pitch}° Yaw:${person.angle.yaw}°`, person.detection.box.x, person.detection.box.y - 60);
    ctx.fillText(`Face Shape: ${shapes}`, person.detection.box.x, person.detection.box.y - 42)
    ctx.fillText(`Recommended Frames: `, person.detection.box.x, person.detection.box.y - 24)
    ctx.fillText(`${recommendation}`, person.detection.box.x, person.detection.box.y - 6)

    // draw face points for each face
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = 'lightblue';
    const pointSize = 2;
    for (let i = 0; i < person.landmarks.positions.length; i++) {
      ctx.beginPath();
      ctx.arc(person.landmarks.positions[i].x, person.landmarks.positions[i].y, pointSize, 0, 2 * Math.PI);
      ctx.fill();
    }
    
  }
}

async function detectVideo(video, canvas) {
  if (!video || video.paused) return false;
  const t0 = performance.now();
  faceapi
    .detectAllFaces(video, optionsSSDMobileNet)
    .withFaceLandmarks()
    .withFaceExpressions()
    // .withFaceDescriptors()
    .withAgeAndGender()
    .then((result) => {

      const fps = 1000 / (performance.now() - t0);
      const faceShapes = displayFaceDetail(result);
      // const recommendations = displayFaceDetail(result).recommendations;
      let recommendation = [];

      if (faceShapes == "Oval") {
        recommendation = "Square, Rectangular, Cat-eye";
      }
      if (faceShapes == "Long") {
        recommendation = "Round, Oval, Aviator";
      }
      if (faceShapes == "Rectangle") {
        recommendation = "Oval, Round, Oversize";
      }
      if (faceShapes == "Heart") {
        recommendation = "Rectangular, Oval, Round";
      }
      if (faceShapes == "Round") {
        recommendation = "Rectangular, Square, Oval";
      }
      if (faceShapes =="Diamond")
        recommendation = "Oval, Round, Cat-eye";

      drawFaces(canvas, result, fps.toLocaleString(), faceShapes, recommendation);
      displayEyeDistance(result);
      displayDistance(result);
      
      log(`===============================================================================`);
      
      requestAnimationFrame(() => detectVideo(video, canvas));
    
      return true;
    })
    .catch((err) => {
      log(`Detect Error: ${str(err)}`);
      return false;
    });
  return false;
}

// just initialize everything and call main function
async function setupCamera() {
  const video = document.getElementById('video');
  const canvas = document.getElementById('canvas');
  if (!video || !canvas) return null;

  log('Setting up camera');
  // setup webcam. note that navigator.mediaDevices requires that page is accessed via https
  if (!navigator.mediaDevices) {
    log('Camera Error: access not supported');
    return null;
  }
  let stream;
  const constraints = { audio: false, video: { facingMode: 'user', resizeMode: 'crop-and-scale' } };
  if (window.innerWidth > window.innerHeight) constraints.video.width = { ideal: window.innerWidth };
  else constraints.video.height = { ideal: window.innerHeight };
  try {
    stream = await navigator.mediaDevices.getUserMedia(constraints);
  } catch (err) {
    if (err.name === 'PermissionDeniedError' || err.name === 'NotAllowedError') log(`Camera Error: camera permission denied: ${err.message || err}`);
    if (err.name === 'SourceUnavailableError') log(`Camera Error: camera not available: ${err.message || err}`);
    return null;
  }
  if (stream) {
    video.srcObject = stream;
  } else {
    log('Camera Error: stream empty');
    return null;
  }
  const track = stream.getVideoTracks()[0];
  const settings = track.getSettings();
  if (settings.deviceId) delete settings.deviceId;
  if (settings.groupId) delete settings.groupId;
  if (settings.aspectRatio) settings.aspectRatio = Math.trunc(100 * settings.aspectRatio) / 100;
  log(`Camera active: ${track.label}`);
  log(`Camera settings: ${str(settings)}`);
  canvas.addEventListener('click', () => {
    if (video && video.readyState >= 2) {
      if (video.paused) {
        video.play();
        detectVideo(video, canvas);
      } else {
        video.pause();
      }
    }
    log(`Camera state: ${video.paused ? 'paused' : 'playing'}`);
  });
  // Ensure this is called after the video element is playing
  video.addEventListener('play', () => {
    calculateAndDisplayBrightness(video, canvas);
  });

  return new Promise((resolve) => {
    video.onloadeddata = async () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      video.play();
      detectVideo(video, canvas);
      resolve(true);
    };
  });
}

async function setupFaceAPI() {
  // load face-api models
  // log('Models loading');
  // await faceapi.nets.tinyFaceDetector.load(modelPath); // using ssdMobilenetv1
  await faceapi.nets.ssdMobilenetv1.load(modelPath);
  await faceapi.nets.ageGenderNet.load(modelPath);
  await faceapi.nets.faceLandmark68Net.load(modelPath);
  await faceapi.nets.faceRecognitionNet.load(modelPath);
  await faceapi.nets.faceExpressionNet.load(modelPath);
  optionsSSDMobileNet = new faceapi.SsdMobilenetv1Options({ minConfidence: minScore, maxResults });
  // check tf engine state
  log(`Models loaded: ${str(faceapi.tf.engine().state.numTensors)} tensors`);
}

async function main() {
  // initialize tfjs
  log('FaceAPI WebCam Test');

  // if you want to use wasm backend location for wasm binaries must be specified
  // await faceapi.tf?.setWasmPaths(`https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm@${faceapi.tf.version_core}/dist/`);
  // await faceapi.tf?.setBackend('wasm');
  // log(`WASM SIMD: ${await faceapi.tf?.env().getAsync('WASM_HAS_SIMD_SUPPORT')} Threads: ${await faceapi.tf?.env().getAsync('WASM_HAS_MULTITHREAD_SUPPORT') ? 'Multi' : 'Single'}`);

  // default is webgl backend
  await faceapi.tf.setBackend('webgl');
  await faceapi.tf.ready();

  // tfjs optimizations
  if (faceapi.tf?.env().flagRegistry.CANVAS2D_WILL_READ_FREQUENTLY) faceapi.tf.env().set('CANVAS2D_WILL_READ_FREQUENTLY', true);
  if (faceapi.tf?.env().flagRegistry.WEBGL_EXP_CONV) faceapi.tf.env().set('WEBGL_EXP_CONV', true);
  if (faceapi.tf?.env().flagRegistry.WEBGL_EXP_CONV) faceapi.tf.env().set('WEBGL_EXP_CONV', true);

  // check version
  log(`Version: FaceAPI ${str(faceapi?.version || '(not loaded)')} TensorFlow/JS ${str(faceapi.tf?.version_core || '(not loaded)')} Backend: ${str(faceapi.tf?.getBackend() || '(not loaded)')}`);

  await setupFaceAPI();
  await setupCamera();
}

// start processing as soon as page is loaded
window.onload = main;


async function detectFaceShapes(video) {
    const canvas = faceapi.createCanvasFromMedia(video);
    document.body.append(canvas);

    const displaySize = { width: video.width, height: video.height };
    faceapi.matchDimensions(canvas, displaySize);

    setInterval(async () => {
        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
                                         .withFaceLandmarks()
                                         .withFaceExpressions();
        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        faceapi.draw.drawDetections(canvas, resizedDetections);
        faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
        faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
    }, 100);
}

function calculateAndDisplayBrightness(video, canvas) {
  if (!video || video.paused || video.ended) return;

  // Ensure the canvas size matches the video frame size
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext('2d');
  // Draw the video frame to the canvas
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  // Get the image data from the canvas
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Calculate the average brightness
  let totalBrightness = 0;
  for (let i = 0; i < data.length; i += 4) {
    // Simple average for RGB
    const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
    totalBrightness += brightness;
  }
  const averageBrightness = totalBrightness / (imageData.width * imageData.height);

  // Display the brightness on the screen
  displayBrightness(averageBrightness);

  // Call this function again to continuously update the brightness
  requestAnimationFrame(() => calculateAndDisplayBrightness(video, canvas));
}

function displayBrightness(brightness) {
  const logDiv = document.getElementById('log');
  // Create a new div element for the brightness value
  const brightnessDiv = document.createElement('div');
  brightnessDiv.textContent = `Current Brightness: ${brightness.toFixed(2)}`;
  // Append the new div to the log div
  logDiv.appendChild(brightnessDiv);
  // Optionally, scroll to the bottom of the log div to ensure the latest information is visible
  logDiv.scrollTop = logDiv.scrollHeight;
}

// Ensure this is called after the video element is playing
video.addEventListener('play', () => {
  calculateAndDisplayBrightness(video, canvas);
});