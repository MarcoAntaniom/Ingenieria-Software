from decimal import Decimal

from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import NotFound, ValidationError

from .models import EntregaTarea
from .permissions import is_assigned_teacher


@transaction.atomic
def guardar_borrador_entrega(tarea, estudiante, archivo=None, comentario=None):
    """Permite crear o actualizar un avance sin marcarlo como entregado oficialmente."""
    entrega, _ = EntregaTarea.objects.get_or_create(
        tarea=tarea,
        estudiante=estudiante,
        defaults={'estado': EntregaTarea.EstadoEntrega.BORRADOR}
    )
    entrega = EntregaTarea.objects.select_for_update().get(pk=entrega.pk)

    if entrega.estado not in (
        EntregaTarea.EstadoEntrega.BORRADOR,
        EntregaTarea.EstadoEntrega.REABIERTA,
    ):
        raise ValidationError("La entrega ya no admite cambios del estudiante.")

    if archivo:
        try:
            for validator in EntregaTarea._meta.get_field('archivo').validators:
                validator(archivo)
        except DjangoValidationError as error:
            raise ValidationError(error.messages) from error
        entrega.archivo = archivo
    if comentario is not None:
        entrega.comentario_estudiante = comentario

    entrega.save()
    return entrega


@transaction.atomic
def confirmar_envio_definitivo(entrega_id, estudiante):
    """
    Realiza la entrega definitiva, calcula si hay retraso y aplica 
    la penalización del 1% por hora a menos que tenga exención docente.
    """
    try:
        entrega = EntregaTarea.objects.select_for_update().get(
            id=entrega_id,
            estudiante=estudiante,
        )
    except EntregaTarea.DoesNotExist:
        raise NotFound("La entrega o borrador no existe.")

    if entrega.estado in (
        EntregaTarea.EstadoEntrega.ENVIADO,
        EntregaTarea.EstadoEntrega.EN_REVISION,
    ):
        raise ValidationError("Esta tarea ya cuenta con una entrega definitiva registrada.")

    if not entrega.archivo:
        raise ValidationError("No se puede realizar una entrega definitiva sin adjuntar un archivo.")

    ahora = timezone.now()
    tarea = entrega.tarea

    # Validar si superó la fecha límite oficial
    if tarea.fecha_cierre and ahora > tarea.fecha_cierre:
        if not tarea.permite_atrasados:
            raise ValidationError("El plazo de entrega ha expirado y la tarea no acepta envíos fuera de plazo.")
        entrega.es_fuera_de_plazo = True

    # Cambiar estado y estampar el timestamp oficial
    entrega.estado = EntregaTarea.EstadoEntrega.ENVIADO
    entrega.fecha_envio_definitivo = ahora
    entrega.save()

    return entrega


def calcular_penalizacion_calificacion(entrega_id, calificacion_obtenida):
    """
    Función para que el docente asigne la nota y el sistema aplique 
    el 1% de descuento por cada hora de atraso (si aplica y no está exento).
    """
    try:
        entrega = EntregaTarea.objects.get(id=entrega_id)
    except EntregaTarea.DoesNotExist:
        raise ValidationError("La entrega no existe.")

    nota_base = Decimal(str(calificacion_obtenida))
    entrega.calificacion_original = nota_base

    # Si no está fuera de plazo o el docente otorgó exención, no hay penalización
    if not entrega.es_fuera_de_plazo or entrega.exonerado_penalizacion or not entrega.tarea.aplica_penalizacion_atraso:
        entrega.calificacion_final = nota_base
    else:
        # Calcular diferencia en horas completas
        diferencia_tiempo = entrega.fecha_envio_definitivo - entrega.tarea.fecha_cierre
        horas_atraso = Decimal(str(diferencia_tiempo.total_seconds() / 3600)).quantize(Decimal('1.'))
        
        if horas_atraso < 0:
            horas_atraso = 0

        # 1% de penalización por cada hora de atraso
        porcentaje_descuento = horas_atraso * Decimal('0.01')
        
        # El descuento no puede superar el 100% (nota mínima 0)
        if porcentaje_descuento > Decimal('1.00'):
            porcentaje_descuento = Decimal('1.00')

        nota_penalizada = nota_base * (Decimal('1.00') - porcentaje_descuento)
        entrega.calificacion_final = max(Decimal('0.00'), nota_penalizada.quantize(Decimal('0.01')))

    entrega.save()
    return entrega

def cambiar_estado_revision(entrega_id, docente):
    """Permite al docente marcar la entrega como 'En revisión'."""
    try:
        entrega = EntregaTarea.objects.get(id=entrega_id)
    except EntregaTarea.DoesNotExist:
        raise NotFound("La entrega no existe.")

    if not is_assigned_teacher(docente, entrega.tarea.seccion):
        raise NotFound("La entrega no existe.")

    if entrega.estado != EntregaTarea.EstadoEntrega.ENVIADO:
        raise ValidationError("Solo se pueden revisar entregas que hayan sido enviadas definitivamente.")

    entrega.estado = EntregaTarea.EstadoEntrega.EN_REVISION
    entrega.save()
    return entrega


def reabrir_entrega(entrega_id, docente):
    """Reabre la entrega para que el estudiante pueda modificar su archivo o corregir."""
    try:
        entrega = EntregaTarea.objects.get(id=entrega_id)
    except EntregaTarea.DoesNotExist:
        raise NotFound("La entrega no existe.")

    if not is_assigned_teacher(docente, entrega.tarea.seccion):
        raise NotFound("La entrega no existe.")

    if entrega.estado not in (
        EntregaTarea.EstadoEntrega.ENVIADO,
        EntregaTarea.EstadoEntrega.EN_REVISION,
    ):
        raise ValidationError("Solo se puede reabrir una entrega enviada o en revisión.")

    entrega.estado = EntregaTarea.EstadoEntrega.REABIERTA
    entrega.save()
    return entrega