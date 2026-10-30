from django.shortcuts import render
from django.core.exceptions import ValidationError
from django.utils import timezone
from .models import IntentoEvaluacion
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