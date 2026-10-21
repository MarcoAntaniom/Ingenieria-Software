from django.urls import path
from .views import *

urlpatterns = [
    path('login/', view=LoginView.as_view(), name='login'),
    path('me/', view=PerfilView.as_view(), name='perfil_me'),
    path('read/', view=UsuarioView.as_view(), name='read'),
    path('create/', view=UsuarioView.as_view(), name='create'),
    path('update/<int:pk>/', view=UsuarioView.as_view(), name='update'),
    path('refresh/', view=CustomTokenRefreshView.as_view(), name='token_refresh'),
]
