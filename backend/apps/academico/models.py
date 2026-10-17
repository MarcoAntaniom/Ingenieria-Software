from django.db import models

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
