from django.core.exceptions import ValidationError
from django.utils import timezone
from .models import EntregaTarea, Inscripcion, SeccionDocente
from decimal import Decimal


def es_admin_usuario(usuario):
    if not usuario or not getattr(usuario, 'is_authenticated', False):
        return False
    rol = getattr(usuario, 'rol', None)
    if getattr(rol, 'id', None) == 1:
        return True
    codigo = (getattr(rol, 'codigo', '') or '').strip().lower()
    nombre = (getattr(rol, 'nombre', '') or '').strip().lower()
    return (
        codigo in ('admin', 'adm', 'administrador')
        or 'admin' in codigo
        or 'admin' in nombre
    )


def es_docente_usuario(usuario):
    if not usuario or not getattr(usuario, 'is_authenticated', False):
        return False
    if hasattr(usuario, 'perfil_docente'):
        return True
    rol = getattr(usuario, 'rol', None)
    codigo = (getattr(rol, 'codigo', '') or '').strip().lower()
    nombre = (getattr(rol, 'nombre', '') or '').strip().lower()
    return (
        any(k in codigo or k in nombre for k in ('docente', 'profesor', 'teacher'))
        or codigo == 'doc'
    )


def obtener_secciones_usuario_ids(usuario):
    """
    Retorna los IDs de secciones a las que pertenece el usuario:
    - `None` para administradores (acceso sin restricción de sección).
    - Lista de IDs de `SeccionDocente` para docentes.
    - Lista de IDs de `Inscripcion` para estudiantes.
    - `[]` si no tiene perfil o no está autenticado.
    """
    if not usuario or not getattr(usuario, 'is_authenticated', False):
        return []
    if es_admin_usuario(usuario):
        return None
    if es_docente_usuario(usuario):
        if hasattr(usuario, 'perfil_docente'):
            return list(
                SeccionDocente.objects.filter(
                    docente=usuario.perfil_docente
                ).values_list('seccion_id', flat=True)
            )
        return []
    if hasattr(usuario, 'perfil_estudiante'):
        return list(
            Inscripcion.objects.filter(
                estudiante=usuario.perfil_estudiante
            ).values_list('seccion_id', flat=True)
        )
    return []

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
    Realiza la entrega definitiva, calcula si hay retraso y aplica 
    la penalización del 1% por hora a menos que tenga exención docente.
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

    # Validar si superó la fecha límite oficial (máximo 1 hora de espera en entrega tardía)
    if tarea.fecha_cierre and ahora > tarea.fecha_cierre:
        if not tarea.permite_atrasados:
            raise ValidationError("El plazo de entrega ha expirado y la tarea no acepta envíos fuera de plazo.")
        limite_tardio = tarea.fecha_cierre + timezone.timedelta(hours=1)
        if ahora > limite_tardio:
            raise ValidationError("El tiempo máximo de espera para entregas tardías (1 hora) ha expirado y la entrega está bloqueada.")
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
        raise ValidationError("La entrega no existe.")

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
        raise ValidationError("La entrega no existe.")

    # Cambia de estado a REABIERTA permitiendo edición nuevamente
    entrega.estado = EntregaTarea.EstadoEntrega.REABIERTAS
    entrega.save()
    return entrega