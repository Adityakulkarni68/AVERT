import { db } from './firebase.js';
import { collection, onSnapshot, doc, updateDoc, increment, getDoc, query, where } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

// Load students data
function loadStudents() {
  const studentsTable = document.getElementById('studentsTable').getElementsByTagName('tbody')[0];
  const messageDiv = document.getElementById('message');
  const selectedDate = document.getElementById('attendanceDate').value;

  // Listen for real-time updates
  onSnapshot(collection(db, "students"), (snapshot) => {
    studentsTable.innerHTML = '';
    messageDiv.style.display = 'none';

    if (snapshot.empty) {
      messageDiv.textContent = 'No students found';
      messageDiv.style.display = 'block';
      return;
    }

    snapshot.forEach(doc => {
      const student = doc.data();
      const row = studentsTable.insertRow();
      
      // Check if attendance is already marked for the selected date
      const attendanceForDate = student.attendanceHistory?.find(record => record.date === selectedDate);
      const status = attendanceForDate?.status || 'unmarked';
      
      row.innerHTML = `
        <td>${student.name}</td>
        <td>${student.rollNo}</td>
        <td>${student.branch}</td>
        <td>${student.section}</td>
        <td class="status-${status}">
          ${status.charAt(0).toUpperCase() + status.slice(1)}
        </td>
        <td>
          <div class="btn-group">
            <button class="btn" onclick="markAttendance('${doc.id}', 'present', '${selectedDate}')" ${status !== 'unmarked' ? 'disabled' : ''}>Present</button>
            <button class="btn" onclick="markAttendance('${doc.id}', 'late', '${selectedDate}')" ${status !== 'unmarked' ? 'disabled' : ''}>Late</button>
          </div>
        </td>
      `;
    });
  }, (error) => {
    console.error('Error loading students:', error);
    messageDiv.textContent = 'Error loading students';
    messageDiv.style.display = 'block';
  });
}

// Load attendance history
function loadAttendanceHistory() {
  const historyTable = document.getElementById('historyTable').getElementsByTagName('tbody')[0];
  
  onSnapshot(collection(db, "students"), (snapshot) => {
    const attendanceByDate = {};
    
    snapshot.forEach(doc => {
      const student = doc.data();
      if (student.attendanceHistory) {
        student.attendanceHistory.forEach(record => {
          if (!attendanceByDate[record.date]) {
            attendanceByDate[record.date] = {
              present: 0,
              late: 0,
              absent: 0
            };
          }
          attendanceByDate[record.date][record.status]++;
        });
      }
    });
    
    // Convert to array and sort by date
    const sortedDates = Object.keys(attendanceByDate).sort((a, b) => new Date(b) - new Date(a));
    
    historyTable.innerHTML = '';
    sortedDates.forEach(date => {
      const stats = attendanceByDate[date];
      const row = historyTable.insertRow();
      row.innerHTML = `
        <td>${new Date(date).toLocaleDateString()}</td>
        <td>${stats.present}</td>
        <td>${stats.late}</td>
        <td>${stats.absent}</td>
      `;
    });
  });
}

// Mark attendance
window.markAttendance = async function(studentId, status, date) {
  try {
    console.log('Marking attendance for student:', studentId, 'Status:', status, 'Date:', date);
    
    const studentRef = doc(db, "students", studentId);
    const currentTime = new Date();
    const isLate = status === 'late';
    
    // Get current student data
    const studentDoc = await getDoc(studentRef);
    if (!studentDoc.exists()) {
      throw new Error('Student document not found');
    }
    
    const studentData = studentDoc.data();
    console.log('Current student data:', studentData);
    
    // Initialize attendanceHistory if it doesn't exist
    const attendanceHistory = studentData.attendanceHistory || [];
    
    // Check if attendance is already marked for this date
    const existingRecordIndex = attendanceHistory.findIndex(record => record.date === date);
    
    if (existingRecordIndex !== -1) {
      throw new Error('Attendance already marked for this date');
    }
    
    // Add new attendance record
    attendanceHistory.push({
      date: date,
      status: status,
      timestamp: currentTime
    });
    
    const updates = {
      attendanceHistory: attendanceHistory,
      lastAttendance: {
        timestamp: currentTime,
        status: status,
        date: date
      }
    };
    
    // Increment late count if status is late
    if (isLate) {
      const currentLateCount = studentData.lateCount || 0;
      updates.lateCount = currentLateCount + 1;
    }
    
    console.log('Updating student with:', updates);
    await updateDoc(studentRef, updates);
    console.log('Update successful');
    
    // Show success message
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = `Attendance marked as ${status} successfully`;
    messageDiv.style.display = 'block';
    messageDiv.className = 'message success';
    
    // Hide message after 3 seconds
    setTimeout(() => {
      messageDiv.style.display = 'none';
    }, 3000);
    
  } catch (error) {
    console.error('Error marking attendance:', error);
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = `Error marking attendance: ${error.message}`;
    messageDiv.style.display = 'block';
    messageDiv.className = 'message error';
  }
};

// Add event listener for date change
document.getElementById('attendanceDate').addEventListener('change', loadStudents);

// Load initial data
loadStudents();
loadAttendanceHistory(); 