from rest_framework.routers import DefaultRouter

from .views import (
    AnuncioViewSet,
    ForoViewSet,
    MensajeDirectoViewSet,
    MensajeForoViewSet,
    TemaForoViewSet,
)

router = DefaultRouter()
router.register('anuncios', AnuncioViewSet, basename='anuncio')
router.register('foros', ForoViewSet, basename='foro')
router.register('temas', TemaForoViewSet, basename='tema-foro')
router.register('mensajes-foro', MensajeForoViewSet, basename='mensaje-foro')
router.register('mensajes-directos', MensajeDirectoViewSet, basename='mensaje-directo')

urlpatterns = router.urls
