import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBMQ3K52qhUHZtoq3qRdm7Qhsrq47wBHSo",
  authDomain: "avert-86ef6.firebaseapp.com",
  projectId: "avert-86ef6",
  storageBucket: "avert-86ef6.firebasestorage.app",
  messagingSenderId: "813023959298",
  appId: "1:813023959298:web:717a961badc8109fc94a1b"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, signInWithEmailAndPassword, db }; 