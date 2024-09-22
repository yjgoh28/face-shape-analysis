export function initUserDashboard() {
    const userDashboardBtn = document.getElementById('userDashboardBtn');
    const userDashboardOverlay = document.getElementById('userDashboardOverlay');
    const closeDashboardBtn = document.getElementById('closeDashboardBtn');
    
    // Show the user dashboard button for all users
    userDashboardBtn.style.display = 'inline-block';
    userDashboardBtn.addEventListener('click', () => {
        console.log('User dashboard button clicked');
        userDashboardOverlay.style.display = 'block';
        console.log('User dashboard overlay display set to block');
        fetchUsers();
    });

    closeDashboardBtn.addEventListener('click', () => {
        console.log('Close dashboard button clicked');
        userDashboardOverlay.style.display = 'none';
    });
}

export async function fetchUsers() {
    const token = localStorage.getItem('token');
    console.log('Retrieved token:', token);
    if (!token) {
        console.error('No token found');
        alert('No authentication token found. Please log in again.');
        return;
    }

    try {
        const response = await fetch('http://localhost:5001/api/users', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Received data:', data);

        const tableBody = document.getElementById('userTableBody');
        console.log('Table body element:', tableBody);
        tableBody.innerHTML = ''; // Clear existing rows

        data.forEach(user => {
            const row = tableBody.insertRow();
            row.insertCell(0).textContent = user.email;
            row.insertCell(1).textContent = user.role;
            row.insertCell(2).textContent = user.customFilter ? 'Yes' : 'No';
            
            // Add new cell for custom filter image
            const filterCell = row.insertCell(3);
            if (user.customFilter) {
                const img = document.createElement('img');
                img.src = `http://localhost:5001/${user.customFilter}`; // Adjust the URL as needed
                img.alt = 'Custom Filter';
                img.style.width = '50px'; // Adjust size as needed
                img.style.height = 'auto';
                filterCell.appendChild(img);

                // Add remove custom filter button
                const removeFilterBtn = document.createElement('button');
                removeFilterBtn.textContent = 'Remove Filter';
                removeFilterBtn.onclick = () => removeCustomFilter(user._id);
                filterCell.appendChild(removeFilterBtn);
            } else {
                filterCell.textContent = 'No custom filter';
            }
            
            // Update the delete button (now in the 5th column)
            const deleteCell = row.insertCell(4);
            const deleteButton = document.createElement('button');
            deleteButton.innerHTML = '&#10005;'; // X icon
            deleteButton.className = 'delete-btn';
            deleteButton.onclick = () => deleteUser(user._id);
            deleteCell.appendChild(deleteButton);

            console.log('Added row for user:', user.email)
        });

        console.log('Finished populating table');
    } catch (error) {
        console.error('Error fetching users:', error);
        alert(`Failed to load user data: ${error.message}`);
    }
}

async function deleteUser(userId) {
    const token = localStorage.getItem('token');
    if (!token) {
        console.error('No token found');
        alert('No authentication token found. Please log in again.');
        return;
    }

    if (!confirm('Are you sure you want to delete this user?')) {
        return;
    }

    try {
        const response = await fetch(`http://localhost:5001/api/users/${userId}`, {
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
        console.log('User deleted:', data);
        alert('User deleted successfully');
        
        // Refresh the user list
        fetchUsers();
    } catch (error) {
        console.error('Error deleting user:', error);
        alert(`Failed to delete user: ${error.message}`);
    }
}

// New function to remove custom filter
async function removeCustomFilter(userId) {
    if (!confirm('Are you sure you want to remove this user\'s custom filter?')) {
        return;
    }

    try {
        const response = await fetch(`http://localhost:5001/api/user-filter/${userId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Custom filter removed:', data);
        alert('Custom filter removed successfully');
        
        // Refresh the user list
        fetchUsers();
    } catch (error) {
        console.error('Error removing custom filter:', error);
        alert(`Failed to remove custom filter: ${error.message}`);
    }
}