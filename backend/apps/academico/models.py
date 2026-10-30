from django.utils import timezone
from django.db import models
from .validators import validar_tamanio_archivo, validador_extensiones
from django.contrib.auth.models import User
# Modelos para academico

class Carrera(models.Model):
    # Tabla carreras.
    codigo = models.CharField(max_length=20, unique=True)
    nombre_carrera = models.CharField(max_length=150)

    class Meta:
        db_table = 'carreras'
        verbose_name = 'Carrera'
        verbose_name_plural = 'Carreras'

    def __str__(self):
        return f"{self.nombre_carrera} ({self.codigo})"

class Departamento(models.Model):
    # Tabla departamentos.
    codigo = models.CharField(max_length=20, unique=True)
    nombre = models.CharField(max_length=100)

    class Meta:
        db_table = 'departamentos'
        verbose_name = 'Departamento'
        verbose_name_plural = 'Departamentos'

    def __str__(self):
        return self.nombre

class PeriodoAcademico(models.Model):
    # Tabla periodos_academicos.
    codigo = models.CharField(max_length=20, unique=True)
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField()
    activo = models.BooleanField(default=False)

    class Meta:
        db_table = 'periodos_academicos'
        verbose_name = 'Período Académico'
        verbose_name_plural = 'Períodos Académicos'

    def __str__(self):
        return self.codigo

class EstadoInscripcion(models.Model):
    # Tabla estados_inscripcion.
    codigo = models.CharField(max_length=20, unique=True)

    class Meta:
        db_table = 'estados_inscripcion'
        verbose_name = 'Estado de Inscripción'
        verbose_name_plural = 'Estados de Inscripción'

    def __str__(self):
        return self.codigo

class Asignatura(models.Model):
    carrera = models.ForeignKey(Carrera, on_delete=models.RESTRICT, related_name='asignaturas')
    codigo = models.CharField(max_length=20, unique=True)
    nombre = models.CharField(max_length=150)

    class Meta:
        db_table = 'asignaturas'
        verbose_name = 'Asignatura'
        verbose_name_plural = 'Asignaturas'

    def __str__(self):
        return f"{self.nombre} ({self.codigo})"

class Seccion(models.Model):
    asignatura = models.ForeignKey(Asignatura, on_delete=models.RESTRICT, related_name='secciones')
    periodo_academico = models.ForeignKey(PeriodoAcademico, on_delete=models.RESTRICT, related_name='secciones')
    numero_seccion = models.IntegerField()

    class Meta:
        db_table = 'secciones'
        verbose_name = 'Sección'
        verbose_name_plural = 'Secciones'
        unique_together = ('asignatura', 'periodo_academico', 'numero_seccion')

    def __str__(self):
        return f"{self.asignatura.codigo} - Sec. {self.numero_seccion} ({self.periodo_academico.codigo})"

class SeccionDocente(models.Model):
    seccion = models.ForeignKey(Seccion, on_delete=models.CASCADE, related_name='docentes_asignados')
    docente = models.ForeignKey('usuarios.PerfilDocente', on_delete=models.RESTRICT, related_name='secciones_asignadas')
    es_titular = models.BooleanField(default=True)

    class Meta:
        db_table = 'secciones_docentes'
        verbose_name = 'Docente de Sección'
        verbose_name_plural = 'Docentes de Sección'
        unique_together = ('seccion', 'docente')

    def __str__(self):
        return f"{self.docente} en {self.seccion}"

class Inscripcion(models.Model):
    seccion = models.ForeignKey(Seccion, on_delete=models.CASCADE, related_name='inscripciones')
    estudiante = models.ForeignKey('usuarios.PerfilEstudiante', on_delete=models.CASCADE, related_name='inscripciones')
    estado = models.ForeignKey(EstadoInscripcion, on_delete=models.RESTRICT, related_name='inscripciones')
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'inscripciones'
        verbose_name = 'Inscripción'
        verbose_name_plural = 'Inscripciones'
        unique_together = ('seccion', 'estudiante')

    def __str__(self):
        return f"{self.estudiante} - {self.seccion}"


class EntregaAcademica(models.Model):
    # Campos principales según las historias de usuario y requerimientos
    titulo = models.CharField(max_length=255, verbose_name="Título de la Entrega")
    
    # Campo de archivo con las restricciones aplicadas
    archivo = models.FileField(
        upload_to='academico/entregas/',
        validators=[validador_extensiones, validar_tamanio_archivo],
        verbose_name="Archivo adjunto"
    )
    
    fecha_creacion = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de subida")

    class Meta:
        verbose_name = "Entrega Académica"
        verbose_name_plural = "Entregas Académicas"

    def __str__(self):
        return f"{self.titulo} - {self.archivo.name}"


class AnuncioAcademico(models.Model):
    titulo = models.CharField(max_length=200, verbose_name="Título del aviso")
    contenido = models.TextField(verbose_name="Mensaje o comunicado")
    autor = models.ForeignKey("usuarios.Usuarios", on_delete=models.CASCADE, verbose_name="Publicado por")
    fecha_publicacion = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de publicación")
    
    # Opcional: para dirigir el anuncio a un curso o sección específica
    dirigido_a = models.CharField(max_length=100, blank=True, null=True, verbose_name="Curso / Sección")

    class Meta:
        verbose_name = "Anuncio Académico"
        verbose_name_plural = "Tablón de Anuncios"
        ordering = ['-fecha_publicacion'] # Los más recientes primero

    def __str__(self):
        return f"{self.titulo} ({self.fecha_publicacion.strftime('%d/%m/%Y')})"


class Tarea(models.Model):
    titulo = models.CharField(max_length=200, verbose_name="Título de la Tarea")
    descripcion = models.TextField(blank=True, null=True, verbose_name="Descripción")
    fecha_cierre = models.DateTimeField(verbose_name="Fecha límite oficial")
    permite_atrasados = models.BooleanField(default=False, verbose_name="¿Permite entregas fuera de plazo?")

    class Meta:
        verbose_name = "Tarea"
        verbose_name_plural = "Tareas"

    def __str__(self):
        return self.titulo


class EntregaTarea(models.Model):
    class EstadoEntrega(models.TextChoices):
        BORRADOR = 'BORRADOR', 'Borrador'
        ENVIADO = 'ENVIADO', 'Enviado'

    tarea = models.ForeignKey(Tarea, on_delete=models.CASCADE, related_name="entregas")
    estudiante = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="Estudiante") # type: ignore
    
    # El archivo usa los validadores de extensión y tamaño (50 MB), y puede ser nulo en estado BORRADOR
    archivo = models.FileField(
        upload_to='academico/entregas/',
        validators=[validador_extensiones, validar_tamanio_archivo],
        blank=True,
        null=True,
        verbose_name="Archivo adjunto"
    )
    
    estado = models.CharField(
        max_length=10,
        choices=EstadoEntrega.choices,
        default=EstadoEntrega.BORRADOR,
        verbose_name="Estado de la entrega"
    )
    
    comentario_estudiante = models.TextField(blank=True, null=True, verbose_name="Comentarios del estudiante")
    fecha_envio = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de creación inicial")
    fecha_modificacion = models.DateTimeField(auto_now=True, verbose_name="Última modificación")
    fecha_envio_definitivo = models.DateTimeField(blank=True, null=True, verbose_name="Fecha de envío definitivo")
    es_fuera_de_plazo = models.BooleanField(default=False, verbose_name="Entregado fuera de plazo")

    class Meta:
        verbose_name = "Entrega de Tarea"
        verbose_name_plural = "Entregas de Tareas"
        unique_together = ('tarea', 'estudiante')  # Una única instancia de entrega/borrador activa por estudiante y tarea

    def __str__(self):
        return f"{self.tarea.titulo} - {self.estudiante.username} [{self.estado}]"

    def save(self, *args, **kwargs):
        # Si se está intentando cambiar a estado ENVIADO (o se guarda de forma definitiva), 
        # evaluamos las reglas de fecha de cierre y plazos.
        if self.estado == self.EstadoEntrega.ENVIADO and self.tarea.fecha_cierre:
            ahora = timezone.now()
            if ahora > self.tarea.fecha_cierre:
                if not self.tarea.permite_atrasados:
                    raise ValueError("El plazo de entrega ha expirado y esta tarea no acepta envíos fuera de plazo.")
                self.es_fuera_de_plazo = True
            else:
                self.es_fuera_de_plazo = False
            
            # Registramos la fecha de envío definitivo si no estaba seteada
            if not self.fecha_envio_definitivo:
                self.fecha_envio_definitivo = ahora

        super().save(*args, **kwargs)