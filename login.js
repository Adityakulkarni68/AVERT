import { auth, signInWithEmailAndPassword, db } from './firebase.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
let currentRole = 'teacher';

// Update currentRole when role buttons are clicked
document.getElementById('teacherBtn').addEventListener('click', () => {
  currentRole = 'teacher';
});

document.getElementById('adminBtn').addEventListener('click', () => {
  currentRole = 'admin';
});

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Get the user's role from Firestore using email as document ID
    const userDoc = await getDoc(doc(db, "teachers", email));
    
    if (!userDoc.exists()) {
      throw new Error('User data not found');
    }
    
    const userData = userDoc.data();
    
    // Check if the user's role matches the selected role
    if (userData.role !== currentRole) {
      throw new Error(`Please login as ${userData.role}`);
    }
    
    // Redirect based on role
    if (userData.role === 'admin') {
      window.location.href = 'admin.html';
    } else {
      window.location.href = 'teacher_home.html';
    }
  } catch (error) {
    console.error('Login error:', error);
    loginError.textContent = error.message;
    loginError.style.display = 'block';
  }
}); 