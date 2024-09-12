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
            
            // Update the delete button
            const deleteCell = row.insertCell(3);
            const deleteButton = document.createElement('button');
            deleteButton.innerHTML = '&#10005;'; // X icon
            deleteButton.className = 'delete-btn';
            deleteButton.onclick = () => deleteUser(user._id);
            deleteCell.appendChild(deleteButton);

            console.log('Added row for user:', user.email);
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