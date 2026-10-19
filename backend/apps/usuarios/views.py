from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .models import Usuarios
from .serializers import LoginSerializer, UsuarioSerializer

# Vistas de los usuarios.

class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)

        if serializer.is_valid():
            # Si es válido manda código 200 y lo deja pasar.
            return Response(
                {
                    "mensaje": "Login exitoso",
                    "datos": serializer.validated_data 
                },
                status=status.HTTP_200_OK
            )

        # Si no es válido manda código 400 y no lo deja pasar.
        return Response(
            {
                "mensaje": "Error al iniciar sesión",
                "error": serializer.errors 
            },
            status=status.HTTP_400_BAD_REQUEST
        )

class PerfilView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UsuarioSerializer(request.user) # request tiene almacenado los datos del usuario que inicio sesión.
        return Response(
            {
                "mensaje": "Datos encontrados exitosamente",
                "datos": serializer.data
            },
            status=status.HTTP_200_OK
        )

class UsuarioView(APIView):
    permission_classes = [permissions.IsAuthenticated] # Solo deja que un usuario logueado cree o modifique un usuario.

    def get(self, request):
        usuarios = Usuarios.objects.all()

        serializer = UsuarioSerializer(
            usuarios,
            many=True
        )

        return Response (
            {
                "mensaje": "Datos enviados correctamente",
                "datos": serializer.data
            },
            status=status.HTTP_200_OK
        )

    def post(self, request):
        serializer = UsuarioSerializer(data=request.data)

        if serializer.is_valid():
            # Guarda los datos en la base de datos.
            usuario = serializer.save()

            return Response(
                {
                    "mensaje": "Usuario creado exitosamente",
                    "usuario": UsuarioSerializer(usuario).data
                },
                status=status.HTTP_201_CREATED
            )

        # En caso de que algo no este correcto, no guarda los datos y manda error.
        return Response(
            {
                "mensaje": "Error al crear el usuario",
                "error": serializer.errors
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    def put(self, request, pk):
        try:
            usuario = Usuarios.objects.get(pk=pk) # Obtiene el ID del usuario a modificar.
        except Usuarios.DoesNotExist:
            return Response(
                {
                    "mensaje": "El usuario no existe"
                },
                status=status.HTTP_404_NOT_FOUND
            )

        # Validar los nuevos datos del usuario existente.
        serializer = UsuarioSerializer(
            usuario,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():
            usuario_actualizado = serializer.save()

            return Response(
                {
                    "mensaje": "Usuario actualizado correctamente",
                    "datos": UsuarioSerializer(usuario_actualizado).data
                },
                status=status.HTTP_200_OK
            )

        return Response(
            {
                "mensaje": "Error al actualizar el usuario",
                "error": serializer.errors
            },
            status=status.HTTP_400_BAD_REQUEST
        )
