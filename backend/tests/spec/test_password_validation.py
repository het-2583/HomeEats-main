"""
Simple specification test for password validation.
Tests password strength requirements using property-based approach.
"""
from django.test import TestCase
from api.serializers import UserSerializer


class PasswordValidationTest(TestCase):
    """Simple specification test for password validation rules."""
    
    def test_password_must_have_uppercase_letter(self):
        """Test that password must contain at least one uppercase letter."""
        serializer = UserSerializer(data={
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'lowercase123!',
            'confirm_password': 'lowercase123!',
            'user_type': 'customer',
            'phone_number': '1234567890',
            'pincode': '123456'
        })
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('password', serializer.errors)
    
    def test_password_must_have_number(self):
        """Test that password must contain at least one number."""
        serializer = UserSerializer(data={
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'NoNumbers!',
            'confirm_password': 'NoNumbers!',
            'user_type': 'customer',
            'phone_number': '1234567890',
            'pincode': '123456'
        })
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('password', serializer.errors)
    
    def test_password_must_have_special_character(self):
        """Test that password must contain at least one special character."""
        serializer = UserSerializer(data={
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'NoSpecial123',
            'confirm_password': 'NoSpecial123',
            'user_type': 'customer',
            'phone_number': '1234567890',
            'pincode': '123456'
        })
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('password', serializer.errors)
    
    def test_password_must_be_at_least_8_characters(self):
        """Test that password must be at least 8 characters long."""
        serializer = UserSerializer(data={
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'Short1!',
            'confirm_password': 'Short1!',
            'user_type': 'customer',
            'phone_number': '1234567890',
            'pincode': '123456'
        })
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('password', serializer.errors)
    
    def test_valid_password_passes_validation(self):
        """Test that a valid password passes all validation rules."""
        serializer = UserSerializer(data={
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'ValidPass123!',
            'confirm_password': 'ValidPass123!',
            'user_type': 'customer',
            'phone_number': '1234567890',
            'address': '123 Test Street',
            'pincode': '123456'
        })
        
        self.assertTrue(serializer.is_valid())

