import firebase_admin
from firebase_admin import credentials, firestore
import json

# Initialize Firebase Admin SDK
cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred)

db = firestore.client()

# Load student data from JSON
with open("students.json", "r") as f:
    students = json.load(f)

# Add each student to the "students" collection
for student in students:
    doc_ref = db.collection("students").document(student["rollNo"])
    doc_ref.set(student)

print("✅ Student data imported to Firestore successfully.")