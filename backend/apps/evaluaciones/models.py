from django.db import models

# Modelos para evaluaciones.

class Rubrica(models.Model):
    # Tabla rubricas.
    docente_creador = models.ForeignKey('usuarios.PerfilDocente', on_delete=models.CASCADE, related_name='docentes')
    titulo = models.CharField(max_length=150)
    descripcion = models.TextField(blank=True, null=True, default=None)
    es_plantilla_global = models.BooleanField(default=False)
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'rubricas'
        verbose_name = 'Rubrica'
        verbose_name_plural = 'Rubricas'

    def __str__(self):
        return self.titulo

class CriteriosRubrica(models.Model):
    # Tabla criterios_rubrica.
    rubrica = models.ForeignKey(Rubrica, on_delete=models.CASCADE, related_name='rubrica')
    titulo = models.CharField(max_length=150)
    descripcion = models.TextField(blank=True, null=True, default=None)
    ponderacion_porcentaje = models.DecimalField(max_digits=5, decimal_places=2)
    orden = models.IntegerField(default=1)

    class Meta:
        db_table = 'criterios_rubrica'
        verbose_name = 'CriterioRubrica'
        verbose_name_plural = 'CriteriosRubricas'

    def __str__(self):
        return self.titulo

class NivelCriterio(models.Model):
    # Tabla niveles_criterio.
    criterio = models.ForeignKey(CriteriosRubrica, on_delete=models.CASCADE, related_name='criterios')
    nombre_nivel = models.CharField(max_length=60)
    descripcion = models.TextField()
    puntaje = models.DecimalField(max_digits=5, decimal_places=2)

    class Meta:
        db_table = 'niveles_criterio'
        verbose_name = 'NivelCriterio'
        verbose_name_plural = 'NivelesCriterio'

    def __str__(self):
        return self.nombre_nivel

class Tarea(models.Model):
    # Tabla tareas
    seccion = models.ForeignKey('academico.Seccion', on_delete=models.CASCADE, related_name='seccion')
    rubrica = models.ForeignKey(Rubrica, on_delete=models.SET_NULL, null=True, blank=True, related_name='tareas')
    titulo = models.CharField(max_length=200)
    instrucciones = models.TextField(null=True, default=None)
    fecha_apertura = models.DateTimeField()
    fecha_limite = models.DateTimeField()
    puntaje_maximo = models.DecimalField(max_digits=5, decimal_places=2)
    permitir_entregas_tardias = models.BooleanField(default=False)
    es_visible = models.BooleanField(default=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'tareas'
        verbose_name = 'Tarea'
        verbose_name_plural = 'Tareas'

    def __str__(self):
        return self.titulo

class EstadoEntrega(models.Model):
    # Tabla estados_entrega
    codigo = models.CharField(max_length=20, unique=True)

    class Meta:
        db_table = 'estados_entrega'
        verbose_name = 'EstadoEntrega'
        verbose_name_plural = 'EstadosEntrega'

    def __str__(self):
        return self.codigo

class EntregaTarea(models.Model):
    # Tabla entregas_tareas
    tarea = models.ForeignKey(Tarea, on_delete=models.CASCADE, related_name='tarea')
    estudiante = models.ForeignKey('usuarios.PerfilEstudiante', on_delete=models.CASCADE, related_name='estudiante')
    fecha_envio = models.DateTimeField(auto_now_add=True)
    nota_final = models.DecimalField(max_digits=5, decimal_places=2, null=True, default=None)
    observaciones_generales = models.TextField(blank=True, null=True, default=None)
    calificado_por = models.ForeignKey('usuarios.PerfilDocente', on_delete=models.SET_NULL, null=True, blank=True, related_name='docente')
    estado = models.ForeignKey(EstadoEntrega, on_delete=models.CASCADE, related_name='estado')
    calificado_en = models.DateTimeField(null=True, default=None)

    class Meta:
        db_table = 'entregas_tareas'
        verbose_name = 'EntregaTarea'
        verbose_name_plural = 'EntregasTareas'

class ArchivoEntrega(models.Model):
    # Tabla archivos_entrega
    entrega = models.ForeignKey(EntregaTarea, on_delete=models.CASCADE, related_name='archivos_adjuntos')
    archivo = models.ForeignKey('archivos.Archivo', on_delete=models.CASCADE, related_name='entregas_asociadas')

    class Meta:
        db_table = 'archivos_entrega'
        verbose_name = 'ArchivoEntrega'
        verbose_name_plural = 'ArchivosEntregas'

class EvaluacionCriterio(models.Model):
    # Tabla evaluaciones_criterio
    entrega = models.ForeignKey(EntregaTarea, on_delete=models.CASCADE, related_name='evaluaciones_criterios')
    criterio = models.ForeignKey(CriteriosRubrica, on_delete=models.CASCADE, related_name='criterio')
    nivel_seleccionado = models.ForeignKey(NivelCriterio, on_delete=models.CASCADE, related_name='nivel')
    puntaje_asignado = models.DecimalField(max_digits=5, decimal_places=2)
    retroalimentacion = models.TextField(blank=True, null=True, default=None)

    class Meta:
        db_table = 'evaluaciones_criterio'
        verbose_name = 'EvaluacionCriterio'
        verbose_name_plural = 'EvaluacionesCriterios'
