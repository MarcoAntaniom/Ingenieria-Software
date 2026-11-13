"""
ASGI config for config project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/6.1/howto/deployment/asgi/
"""

import os

from django.core.asgi import get_asgi_application
from django.conf import settings

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

django_asgi_app = get_asgi_application()

from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import OriginValidator

from apps.notificaciones.routing import websocket_urlpatterns
from apps.notificaciones.middleware import JWTAuthMiddleware

application = ProtocolTypeRouter({
    'http': django_asgi_app,
    'websocket': OriginValidator(
        JWTAuthMiddleware(
            URLRouter(websocket_urlpatterns)
        ),
        settings.WEBSOCKET_ALLOWED_ORIGINS,
    ),
})
