let brightnessWarningDisplayed = false;

function calculateBrightness(imageData) {
    let r, g, b, avg;
    let colorSum = 0;
    for(let x = 0, len = imageData.data.length; x < len; x += 4) {
        r = imageData.data[x];
        g = imageData.data[x+1];
        b = imageData.data[x+2];

        avg = Math.floor((r + g + b) / 3);
        colorSum += avg;
    }

    let brightness = Math.floor(colorSum / (imageData.width * imageData.height));
    return brightness;
}

function displayBrightnessWarning() {
    if (!brightnessWarningDisplayed) {
        const warningDiv = document.createElement('div');
        warningDiv.id = 'brightnessWarning';
        warningDiv.style.position = 'fixed';
        warningDiv.style.top = '20px';
        warningDiv.style.left = '50%';
        warningDiv.style.transform = 'translateX(-50%)';
        warningDiv.style.backgroundColor = 'rgba(255, 255, 0, 0.8)';
        warningDiv.style.color = 'black';
        warningDiv.style.padding = '10px';
        warningDiv.style.borderRadius = '5px';
        warningDiv.style.zIndex = '1000';
        warningDiv.textContent = 'Please ensure the surrounding area is bright enough for optimal face detection.';
        
        document.body.appendChild(warningDiv);
        brightnessWarningDisplayed = true;
    }
}

function hideBrightnessWarning() {
    const warningDiv = document.getElementById('brightnessWarning');
    if (warningDiv) {
        warningDiv.remove();
        brightnessWarningDisplayed = false;
    }
}

function checkBrightness() {
    const video = document.getElementById('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    const brightness = calculateBrightness(imageData);
    
    // You can adjust this threshold as needed
    const brightnessThreshold = 100;

    if (brightness < brightnessThreshold) {
        displayBrightnessWarning();
    } else {
        hideBrightnessWarning();
    }
}

function startBrightnessCheck() {
    setInterval(checkBrightness, 1000); // Check every second
}

export { startBrightnessCheck };