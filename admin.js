import { auth, db } from './firebase.js';
import { signOut } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { collection, query, where, getDocs, doc, getDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

// Check authentication and role
auth.onAuthStateChanged(async (user) => {
  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  try {
    // Check if user is an admin
    const userDoc = await getDoc(doc(db, "teachers", user.email));
    if (!userDoc.exists() || userDoc.data().role !== 'admin') {
      await signOut(auth);
      window.location.href = 'login.html';
      return;
    }

    // Display user name
    document.getElementById('userName').textContent = userDoc.data().name;
    
    // Load flagged students and offenders
    loadFlaggedStudents();
    loadSeriousOffenders();
    loadAttendanceSheet();
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

// Load flagged (late) students
function loadFlaggedStudents() {
  const flaggedTableBody = document.querySelector('#flaggedTable tbody');
  const messageDiv = document.getElementById('flaggedMessage');

  // Listen for real-time updates
  onSnapshot(collection(db, "students"), (snapshot) => {
    flaggedTableBody.innerHTML = '';
    messageDiv.style.display = 'none';

    if (snapshot.empty) {
      messageDiv.textContent = 'No late students found';
      messageDiv.style.display = 'block';
      return;
    }

    let hasLateStudents = false;
    snapshot.forEach(doc => {
      const student = doc.data();
      if (student.lastAttendance?.status === 'late') {
        hasLateStudents = true;
        const row = flaggedTableBody.insertRow();
        row.innerHTML = `
          <td>${student.name}</td>
          <td>${student.rollNo}</td>
          <td>${student.branch}</td>
          <td>${student.section}</td>
          <td>${new Date(student.lastAttendance.timestamp.toDate()).toLocaleString()}</td>
          <td>${student.lateCount || 1}</td>
        `;
      }
    });

    if (!hasLateStudents) {
      messageDiv.textContent = 'No late students found';
      messageDiv.style.display = 'block';
    }
  }, (error) => {
    console.error('Error loading flagged students:', error);
    messageDiv.textContent = 'Error loading flagged students';
    messageDiv.style.display = 'block';
  });
}

// Load serious offenders (5+ late instances)
function loadSeriousOffenders() {
  const offendersTableBody = document.querySelector('#offendersTable tbody');
  const messageDiv = document.getElementById('offendersMessage');

  // Listen for real-time updates
  onSnapshot(collection(db, "students"), (snapshot) => {
    offendersTableBody.innerHTML = '';
    messageDiv.style.display = 'none';

    if (snapshot.empty) {
      messageDiv.textContent = 'No serious offenders found';
      messageDiv.style.display = 'block';
      return;
    }

    let hasOffenders = false;
    snapshot.forEach(doc => {
      const student = doc.data();
      if (student.lateCount >= 5) {
        hasOffenders = true;
        const row = offendersTableBody.insertRow();
        row.innerHTML = `
          <td>${student.name}</td>
          <td>${student.rollNo}</td>
          <td>${student.branch}</td>
          <td>${student.section}</td>
          <td>${student.lateCount}</td>
          <td>${new Date(student.lastAttendance.timestamp.toDate()).toLocaleDateString()}</td>
        `;
      }
    });

    if (!hasOffenders) {
      messageDiv.textContent = 'No serious offenders found';
      messageDiv.style.display = 'block';
    }
  }, (error) => {
    console.error('Error loading serious offenders:', error);
    messageDiv.textContent = 'Error loading serious offenders';
    messageDiv.style.display = 'block';
  });
}

// Load attendance data
function loadAttendanceSheet() {
  const attendanceTable = document.getElementById('attendanceTable').getElementsByTagName('tbody')[0];
  const messageDiv = document.getElementById('attendanceMessage');
  const branchFilter = document.getElementById('branchFilter');
  const sectionFilter = document.getElementById('sectionFilter');
  const dateFilter = document.getElementById('dateFilter');

  // Set today's date as default
  dateFilter.value = new Date().toISOString().split('T')[0];

  // Listen for real-time updates
  onSnapshot(collection(db, "students"), (snapshot) => {
    attendanceTable.innerHTML = '';
    messageDiv.style.display = 'none';

    if (snapshot.empty) {
      messageDiv.textContent = 'No attendance data found';
      messageDiv.style.display = 'block';
      return;
    }

    // Update branch and section filters
    const branches = new Set();
    const sections = new Set();

    snapshot.forEach(doc => {
      const student = doc.data();
      if (student.branch) branches.add(student.branch);
      if (student.section) sections.add(student.section);
    });

    // Update branch filter options
    branchFilter.innerHTML = '<option value="">All Branches</option>';
    branches.forEach(branch => {
      branchFilter.innerHTML += `<option value="${branch}">${branch}</option>`;
    });

    // Update section filter options
    sectionFilter.innerHTML = '<option value="">All Sections</option>';
    sections.forEach(section => {
      sectionFilter.innerHTML += `<option value="${section}">${section}</option>`;
    });

    // Filter and display students
    snapshot.forEach(doc => {
      const student = doc.data();
      const selectedBranch = branchFilter.value;
      const selectedSection = sectionFilter.value;
      const selectedDate = dateFilter.value;

      // Apply filters
      if (selectedBranch && student.branch !== selectedBranch) return;
      if (selectedSection && student.section !== selectedSection) return;
      if (selectedDate && student.lastAttendance?.date !== selectedDate) return;

      const row = attendanceTable.insertRow();
      
      row.innerHTML = `
        <td>${student.name}</td>
        <td>${student.rollNo}</td>
        <td>${student.branch}</td>
        <td>${student.section}</td>
        <td class="status-${student.lastAttendance?.status || 'absent'}">
          ${student.lastAttendance?.status || 'Absent'}
        </td>
        <td>${student.lastAttendance?.timestamp ? new Date(student.lastAttendance.timestamp.toDate()).toLocaleTimeString() : '-'}</td>
      `;
    });
  }, (error) => {
    console.error('Error loading attendance:', error);
    messageDiv.textContent = 'Error loading attendance data';
    messageDiv.style.display = 'block';
  });
}

// Add event listeners for filters
document.getElementById('branchFilter').addEventListener('change', loadAttendanceSheet);
document.getElementById('sectionFilter').addEventListener('change', loadAttendanceSheet);
document.getElementById('dateFilter').addEventListener('change', loadAttendanceSheet); 