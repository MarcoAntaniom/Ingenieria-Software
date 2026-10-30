from django.db import models
# Modelos para archivos.

class TipoArchivo(models.Model):
    extension = models.CharField(max_length=10, unique=True)
    mime_type = models.CharField(max_length=100)
    tamanio_maximo_bytes = models.BigIntegerField()

    class Meta:
        db_table = 'tipos_archivo'
        verbose_name = 'Tipo de Archivo'
        verbose_name_plural = 'Tipos de Archivos'

    def __str__(self):
        return self.extension


class Archivo(models.Model):
    subido_por = models.ForeignKey(
        'usuarios.Usuarios',
        on_delete=models.RESTRICT,
        related_name='archivos_subidos'
    )
    tipo_archivo = models.ForeignKey(
        TipoArchivo,
        on_delete=models.RESTRICT,
        related_name='archivos'
    )
    nombre_original = models.CharField(max_length=255)
    nombre_almacenamiento = models.CharField(max_length=255, unique=True)
    url_publica = models.TextField()
    peso_bytes = models.BigIntegerField()
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'archivos'
        verbose_name = 'Archivo'
        verbose_name_plural = 'Archivos'

    def __str__(self):
        return self.nombre_original