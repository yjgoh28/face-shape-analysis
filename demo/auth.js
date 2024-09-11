// Simple in-memory storage for demo purposes
let users = [];

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login');
    const registerForm = document.getElementById('register');
    const showRegisterLink = document.getElementById('showRegister');
    const showLoginLink = document.getElementById('showLogin');

    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (registerForm) registerForm.addEventListener('submit', handleRegister);
    if (showRegisterLink) showRegisterLink.addEventListener('click', toggleForms);
    if (showLoginLink) showLoginLink.addEventListener('click', toggleForms);
});

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch('http://localhost:5001/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('role', data.role);
            console.log('Token stored:', data.token);
            console.log('Role stored:', data.role);
            window.location.href = 'webcam.html';
        } else {
            throw new Error(data.message || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        showErrorModal(error.message);
        document.getElementById('loginPassword').value = '';
    }
}

// Make handleLogin available globally
window.handleLogin = handleLogin;

async function handleRegister(e) {
    e.preventDefault();
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const isAdmin = document.getElementById('registerAsAdmin').checked;
    const adminSecret = isAdmin ? document.getElementById('adminSecret').value : null;

    try {
        const response = await fetch('http://localhost:5001/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                email, 
                password, 
                role: isAdmin ? 'admin' : 'user',
                adminSecret
            }),
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('role', data.role);
            window.location.href = 'webcam.html';
        } else {
            throw new Error(data.message || 'Registration failed');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showErrorModal(error.message);
        // Clear the form
        document.getElementById('registerEmail').value = '';
        document.getElementById('registerPassword').value = '';
        if (document.getElementById('adminSecret')) {
            document.getElementById('adminSecret').value = '';
        }
    }
}

// Make handleRegister available globally
window.handleRegister = handleRegister;

function toggleForms() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    loginForm.style.display = loginForm.style.display === 'none' ? 'block' : 'none';
    registerForm.style.display = registerForm.style.display === 'none' ? 'block' : 'none';
}

// Make toggleForms available globally
window.toggleForms = toggleForms;

export function logout() {
    localStorage.removeItem('token');
    window.location.href = 'auth.html';
}

// Make logout available globally
window.logout = logout;

function showErrorModal(message) {
    const modal = document.getElementById('errorModal');
    const errorMessage = document.getElementById('errorMessage');
    const closeBtn = document.getElementsByClassName('close')[0];

    errorMessage.textContent = message;
    modal.style.display = 'block';

    closeBtn.onclick = function() {
        modal.style.display = 'none';
    }

    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    }
}