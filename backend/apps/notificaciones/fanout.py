import logging
import uuid
from datetime import timedelta

from django.db import transaction
from django.db.models import Q
from django.utils import timezone

from apps.academico.models import Inscripcion

from .models import SolicitudNotificacion
from .services import BATCH_SIZE, crear_notificaciones

logger = logging.getLogger(__name__)
MAX_ATTEMPTS = 12
LEASE_DURATION = timedelta(minutes=2)
MAX_RETRY_DELAY_SECONDS = 300


def procesar_solicitudes_pendientes(batch_size=10):
    solicitudes = _reclamar_solicitudes(batch_size)
    destinatarios_procesados = 0

    for solicitud in solicitudes:
        try:
            destinatarios_procesados += _procesar_solicitud(solicitud)
        except Exception as error:
            logger.exception(
                'Falló la expansión de la solicitud de notificación %s.',
                solicitud['solicitud_id'],
            )
            _programar_reintento(solicitud, error)

    return destinatarios_procesados


def _reclamar_solicitudes(batch_size):
    ahora = timezone.now()
    solicitudes_reclamadas = []

    with transaction.atomic():
        solicitudes = list(
            SolicitudNotificacion.objects
            .filter(
                Q(
                    estado=SolicitudNotificacion.Estado.PENDIENTE,
                    disponible_en__lte=ahora,
                )
                | Q(
                    estado=SolicitudNotificacion.Estado.PROCESANDO,
                    bloqueo_hasta__lt=ahora,
                )
            )
            .order_by('creado_en')
            .select_for_update(skip_locked=True)[:batch_size]
        )

        for solicitud in solicitudes:
            token_bloqueo = uuid.uuid4()
            solicitud.estado = SolicitudNotificacion.Estado.PROCESANDO
            solicitud.intentos += 1
            solicitud.bloqueo_hasta = ahora + LEASE_DURATION
            solicitud.token_bloqueo = token_bloqueo
            solicitud.save(update_fields=[
                'estado',
                'intentos',
                'bloqueo_hasta',
                'token_bloqueo',
            ])
            solicitudes_reclamadas.append({
                'solicitud_id': solicitud.pk,
                'token_bloqueo': token_bloqueo,
                'intentos': solicitud.intentos,
            })

    return solicitudes_reclamadas


def _procesar_solicitud(solicitud):
    ahora = timezone.now()
    with transaction.atomic():
        trabajo = (
            SolicitudNotificacion.objects
            .select_for_update()
            .filter(
                pk=solicitud['solicitud_id'],
                token_bloqueo=solicitud['token_bloqueo'],
            )
            .first()
        )
        if trabajo is None:
            return 0

        destinatarios = Inscripcion.objects.filter(
            seccion_id=trabajo.seccion_id,
            estudiante__usuario_id__gt=trabajo.ultimo_destinatario_id,
            creado_en__lte=trabajo.creado_en,
        )
        if trabajo.excluido_id:
            destinatarios = destinatarios.exclude(
                estudiante__usuario_id=trabajo.excluido_id,
            )
        ids = list(
            destinatarios
            .order_by('estudiante__usuario_id')
            .values_list('estudiante__usuario_id', flat=True)
            .distinct()[:BATCH_SIZE]
        )

        if not ids:
            trabajo.estado = SolicitudNotificacion.Estado.COMPLETADA
            trabajo.completado_en = ahora
            trabajo.bloqueo_hasta = None
            trabajo.token_bloqueo = None
            trabajo.save(update_fields=[
                'estado',
                'completado_en',
                'bloqueo_hasta',
                'token_bloqueo',
            ])
            return 0

        crear_notificaciones(
            ids,
            titulo=trabajo.titulo,
            mensaje=trabajo.mensaje,
            tipo=trabajo.tipo,
            datos=trabajo.datos,
        )
        trabajo.ultimo_destinatario_id = ids[-1]
        trabajo.estado = SolicitudNotificacion.Estado.PENDIENTE
        trabajo.disponible_en = ahora
        trabajo.bloqueo_hasta = None
        trabajo.token_bloqueo = None
        trabajo.save(update_fields=[
            'ultimo_destinatario_id',
            'estado',
            'disponible_en',
            'bloqueo_hasta',
            'token_bloqueo',
        ])
        return len(ids)


def _programar_reintento(solicitud, error):
    ahora = timezone.now()
    if solicitud['intentos'] >= MAX_ATTEMPTS:
        estado = SolicitudNotificacion.Estado.FALLIDA
        disponible_en = ahora
    else:
        estado = SolicitudNotificacion.Estado.PENDIENTE
        segundos_espera = min(
            2 ** (solicitud['intentos'] - 1),
            MAX_RETRY_DELAY_SECONDS,
        )
        disponible_en = ahora + timedelta(seconds=segundos_espera)

    SolicitudNotificacion.objects.filter(
        pk=solicitud['solicitud_id'],
        token_bloqueo=solicitud['token_bloqueo'],
    ).update(
        estado=estado,
        disponible_en=disponible_en,
        bloqueo_hasta=None,
        token_bloqueo=None,
        ultimo_error=str(error)[:4000],
    )
    if estado == SolicitudNotificacion.Estado.FALLIDA:
        logger.error(
            'La solicitud de notificación %s agotó los reintentos: %s',
            solicitud['solicitud_id'],
            error,
        )
