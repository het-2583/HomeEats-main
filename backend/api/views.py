from decimal import Decimal

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters import rest_framework as filters
from users.models import User, TiffinOwner, DeliveryBoy, Wallet, WalletTransaction, BankAccount
from .models import Tiffin, Order, Delivery
from .serializers import (
    UserSerializer, TiffinOwnerSerializer, DeliveryBoySerializer,
    TiffinSerializer, OrderSerializer, DeliverySerializer,
    WalletSerializer, WalletTransactionSerializer, BankAccountSerializer
)
from rest_framework.permissions import AllowAny
from django.db import models, transaction
from rest_framework.exceptions import PermissionDenied, ValidationError
from django.utils import timezone
import random
from rest_framework_simplejwt.tokens import RefreshToken
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse

class IsOwnerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.owner.user == request.user


DELIVERY_FEE = Decimal('10.00')
OWNER_ACCEPTANCE_STATUSES = {'confirmed', 'preparing', 'ready_for_delivery', 'picked_up', 'delivered'}


def _get_wallet(user):
    wallet, _ = Wallet.objects.get_or_create(user=user)
    return wallet


def _adjust_wallet_balance(wallet, delta):
    wallet.balance = (wallet.balance or Decimal('0')) + delta
    wallet.save(update_fields=['balance', 'updated_at'])


def _record_wallet_transaction(wallet, txn_type, amount, reference=''):
    WalletTransaction.objects.create(wallet=wallet, txn_type=txn_type, amount=amount, reference=reference)


def _credit_owner_for_order(order):
    owner_wallet = _get_wallet(order.tiffin.owner.user)
    _adjust_wallet_balance(owner_wallet, order.total_price)
    _record_wallet_transaction(owner_wallet, 'credit for tiffin', order.total_price, reference=f'ORDER:{order.id}')


def _transfer_delivery_fee(delivery):
    owner_wallet = _get_wallet(delivery.order.tiffin.owner.user)
    if owner_wallet.balance < DELIVERY_FEE:
        raise ValidationError({'wallet': 'Owner wallet has insufficient balance to pay delivery fee.'})
    _adjust_wallet_balance(owner_wallet, -DELIVERY_FEE)
    _record_wallet_transaction(owner_wallet, 'debit for delivery', DELIVERY_FEE, reference=f'DELIVERY:{delivery.id}')

    delivery_wallet = _get_wallet(delivery.delivery_boy.user)
    _adjust_wallet_balance(delivery_wallet, DELIVERY_FEE)
    _record_wallet_transaction(delivery_wallet, 'delivery_earning', DELIVERY_FEE, reference=f'DELIVERY:{delivery.id}')

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ['create', 'me']:
            return [AllowAny()]
        return super().get_permissions()

    def get_queryset(self):
        if self.request.user.user_type == 'owner':
            return User.objects.filter(id=self.request.user.id)
        return User.objects.all()

    @action(detail=False, methods=['get'])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=['patch', 'put'])
    def update_me(self, request):
        serializer = self.get_serializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


# OTP-based Auth endpoints removed per request.

class TiffinOwnerViewSet(viewsets.ModelViewSet):
    queryset = TiffinOwner.objects.all()
    serializer_class = TiffinOwnerSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.user_type == 'owner':
            return TiffinOwner.objects.filter(user=self.request.user)
        return TiffinOwner.objects.all()

class DeliveryBoyViewSet(viewsets.ModelViewSet):
    queryset = DeliveryBoy.objects.all()
    serializer_class = DeliveryBoySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.user_type == 'delivery':
            return DeliveryBoy.objects.filter(user=self.request.user)
        return DeliveryBoy.objects.all()

class TiffinViewSet(viewsets.ModelViewSet):
    queryset = Tiffin.objects.all()
    serializer_class = TiffinSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [permissions.IsAuthenticated(), IsOwnerOrReadOnly()]

    def get_queryset(self):
        user = self.request.user
        queryset = Tiffin.objects.all()

        if user.is_authenticated and user.user_type == 'owner':
            # Owners only see their own tiffins.
            print(f"Filtering tiffins for owner: {user.username}")  # Debug log
            return queryset.filter(owner__user=user)

        # For anonymous users or non-owners, always filter by availability
        queryset = queryset.filter(is_available=True)

        # Apply pincode filter if provided
        pincode = self.request.query_params.get('pincode', None)
        if pincode:
            queryset = queryset.filter(owner__business_pincode=pincode)

        # Apply search filter if provided
        search_term = self.request.query_params.get('search', None)
        if search_term:
            queryset = queryset.filter(
                models.Q(name__icontains=search_term) | models.Q(description__icontains=search_term)
            )

        return queryset

    def perform_create(self, serializer):
        if not hasattr(self.request.user, 'tiffin_owner'):
            raise PermissionDenied("User is not a tiffin owner")
        serializer.save(owner=self.request.user.tiffin_owner)

class OrderFilter(filters.FilterSet):
    status = filters.CharFilter(field_name="status")
    pincode = filters.CharFilter(field_name="delivery_pincode")

    class Meta:
        model = Order
        fields = ['status', 'customer', 'tiffin', 'delivery_boy', 'pincode']

class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_class = OrderFilter

    def get_queryset(self):
        user = self.request.user
        queryset = Order.objects.all()
        
        if user.user_type == 'customer':
            return queryset.filter(customer=user)
        elif user.user_type == 'owner':
            return queryset.filter(tiffin__owner__user=user)
        elif user.user_type == 'delivery':
            # For delivery boys, only show orders in their pincode
            return queryset.filter(
                delivery_pincode=user.pincode,
                status__in=['ready_for_delivery', 'picked_up']
            )
        
        # Filter by pincode if provided
        pincode = self.request.query_params.get('pincode', None)
        if pincode:
            queryset = queryset.filter(delivery_pincode=pincode)
        
        return queryset

    def perform_create(self, serializer):
        tiffin = serializer.validated_data['tiffin']
        quantity = serializer.validated_data['quantity']
        total_price = tiffin.price * quantity

        customer_wallet = _get_wallet(self.request.user)
        if customer_wallet.balance < total_price:
            raise ValidationError({'wallet': 'Insufficient wallet balance. Please add money to your wallet before placing an order.'})

        with transaction.atomic():
            order = serializer.save(customer=self.request.user, total_price=total_price)
            _adjust_wallet_balance(customer_wallet, -total_price)
            _record_wallet_transaction(customer_wallet, 'debit', total_price, reference=f'ORDER:{order.id}')

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        order = self.get_object()
        new_status = request.data.get('status')
        
        if new_status not in dict(Order.STATUS_CHOICES):
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
        
        previous_status = order.status

        with transaction.atomic():
            order.status = new_status
            order.save()

            if previous_status == 'pending' and new_status in OWNER_ACCEPTANCE_STATUSES:
                _credit_owner_for_order(order)

            if new_status == 'ready_for_delivery':
                # Create a new Delivery record
                Delivery.objects.create(
                    order=order,
                    pickup_address=order.tiffin.owner.business_address,
                    delivery_address=order.delivery_address,
                    status='pending', # Initial status for the delivery
                    delivery_boy=None # Delivery boy will be assigned later
                )

        return Response(OrderSerializer(order).data)

class DeliveryFilter(filters.FilterSet):
    status = filters.CharFilter(field_name="status")
    pincode = filters.CharFilter(field_name="order__delivery_pincode")
    delivery_boy_is_null = filters.BooleanFilter(field_name="delivery_boy", lookup_expr='isnull')

    class Meta:
        model = Delivery
        fields = ['status', 'delivery_boy', 'pincode', 'delivery_boy_is_null']

class DeliveryViewSet(viewsets.ModelViewSet):
    queryset = Delivery.objects.all()
    serializer_class = DeliverySerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_class = DeliveryFilter

    def get_queryset(self):
        user = self.request.user
        if user.user_type == 'delivery':
            # Delivery boys see deliveries in their pincode, either assigned or unassigned
            # For unassigned deliveries, check if the delivery_boy field is null and in their pincode
            # For assigned deliveries, ensure it's assigned to them
            return Delivery.objects.filter(
                models.Q(delivery_boy__user=user) |
                models.Q(delivery_boy__isnull=True, order__delivery_pincode=user.pincode)
            )
        elif user.user_type == 'owner':
            return Delivery.objects.filter(order__tiffin__owner__user=user)
        elif user.user_type == 'customer':
            return Delivery.objects.filter(order__customer=user)
        return Delivery.objects.none()

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        delivery = self.get_object()
        new_status = request.data.get('status')
        
        if new_status not in dict(Delivery.STATUS_CHOICES):
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
        
        delivery.status = new_status
        delivery.save()
        return Response(DeliverySerializer(delivery).data)

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        delivery = self.get_object()
        user = self.request.user

        if user.user_type != 'delivery':
            return Response({'error': 'Only delivery boys can accept deliveries.'}, status=status.HTTP_403_FORBIDDEN)

        if delivery.status != 'pending':
            return Response({'error': 'Delivery is not in pending status.'}, status=status.HTTP_400_BAD_REQUEST)

        if delivery.delivery_boy is not None:
            return Response({'error': 'Delivery already assigned.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            delivery_boy_profile = DeliveryBoy.objects.get(user=user)
        except DeliveryBoy.DoesNotExist:
            return Response({'error': 'Delivery boy profile not found.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            with transaction.atomic():
                delivery.delivery_boy = delivery_boy_profile
                delivery.status = 'accepted'
                delivery.save()
                _transfer_delivery_fee(delivery)
        except ValidationError as exc:
            return Response(exc.detail, status=status.HTTP_400_BAD_REQUEST)

        return Response(DeliverySerializer(delivery).data)


class WalletViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def _get_or_create_wallet(self, user):
        wallet, _ = Wallet.objects.get_or_create(user=user)
        return wallet

    def list(self, request):
        wallet = self._get_or_create_wallet(request.user)
        return Response(WalletSerializer(wallet).data)

    @action(detail=False, methods=['get'])
    def transactions(self, request):
        wallet = self._get_or_create_wallet(request.user)
        txns = wallet.transactions.order_by('-created_at')
        return Response(WalletTransactionSerializer(txns, many=True).data)

    @action(detail=False, methods=['post'])
    def deposit(self, request):
        amount = request.data.get('amount')
        reference = request.data.get('reference', '')
        try:
            amount = float(amount)
        except (TypeError, ValueError):
            return Response({'error': 'Invalid amount'}, status=status.HTTP_400_BAD_REQUEST)
        if amount <= 0:
            return Response({'error': 'Amount must be positive'}, status=status.HTTP_400_BAD_REQUEST)
        wallet = self._get_or_create_wallet(request.user)
        # Update balance and record transaction
        wallet.balance = (wallet.balance or 0) + amount
        wallet.save()
        WalletTransaction.objects.create(wallet=wallet, txn_type='credit', amount=amount, reference='Added to Wallet')
        return Response(WalletSerializer(wallet).data)

    @action(detail=False, methods=['post'])
    def add_to_wallet_from_bank(self, request):
        amount = request.data.get('amount')
        reference = request.data.get('reference', '')
        try:
            amount = float(amount)
        except (TypeError, ValueError):
            return Response({'error': 'Invalid amount'}, status=status.HTTP_400_BAD_REQUEST)
        if amount <= 0:
            return Response({'error': 'Amount must be positive'}, status=status.HTTP_400_BAD_REQUEST)
        wallet = self._get_or_create_wallet(request.user)
        # Update balance and record transaction
        wallet.balance = (wallet.balance or 0) + amount
        wallet.save()
        WalletTransaction.objects.create(wallet=wallet, txn_type='added from bank account', amount=amount, reference='Added from Bank Account')
        return Response(WalletSerializer(wallet).data)

    @action(detail=False, methods=['post'])
    @csrf_exempt
    def credit(self, request):
        amount = request.data.get('amount')
        bank_account_id = request.data.get('bank_account_id')
        try:
            amount = float(amount)
        except (TypeError, ValueError):
            return Response({'error': 'Invalid amount'}, status=status.HTTP_400_BAD_REQUEST)
        if amount <= 0:
            return Response({'error': 'Amount must be positive'}, status=status.HTTP_400_BAD_REQUEST)
        wallet = self._get_or_create_wallet(request.user)
        if wallet.balance < amount:
            return Response({'error': 'Insufficient balance'}, status=status.HTTP_400_BAD_REQUEST)
        # Validate bank account ownership
        try:
            if bank_account_id:
                bank = BankAccount.objects.get(id=bank_account_id, user=request.user)
            else:
                bank = BankAccount.objects.filter(user=request.user, is_primary=True).first()
        except BankAccount.DoesNotExist:
            bank = None
        if not bank:
            return Response({'error': 'No valid bank account found'}, status=status.HTTP_400_BAD_REQUEST)
        # Deduct and record
        wallet.balance = wallet.balance - amount
        wallet.save()
        WalletTransaction.objects.create(wallet=wallet, txn_type='withdraw to bank account', amount=amount, reference=f"Withdrawn to Bank: {bank.id}")
        return Response(WalletSerializer(wallet).data)

    @action(detail=False, methods=['post'])
    @csrf_exempt
    def withdraw_to_bank(self, request):
        return JsonResponse({'message': 'The withdrawal facility is temporarily stopped.'}, status=403)


class BankAccountViewSet(viewsets.ModelViewSet):
    serializer_class = BankAccountSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return BankAccount.objects.filter(user=self.request.user).order_by('-is_primary', '-created_at')

    def perform_create(self, serializer):
        serializer.save()