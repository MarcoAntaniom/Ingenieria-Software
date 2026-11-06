from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ForoViewSet, TemaForoViewSet, MensajeForoViewSet, MensajeDirectoViewSet

router = DefaultRouter()
router.register('foros', ForoViewSet, basename='foros')
router.register('temas', TemaForoViewSet, basename='temas')
router.register('mensajes', MensajeForoViewSet, basename='mensajes')
router.register('mensajes-directos', MensajeDirectoViewSet, basename='mensajes-directos')

urlpatterns = [
    path('', include(router.urls)),
]
