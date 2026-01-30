"""
Script to create an admin or insurance company user.

Usage:
    # Create Insurance company user (recommended)
    python3 app/create_admin_user.py --email insurance@example.com --password yourpassword --role Insurance
    
    # Create Admin user
    python3 app/create_admin_user.py --email admin@example.com --password yourpassword --role Admin
"""

import sys
import argparse
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database import SessionLocal
from app.models.db_models import User, UserRole
from app.utils.auth import get_password_hash


def create_admin_user(email: str, password: str, role: str = "Insurance"):
    """Create an admin or insurance company user."""
    db = SessionLocal()
    try:
        # Validate role
        if role not in ["Admin", "Insurance"]:
            print(f"❌ Invalid role. Must be 'Admin' or 'Insurance'")
            return
        
        role_enum = UserRole.ADMIN if role == "Admin" else UserRole.INSURANCE
        
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            # Update existing user
            existing_user.role = role_enum
            existing_user.password_hash = get_password_hash(password)
            existing_user.business_id = None  # Insurance/Admin doesn't need a business
            db.commit()
            db.refresh(existing_user)
            print(f"✅ Updated existing user '{email}' to {role} role")
            print(f"   Current role: {existing_user.role}")
            return
        
        # Create new user
        new_user = User(
            email=email,
            password_hash=get_password_hash(password),
            role=role_enum,
            business_id=None,  # Insurance/Admin doesn't need a business
        )
        db.add(new_user)
        db.commit()
        print(f"✅ Created {role} user: {email}")
        print(f"   Password: {password}")
        print(f"   Role: {role}")
    except Exception as e:
        db.rollback()
        print(f"❌ Error creating admin user: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Create an admin or insurance company user")
    parser.add_argument("--email", required=True, help="User email address")
    parser.add_argument("--password", required=True, help="User password")
    parser.add_argument("--role", default="Insurance", choices=["Admin", "Insurance"], 
                       help="User role: Admin or Insurance (default: Insurance)")
    
    args = parser.parse_args()
    
    create_admin_user(args.email, args.password, args.role)
