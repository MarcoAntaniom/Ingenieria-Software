from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .serializers import LoginSerializer, UsuarioSerializer

# Vistas de los usuarios.

class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)

        if serializer.is_valid():
            # Si es válido manda código 200 y lo deja pasar.
            return Response(serializer.validated_data, status=status.HTTP_200_OK)

        # Si no es válido manda código 400 y no lo deja pasar.
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PerfilView(APIView):
    permissions_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UsuarioSerializer(request.user) # request tiene almacenado los datos del usuario que inicio sesión.
        return Response(serializer.data, status=status.HTTP_200_OK)
