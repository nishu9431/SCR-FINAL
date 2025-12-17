const API_BASE_URL = 'http://localhost:8000';

// Admin credentials (for demo - in production, use secure backend validation)
const ADMIN_CREDENTIALS = {
    email: 'admin@parkpulse.com',
    password: 'admin123'
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Check if already logged in
    const token = localStorage.getItem('adminToken');
    if (token) {
        // Verify token is still valid (optional)
        window.location.href = 'Admin_Dashboard.html';
    }

    // Add form submit handler
    const loginForm = document.getElementById('adminLoginForm');
    loginForm.addEventListener('submit', handleLogin);

    // Add enter key listener on password field
    document.getElementById('password').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleLogin(e);
        }
    });
});

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    
    // Validate inputs
    if (!email || !password) {
        showAlert('Please enter both email and password', 'error');
        return;
    }

    // Show loading state
    setLoading(true);
    
    try {
        // Try API login first
        const response = await fetch(`${API_BASE_URL}/v1/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });

        if (response.ok) {
            const data = await response.json();
            
            // Check if user has admin role
            if (data.user && data.user.role === 'admin') {
                // Store admin token
                if (rememberMe) {
                    localStorage.setItem('adminToken', data.access_token);
                    localStorage.setItem('adminUser', JSON.stringify(data.user));
                } else {
                    sessionStorage.setItem('adminToken', data.access_token);
                    sessionStorage.setItem('adminUser', JSON.stringify(data.user));
                }
                
                showAlert('Login successful! Redirecting...', 'success');
                
                setTimeout(() => {
                    window.location.href = 'Admin_Dashboard.html';
                }, 1500);
            } else {
                showAlert('Unauthorized: Admin access required', 'error');
                setLoading(false);
            }
        } else {
            // If API fails, use demo credentials
            handleDemoLogin(email, password, rememberMe);
        }
    } catch (error) {
        console.error('Login error:', error);
        // Fallback to demo login
        handleDemoLogin(email, password, rememberMe);
    }
}

function handleDemoLogin(email, password, rememberMe) {
    // Demo admin login
    if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
        const adminUser = {
            id: 1,
            email: email,
            name: 'Admin User',
            role: 'admin'
        };
        
        const demoToken = 'demo_admin_token_' + Date.now();
        
        if (rememberMe) {
            localStorage.setItem('adminToken', demoToken);
            localStorage.setItem('adminUser', JSON.stringify(adminUser));
        } else {
            sessionStorage.setItem('adminToken', demoToken);
            sessionStorage.setItem('adminUser', JSON.stringify(adminUser));
        }
        
        showAlert('Login successful! Redirecting...', 'success');
        
        setTimeout(() => {
            window.location.href = 'Admin_Dashboard.html';
        }, 1500);
    } else {
        showAlert('Invalid credentials. Use admin@parkpulse.com / admin123', 'error');
        setLoading(false);
    }
}

function loginWithGoogle() {
    showAlert('Google OAuth for admin is not configured yet', 'error');
    
    // In production, redirect to Google OAuth
    // window.location.href = `${API_BASE_URL}/v1/auth/google?admin=true`;
}

function togglePassword() {
    const passwordInput = document.getElementById('password');
    const eyeIcon = document.getElementById('eyeIcon');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        eyeIcon.setAttribute('data-lucide', 'eye-off');
    } else {
        passwordInput.type = 'password';
        eyeIcon.setAttribute('data-lucide', 'eye');
    }
    
    // Re-initialize Lucide icons
    lucide.createIcons();
}

function showAlert(message, type) {
    const alertDiv = document.getElementById('alertMessage');
    alertDiv.textContent = message;
    alertDiv.className = `alert-message ${type}`;
    alertDiv.style.display = 'flex';
    
    // Auto-hide after 5 seconds for errors
    if (type === 'error') {
        setTimeout(() => {
            alertDiv.style.display = 'none';
        }, 5000);
    }
}

function setLoading(isLoading) {
    const loginBtn = document.getElementById('loginBtn');
    const btnText = loginBtn.querySelector('.btn-text');
    const btnLoader = loginBtn.querySelector('.btn-loader');
    
    if (isLoading) {
        loginBtn.disabled = true;
        btnText.style.display = 'none';
        btnLoader.style.display = 'block';
    } else {
        loginBtn.disabled = false;
        btnText.style.display = 'block';
        btnLoader.style.display = 'none';
    }
}

// Add password strength indicator (optional enhancement)
document.getElementById('password')?.addEventListener('input', (e) => {
    const password = e.target.value;
    // Could add password strength visual feedback here
});
