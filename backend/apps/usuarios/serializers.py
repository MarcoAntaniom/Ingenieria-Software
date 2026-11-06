from rest_framework import serializers, exceptions, exceptions
from django.contrib.auth.hashers import check_password
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.hashers import make_password
from .models import *

class RolSerializer(serializers.ModelSerializer):
    class Meta:
        model = Roles
        fields = ['id', 'nombre', 'codigo']

class UsuarioSerializer(serializers.ModelSerializer):
    # Permite crear usuarios.
    rol_id = serializers.PrimaryKeyRelatedField(
        queryset = Roles.objects.all(),
        source = 'rol',
        write_only=True
    )

    password_hash = serializers.CharField(
        write_only=True,
        required=True
    )

    rol = RolSerializer(read_only=True)

    class Meta:
        model = Usuarios
        fields = ['id', 'rut', 'nombres', 'apellidos', 'correo_institucional', 'password_hash', 'rol_id', 'rol', 'activo']

    # Método para hashear la password.
    def create(self, validated_data):
        validated_data['password_hash'] = make_password(
            validated_data['password_hash']
        )

        return Usuarios.objects.create(**validated_data)

class LoginSerializer(serializers.Serializer):
    correo_institucional = serializers.EmailField(
        error_messages={
            'required': 'El correo institucional es obligatorio.',
            'invalid': 'Ingresa un formato de correo electrónico válido.',
            'blank': 'El correo institucional no puede estar vacío.',
        }
    )
    password = serializers.CharField(
        write_only=True,
        error_messages={
            'required': 'La contraseña es obligatoria.',
            'blank': 'La contraseña no puede estar vacía.',
        }
    )

    def validate(self, attrs):
        raw_correo = attrs.get('correo_institucional')
        password = attrs.get('password')

        # Normalización estricta de correo (limpieza de espacios y conversión a minúsculas)
        correo = str(raw_correo).strip().lower() if raw_correo else ''

        if not correo or not password:
            raise serializers.ValidationError("Debe ingresar correo institucional y contraseña.")

        try:
            # Comprueba si el usuario existe en la base de datos usando el correo normalizado
            usuario = Usuarios.objects.select_related('rol').get(correo_institucional=correo)
        except Usuarios.DoesNotExist:
            # Mitigación de enumeración de usuarios: mensaje idéntico al fallo de contraseña (HTTP 401)
            raise exceptions.AuthenticationFailed(
                detail="Credenciales incorrectas. Verifique su correo institucional y contraseña.",
                code="invalid_credentials"
            )

        # Comprueba si el usuario está activo (HTTP 403 Forbidden)
        if not usuario.activo:
            raise exceptions.PermissionDenied(
                detail="Esta cuenta institucional se encuentra inactiva o bloqueada. Contacte a soporte de TI.",
                code="account_inactive"
            )

        # Comprueba la contraseña ingresada mediante hash seguro (HTTP 401 Unauthorized)
        if not check_password(password, usuario.password_hash):
            raise exceptions.AuthenticationFailed(
                detail="Credenciales incorrectas. Verifique su correo institucional y contraseña.",
                code="invalid_credentials"
            )

        # Genera el token JWT con claims consistentes de rol y permisos
        refresh = RefreshToken.for_user(usuario)
        refresh['rol'] = usuario.rol.codigo

        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'usuario': UsuarioSerializer(usuario).data # Reutiliza el UsuarioSerializer para devolver un perfil limpio.
        }


class PerfilEstudianteSerializer(serializers.ModelSerializer):
    class Meta:
        model = PerfilEstudiante
        fields = ['id', 'usuario', 'carrera', 'nivel', 'anio_ingreso']

class PerfilDocenteSerializer(serializers.ModelSerializer):
    class Meta:
        model = PerfilDocente
        fields = ["id", "usuario", "especialidad", "departamento"]
