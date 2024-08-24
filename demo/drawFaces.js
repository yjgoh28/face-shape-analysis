import { filterImages } from './filterUtils.js';
import { TopLeftEyePosition } from './webcam.js';

// Add this function outside of drawFaces
function drawFilterOnFace(ctx, shape, person) {
  let filterImg;
  switch (shape) {
    case 'Oval':
      filterImg = filterImages.aviator;
      break;
    case 'Long':
      filterImg = filterImages.long_filter;
      break;
    // Add more cases for other face shapes
    default:
      filterImg = filterImages.circle;
  }

  if (filterImg) {
    const { x, y, width, height } = person.detection.box;
    ctx.drawImage(filterImg, TopLeftEyePosition.x - 100, TopLeftEyePosition.y - 110, width, height - 100);
  }
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
    ctx.fillText(`Face Shape: ${shapes}`, person.detection.box.x, person.detection.box.y - 41);
    ctx.fillText(`Recommended Frames: `, person.detection.box.x, person.detection.box.y - 23);
    ctx.fillText(`${recommendation}`, person.detection.box.x, person.detection.box.y - 5);

    ctx.fillStyle = 'lightblue';
    ctx.fillText(`Gender: ${Math.round(100 * person.genderProbability)}% ${person.gender}`, person.detection.box.x, person.detection.box.y - 114);
    ctx.fillText(`Expression: ${Math.round(100 * expression[0][1])}% ${expression[0][0]}`, person.detection.box.x, person.detection.box.y - 96);
    ctx.fillText(`Age: ${Math.round(person.age)} years`, person.detection.box.x, person.detection.box.y - 78);
    ctx.fillText(`Roll: ${person.angle.roll}° Pitch:${person.angle.pitch}° Yaw:${person.angle.yaw}°`, person.detection.box.x, person.detection.box.y - 60);
    ctx.fillText(`Face Shape: ${shapes}`, person.detection.box.x, person.detection.box.y - 42);
    ctx.fillText(`Recommended Frames: `, person.detection.box.x, person.detection.box.y - 24);
    ctx.fillText(`${recommendation}`, person.detection.box.x, person.detection.box.y - 6);

    // draw face points for each face
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = 'lightblue';
    const pointSize = 2;
    for (let i = 0; i < person.landmarks.positions.length; i++) {
      ctx.beginPath();
      ctx.arc(person.landmarks.positions[i].x, person.landmarks.positions[i].y, pointSize, 0, 2 * Math.PI);
      ctx.fill();
    }

    // Draw the filter on the face
    drawFilterOnFace(ctx, shape, person);
  }
}