from django.urls import path

from .views import (
    NotificacionListView,
    NotificacionReadView,
    NotificacionUnreadCountView,
    NotificacionesReadAllView,
    TipoNotificacionListView,
)

urlpatterns = [
    path('', NotificacionListView.as_view(), name='notificaciones-list'),
    path('tipos/', TipoNotificacionListView.as_view(), name='notificaciones-tipos'),
    path('no-leidas/contador/', NotificacionUnreadCountView.as_view(), name='notificaciones-no-leidas'),
    path('leer-todas/', NotificacionesReadAllView.as_view(), name='notificaciones-leer-todas'),
    path('<int:pk>/leer/', NotificacionReadView.as_view(), name='notificacion-leer'),
]
