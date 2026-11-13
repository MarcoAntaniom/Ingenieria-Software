from django.db import models


class TipoNotificacion(models.Model):
    codigo = models.CharField(max_length=40, unique=True)
    nombre = models.CharField(max_length=80)
    descripcion = models.CharField(max_length=200, blank=True)
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = 'tipos_notificacion'
        verbose_name = 'Tipo de notificación'
        verbose_name_plural = 'Tipos de notificación'
        ordering = ['nombre']

    def __str__(self):
        return self.nombre


class Notificacion(models.Model):
    destinatario = models.ForeignKey(
        'usuarios.Usuarios',
        on_delete=models.CASCADE,
        related_name='notificaciones',
    )
    titulo = models.CharField(max_length=200)
    mensaje = models.TextField()
    tipo = models.ForeignKey(
        TipoNotificacion,
        on_delete=models.PROTECT,
        related_name='notificaciones',
    )
    datos = models.JSONField(default=dict, blank=True)
    leida = models.BooleanField(default=False)
    creada_en = models.DateTimeField(auto_now_add=True)
    leida_en = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'notificaciones'
        verbose_name = 'Notificación'
        verbose_name_plural = 'Notificaciones'
        ordering = ['-creada_en']
        indexes = [
            models.Index(fields=['destinatario', 'leida', '-creada_en']),
        ]

    def __str__(self):
        return f'{self.titulo} ({self.destinatario_id})'


class EventoNotificacion(models.Model):
    class Estado(models.TextChoices):
        PENDIENTE = 'pendiente', 'Pendiente'
        PROCESANDO = 'procesando', 'Procesando'
        ENVIADO = 'enviado', 'Enviado'
        FALLIDO = 'fallido', 'Fallido'

    notificacion = models.OneToOneField(
        Notificacion,
        on_delete=models.CASCADE,
        related_name='evento_entrega',
    )
    estado = models.CharField(
        max_length=12,
        choices=Estado.choices,
        default=Estado.PENDIENTE,
    )
    intentos = models.PositiveIntegerField(default=0)
    disponible_en = models.DateTimeField(auto_now_add=True)
    bloqueo_hasta = models.DateTimeField(null=True, blank=True)
    token_bloqueo = models.UUIDField(null=True, blank=True)
    ultimo_error = models.TextField(blank=True)
    creado_en = models.DateTimeField(auto_now_add=True)
    enviado_en = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'eventos_notificacion'
        verbose_name = 'Evento de notificación'
        verbose_name_plural = 'Eventos de notificación'
        indexes = [
            models.Index(
                fields=['estado', 'disponible_en', 'creado_en'],
                name='evento_notif_queue_idx',
            ),
        ]

    def __str__(self):
        return f'{self.notificacion_id}: {self.get_estado_display()}'


class SolicitudNotificacion(models.Model):
    class Estado(models.TextChoices):
        PENDIENTE = 'pendiente', 'Pendiente'
        PROCESANDO = 'procesando', 'Procesando'
        COMPLETADA = 'completada', 'Completada'
        FALLIDA = 'fallida', 'Fallida'

    seccion = models.ForeignKey(
        'academico.Seccion',
        on_delete=models.CASCADE,
        related_name='solicitudes_notificacion',
    )
    excluido = models.ForeignKey(
        'usuarios.Usuarios',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='+',
    )
    tipo = models.ForeignKey(
        TipoNotificacion,
        on_delete=models.PROTECT,
        related_name='solicitudes',
    )
    titulo = models.CharField(max_length=200)
    mensaje = models.TextField()
    datos = models.JSONField(default=dict, blank=True)
    ultimo_destinatario_id = models.PositiveBigIntegerField(default=0)
    estado = models.CharField(
        max_length=12,
        choices=Estado.choices,
        default=Estado.PENDIENTE,
    )
    intentos = models.PositiveIntegerField(default=0)
    disponible_en = models.DateTimeField(auto_now_add=True)
    bloqueo_hasta = models.DateTimeField(null=True, blank=True)
    token_bloqueo = models.UUIDField(null=True, blank=True)
    ultimo_error = models.TextField(blank=True)
    creado_en = models.DateTimeField(auto_now_add=True)
    completado_en = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'solicitudes_notificacion'
        verbose_name = 'Solicitud de notificación'
        verbose_name_plural = 'Solicitudes de notificación'
        indexes = [
            models.Index(
                fields=['estado', 'disponible_en', 'creado_en'],
                name='solicitud_notif_queue_idx',
            ),
        ]

    def __str__(self):
        return f'{self.titulo}: {self.get_estado_display()}'
