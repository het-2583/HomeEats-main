import re

from rest_framework import serializers
from rest_framework.validators import UniqueTogetherValidator
from users.models import User, TiffinOwner, DeliveryBoy, Wallet, WalletTransaction, BankAccount
from .models import Tiffin, Order, Delivery

class UserSerializer(serializers.ModelSerializer):
    business_name = serializers.CharField(write_only=True, required=False)
    business_address = serializers.CharField(write_only=True, required=False)
    vehicle_number = serializers.CharField(write_only=True, required=False)
    fssai_number = serializers.CharField(write_only=True, required=False, allow_blank=True)
    confirm_password = serializers.CharField(write_only=True, required=True)
    tiffin_owner = serializers.SerializerMethodField()
    delivery_boy = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'user_type',
                  'phone_number', 'address', 'pincode',
                  'business_name', 'business_address', 'vehicle_number', 'fssai_number',
                  'confirm_password', 'tiffin_owner', 'delivery_boy')
        extra_kwargs = {
            'password': {'write_only': True},
            'confirm_password': {'write_only': True},
        }
        validators = [
            UniqueTogetherValidator(
                queryset=User.objects.all(),
                fields=('phone_number', 'user_type'),
                message='This phone number is already registered for the selected user type.'
            )
        ]

    def get_tiffin_owner(self, obj):
        if hasattr(obj, 'tiffin_owner'):
            return {
                'business_name': obj.tiffin_owner.business_name,
                'business_address': obj.tiffin_owner.business_address,
                'business_pincode': obj.tiffin_owner.business_pincode,
                'is_verified': obj.tiffin_owner.is_verified
            }
        return None

    def get_delivery_boy(self, obj):
        if hasattr(obj, 'delivery_boy'):
            return {
                'vehicle_number': obj.delivery_boy.vehicle_number,
                'is_available': obj.delivery_boy.is_available
            }
        return None

    def validate_password(self, value):
        password_policy = re.compile(r'^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$')
        if not password_policy.match(value):
            raise serializers.ValidationError(
                'Password must be at least 8 characters long and include one uppercase letter, '
                'one number, and one special character.'
            )
        return value

    def validate(self, attrs):
        password = attrs.get('password')
        confirm_password = attrs.get('confirm_password')

        if password and confirm_password and password != confirm_password:
            raise serializers.ValidationError({'confirm_password': 'Confirm password must match password.'})

        return attrs

    def create(self, validated_data):
        password = validated_data.pop('password')
        user_type = validated_data.pop('user_type')
        validated_data.pop('confirm_password', None)

        business_name = validated_data.pop('business_name', None)
        business_address = validated_data.pop('business_address', None)
        vehicle_number = validated_data.pop('vehicle_number', None)
        fssai_number = validated_data.pop('fssai_number', '')

        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.user_type = user_type
        user.save()

        if user_type == 'owner':
            TiffinOwner.objects.create(
                user=user,
                business_name=business_name,
                business_address=business_address,
                business_pincode=user.pincode, # Assuming business_pincode is the same as user's pincode
                fssai_number=fssai_number or None
            )
        elif user_type == 'delivery':
            DeliveryBoy.objects.create(
                user=user,
                vehicle_number=vehicle_number,
                is_available=True
            )
        return user

class TiffinOwnerSerializer(serializers.ModelSerializer):
    user = UserSerializer()

    class Meta:
        model = TiffinOwner
        fields = ('id', 'user', 'business_name', 'business_address', 'business_pincode', 'is_verified')

    def create(self, validated_data):
        user_data = validated_data.pop('user')
        user = User.objects.create_user(**user_data)
        tiffin_owner = TiffinOwner.objects.create(user=user, **validated_data)
        return tiffin_owner

class DeliveryBoySerializer(serializers.ModelSerializer):
    user = UserSerializer()

    class Meta:
        model = DeliveryBoy
        fields = ('id', 'user', 'vehicle_number', 'is_available', 'current_location')

    def create(self, validated_data):
        user_data = validated_data.pop('user')
        user = User.objects.create_user(**user_data)
        delivery_boy = DeliveryBoy.objects.create(user=user, **validated_data)
        return delivery_boy

class TiffinSerializer(serializers.ModelSerializer):
    owner_name = serializers.CharField(source='owner.business_name', read_only=True)
    image = serializers.ImageField(required=False)
    owner = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Tiffin
        fields = ('id', 'owner', 'owner_name', 'name', 'description', 'price', 'is_available', 'image', 'created_at', 'updated_at')

class OrderSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.username', read_only=True)
    tiffin_name = serializers.CharField(source='tiffin.name', read_only=True)
    delivery_boy_name = serializers.CharField(source='delivery_boy.user.username', read_only=True)
    customer = serializers.PrimaryKeyRelatedField(read_only=True)
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Order
        fields = ('id', 'customer', 'customer_name', 'tiffin', 'tiffin_name', 'delivery_boy', 
                 'delivery_boy_name', 'quantity', 'total_price', 'status', 'delivery_address', 
                 'delivery_pincode', 'created_at', 'updated_at')

class DeliverySerializer(serializers.ModelSerializer):
    order_details = OrderSerializer(source='order', read_only=True)
    delivery_boy_name = serializers.CharField(source='delivery_boy.user.username', read_only=True)

    class Meta:
        model = Delivery
        fields = ('id', 'order', 'order_details', 'delivery_boy', 'delivery_boy_name', 
                 'pickup_address', 'delivery_address', 'status', 'created_at', 'updated_at') 


class BankAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = BankAccount
        fields = ('id', 'account_holder_name', 'bank_name', 'account_number', 'ifsc_code', 'is_primary', 'created_at')
        read_only_fields = ('id', 'created_at')

    def create(self, validated_data):
        user = self.context['request'].user
        # If this is set as primary, unset others
        if validated_data.get('is_primary', True):
            BankAccount.objects.filter(user=user).update(is_primary=False)
        return BankAccount.objects.create(user=user, **validated_data)


class WalletTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = WalletTransaction
        fields = ('id', 'txn_type', 'amount', 'reference', 'created_at')
        read_only_fields = ('id', 'created_at')


class WalletSerializer(serializers.ModelSerializer):
    transactions = WalletTransactionSerializer(many=True, read_only=True)

    class Meta:
        model = Wallet
        fields = ('balance', 'updated_at', 'transactions')
        read_only_fields = ('balance', 'updated_at', 'transactions')