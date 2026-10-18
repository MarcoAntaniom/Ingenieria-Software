from django.urls import path
from .views import LoginView, PerfilView

urlpatterns = [
    path('login/', view=LoginView.as_view(), name='login'),
    path('me/', view=PerfilView.as_view(), name='perfil_me'),
]
