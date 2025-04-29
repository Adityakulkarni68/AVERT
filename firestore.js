// firestore.js
// Placeholder Firestore logic for attendance app

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, Timestamp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

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
  try {
    const studentsRef = collection(db, "students");
    const querySnapshot = await getDocs(studentsRef);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching students:", error);
    return [];
  }
}

export async function markAttendance(rollNo, status) {
  try {
    const studentRef = doc(db, "students", rollNo);
    const studentDoc = await getDoc(studentRef);
    
    if (!studentDoc.exists()) {
      throw new Error("Student not found");
    }

    const now = Timestamp.now();
    const isLate = status === 'late' || (status === 'present' && isAttendanceLate(now));
    
    // Update the student document with attendance info
    await setDoc(studentRef, {
      ...studentDoc.data(),
      lastAttendance: {
        timestamp: now,
        status: isLate ? 'late' : 'present',
        date: new Date().toISOString().split('T')[0]
      }
    }, { merge: true });
    
    return { 
      success: true, 
      isLate,
      status: isLate ? 'late' : 'present',
      timestamp: now
    };
  } catch (error) {
    console.error("Error marking attendance:", error);
    return { success: false, error: error.message };
  }
}

export async function getFlaggedStudents() {
  try {
    const studentsRef = collection(db, "students");
    const querySnapshot = await getDocs(studentsRef);
    
    const flaggedStudents = [];
    querySnapshot.forEach(doc => {
      const student = doc.data();
      if (student.lastAttendance && student.lastAttendance.status === 'late') {
        flaggedStudents.push({
          ...student,
          rollNo: doc.id,
          markedTime: student.lastAttendance.timestamp.toDate().toLocaleString()
        });
      }
    });
    
    return flaggedStudents;
  } catch (error) {
    console.error("Error fetching flagged students:", error);
    return [];
  }
}

function isAttendanceLate(timestamp) {
  const now = new Date();
  const attendanceTime = timestamp.toDate();
  const minutesLate = (now - attendanceTime) / (1000 * 60);
  return minutesLate > ALLOWED_TIME;
} 