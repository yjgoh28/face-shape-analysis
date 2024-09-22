let customFilterImage = null;
let customFilterPath = null;

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
        customFilterPath = result.imageUrl;
        
        // Preload the custom filter image
        customFilterImage = await createFilterImage(result.imageUrl);
        console.log('Custom filter image created:', customFilterImage);
        
        // Show the custom filter button
        document.getElementById('customFilterBtn').style.display = 'inline-block';

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
        const storedCustomFilterPath = localStorage.getItem('customFilterPath');
        console.log('Custom filter path from localStorage:', storedCustomFilterPath);
        if (storedCustomFilterPath) {
            customFilterImage = createFilterImage(storedCustomFilterPath);
            console.log('Custom filter created:', customFilterImage);
        } else {
            console.log('No custom filter path found');
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
    const token = localStorage.getItem('token');
    if (token) {
        try {
            const response = await fetch('http://localhost:5001/api/user-filter', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                if (data.hasCustomFilter && data.customFilterPath) {
                    localStorage.setItem('hasCustomFilter', 'true');
                    localStorage.setItem('customFilterPath', data.customFilterPath);
                    customFilterPath = data.customFilterPath;
                    await getCustomFilter();
                }
            }
        } catch (error) {
            console.error('Error loading custom filter:', error);
        }
    }
}

// Modify this function to only clear local cache
export function clearCustomFilterData() {
    customFilterImage = null;
    customFilterPath = null;
}

// Add this new function
export async function removeCustomFilter() {
    const token = localStorage.getItem('token');
    if (!token) {
        console.error('No token found');
        alert('No authentication token found. Please log in again.');
        return;
    }

    try {
        const response = await fetch('http://localhost:5001/api/user-filter', {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Custom filter removed:', data);

        // Clear local storage and cache
        localStorage.removeItem('hasCustomFilter');
        localStorage.removeItem('customFilterPath');
        clearCustomFilterData();

        // Hide the custom filter button
        document.getElementById('customFilterBtn').style.display = 'none';

        alert('Custom filter removed successfully');
    } catch (error) {
        console.error('Error removing custom filter:', error);
        alert(`Failed to remove custom filter: ${error.message}`);
    }
}