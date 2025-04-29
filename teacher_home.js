import { getAssignedStudents, markAttendance } from './firestore.js';
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { doc, getDoc, onSnapshot, updateDoc } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

const studentsTableBody = document.querySelector('#studentsTable tbody');
const messageDiv = document.getElementById('message');

// Initialize Firebase Auth
const auth = getAuth();

// Check authentication and role
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  try {
    // Check if user is a teacher
    const userDoc = await getDoc(doc(db, "teachers", user.email));
    if (!userDoc.exists() || userDoc.data().role !== 'teacher') {
      await signOut(auth);
      window.location.href = 'login.html';
      return;
    }

    // Display user name
    document.getElementById('userName').textContent = userDoc.data().name;
    
    // Load students data
    loadStudents();
  } catch (error) {
    console.error('Error checking user role:', error);
    window.location.href = 'login.html';
  }
});

// Logout functionality
document.getElementById('logoutBtn').addEventListener('click', async () => {
  try {
    await signOut(auth);
    window.location.href = 'login.html';
  } catch (error) {
    console.error('Error signing out:', error);
  }
});

function getStatusClass(status) {
  switch (status) {
    case 'present': return 'status-present';
    case 'late': return 'status-late';
    default: return 'status-absent';
  }
}

function formatTime(timestamp) {
  if (!timestamp) return '';
  return timestamp.toDate().toLocaleTimeString();
}

async function loadStudents() {
  try {
    const students = await getAssignedStudents();
    studentsTableBody.innerHTML = '';
    
    if (students.length === 0) {
      studentsTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No students found</td></tr>';
      return;
    }

    students.forEach(student => {
      const tr = document.createElement('tr');
      const status = student.lastAttendance?.status || 'absent';
      const time = student.lastAttendance?.timestamp;
      
      tr.innerHTML = `
        <td>${student.name}</td>
        <td>${student.rollNo}</td>
        <td>${student.branch}</td>
        <td>${student.section}</td>
        <td class="${getStatusClass(status)}">
          ${status.charAt(0).toUpperCase() + status.slice(1)}
          ${time ? ` (${formatTime(time)})` : ''}
        </td>
        <td>
          <div class="btn-group">
            <button data-id="${student.rollNo}" data-action="present" class="mark-btn">
              Present
            </button>
            <button data-id="${student.rollNo}" data-action="late" class="mark-btn">
              Late
            </button>
          </div>
        </td>
      `;
      studentsTableBody.appendChild(tr);
    });

    // Add event listeners
    studentsTableBody.querySelectorAll('.mark-btn').forEach(btn => {
      btn.onclick = async () => {
        const rollNo = btn.getAttribute('data-id');
        const action = btn.getAttribute('data-action');
        const result = await markAttendance(rollNo, action);
        
        if (result.success) {
          // Disable all buttons for this student
          const studentRow = btn.closest('tr');
          studentRow.querySelectorAll('.mark-btn').forEach(b => b.disabled = true);
          
          // Update status cell
          const statusCell = studentRow.querySelector('td:nth-child(5)');
          statusCell.className = getStatusClass(action);
          statusCell.textContent = `${action.charAt(0).toUpperCase() + action.slice(1)} (${formatTime(result.timestamp)})`;
          
          messageDiv.textContent = `Attendance marked as ${action} for ${rollNo}`;
          messageDiv.style.color = action === 'late' ? 'red' : 'green';
        } else {
          messageDiv.textContent = `Error: ${result.error}`;
          messageDiv.style.color = 'red';
        }
      };
    });
  } catch (error) {
    console.error("Error loading students:", error);
    messageDiv.textContent = "Error loading students. Please try again.";
    messageDiv.style.color = 'red';
  }
} 