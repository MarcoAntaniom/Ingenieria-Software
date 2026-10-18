from rest_framework import serializers
from django.contrib.auth.hashers import check_password
from rest_framework_simplejwt.tokens import RefreshToken
from .models import *

class RolSerializer(serializers.ModelSerializer):
    class Meta:
        model = Roles
        fields = ['id', 'nombre', 'codigo']

class UsuarioSerializer(serializers.ModelSerializer):
    rol = RolSerializer(read_only=True)

    class Meta:
        model = Usuarios
        fields = ['id', 'rut', 'nombres', 'apellidos', 'correo_institucional', 'rol', 'activo']

class LoginSerializer(serializers.Serializer):
    correo_institucional = serializers.EmailField()
    password = serializers.CharField(write_only=True) # Garantiza que la contraseña solo viaje al backend y no vuelva frontend.

    def validate(self, attrs):
        correo = attrs.get('correo_institucional')
        password = attrs.get('password')

        try:
            # Comprueba si el usuario existe en la base de datos.
            usuario = Usuarios.objects.select_related('rol').get(correo_institucional=correo)
        except Usuarios.DoesNotExist:
            raise serializers.ValidationError("Credenciales inválidas")

        # Comprueba si el usuario esta activo, de lo contrario le niega el acceso.
        if not usuario.activo:
            raise serializers.ValidationError("Esta cuenta se encuentra inactiva")

        # Comprueba la contraseña ingresada con la almacenada en la base de datos con Django.
        if not check_password(password, usuario.password_hash):
            raise serializers.ValidationError("Credenciales inválidas")

        # Genera el token JWT
        refresh = RefreshToken.for_user(usuario)
        refresh['rol'] = usuario.rol.codigo

        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'usuario': UsuarioSerializer(usuario).data # Reutiliza el UsuarioSerializer para devolver un perfil limpio.
        }
