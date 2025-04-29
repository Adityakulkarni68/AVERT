import { getFlaggedStudents } from './firestore.js';
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

const flaggedTableBody = document.querySelector('#flaggedTable tbody');
const messageDiv = document.createElement('div');
messageDiv.style.marginTop = '1rem';
document.querySelector('.container').appendChild(messageDiv);

// Initialize Firebase Auth
const auth = getAuth();

// Check if user is logged in and is admin
onAuthStateChanged(auth, (user) => {
  if (user) {
    // TODO: Check if user is admin
    loadFlagged();
  } else {
    window.location.href = 'login.html';
  }
});

async function loadFlagged() {
  try {
    const flagged = await getFlaggedStudents();
    flaggedTableBody.innerHTML = '';
    
    if (flagged.length === 0) {
      flaggedTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No late students found</td></tr>';
      return;
    }

    flagged.forEach(student => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${student.name}</td>
        <td>${student.rollNo}</td>
        <td>${student.branch}</td>
        <td>${student.section}</td>
        <td>${student.markedTime}</td>
      `;
      flaggedTableBody.appendChild(tr);
    });
  } catch (error) {
    console.error("Error loading flagged students:", error);
    messageDiv.textContent = "Error loading flagged students. Please try again.";
    messageDiv.style.color = 'red';
  }
}

loadFlagged(); 