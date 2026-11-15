from rest_framework import serializers
from django.contrib.auth.hashers import check_password, make_password
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Roles, Usuarios, PerfilEstudiante, PerfilDocente


class RolSerializer(serializers.ModelSerializer):
    class Meta:
        model = Roles
        fields = ['id', 'nombre', 'codigo', 'descripcion']


class UsuarioSerializer(serializers.ModelSerializer):
    # Permite crear y actualizar usuarios indicando el ID del rol.
    rol_id = serializers.PrimaryKeyRelatedField(
        queryset=Roles.objects.all(),
        source='rol',
        write_only=True,
        required=False,
    )

    password_hash = serializers.CharField(
        write_only=True,
        required=False,
    )

    rol = RolSerializer(read_only=True)

    class Meta:
        model = Usuarios
        fields = [
            'id',
            'rut',
            'nombres',
            'apellidos',
            'correo_institucional',
            'password_hash',
            'rol_id',
            'rol',
            'activo',
        ]

    def create(self, validated_data):
        raw_password = validated_data.get('password_hash')
        if not raw_password:
            raise serializers.ValidationError({'password_hash': 'Este campo es requerido.'})
        if 'rol' not in validated_data:
            raise serializers.ValidationError({'rol_id': 'Este campo es requerido.'})

        validated_data['password_hash'] = make_password(raw_password)
        return Usuarios.objects.create(**validated_data)

    def update(self, instance, validated_data):
        raw_password = validated_data.pop('password_hash', None)
        if raw_password:
            instance.password_hash = make_password(raw_password)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class LoginSerializer(serializers.Serializer):
    correo_institucional = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        correo = attrs.get('correo_institucional')
        password = attrs.get('password')

        try:
            usuario = Usuarios.objects.select_related('rol').get(correo_institucional=correo)
        except Usuarios.DoesNotExist:
            raise serializers.ValidationError("Credenciales inválidas")

        if not usuario.activo:
            raise serializers.ValidationError("Esta cuenta se encuentra inactiva")

        if not check_password(password, usuario.password_hash):
            raise serializers.ValidationError("Credenciales inválidas")

        refresh = RefreshToken.for_user(usuario)
        refresh['rol'] = usuario.rol.codigo

        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'usuario': UsuarioSerializer(usuario).data,
        }


class PerfilEstudianteSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.SerializerMethodField()
    carrera_nombre = serializers.SerializerMethodField()

    class Meta:
        model = PerfilEstudiante
        fields = [
            'id',
            'usuario',
            'usuario_nombre',
            'carrera',
            'carrera_nombre',
            'nivel',
            'anio_ingreso',
        ]

    def get_usuario_nombre(self, obj):
        if obj.usuario_id:
            return f"{obj.usuario.nombres} {obj.usuario.apellidos}".strip()
        return ""

    def get_carrera_nombre(self, obj):
        if obj.carrera_id:
            return obj.carrera.nombre_carrera
        return ""


class PerfilDocenteSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.SerializerMethodField()
    departamento_nombre = serializers.SerializerMethodField()

    class Meta:
        model = PerfilDocente
        fields = [
            'id',
            'usuario',
            'usuario_nombre',
            'especialidad',
            'departamento',
            'departamento_nombre',
        ]

    def get_usuario_nombre(self, obj):
        if obj.usuario_id:
            return f"{obj.usuario.nombres} {obj.usuario.apellidos}".strip()
        return ""

    def get_departamento_nombre(self, obj):
        if obj.departamento_id:
            return obj.departamento.nombre
        return ""
