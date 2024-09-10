let filterHue = 0;

export function initColorSlider() {
    const hueSlider = document.getElementById('hue');

    function updateColor() {
        filterHue = parseInt(hueSlider.value);
    }

    hueSlider.addEventListener('input', updateColor);
}

export function getFilterHue() {
    return filterHue;
}