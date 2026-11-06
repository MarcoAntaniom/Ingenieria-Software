from django.db import models

# Modelos para comunicación.

class Anuncio(models.Model):
    seccion = models.ForeignKey(
        'academico.Seccion',
        on_delete=models.CASCADE,
        related_name='anuncios',
    )
    autor = models.ForeignKey(
        'usuarios.Usuarios',
        on_delete=models.CASCADE,
        related_name='anuncios',
    )
    titulo = models.CharField(max_length=200)
    contenido = models.TextField()
    fijado = models.BooleanField(default=False)
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'anuncios'
        verbose_name = 'Anuncio'
        verbose_name_plural = 'Anuncios'

    def __str__(self):
        return self.titulo


class ArchivoAnuncio(models.Model):
    anuncio = models.ForeignKey(
        Anuncio,
        on_delete=models.CASCADE,
        related_name='archivos',
    )
    archivo = models.ForeignKey('archivos.Archivo', on_delete=models.CASCADE, related_name='anuncios')

    class Meta:
        db_table = 'archivos_anuncio'
        verbose_name = 'Archivo de anuncio'
        verbose_name_plural = 'Archivos de anuncio'
        unique_together = ('anuncio', 'archivo_id')


class Foro(models.Model):
    seccion = models.ForeignKey(
        'academico.Seccion',
        on_delete=models.CASCADE,
        related_name='foros',
    )
    creado_por = models.ForeignKey(
        'usuarios.Usuarios',
        on_delete=models.CASCADE,
        related_name='foros_creados',
    )
    titulo = models.CharField(max_length=200)
    descripcion = models.TextField(blank=True, null=True)
    activo = models.BooleanField(default=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'foros'
        verbose_name = 'Foro'
        verbose_name_plural = 'Foros'

    def __str__(self):
        return self.titulo


class TemaForo(models.Model):
    foro = models.ForeignKey(
        Foro,
        on_delete=models.CASCADE,
        related_name='temas',
    )
    autor = models.ForeignKey(
        'usuarios.Usuarios',
        on_delete=models.CASCADE,
        related_name='temas_foro',
    )
    titulo = models.CharField(max_length=200)
    contenido = models.TextField()
    cerrado = models.BooleanField(default=False)
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'temas_foro'
        verbose_name = 'Tema de foro'
        verbose_name_plural = 'Temas de foro'

    def __str__(self):
        return self.titulo


class MensajeForo(models.Model):
    tema = models.ForeignKey(
        TemaForo,
        on_delete=models.CASCADE,
        related_name='mensajes',
    )
    autor = models.ForeignKey(
        'usuarios.Usuarios',
        on_delete=models.CASCADE,
        related_name='mensajes_foro',
    )
    mensaje_padre = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        related_name='respuestas',
        blank=True,
        null=True,
    )
    contenido = models.TextField()
    creado_en = models.DateTimeField(auto_now_add=True)
    editado_en = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = 'mensajes_foro'
        verbose_name = 'Mensaje de foro'
        verbose_name_plural = 'Mensajes de foro'


class Conversacion(models.Model):
    es_grupal = models.BooleanField(default=False)
    titulo = models.CharField(max_length=120, blank=True, null=True)
    creado_por = models.ForeignKey(
        'usuarios.Usuarios',
        on_delete=models.CASCADE,
        related_name='conversaciones_creadas',
    )
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'conversaciones'
        verbose_name = 'Conversación'
        verbose_name_plural = 'Conversaciones'

    def __str__(self):
        return self.titulo or str(self.id)


class ParticipanteConversacion(models.Model):
    conversacion = models.ForeignKey(
        Conversacion,
        on_delete=models.CASCADE,
        related_name='participantes',
    )
    usuario = models.ForeignKey(
        'usuarios.Usuarios',
        on_delete=models.CASCADE,
        related_name='participaciones_conversacion',
    )
    es_administrador = models.BooleanField(default=False)
    unido_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'participantes_conversacion'
        verbose_name = 'Participante de conversación'
        verbose_name_plural = 'Participantes de conversación'
        unique_together = ('conversacion', 'usuario')


class MensajeDirecto(models.Model):
    conversacion = models.ForeignKey(
        Conversacion,
        on_delete=models.CASCADE,
        related_name='mensajes',
    )
    remitente = models.ForeignKey(
        'usuarios.Usuarios',
        on_delete=models.CASCADE,
        related_name='mensajes_directos_enviados',
    )
    contenido = models.TextField()
    enviado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'mensajes_directos'
        verbose_name = 'Mensaje directo'
        verbose_name_plural = 'Mensajes directos'


class LecturaMensaje(models.Model):
    mensaje = models.ForeignKey(
        MensajeDirecto,
        on_delete=models.CASCADE,
        related_name='lecturas',
    )
    usuario = models.ForeignKey(
        'usuarios.Usuarios',
        on_delete=models.CASCADE,
        related_name='lecturas_mensajes',
    )
    leido_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'lecturas_mensajes'
        verbose_name = 'Lectura de mensaje'
        verbose_name_plural = 'Lecturas de mensajes'
        unique_together = ('mensaje', 'usuario')
