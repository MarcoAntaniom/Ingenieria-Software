from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.settings import api_settings
from rest_framework.exceptions import AuthenticationFailed
from .models import Usuarios

class UsuarioJWTAuthentication(JWTAuthentication):
    def get_user(eslf, validated_token):
        try:
            user_id = validated_token[api_settings.USER_ID_CLAIM]
        except KeyError:
            raise AuthenticationFailed("El token no contiene identificación de usuario reconocible", code="token_not_valid")

        try:
            # Busca el usuario en el modelo Usuarios.
            return Usuarios.objects.select_related('rol').get(id=user_id, activo=True)
        except Usuarios.DoesNotExist:
            raise AuthenticationFailed("Usuario no encontrado o inactivo", code="user_not_found")
