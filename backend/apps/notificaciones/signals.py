from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

from apps.comunicacion.models import Anuncio, MensajeDirecto, MensajeForo, TemaForo
from apps.evaluaciones.models import EntregaTarea, Tarea

from .services import crear_notificaciones, programar_notificaciones_seccion


def _notificar_inscritos(seccion_id, emisor_id, *, titulo, mensaje, tipo, datos):
    programar_notificaciones_seccion(
        seccion_id,
        titulo=titulo,
        mensaje=mensaje,
        tipo=tipo,
        datos=datos,
        excluir_usuario_id=emisor_id,
    )


@receiver(post_save, sender=Anuncio, dispatch_uid='notificaciones_anuncio')
def notificar_anuncio(sender, instance, created, **kwargs):
    if not created:
        return
    _notificar_inscritos(
        instance.seccion_id,
        instance.autor_id,
        titulo=instance.titulo,
        mensaje='Se publicó un nuevo anuncio en tu sección.',
        tipo='comunicacion',
        datos={'anuncio_id': instance.pk, 'seccion_id': instance.seccion_id},
    )


@receiver(pre_save, sender=Tarea, dispatch_uid='notificaciones_tarea_pre_save')
def registrar_visibilidad_anterior_tarea(sender, instance, **kwargs):
    if not instance.pk:
        instance._notificacion_visible_anterior = False
        return
    instance._notificacion_visible_anterior = sender.objects.filter(
        pk=instance.pk,
    ).values_list('es_visible', flat=True).first()


@receiver(post_save, sender=Tarea, dispatch_uid='notificaciones_tarea')
def notificar_tarea(sender, instance, created, **kwargs):
    era_visible = getattr(instance, '_notificacion_visible_anterior', False)
    if not instance.es_visible or (not created and era_visible):
        return
    _notificar_inscritos(
        instance.seccion_id,
        None,
        titulo=instance.titulo,
        mensaje='Hay una nueva tarea disponible en tu sección.',
        tipo='evaluacion',
        datos={'tarea_id': instance.pk, 'seccion_id': instance.seccion_id},
    )


@receiver(pre_save, sender=EntregaTarea, dispatch_uid='notificaciones_nota_pre_save')
def registrar_nota_anterior(sender, instance, **kwargs):
    if not instance.pk:
        instance._notificacion_nota_anterior = None
        return
    instance._notificacion_nota_anterior = sender.objects.filter(
        pk=instance.pk,
    ).values_list('nota_final', flat=True).first()


@receiver(post_save, sender=EntregaTarea, dispatch_uid='notificaciones_nota')
def notificar_calificacion(sender, instance, created, **kwargs):
    nota_anterior = getattr(instance, '_notificacion_nota_anterior', None)
    if instance.nota_final is None or (not created and nota_anterior == instance.nota_final):
        return
    crear_notificaciones(
        [instance.estudiante.usuario_id],
        titulo=f'Calificación publicada: {instance.tarea.titulo}',
        mensaje='Tu entrega ya fue calificada.',
        tipo='evaluacion',
        datos={'entrega_id': instance.pk, 'tarea_id': instance.tarea_id},
    )


@receiver(post_save, sender=TemaForo, dispatch_uid='notificaciones_tema_foro')
def notificar_tema_foro(sender, instance, created, **kwargs):
    if not created:
        return
    _notificar_inscritos(
        instance.foro.seccion_id,
        instance.autor_id,
        titulo=f'Nuevo tema: {instance.titulo}',
        mensaje='Se creó un nuevo tema en el foro de tu sección.',
        tipo='comunicacion',
        datos={'foro_id': instance.foro_id, 'tema_id': instance.pk},
    )


@receiver(post_save, sender=MensajeForo, dispatch_uid='notificaciones_mensaje_foro')
def notificar_mensaje_foro(sender, instance, created, **kwargs):
    if not created:
        return
    destinatarios = {instance.tema.autor_id}
    if instance.mensaje_padre_id:
        destinatarios.add(instance.mensaje_padre.autor_id)
    destinatarios.discard(instance.autor_id)
    crear_notificaciones(
        destinatarios,
        titulo=f'Nueva respuesta: {instance.tema.titulo}',
        mensaje='Hay una nueva respuesta en el tema que sigues.',
        tipo='comunicacion',
        datos={'tema_id': instance.tema_id, 'mensaje_id': instance.pk},
    )


@receiver(post_save, sender=MensajeDirecto, dispatch_uid='notificaciones_mensaje_directo')
def notificar_mensaje_directo(sender, instance, created, **kwargs):
    if not created:
        return
    destinatarios = instance.conversacion.participantes.exclude(
        usuario_id=instance.remitente_id,
    ).values_list('usuario_id', flat=True)
    crear_notificaciones(
        destinatarios,
        titulo='Nuevo mensaje',
        mensaje=f'{instance.remitente.nombres} {instance.remitente.apellidos} te envió un mensaje.',
        tipo='comunicacion',
        datos={'conversacion_id': instance.conversacion_id, 'mensaje_id': instance.pk},
    )
