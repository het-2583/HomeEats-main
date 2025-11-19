from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from api.views import (
    UserViewSet, TiffinOwnerViewSet, DeliveryBoyViewSet,
    TiffinViewSet, OrderViewSet, DeliveryViewSet,
    WalletViewSet, BankAccountViewSet
)
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from rest_framework import permissions

# Create a router and register our viewsets with it
router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'tiffin-owners', TiffinOwnerViewSet)
router.register(r'delivery-boys', DeliveryBoyViewSet)
router.register(r'tiffins', TiffinViewSet)
router.register(r'orders', OrderViewSet)
router.register(r'deliveries', DeliveryViewSet)
router.register(r'wallet', WalletViewSet, basename='wallet')
router.register(r'bank-accounts', BankAccountViewSet, basename='bank-accounts')

# Swagger documentation setup
schema_view = get_schema_view(
    openapi.Info(
        title="Home Eats API",
        default_version='v1',
        description="API documentation for Home Eats application",
        terms_of_service="https://www.google.com/policies/terms/",
        contact=openapi.Contact(email="contact@homeeats.com"),
        license=openapi.License(name="BSD License"),
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Swagger documentation URLs
    path('api/docs/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('api/redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    # Serve static files in development
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    # Catch all other URLs and serve the frontend
    urlpatterns += [re_path(r'^.*$', TemplateView.as_view(template_name='index.html'))] 