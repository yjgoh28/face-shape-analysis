/*
 * !!!Modified
 * 
 * FaceAPI Demo for Browsers
 * Loaded via `webcam.html`
 */

import * as faceapi from '../dist/face-api.esm.js'; // use when in dev mode
import { drawFaces, drawFilterOnFace , setCurrentFilter } from './drawFaces.js';
import { preloadFilterImages, filterImages } from './filterUtils.js';
import { findNearestSpectacleShops } from './nearestSpectacleShop.js';

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

let TopLeftEyePosition = 0;
export { TopLeftEyePosition };

// configuration options
const modelPath = '../model/'; // path to model folder that will be loaded using http
const minScore = 0.2; // minimum score for face detection
const maxResults = 1; // maximum number of faces to detect
let optionsSSDMobileNet;

let currentFilter = 'circle'; // Default filter


// Helper function to pretty-print JSON object to string
function str(json) {
  let text = '<font color="lightblue">';
  text += json ? JSON.stringify(json).replace(/{|}|"|\[|\]/g, '').replace(/,/g, ', ') : '';
  text += '</font>';
  return text;
}

// Helper function to print strings to HTML document as a log
export function log(...txt) {
  console.log(...txt); // eslint-disable-line no-console
  const div = document.getElementById('log');
  if (div) div.innerHTML += `<br>${txt}`;
}

// Calculate the center point of the eye


// Calculate the distance between two points
function calculatePointDistance(pointA, pointB) {
  return Math.sqrt(Math.pow(pointA.x - pointB.x, 2) + Math.pow(pointA.y - pointB.y, 2));
}

// Find the midpoint between two points
function findMidpoint(pointA, pointB) {
  return {
    x: (pointA.x + pointB.x) / 2,
    y: (pointA.y + pointB.y) / 2
  };
}

function calculateEyeCenter(eyePoints) {
  let sumX = 0, sumY = 0;
  eyePoints.forEach(point => {
      sumX += point.x;
      sumY += point.y;
  });
  return { x: sumX / eyePoints.length, y: sumY / eyePoints.length };
}

// Display the distance between the eyes on the canvas
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
      // log(`Eye Distance: ${distance.toFixed(2)}`, textPosition.x, textPosition.y);
      // log(`Left Eye Center: x=${leftEyeCenter.x.toFixed(2)}, y=${leftEyeCenter.y.toFixed(2)}`);

      TopLeftEyePosition = leftEyeCenter;
  });
}

// Display the estimated distance of the face from the camera
function displayDistance(result) {
  result.forEach(detection => {
    const distance = estimateDistance(detection.detection.box);
    // log(`Distance: ${distance}`);
  });
}

// Get the length of Face Feature Details
function displayFaceDetail(detections) {
  let faceShapes = [];

  detections.forEach(detection => {
    const landmarks = detection.landmarks;
    let foreheadWidth = calculatePointDistance(landmarks.positions[0], landmarks.positions[16]);
    let cheekboneWidth = calculatePointDistance(landmarks.positions[4], landmarks.positions[12]);
    let jawWidth = calculatePointDistance(landmarks.positions[2], landmarks.positions[14]);
    let faceLength = calculatePointDistance(landmarks.positions[27], landmarks.positions[8]);
    let chinLength = calculatePointDistance(landmarks.positions[8], landmarks.positions[57]);

    let ratioWidthToLength = cheekboneWidth / faceLength;
    let ratioJawToCheekbone = jawWidth / cheekboneWidth;
    let ratioForeheadToCheekbone = foreheadWidth / cheekboneWidth;
    let ratioChinToJaw = chinLength / jawWidth;

    let faceShape = "";

    // Round face
    // Square face

    // Oval face
    if (ratioForeheadToCheekbone >0.9 && ratioWidthToLength <1.05) {
      faceShape = "Oval";
    }
    else if (ratioForeheadToCheekbone > 0.8 && ratioForeheadToCheekbone < 1.25) {
      faceShape = "Square";
    }
    else if (ratioForeheadToCheekbone > 0.8 && ratioForeheadToCheekbone < 1.25 && ratioWidthToLength < 1.05) {
      faceShape = "Heart";
    }
    // Diamond face
    else if (ratioForeheadToCheekbone >0.999 && ratioJawToCheekbone > 0.999 && ratioWidthToLength >0.85 ) {
      faceShape = "Diamond";
    }


    // Heart face (inverted triangle)
    else {
      faceShape = "Undefined";
    }

    faceShapes.push(faceShape);
  });

  return faceShapes;
}

async function detectVideo(video, canvas) {
  if (!video || video.paused) return false;
  const t0 = performance.now();

  // 1. Face Detection and Analysis
  faceapi
    .detectAllFaces(video, optionsSSDMobileNet)
    .withFaceLandmarks()
    .withFaceExpressions()
    .withAgeAndGender()
    .then((result) => {
      const fps = 1000 / (performance.now() - t0);
      const faceShapes = displayFaceDetail(result);
      let recommendations = [];

      faceShapes.forEach(faceShape => {
        let recommendation;
        switch(faceShape) {
          case "Oval":
            recommendation = "Rectangle, Cat-eye, Aviator";
            break;
          case "Round":
            recommendation = "Rectangle";
            break;
          case "Square":
            recommendation = "Circle, Oval, Aviator";
            break;
          case "Diamond":
            recommendation = "Oval, Cat-eye";
            break;
          case "Rectangular":
            recommendation = "Circle, Oval";
            break;
          case "Triangle":
            recommendation = "Cat-eye, Aviator";
            break;
          case "Heart":
            recommendation = "Circle, Oval";
            break;
          default:
            recommendation = "Unable to determine suitable frames";
        }
        recommendations.push(recommendation);
      });

      drawFaces(canvas, result, fps.toLocaleString(), faceShapes, recommendations);
      displayEyeDistance(result);
      displayDistance(result);

      requestAnimationFrame(() => detectVideo(video, canvas));
      return true;
    })
    .catch((err) => {
      log(`Detect Error: ${str(err)}`);
      return false;
    });

  return false;
}

// Initialize the camera and start video feed
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
  const constraints = { audio: false, video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } };
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

// Load FaceAPI models
async function setupFaceAPI() {
  await faceapi.nets.ssdMobilenetv1.load(modelPath);
  await faceapi.nets.ageGenderNet.load(modelPath);
  await faceapi.nets.faceLandmark68Net.load(modelPath);
  await faceapi.nets.faceRecognitionNet.load(modelPath);
  await faceapi.nets.faceExpressionNet.load(modelPath);
  optionsSSDMobileNet = new faceapi.SsdMobilenetv1Options({ minConfidence: minScore, maxResults });
  log(`Models loaded: ${str(faceapi.tf.engine().state.numTensors)} tensors`);
}

// Main function to initialize the system
async function main() {
  log('FaceAPI WebCam Test');

  // Set up button listeners
  document.getElementById('aviatorBtn').addEventListener('click', () => {
    setCurrentFilter('aviator');
    console.log('Aviator filter selected');
  });
  document.getElementById('catEyeBtn').addEventListener('click', () => {
    setCurrentFilter('cat_eye');
    console.log('Cat Eye filter selected');
  });
  document.getElementById('circleBtn').addEventListener('click', () => {
    setCurrentFilter('circle');
    console.log('Circle filter selected');
  });
  document.getElementById('ovalBtn').addEventListener('click', () => {
    setCurrentFilter('oval');
    console.log('Oval filter selected');
  });
  document.getElementById('rectangleBtn').addEventListener('click', () => {
    setCurrentFilter('rectangle');
    console.log('Rectangle filter selected');
  });
  document.getElementById('findShopBtn').addEventListener('click', () => {
    console.log('Finding nearest spectacle shops...');
    findNearestSpectacleShops();
  });

  // Set backend to WebGL and initialize TensorFlow.js
  await faceapi.tf.setBackend('webgl');
  await faceapi.tf.ready();

  // TensorFlow.js optimizations
  if (faceapi.tf?.env().flagRegistry.CANVAS2D_WILL_READ_FREQUENTLY) faceapi.tf.env().set('CANVAS2D_WILL_READ_FREQUENTLY', true);
  if (faceapi.tf?.env().flagRegistry.WEBGL_EXP_CONV) faceapi.tf.env().set('WEBGL_EXP_CONV', true);

  log(`Version: FaceAPI ${str(faceapi?.version || '(not loaded)')} TensorFlow/JS ${str(faceapi.tf?.version_core || '(not loaded)')} Backend: ${str(faceapi.tf?.getBackend() || '(not loaded)')}`);

  await setupFaceAPI();
  await preloadFilterImages(); // Preload filter images
  await setupCamera();
}

// Start processing as soon as page is loaded
window.onload = main;

// Detect face shapes in the video feed
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
