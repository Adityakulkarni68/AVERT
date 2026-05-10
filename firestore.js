// firestore.js
// Placeholder Firestore logic for attendance app

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, Timestamp, updateDoc, increment } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBMQ3K52qhUHZtoq3qRdm7Qhsrq47wBHSo",
  authDomain: "avert-86ef6.firebaseapp.com",
  projectId: "avert-86ef6",
  storageBucket: "avert-86ef6.firebasestorage.app",
  messagingSenderId: "813023959298",
  appId: "1:813023959298:web:717a961badc8109fc94a1b"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Constants
const ALLOWED_TIME = 30; // minutes after which attendance is considered late

export async function getAssignedStudents() {
  const studentsSnapshot = await getDocs(collection(db, "students"));
  return studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function markAttendance(rollNo, status) {
  try {
    const studentRef = doc(db, "students", rollNo);
    const studentDoc = await getDoc(studentRef);
    const studentData = studentDoc.data();
    
    const updates = {
      lastAttendance: {
        timestamp: new Date(),
        status: status,
        date: new Date().toISOString().split('T')[0]
      }
    };
    
    // Increment late count if status is late
    if (status === 'late') {
      updates.lateCount = increment(1);
    }
    
    await updateDoc(studentRef, updates);
    return { success: true };
  } catch (error) {
    console.error('Error marking attendance:', error);
    return { success: false, error: error.message };
  }
}

export async function getFlaggedStudents() {
  const studentsSnapshot = await getDocs(collection(db, "students"));
  return studentsSnapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(student => student.lastAttendance?.status === 'late');
}

export async function getSeriousOffenders() {
  const studentsSnapshot = await getDocs(collection(db, "students"));
  return studentsSnapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(student => student.lateCount >= 5);
}

function isAttendanceLate(timestamp) {
  const now = new Date();
  const attendanceTime = timestamp.toDate();
  const minutesLate = (now - attendanceTime) / (1000 * 60);
  return minutesLate > ALLOWED_TIME;
} 