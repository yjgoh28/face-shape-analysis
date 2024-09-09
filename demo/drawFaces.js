import { filterImages } from './filterUtils.js';
import { TopLeftEyePosition } from './webcam.js';
import { log } from './webcam.js';



let currentFilter = 'circle';
let ctxvalue = null;
let personvalue = null;
let previousShape = null;

const toplefteyebrowvalue = 1;


function updateValues(newCtxValue, newPersonValue) {
  ctxvalue = newCtxValue;
  personvalue = newPersonValue;
}

function getValues() {
  return { ctxvalue, personvalue };
}

export function setCurrentFilter(filterName) {
  currentFilter = filterName;
}

export function getCurrentFilter() {
  return currentFilter;
}


export function drawFilterOnFace() {
  const { ctxvalue, personvalue } = getValues();
  
  let img;
  const currentFilter = getCurrentFilter();
  switch (currentFilter) {
    case 'aviator':
      img = filterImages.aviator;
      break;
    case 'cat_eye':
      img = filterImages.cat_eye;
      break;
    case 'circle':
      img = filterImages.circle;
      break;
    case 'oval':
      img = filterImages.oval;
      break;
    case 'rectangle':
      img = filterImages.rectangle;
      break;
    default:
      console.error('Unknown filter type');
      return;
  }

  const { x, y, width, height } = personvalue.detection.box;
  
  // Use specific landmark points for positioning
  const leftEye = personvalue.landmarks.getLeftEye()[0];
  const rightEye = personvalue.landmarks.getRightEye()[3];
  
  // Calculate filter dimensions based on face size
  let filterWidth, filterHeight;
  
  // Calculate the distance between eyes
  const eyeDistance = rightEye.x - leftEye.x;

  // Adjust filter size based on the filter type and eye distance
  switch (currentFilter) {
    case 'rectangle':
      filterWidth = eyeDistance * 2;
      filterHeight = filterWidth * 0.6;
      break;
    case 'aviator':
      filterWidth = eyeDistance * 2;
      filterHeight = filterWidth * 0.5;
      break;
    case 'cat_eye':
      filterWidth = eyeDistance * 1.5;
      filterHeight = filterWidth * 0.45;
      break;
    case 'circle':
      filterWidth = eyeDistance * 1.5;
      filterHeight = filterWidth * 0.65;
      break;
    case 'oval':
      filterWidth = eyeDistance * 1.5;
      filterHeight = filterWidth * 1.5;
      break;
    default:
      filterWidth = eyeDistance * 1.5;
      filterHeight = filterWidth * (img.height / img.width);
  }
  
  // Position the filter centered between the eyes
  const filterX = leftEye.x - (filterWidth - eyeDistance) / 2;
  const filterY = leftEye.y - filterHeight / 1.95; // Adjust this value to move the filter up or down

  // Draw the image with calculated dimensions
  ctxvalue.drawImage(img, filterX, filterY, filterWidth, filterHeight);
}


export function drawFaces(canvas, data, fps, shapes, recommendation) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // draw title
  ctx.font = 'normal 20px "Segoe UI"';
  ctx.fillStyle = 'white';
  ctx.fillText(`FPS: ${fps}`, 10, 25);

  for (let i = 0; i < data.length; i++) {
    const person = data[i];
    const shape = shapes[i];
    // draw box around each face
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'deepskyblue';
    ctx.fillStyle = 'deepskyblue';
    ctx.globalAlpha = 0.6;
    ctx.beginPath();

    // draw the detection box around face
    // ctx.rect(person.detection.box.x, person.detection.box.y, person.detection.box.width, person.detection.box.height);
    ctx.stroke();
    ctx.globalAlpha = 1;
    // draw text labels
    const expression = Object.entries(person.expressions).sort((a, b) => b[1] - a[1]);



    ctx.fillStyle = 'lightblue';
    ctx.fillText(`Face Shape: ${shapes}`, person.detection.box.x, person.detection.box.y - 42);
    ctx.fillText(`Recommended Frames: `, person.detection.box.x, person.detection.box.y - 24);
    ctx.fillText(`${recommendation}`, person.detection.box.x, person.detection.box.y - 6);

    updateValues(ctx, person);

    // draw face points for each face
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = 'lightblue';
    const pointSize = 2;

    // const testvalue = 8;
    // const testvalue2 = 57;
    for (let i = 0; i < person.landmarks.positions.length; i++) {
    // for (let i = 35; i < 37; i++) {
    
      ctx.beginPath();
      ctx.arc(person.landmarks.positions[i].x, person.landmarks.positions[i].y, pointSize, 0, 2 * Math.PI);
      
      // ctx.arc(person.landmarks.positions[testvalue].x, person.landmarks.positions[testvalue].y, pointSize, 0, 2 * Math.PI);
      // ctx.arc(person.landmarks.positions[testvalue2].x, person.landmarks.positions[testvalue2].y, pointSize, 0, 2 * Math.PI);
      ctx.fill();
    }

    
    
    
    const currentShape = shapes[i];
    if (currentShape !== previousShape) {
      switch (currentShape) {
        case 'Oval':
          setCurrentFilter('aviator');
          log('aviator filter selected by shape');
          break;
        case 'Long':
          setCurrentFilter('circle');
          log('circle filter selected by shape');         
          break;
        // Add more cases for other face shapes
        default:
          setCurrentFilter('circle');
      }
      previousShape = currentShape;
    }

    // Call drawFilterOnFace here
    drawFilterOnFace();
  }
}