from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.exceptions import InvalidToken

from apps.usuarios.authentication import UsuarioJWTAuthentication


class JWTAuthMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        scope = dict(scope)
        token = self._get_token(scope)
        scope['user'] = await self._get_user(token) if token else AnonymousUser()
        return await self.app(scope, receive, send)

    @staticmethod
    def _get_token(scope):
        query = parse_qs(scope.get('query_string', b'').decode('utf-8', errors='replace'))
        tokens = query.get('token', [])
        return tokens[0] if tokens else None

    @staticmethod
    @database_sync_to_async
    def _get_user(token):
        authentication = UsuarioJWTAuthentication()
        try:
            validated_token = authentication.get_validated_token(token.encode('utf-8'))
            return authentication.get_user(validated_token)
        except (AuthenticationFailed, InvalidToken):
            return AnonymousUser()
