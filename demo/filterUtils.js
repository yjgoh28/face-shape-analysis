export function createFilterImage(filterName) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = `../filters/${filterName}.png`; // Adjust the path as needed
  });
}

export const filterImages = {
// Used for caching image so that it wouldnt disappear after it got loaded
  aviator: null,
  cat_eye: null,
  circle: null,
  oval: null,
  rectangle: null
};

export async function preloadFilterImages() {
  filterImages.aviator = await createFilterImage('aviator');
  filterImages.cat_eye = await createFilterImage('cat-eye');
  filterImages.circle = await createFilterImage('circle');
  filterImages.oval = await createFilterImage('oval');
  filterImages.rectangle = await createFilterImage('rectangle');
}