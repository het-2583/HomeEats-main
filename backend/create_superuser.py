#!/usr/bin/env python
"""
Script to create a superuser with all required fields.
Run this with: python manage.py shell < create_superuser.py
Or: python create_superuser.py (if run from backend directory)
"""
import os
import sys
import django

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from users.models import User

# Check existing users
print("Existing users in database:")
users = User.objects.all()
if users.exists():
    for u in users:
        print(f"  - ID: {u.id}, Username: {u.username}, Phone: {u.phone_number}, Type: {u.user_type}, Is Superuser: {u.is_superuser}")
else:
    print("  No users found.")

print("\n" + "="*50)
print("Creating superuser...")

# Create superuser with all required fields
# Change these values as needed
username = "admin"
email = "admin@example.com"
phone_number = "1234567890"  # Use a unique phone number
user_type = "customer"  # Options: 'customer', 'owner', 'delivery'
address = "123 Main St"
pincode = "123456"
password = "admin123"  # Change this!

# Check if user with this phone_number and user_type already exists
if User.objects.filter(phone_number=phone_number, user_type=user_type).exists():
    print(f"\nERROR: A user with phone_number '{phone_number}' and user_type '{user_type}' already exists!")
    print("Please use a different phone number or user type.")
    sys.exit(1)

# Check if username already exists
if User.objects.filter(username=username).exists():
    print(f"\nERROR: Username '{username}' already exists!")
    print("Please use a different username.")
    sys.exit(1)

try:
    user = User.objects.create_superuser(
        username=username,
        email=email,
        password=password,
        phone_number=phone_number,
        user_type=user_type,
        address=address,
        pincode=pincode
    )
    print(f"\n✓ Superuser created successfully!")
    print(f"  Username: {user.username}")
    print(f"  Email: {user.email}")
    print(f"  Phone: {user.phone_number}")
    print(f"  Type: {user.get_user_type_display()}")
except Exception as e:
    print(f"\n✗ Error creating superuser: {e}")
    sys.exit(1)

