let customFilterImage = null;

export async function uploadImage(file) {
    console.log('Uploading image...');
    const formData = new FormData();
    formData.append('image', file);

    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch('http://localhost:5001/api/upload-filter', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error('Failed to upload image');
        }

        const result = await response.json();
        console.log('Upload successful, result:', result);
        
        localStorage.setItem('hasCustomFilter', 'true');
        localStorage.setItem('customFilterPath', result.imageUrl);
        
        // Preload the custom filter image
        customFilterImage = await createFilterImage(result.imageUrl);
        console.log('Custom filter image created:', customFilterImage);
        
        alert('Custom filter uploaded successfully.');
    } catch (error) {
        console.error('Error uploading image:', error);
        alert('Failed to upload image. Please try again.');
        throw error;
    }
}

export function getCustomFilter() {
    console.log('getCustomFilter called');
    if (!customFilterImage) {
        console.log('customFilterImage is null, attempting to load');
        const customFilterPath = localStorage.getItem('customFilterPath');
        console.log('Custom filter path from localStorage:', customFilterPath);
        if (customFilterPath) {
            customFilterImage = createFilterImage(customFilterPath);
            console.log('Custom filter created:', customFilterImage);
        } else {
            console.log('No custom filter path found in localStorage');
            return null;
        }
    } else {
        console.log('Using cached customFilterImage');
    }
    
    return customFilterImage;
}

function createFilterImage(imageUrl) {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = `http://localhost:5001/${imageUrl}`;
    console.log('Loading filter image from:', img.src);
    return img;
}

export async function loadCustomFilterOnStartup() {
    console.log('Loading custom filter on startup...');
    const hasCustomFilter = localStorage.getItem('hasCustomFilter') === 'true';
    if (hasCustomFilter) {
        await getCustomFilter();
    }
}