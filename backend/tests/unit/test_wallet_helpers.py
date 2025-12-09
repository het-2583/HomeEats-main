"""
Simple unit test for wallet helper function.
Tests the _adjust_wallet_balance function in isolation.
"""
from decimal import Decimal
from django.test import TestCase
from users.models import User, Wallet
from api.views import _adjust_wallet_balance


class WalletHelperTest(TestCase):
    """Simple unit test for wallet balance adjustment."""
    
    def setUp(self):
        """Create a test user and wallet."""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.wallet = Wallet.objects.create(user=self.user, balance=Decimal('100.00'))
    
    def test_adjust_wallet_balance_adds_money(self):
        """Test that adding money increases balance."""
        initial_balance = self.wallet.balance
        _adjust_wallet_balance(self.wallet, Decimal('50.00'))
        
        self.wallet.refresh_from_db()
        self.assertEqual(self.wallet.balance, initial_balance + Decimal('50.00'))
    
    def test_adjust_wallet_balance_subtracts_money(self):
        """Test that subtracting money decreases balance."""
        initial_balance = self.wallet.balance
        _adjust_wallet_balance(self.wallet, Decimal('-30.00'))
        
        self.wallet.refresh_from_db()
        self.assertEqual(self.wallet.balance, initial_balance - Decimal('30.00'))
    
    def test_adjust_wallet_balance_handles_zero_balance(self):
        """Test that function works with zero balance."""
        self.wallet.balance = Decimal('0.00')
        self.wallet.save()
        
        _adjust_wallet_balance(self.wallet, Decimal('25.00'))
        self.wallet.refresh_from_db()
        self.assertEqual(self.wallet.balance, Decimal('25.00'))

