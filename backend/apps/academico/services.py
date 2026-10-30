from django.core.exceptions import ValidationError
from django.utils import timezone
from .models import EntregaTarea

def guardar_borrador_entrega(tarea, estudiante, archivo=None, comentario=None):
    """Permite crear o actualizar un avance sin marcarlo como entregado oficialmente."""
    entrega, created = EntregaTarea.objects.get_or_create(
        tarea=tarea,
        estudiante=estudiante,
        defaults={'estado': EntregaTarea.EstadoEntrega.BORRADOR}
    )

    if entrega.estado == EntregaTarea.EstadoEntrega.ENVIADO:
        raise ValidationError("La entrega ya ha sido enviada de forma definitiva y no puede modificarse.")

    if archivo:
        entrega.archivo = archivo
    if comentario is not None:
        entrega.comentario_estudiante = comentario

    entrega.save()
    return entrega


def confirmar_envio_definitivo(entrega_id, estudiante):
    """
    Realiza la entrega definitiva, asignando el timestamp exacto 
    y validando los plazos correspondientes.
    """
    try:
        entrega = EntregaTarea.objects.get(id=entrega_id, estudiante=estudiante)
    except EntregaTarea.DoesNotExist:
        raise ValidationError("La entrega o borrador no existe.")

    if entrega.estado == EntregaTarea.EstadoEntrega.ENVIADO:
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