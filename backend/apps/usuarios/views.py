from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Roles, Usuarios, PerfilEstudiante, PerfilDocente
from .serializers import (
    LoginSerializer,
    RolSerializer,
    UsuarioSerializer,
    PerfilEstudianteSerializer,
    PerfilDocenteSerializer,
)


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)

        if serializer.is_valid():
            return Response(
                {
                    "mensaje": "Login exitoso",
                    "datos": serializer.validated_data,
                },
                status=status.HTTP_200_OK,
            )

        return Response(
            {
                "mensaje": "Error al iniciar sesión",
                "error": serializer.errors,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )


class LogoutView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        return Response(
            {"mensaje": "Sesión cerrada correctamente"},
            status=status.HTTP_200_OK,
        )


class RolListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        roles = Roles.objects.all().order_by('id')
        return Response(
            {
                "mensaje": "Roles listados correctamente",
                "datos": RolSerializer(roles, many=True).data,
            },
            status=status.HTTP_200_OK,
        )


class PerfilView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UsuarioSerializer(request.user)
        return Response(
            {
                "mensaje": "Datos encontrados exitosamente",
                "datos": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class CustomTokenRefreshView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        refresh_token = request.data.get('refresh')

        if not refresh_token:
            return Response(
                {"detail": "Se requiere el token 'refresh'"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            refresh = RefreshToken(refresh_token)
            refresh.set_jti()
            refresh.set_exp()
            refresh.set_iat()

            return Response(
                {
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                },
                status=status.HTTP_200_OK,
            )

        except Exception:
            return Response(
                {
                    "detail": "El token de refresco es inválido o ha expirado."
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )


class UsuarioView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        usuarios = Usuarios.objects.select_related('rol').all().order_by('id')
        serializer = UsuarioSerializer(usuarios, many=True)
        return Response(
            {
                "mensaje": "Datos enviados correctamente",
                "datos": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    def post(self, request):
        serializer = UsuarioSerializer(data=request.data)

        if serializer.is_valid():
            usuario = serializer.save()
            return Response(
                {
                    "mensaje": "Usuario creado exitosamente",
                    "usuario": UsuarioSerializer(usuario).data,
                },
                status=status.HTTP_201_CREATED,
            )

        return Response(
            {
                "mensaje": "Error al crear el usuario",
                "error": serializer.errors,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    def put(self, request, pk):
        try:
            usuario = Usuarios.objects.get(pk=pk)
        except Usuarios.DoesNotExist:
            return Response(
                {"mensaje": "El usuario no existe"},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = UsuarioSerializer(
            usuario,
            data=request.data,
            partial=True,
        )

        if serializer.is_valid():
            usuario_actualizado = serializer.save()
            return Response(
                {
                    "mensaje": "Usuario actualizado correctamente",
                    "datos": UsuarioSerializer(usuario_actualizado).data,
                },
                status=status.HTTP_200_OK,
            )

        return Response(
            {
                "mensaje": "Error al actualizar el usuario",
                "error": serializer.errors,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )


class PerfilEstudianteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        perfiles = PerfilEstudiante.objects.select_related(
            'usuario', 'carrera'
        ).all().order_by('id')
        return Response(
            {
                "mensaje": "Perfiles de estudiante obtenidos",
                "datos": PerfilEstudianteSerializer(perfiles, many=True).data,
            },
            status=status.HTTP_200_OK,
        )

    def post(self, request):
        if request.user.rol.id != 1 and request.user.rol.codigo.lower() != 'admin':
            return Response(
                {"mensaje": "Permiso denegado"},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = PerfilEstudianteSerializer(data=request.data)

        if serializer.is_valid():
            perfil_estudiante = serializer.save()
            return Response(
                {
                    "mensaje": "Perfil creado exitosamente",
                    "perfil_estudiante": PerfilEstudianteSerializer(perfil_estudiante).data,
                },
                status=status.HTTP_201_CREATED,
            )

        return Response(
            {
                "mensaje": "Error al crear el perfil del estudiante",
                "error": serializer.errors,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )


class PerfilDocenteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        perfiles = PerfilDocente.objects.select_related(
            'usuario', 'departamento'
        ).all().order_by('id')
        return Response(
            {
                "mensaje": "Perfiles docentes obtenidos",
                "datos": PerfilDocenteSerializer(perfiles, many=True).data,
            },
            status=status.HTTP_200_OK,
        )

    def post(self, request):
        if request.user.rol.id != 1 and request.user.rol.codigo.lower() != 'admin':
            return Response(
                {"mensaje": "Permiso denegado"},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = PerfilDocenteSerializer(data=request.data)

        if serializer.is_valid():
            perfil_docente = serializer.save()
            return Response(
                {
                    "mensaje": "Perfil creado exitosamente",
                    "perfil_docente": PerfilDocenteSerializer(perfil_docente).data,
                },
                status=status.HTTP_201_CREATED,
            )

        return Response(
            {
                "mensaje": "Error al crear el perfil del docente",
                "error": serializer.errors,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )
