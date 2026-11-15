from django.urls import path
from .views import (
    CustomTokenRefreshView,
    LoginView,
    LogoutView,
    PerfilDocenteView,
    PerfilEstudianteView,
    PerfilView,
    RolListView,
    UsuarioView,
)

urlpatterns = [
    path('login/', view=LoginView.as_view(), name='login'),
    path('logout/', view=LogoutView.as_view(), name='logout'),
    path('roles/', view=RolListView.as_view(), name='roles_list'),
    path('me/', view=PerfilView.as_view(), name='perfil_me'),
    path('read/', view=UsuarioView.as_view(), name='read'),
    path('create/', view=UsuarioView.as_view(), name='create'),
    path('update/<int:pk>/', view=UsuarioView.as_view(), name='update'),
    path('refresh/', view=CustomTokenRefreshView.as_view(), name='token_refresh'),
    path('student-profile/', view=PerfilEstudianteView.as_view(), name='student-profile'),
    path('teacher-profile/', view=PerfilDocenteView.as_view(), name='teacher-profile'),
]
