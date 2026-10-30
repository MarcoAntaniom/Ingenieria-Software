from django.shortcuts import render
from django.core.exceptions import ValidationError
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .models import IntentoEvaluacion
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

# Create your views here.
def iniciar_o_enviar_evaluacion(evaluacion, estudiante):
    ahora = timezone.now()
    
    # Validar fechas de la evaluación
    if ahora < evaluacion.fecha_inicio or ahora > evaluacion.fecha_cierre:
        raise ValidationError("La evaluación no está disponible en este momento (fuera de plazo).")

    # Contar cuántos intentos previos ha realizado el estudiante
    intentos_realizados = IntentoEvaluacion.objects.filter(evaluacion=evaluacion, estudiante=estudiante).count()

    # Verificar si ya agotó sus intentos
    if intentos_realizados >= evaluacion.intentos_permitidos:
        raise ValidationError(f"Has agotado el límite de {evaluacion.intentos_permitidos} intentos permitidos para esta evaluación.")

    # Crear el nuevo intento
    nuevo_intento = IntentoEvaluacion.objects.create(
        evaluacion=evaluacion,
        estudiante=estudiante,
        numero_intento=intentos_realizados + 1,
        completado=False
    )
    return nuevo_intento
