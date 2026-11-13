import asyncio
import logging
import uuid
from datetime import timedelta

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.db import transaction
from django.db.models import Q
from django.utils import timezone

from .models import EventoNotificacion

logger = logging.getLogger(__name__)
MAX_ATTEMPTS = 12
LEASE_DURATION = timedelta(minutes=2)
MAX_RETRY_DELAY_SECONDS = 300


def procesar_eventos_pendientes(batch_size=100):
    eventos = _reclamar_eventos(batch_size)
    channel_layer = get_channel_layer()
    if channel_layer is None:
        logger.error('No hay un channel layer configurado para entregar notificaciones.')
        for evento in eventos:
            _programar_reintento(
                evento,
                RuntimeError('No hay un channel layer configurado.'),
            )
        return len(eventos)

    resultados = async_to_sync(_enviar_lote)(channel_layer, eventos)
    for evento, error in zip(eventos, resultados):
        if error is not None:
            logger.error(
                'Falló la entrega en tiempo real de la notificación %s.',
                evento['notificacion_id'],
                exc_info=(type(error), error, error.__traceback__),
            )
            _programar_reintento(evento, error)
        else:
            EventoNotificacion.objects.filter(
                pk=evento['evento_id'],
                token_bloqueo=evento['token_bloqueo'],
            ).update(
                estado=EventoNotificacion.Estado.ENVIADO,
                enviado_en=timezone.now(),
                bloqueo_hasta=None,
                token_bloqueo=None,
                ultimo_error='',
            )
    return len(eventos)


async def _enviar_lote(channel_layer, eventos):
    async def enviar(evento):
        try:
            await channel_layer.group_send(
                f'notificaciones_{evento["destinatario_id"]}',
                {
                    'type': 'notification',
                    'notification': evento['notification'],
                },
            )
        except Exception as error:
            return error
        return None

    return await asyncio.gather(*(enviar(evento) for evento in eventos))


def _reclamar_eventos(batch_size):
    ahora = timezone.now()
    eventos_reclamados = []

    with transaction.atomic():
        eventos = list(
            EventoNotificacion.objects
            .filter(
                Q(estado=EventoNotificacion.Estado.PENDIENTE, disponible_en__lte=ahora)
                | Q(estado=EventoNotificacion.Estado.PROCESANDO, bloqueo_hasta__lt=ahora)
            )
            .select_related('notificacion__destinatario', 'notificacion__tipo')
            .order_by('creado_en')
            .select_for_update(skip_locked=True)[:batch_size]
        )

        for evento in eventos:
            token_bloqueo = uuid.uuid4()
            evento.estado = EventoNotificacion.Estado.PROCESANDO
            evento.intentos += 1
            evento.bloqueo_hasta = ahora + LEASE_DURATION
            evento.token_bloqueo = token_bloqueo
            evento.save(update_fields=[
                'estado',
                'intentos',
                'bloqueo_hasta',
                'token_bloqueo',
            ])
            notificacion = evento.notificacion
            eventos_reclamados.append({
                'evento_id': evento.pk,
                'notificacion_id': notificacion.pk,
                'destinatario_id': notificacion.destinatario_id,
                'token_bloqueo': token_bloqueo,
                'intentos': evento.intentos,
                'notification': {
                    'id': notificacion.pk,
                    'titulo': notificacion.titulo,
                    'mensaje': notificacion.mensaje,
                    'tipo': notificacion.tipo.codigo,
                    'datos': notificacion.datos,
                    'leida': notificacion.leida,
                    'creada_en': notificacion.creada_en.isoformat(),
                    'leida_en': (
                        notificacion.leida_en.isoformat()
                        if notificacion.leida_en
                        else None
                    ),
                },
            })

    return eventos_reclamados


def _programar_reintento(evento, error):
    ahora = timezone.now()
    intentos = evento['intentos']
    if intentos >= MAX_ATTEMPTS:
        estado = EventoNotificacion.Estado.FALLIDO
        disponible_en = ahora
    else:
        estado = EventoNotificacion.Estado.PENDIENTE
        segundos_espera = min(2 ** (intentos - 1), MAX_RETRY_DELAY_SECONDS)
        disponible_en = ahora + timedelta(seconds=segundos_espera)

    EventoNotificacion.objects.filter(
        pk=evento['evento_id'],
        token_bloqueo=evento['token_bloqueo'],
    ).update(
        estado=estado,
        disponible_en=disponible_en,
        bloqueo_hasta=None,
        token_bloqueo=None,
        ultimo_error=str(error)[:4000],
    )
    if estado == EventoNotificacion.Estado.FALLIDO:
        logger.error(
            'La notificación %s agotó los reintentos de entrega: %s',
            evento['notificacion_id'],
            error,
        )
