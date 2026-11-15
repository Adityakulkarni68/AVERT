# AVERT — Attendance Violation & Early Response Tracker

A web-based attendance management system for educational institutions. Teachers mark student attendance in real time; admins monitor flagged students and late-attendance offenders through a live dashboard.

---

## Features

| Feature | Details |
|---|---|
| Role-based login | Separate flows for **Teacher** and **Admin** |
| Real-time attendance | Firestore `onSnapshot` listeners — no page refresh needed |
| Late tracking | Each late mark increments a `lateCount` counter per student |
| Serious offenders | Admin dashboard flags students with ≥ 5 late instances |
| Attendance history | Per-student record with date, status, and timestamp |
| Branch / Section filters | Admin can filter the full attendance sheet by branch, section, or date |
| Brute-force protection | 5 failed login attempts triggers a 15-minute lockout (stored in `localStorage`) |
| Dark mode | Theme toggle persisted in `localStorage` |

---

## Architecture

```
┌────────────────────────────────────────────────────┐
│                   Browser (Vanilla JS)              │
│                                                      │
│  index.html ──► login.html ──► teacher_home.html    │
│                           └──► admin.html            │
│                                                      │
│  firebase.js      – Firebase app + Auth init         │
│  firestore.js     – Attendance read/write helpers    │
│  login.js         – Auth flow + lockout logic        │
│  teacher_home.js  – Real-time student list + marking │
│  admin.js         – Flagged students + reports       │
└───────────────────────┬────────────────────────────┘
                        │ Firebase SDK (ESM CDN)
                        ▼
┌────────────────────────────────────────────────────┐
│              Firebase (BaaS)                        │
│                                                      │
│  Firebase Auth  – Email/password authentication     │
│  Firestore      – students, teachers collections    │
│  Firestore Rules – RBAC enforced server-side        │
└────────────────────────────────────────────────────┘
```

### Firestore Data Model

#### `teachers/{email}`
```json
{
  "name":  "Jane Doe",
  "email": "jane@example.com",
  "role":  "teacher | admin"
}
```

#### `students/{rollNo}`
```json
{
  "name":    "John Smith",
  "rollNo":  "CS2301",
  "branch":  "CSE",
  "section": "A",
  "lateCount": 3,
  "lastAttendance": {
    "date":      "2024-11-15",
    "status":    "present | late",
    "timestamp": "<Firestore Timestamp>"
  },
  "attendanceHistory": [
    { "date": "2024-11-14", "status": "present", "timestamp": "..." },
    { "date": "2024-11-15", "status": "late",    "timestamp": "..." }
  ]
}
```

---

## Security

Firestore rules enforce role-based access entirely server-side.

| Collection | Teacher | Admin |
|---|---|---|
| `teachers` | read only | read only |
| `students` | read + update attendance fields only | read all |

Teachers can only write to `lastAttendance`, `attendanceHistory`, and `lateCount` — no other fields can be modified from the client.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JavaScript (ES Modules) |
| Authentication | Firebase Auth (email/password) |
| Database | Cloud Firestore (real-time NoSQL) |
| Hosting | Firebase Hosting |
| Data seeding | Python 3 + `firebase-admin` SDK |

---

## Project Structure

```
AVERT/
├── index.html           # Landing page — role selection
├── login.html           # Shared login (role passed via URL param)
├── teacher_home.html    # Teacher dashboard
├── admin.html           # Admin dashboard
│
├── firebase.js          # Firebase app init + Auth + Firestore exports
├── firestore.js         # Attendance helper functions
├── login.js             # Login handler + brute-force lockout
├── teacher_home.js      # Real-time attendance marking
├── admin.js             # Flagged students, offenders, full sheet
│
├── style.css            # Stylesheet with light/dark theme
├── design.css           # Design tokens
│
├── firestore.rules      # Firestore security rules
│
├── upload.py            # Bulk-upload students to Firestore
├── upload_teachers.py   # Bulk-upload teachers to Firestore
├── students.json        # Student seed data
└── teachers.json        # Teacher seed data
```

---

## Setup

### 1. Create a Firebase Project

- Enable **Authentication → Email/Password**
- Enable **Firestore Database**

### 2. Add Firebase Config

Edit `firebase.js` with your project credentials:

```js
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### 3. Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

### 4. Seed Data (optional)

```bash
python3 -m venv venv
source venv/bin/activate
pip install firebase-admin

# Place your serviceAccountKey.json in the project root (never commit it)
python3 upload_teachers.py
python3 upload.py
```

### 5. Run Locally

```bash
firebase serve
```

Or simply open `index.html` in a browser.

---

## User Flows

### Teacher
1. Lands on `index.html` → clicks **Teacher Login**
2. Authenticates via Firebase Auth
3. Selects a date → real-time student list loads
4. Marks each student **Present** or **Late** (once per day; buttons lock after marking)

### Admin
1. Logs in with admin credentials
2. Views three live panels:
   - **Flagged Students** — marked late today
   - **Serious Offenders** — `lateCount ≥ 5`
   - **Attendance Sheet** — full list with branch / section / date filters

---

## Data Flow

```
Teacher clicks Present/Late
        │
        ▼
teacher_home.js → updateDoc(studentRef, {
  attendanceHistory: [...new record],
  lastAttendance:    { date, status, timestamp },
  lateCount:         n + 1   // only if late
})
        │
        ▼
Cloud Firestore (students collection)
        │
        ▼  onSnapshot (real-time push)
admin.js → renders flagged list, offenders table, full attendance sheet
```

---

## License

MIT
