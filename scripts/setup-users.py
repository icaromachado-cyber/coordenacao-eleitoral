#!/usr/bin/env python3
"""
Setup script: Create Firebase users and populate Firestore with roles/regions.
Requires: firebase-admin, python-dotenv
Usage: python scripts/setup-users.py
"""

import os
import json
import firebase_admin
from firebase_admin import credentials, auth, firestore
from getpass import getpass

# Initialize Firebase
def init_firebase():
    if not firebase_admin.get_app():
        # Try to use GOOGLE_APPLICATION_CREDENTIALS env var
        if os.getenv('GOOGLE_APPLICATION_CREDENTIALS'):
            cred = credentials.Certificate(os.getenv('GOOGLE_APPLICATION_CREDENTIALS'))
        else:
            # Fallback: ask user
            cred_path = input("Path to serviceAccount.json: ").strip()
            if not os.path.exists(cred_path):
                print(f"File not found: {cred_path}")
                exit(1)
            cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
    return firestore.client()

def create_user(email, password):
    """Create Firebase Auth user."""
    try:
        user = auth.create_user(email=email, password=password)
        return user.uid
    except auth.EmailAlreadyExistsError:
        print(f"  ℹ️  User {email} already exists.")
        user = auth.get_user_by_email(email)
        return user.uid
    except Exception as e:
        print(f"  ❌ Error creating user {email}: {e}")
        return None

def set_user_role(db, uid, email, role, region=None):
    """Set role and region in Firestore."""
    doc_data = {"email": email, "role": role}
    if region:
        doc_data["region"] = region
    
    db.collection('users').document(uid).set(doc_data, merge=True)
    print(f"  ✅ {email} → role={role}, region={region or 'N/A'}")

def main():
    print("=" * 60)
    print("Firebase User Setup — Financeiro & Regional")
    print("=" * 60)
    
    db = init_firebase()
    
    # Admin user
    print("\n📌 ADMIN USER")
    admin_email = "icarocaio18@gmail.com"
    admin_pwd = getpass(f"Password for {admin_email}: ")
    admin_uid = create_user(admin_email, admin_pwd)
    if admin_uid:
        set_user_role(db, admin_uid, admin_email, "admin")
    
    # Regional users
    print("\n🌍 REGIONAL USERS")
    regions = [
        ("norte", "norte@coord.local"),
        ("leste", "leste@coord.local"),
        ("sul", "sul@coord.local"),
        ("sudeste", "sudeste@coord.local"),
        ("rural", "rural@coord.local"),
    ]
    
    default_pwd = "Temp@1234!"  # CHANGE THIS IN PRODUCTION
    print(f"(Using default password: {default_pwd})")
    print("⚠️  IMPORTANT: Change these passwords after first login!\n")
    
    for region, email in regions:
        uid = create_user(email, default_pwd)
        if uid:
            set_user_role(db, uid, email, "regional", region)
    
    print("\n" + "=" * 60)
    print("✅ Users created successfully!")
    print("=" * 60)
    print("\nNext steps:")
    print("1. Deploy Firestore rules: firebase deploy --only firestore:rules")
    print("2. Test login with regional accounts")
    print("3. Change default passwords in Firebase Console")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"❌ Error: {e}")
        exit(1)
