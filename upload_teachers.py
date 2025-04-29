import firebase_admin
from firebase_admin import credentials, firestore
import json

# Initialize Firebase Admin SDK
cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred)

db = firestore.client()

# Load teachers data from JSON
with open("teachers.json", "r") as f:
    teachers = json.load(f)

# Add each teacher to the "teachers" collection
for teacher in teachers:
    # Create a document with email as the document ID
    doc_ref = db.collection("teachers").document(teacher["email"])
    doc_ref.set({
        "name": teacher["name"],
        "role": teacher["role"],
        "email": teacher["email"]
    })

print("✅ Teacher data imported to Firestore successfully.") 