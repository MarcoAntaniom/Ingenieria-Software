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
    """Cambia el estado de BORRADOR a ENVIADO y registra la fecha oficial."""
    entrega = EntregaTarea.objects.get(id=entrega_id, estudiante=estudiante)

    if entrega.estado == EntregaTarea.EstadoEntrega.ENVIADO:
        raise ValidationError("Esta entrega ya fue confirmada previamente.")

    if not entrega.archivo:
        raise ValidationError("Debes subir un archivo válido antes de confirmar el envío.")

    ahora = timezone.now()
    tarea = entrega.tarea

    # Validar plazo de la tarea
    if ahora > tarea.fecha_cierre:
        if not tarea.permite_atrasados:
            raise ValidationError("El plazo ha expirado y la tarea no acepta entregas fuera de plazo.")
        entrega.es_fuera_de_plazo = True

    entrega.estado = EntregaTarea.EstadoEntrega.ENVIADO
    entrega.fecha_envio_definitivo = ahora
    entrega.save()
    return entrega