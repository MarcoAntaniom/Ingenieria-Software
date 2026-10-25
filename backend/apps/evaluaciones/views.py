from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .serializers import *

# Vistas para modulo de evaluaciones.

class TareaView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = TareaSerializer(data=request.data)

        if serializer.is_valid():
            tarea = serializer.save()

            return Response(
                {
                    "mensaje": "Tarea creada exitosamente",
                    "tarea": TareaSerializer(tarea).data
                },
                status = status.HTTP_201_CREATED
            )

        return Response(
            {
                "mensaje": "Error al crear la tarea.",
                "error": serializer.errors
            },
            status = status.HTTP_400_BAD_REQUEST
        )
