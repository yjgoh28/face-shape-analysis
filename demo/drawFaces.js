import { filterImages } from './filterUtils.js';
import { TopLeftEyePosition } from './webcam.js';
import { log } from './webcam.js';
import { getFilterHue } from './colorSlider.js';
import { getCustomFilter } from './imageUpload.js';

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
  console.log('Setting current filter to:', filterName);
  currentFilter = filterName;
  // Force a redraw of the filter
  requestAnimationFrame(() => drawFilterOnFace());
}

export function getCurrentFilter() {
  return currentFilter;
}

export function drawFilterOnFace() {
  // console.log('drawFilterOnFace called');
  const { ctxvalue, personvalue } = getValues();
  
  if (!ctxvalue || !personvalue) {
    console.error('ctxvalue or personvalue is null');
    return;
  }

  let img;
  const currentFilter = getCurrentFilter();
  // console.log('Current filter:', currentFilter);
  
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
    case 'custom':
      img = getCustomFilter();
      console.log('Custom filter image:', img);
      if (!img) {
        console.error('Custom filter not available');
        return;
      }
      break;
    default:
      console.error('Unknown filter type:', currentFilter);
      return;
  }

  if (!img) {
    console.error('Filter image is null for', currentFilter);
    return;
  }

  if (!(img instanceof HTMLImageElement)) {
    console.error('Invalid filter image type for', currentFilter, 'Type:', typeof img);
    return;
  }

  if (!img.complete) {
    console.error('Filter image not fully loaded for', currentFilter);
    return;
  }

  // console.log('Filter image dimensions:', img.width, 'x', img.height);

  // Rest of the function remains the same
  const { x, y, width, height } = personvalue.detection.box;
  
  const leftEye = personvalue.landmarks.getLeftEye()[0];
  const rightEye = personvalue.landmarks.getRightEye()[3];
  
  const eyeDistance = rightEye.x - leftEye.x;

  let filterWidth, filterHeight;
  
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
  
  const filterX = leftEye.x - (filterWidth - eyeDistance) / 2;
  const filterY = leftEye.y - filterHeight / 1.95;

  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = filterWidth;
  tempCanvas.height = filterHeight;
  const tempCtx = tempCanvas.getContext('2d');

  tempCtx.drawImage(img, 0, 0, filterWidth, filterHeight);

  const imageData = tempCtx.getImageData(0, 0, filterWidth, filterHeight);
  const data = imageData.data;

  const hue = getFilterHue();
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] > 0) {
      const lightness = hue === 0 ? 0 : 0.5;
      const [r, g, b] = hslToRgb(hue / 360, 1, lightness);
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
    }
  }

  tempCtx.putImageData(imageData, 0, 0);

  ctxvalue.drawImage(tempCanvas, filterX, filterY, filterWidth, filterHeight);

  // console.log('Filter drawn successfully');
}

// Helper function to convert HSL to RGB
function hslToRgb(h, s, l) {
  let r, g, b;

  if (s === 0 || l === 0) {
    r = g = b = l; // achromatic or black
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

export function drawFaces(canvas, data, fps, shapes, recommendation) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.font = 'normal 20px "Segoe UI"';
  ctx.fillStyle = 'white';

  for (let i = 0; i < data.length; i++) {
    const person = data[i];
    const shape = shapes[i];

    ctx.lineWidth = 3;
    ctx.strokeStyle = 'deepskyblue';
    ctx.fillStyle = 'deepskyblue';
    ctx.globalAlpha = 0.6;
    ctx.beginPath();

    ctx.stroke();
    ctx.globalAlpha = 1;

    ctx.fillStyle = 'lightblue';
    ctx.fillText(`Face Shape: ${shapes}`, person.detection.box.x, person.detection.box.y - 42);
    ctx.fillText(`Recommended Frames: `, person.detection.box.x, person.detection.box.y - 24);
    ctx.fillText(`${recommendation}`, person.detection.box.x, person.detection.box.y - 6);

    updateValues(ctx, person);

    ctx.globalAlpha = 0.8;
    ctx.fillStyle = 'lightblue';
    const pointSize = 2;

    for (let i = 0; i < person.landmarks.positions.length; i++) {
      ctx.beginPath();
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
        default:
          setCurrentFilter('circle');
      }
      previousShape = currentShape;
    }

    // Call drawFilterOnFace here
    drawFilterOnFace();
  }
}