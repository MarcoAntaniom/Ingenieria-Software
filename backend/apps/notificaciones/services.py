from itertools import islice

from django.db import transaction

from .models import (
    EventoNotificacion,
    Notificacion,
    SolicitudNotificacion,
    TipoNotificacion,
)

BATCH_SIZE = 500


def crear_notificaciones(destinatario_ids, *, titulo, mensaje, tipo, datos=None):
    if isinstance(tipo, TipoNotificacion):
        tipo_notificacion = tipo
    else:
        tipo_notificacion = TipoNotificacion.objects.get(codigo=tipo, activo=True)
    if hasattr(destinatario_ids, 'iterator'):
        destinatarios = destinatario_ids.iterator(chunk_size=BATCH_SIZE)
    else:
        destinatarios = iter(destinatario_ids)
    total_creadas = 0

    while lote := list(islice(destinatarios, BATCH_SIZE)):
        ids = set(lote)
        if not ids:
            continue

        with transaction.atomic():
            notificaciones = Notificacion.objects.bulk_create([
                Notificacion(
                    destinatario_id=destinatario_id,
                    titulo=titulo,
                    mensaje=mensaje,
                    tipo=tipo_notificacion,
                    datos=datos or {},
                )
                for destinatario_id in ids
            ], batch_size=BATCH_SIZE)
            EventoNotificacion.objects.bulk_create([
                EventoNotificacion(notificacion=notificacion)
                for notificacion in notificaciones
            ], batch_size=BATCH_SIZE)
        total_creadas += len(notificaciones)

    return total_creadas


def programar_notificaciones_seccion(
    seccion_id,
    *,
    titulo,
    mensaje,
    tipo,
    datos=None,
    excluir_usuario_id=None,
):
    tipo_notificacion = TipoNotificacion.objects.get(codigo=tipo, activo=True)
    return SolicitudNotificacion.objects.create(
        seccion_id=seccion_id,
        excluido_id=excluir_usuario_id,
        tipo=tipo_notificacion,
        titulo=titulo,
        mensaje=mensaje,
        datos=datos or {},
    )
