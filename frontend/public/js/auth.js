// Authentication handling
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
});

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorMsg = document.getElementById('errorMessage');

    try {
        const response = await api.auth.login({ email, password });

        // Handle both response structures
        const token = response.data ? response.data.token : response.token;
        const user = response.data ? response.data.user : response.user;

        if (!token || !user) {
            throw new Error('Invalid response from server');
        }

        // Use centralized auth state management
        authState.setAuth(token, user.id);
        window.location.href = 'dashboard.html';
    } catch (error) {
        errorMsg.textContent = error.message;
        errorMsg.classList.remove('hidden');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const displayName = document.getElementById('displayName').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const errorMsg = document.getElementById('errorMessage');
    const successMsg = document.getElementById('successMessage');

    // Client-side validation
    if (password !== confirmPassword) {
        errorMsg.textContent = 'Passwords do not match';
        errorMsg.classList.remove('hidden');
        return;
    }

    // Check password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
        errorMsg.textContent = 'Password must be at least 8 characters with uppercase, lowercase, and number';
        errorMsg.classList.remove('hidden');
        return;
    }

    try {
        const response = await api.auth.register({ displayName, email, password });

        // Handle both response structures
        const token = response.data ? response.data.token : response.token;
        const user = response.data ? response.data.user : response.user;

        if (!token || !user) {
            throw new Error('Invalid response from server');
        }

        // Use centralized auth state management
        authState.setAuth(token, user.id);
        successMsg.textContent = 'Account created successfully! Redirecting...';
        successMsg.classList.remove('hidden');
        errorMsg.classList.add('hidden');
        setTimeout(() => window.location.href = 'dashboard.html', 2000);
    } catch (error) {
        // Parse error message for better display
        let errorText = error.message;
        if (error.message.includes('Validation failed')) {
            errorText = 'Please check your input. Password must have uppercase, lowercase, and number.';
        } else if (error.message.includes('already exists')) {
            errorText = 'An account with this email already exists.';
        } else if (error.message.includes('Network')) {
            errorText = 'Unable to connect to server. Please check if the backend is running.';
        }

        errorMsg.textContent = errorText;
        errorMsg.classList.remove('hidden');
        successMsg.classList.add('hidden');
    }
}

// Global logout function
window.logout = function () {
    console.log('Logout function called');
    // Get token before clearing (for API call)
    const token = authState.getToken();

    // Clear authentication state
    authState.clearAuth();

    // Call logout API endpoint (optional, but good practice)
    if (token) {
        fetch('http://localhost:3000/api/auth/logout', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        }).catch(err => console.log('Logout API call failed (not critical)', err));
    }

    // Redirect to homepage
    window.location.href = 'index.html';
};
