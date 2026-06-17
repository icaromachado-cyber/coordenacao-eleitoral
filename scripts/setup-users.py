#!/usr/bin/env python3
"""
Setup script: Create Firebase users and populate Firestore with roles/regions.
Reads configuration from users-config.json
Requires: firebase-admin, python-dotenv
Usage: python scripts/setup-users.py
"""

import os
import json
import sys
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

def set_user_role(db, uid, email, role, region=None, zona=None, name=None):
    """Set role, region, zona, and name in Firestore."""
    doc_data = {"email": email, "role": role}
    if region:
        doc_data["region"] = region
    if zona:
        doc_data["zona"] = zona
    if name:
        doc_data["name"] = name
    
    db.collection('users').document(uid).set(doc_data, merge=True)
    info = f"{email} → role={role}"
    if region:
        info += f", region={region}"
    if zona:
        info += f", zona={zona}"
    print(f"  ✅ {info}")

def load_config(config_path):
    """Load users configuration from JSON file."""
    try:
        with open(config_path, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"❌ Config file not found: {config_path}")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"❌ Invalid JSON in {config_path}: {e}")
        sys.exit(1)

def main():
    print("=" * 60)
    print("Firebase User Setup — Financeiro & Regional")
    print("=" * 60)
    
    # Load config
    script_dir = os.path.dirname(os.path.abspath(__file__))
    config_path = os.path.join(script_dir, "..", "users-config.json")
    config = load_config(config_path)
    
    db = init_firebase()
    
    # Create admin users
    if "admins" in config and config["admins"]:
        print("\n📌 ADMIN USERS")
        for admin in config["admins"]:
            email = admin.get("email")
            password = admin.get("password")
            name = admin.get("name")
            
            if password == "CHANGE_ME":
                password = getpass(f"Password for {email}: ")
            
            region = admin.get("region")
            zona = admin.get("zona")
            uid = create_user(email, password)
            if uid:
                set_user_role(db, uid, email, "admin", region=region, zona=zona, name=name)
    
    # Create regional users
    if "regionais" in config and config["regionais"]:
        print("\n🌍 REGIONAL USERS")
        for regional in config["regionais"]:
            email = regional.get("email")
            if email == "PREENCHER":
                print(f"  ⏭️  Skipping user with email 'PREENCHER' (configure users-config.json)")
                continue
            
            password = regional.get("password")
            region = regional.get("region")
            zona = regional.get("zona")
            name = regional.get("name")
            
            if password == "CHANGE_ME":
                password = getpass(f"Password for {email}: ")
            
            uid = create_user(email, password)
            if uid:
                set_user_role(db, uid, email, "regional", region=region, zona=zona, name=name)
    
    print("\n" + "=" * 60)
    print("✅ Users created successfully!")
    print("=" * 60)
    print("\nNext steps:")
    print("1. Deploy Firestore rules: firebase deploy --only firestore:rules")
    print("2. Test login with regional accounts")
    print("3. Change default passwords in Firebase Console")
    print(f"\nConfig used: {config_path}")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        exit(1)
