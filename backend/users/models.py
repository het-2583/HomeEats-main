from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    USER_TYPE_CHOICES = (
        ('customer', 'Customer'),
        ('owner', 'Tiffin Owner'),
        ('delivery', 'Delivery Boy'),
    )
    
    user_type = models.CharField(max_length=10, choices=USER_TYPE_CHOICES)
    phone_number = models.CharField(max_length=15)
    address = models.TextField()
    pincode = models.CharField(max_length=6)
    
    # Required fields for createsuperuser command
    REQUIRED_FIELDS = ['email', 'phone_number', 'user_type', 'address', 'pincode']
    
    def __str__(self):
        return f"{self.username} ({self.get_user_type_display()})"

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['phone_number', 'user_type'], name='uniq_phone_per_user_type')
        ]

class TiffinOwner(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='tiffin_owner')
    business_name = models.CharField(max_length=100)
    business_address = models.TextField()
    business_pincode = models.CharField(max_length=6)
    is_verified = models.BooleanField(default=False)
    fssai_number = models.CharField(max_length=20, unique=True, blank=True, null=True)
    
    def __str__(self):
        return self.business_name

class DeliveryBoy(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='delivery_boy')
    vehicle_number = models.CharField(max_length=20)
    is_available = models.BooleanField(default=True)
    current_location = models.CharField(max_length=100, blank=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.vehicle_number}" 


class BankAccount(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bank_accounts')
    account_holder_name = models.CharField(max_length=100)
    bank_name = models.CharField(max_length=100)
    account_number = models.CharField(max_length=34)
    ifsc_code = models.CharField(max_length=20)
    is_primary = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.bank_name} - ****{self.account_number[-4:]} ({self.user.username})"


class Wallet(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='wallet')
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Wallet({self.user.username}) - {self.balance}"


class WalletTransaction(models.Model):
    TRANSACTION_TYPES = (
        ('deposit', 'Deposit'),
        ('withdraw', 'Withdraw'),
        ('order_debit', 'Order Debit'),
        ('owner_credit', 'Owner Credit'),
        ('delivery_fee', 'Delivery Fee'),
        ('delivery_earning', 'Delivery Earning'),
    )

    wallet = models.ForeignKey(Wallet, on_delete=models.CASCADE, related_name='transactions')
    txn_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    reference = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.txn_type} {self.amount} for {self.wallet.user.username}"

