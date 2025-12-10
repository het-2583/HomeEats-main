"""
Simple integration test for wallet API endpoint.
Tests the wallet deposit endpoint through HTTP.
"""
from decimal import Decimal
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from django.test import TestCase

User = get_user_model()


class WalletAPITest(TestCase):
    """Simple integration test for wallet deposit API."""
    
    def setUp(self):
        """Set up test client and user."""
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            user_type='customer',
            phone_number='1234567890',
            address='123 Test Street',
            pincode='123456'
        )
        # Get JWT token using username (SimpleJWT uses USERNAME_FIELD=“username” here)
        response = self.client.post('/api/token/', {
            'username': 'testuser',
            'password': 'testpass123'
        })
        self.token = response.data.get('access')
        assert self.token, "Token generation failed in test setup"
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')
    
    def test_deposit_money_to_wallet(self):
        """Test depositing money via API endpoint."""
        # Get initial balance
        response = self.client.get('/api/wallet/')
        initial_balance = Decimal(str(response.data['balance']))
        
        # Deposit money
        deposit_response = self.client.post('/api/wallet/deposit/', {
            'amount': 100
        })
        
        self.assertEqual(deposit_response.status_code, status.HTTP_200_OK)
        
        # Check new balance
        response = self.client.get('/api/wallet/')
        new_balance = Decimal(str(response.data['balance']))
        
        self.assertEqual(new_balance, initial_balance + Decimal('100.00'))
    
    def test_deposit_requires_authentication(self):
        """Test that deposit requires authentication."""
        self.client.credentials()  # Remove authentication
        
        response = self.client.post('/api/wallet/deposit/', {
            'amount': 100
        })
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

