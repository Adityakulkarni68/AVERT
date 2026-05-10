import { auth, signInWithEmailAndPassword, db } from './firebase.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const loginButton = document.getElementById('loginButton');

// Get role from URL parameter
const urlParams = new URLSearchParams(window.location.search);
const currentRole = urlParams.get('role') || 'teacher';

// Update page title based on role
document.title = `${currentRole.charAt(0).toUpperCase() + currentRole.slice(1)} Login`;

// Add error message element if it doesn't exist
if (!loginError) {
    const errorDiv = document.createElement('div');
    errorDiv.id = 'loginError';
    errorDiv.className = 'error-message';
    errorDiv.style.display = 'none';
    loginForm.parentNode.insertBefore(errorDiv, loginForm.nextSibling);
}

// Track failed attempts in localStorage to persist across page reloads
let failedAttempts = parseInt(localStorage.getItem('failedAttempts') || '0');
const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes in milliseconds

function disableLoginButton() {
    if (loginButton) {
        loginButton.disabled = true;
        loginButton.textContent = 'Please wait 15 minutes';
        const unlockTime = Date.now() + LOCKOUT_TIME;
        localStorage.setItem('unlockTime', unlockTime.toString());
        
        // Check every minute if the lockout period has ended
        const checkInterval = setInterval(() => {
            const now = Date.now();
            const unlockTime = parseInt(localStorage.getItem('unlockTime') || '0');
            
            if (now >= unlockTime) {
                clearInterval(checkInterval);
                if (loginButton) {
                    loginButton.disabled = false;
                    loginButton.textContent = 'Login';
                }
                failedAttempts = 0;
                localStorage.removeItem('failedAttempts');
                localStorage.removeItem('unlockTime');
            }
        }, 60000);
    }
}

// Check if user is still in lockout period
function checkLockoutStatus() {
    const unlockTime = parseInt(localStorage.getItem('unlockTime') || '0');
    if (unlockTime && Date.now() < unlockTime) {
        disableLoginButton();
        return true;
    }
    return false;
}

// Initialize lockout check
checkLockoutStatus();

// Debug function to log Firebase configuration
function logFirebaseConfig() {
    console.log('Firebase Config:', {
        apiKey: auth.app.options.apiKey,
        authDomain: auth.app.options.authDomain,
        projectId: auth.app.options.projectId
    });
}

// Call debug function
logFirebaseConfig();

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Check if button is disabled
    if (loginButton && loginButton.disabled) {
        return;
    }

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    
    try {
        // Show loading state
        if (loginButton) {
            loginButton.disabled = true;
            loginButton.textContent = 'Logging in...';
        }

        // Validate email format
        if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            throw new Error('Please enter a valid email address');
        }

        // Validate password
        if (password.length < 6) {
            throw new Error('Password must be at least 6 characters long');
        }

        console.log('Attempting login with:', { email, passwordLength: password.length });

        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('Login successful:', userCredential);
        
        const user = userCredential.user;
        
        // Get the user's role from Firestore using email as document ID
        const userDoc = await getDoc(doc(db, "teachers", email));
        
        if (!userDoc.exists()) {
            throw new Error('User data not found');
        }
        
        const userData = userDoc.data();
        console.log('User data:', userData);
        
        // Check if the user's role matches the selected role
        if (userData.role !== currentRole) {
            throw new Error(`Please login as ${userData.role}`);
        }
        
        // Reset failed attempts on successful login
        failedAttempts = 0;
        localStorage.removeItem('failedAttempts');
        localStorage.removeItem('unlockTime');
        
        // Redirect based on role
        if (userData.role === 'admin') {
            window.location.href = 'admin.html';
        } else {
            window.location.href = 'teacher_home.html';
        }
    } catch (error) {
        console.error('Login error:', error);
        
        // Handle specific Firebase errors
        let errorMessage = 'An error occurred during login.';
        
        if (error.code === 'auth/too-many-requests') {
            errorMessage = 'Too many failed attempts. Please try again later.';
            disableLoginButton();
            // Clear any existing lockout timers
            localStorage.setItem('unlockTime', (Date.now() + LOCKOUT_TIME).toString());
        } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
            failedAttempts++;
            localStorage.setItem('failedAttempts', failedAttempts.toString());
            errorMessage = 'Invalid email or password.';
            
            if (failedAttempts >= MAX_ATTEMPTS) {
                disableLoginButton();
            }
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Invalid email format.';
        } else if (error.code === 'auth/network-request-failed') {
            errorMessage = 'Network error. Please check your connection.';
        } else if (error.code === 'auth/operation-not-allowed') {
            errorMessage = 'Email/password accounts are not enabled. Please contact support.';
        } else if (error.code === 'auth/invalid-api-key') {
            errorMessage = 'Authentication configuration error. Please contact support.';
        } else {
            errorMessage = error.message;
        }
        
        // Update error message
        const errorElement = document.getElementById('loginError');
        if (errorElement) {
            errorElement.textContent = errorMessage;
            errorElement.style.display = 'block';
        }
        
        // Reset button state
        if (loginButton) {
            loginButton.disabled = false;
            loginButton.textContent = 'Login';
        }
    }
}); 