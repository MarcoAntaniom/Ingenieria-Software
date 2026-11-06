from django.contrib import admin
from .models import EntregaAcademica, Tarea, EntregaTarea

@admin.register(EntregaAcademica)
class EntregaAcademicaAdmin(admin.ModelAdmin):
    list_display = ('id', 'titulo', 'archivo', 'obtener_tamanio_mb', 'fecha_creacion')
    search_fields = ('titulo',)
    list_filter = ('fecha_creacion',)

    def obtener_tamanio_mb(self, obj):
        if obj.archivo:
            tamanio = obj.archivo.size / (1024 * 1024)
            return f"{tamanio:.2f} MB"
        return "N/D"
    obtener_tamanio_mb.short_description = "Tamaño del Archivo"


@admin.register(Tarea)
class TareaAdmin(admin.ModelAdmin):
    list_display = ('id', 'titulo', 'fecha_cierre', 'permite_atrasados', 'aplica_penalizacion_atraso')
    search_fields = ('titulo',)
    list_filter = ('permite_atrasados', 'aplica_penalizacion_atraso', 'fecha_cierre')


@admin.register(EntregaTarea)
class EntregaTareaAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'tarea', 
        'estudiante', 
        'estado', 
        'es_fuera_de_plazo', 
        'exonerado_penalizacion', 
        'calificacion_final', 
        'fecha_envio_definitivo'
    )
    list_filter = ('es_fuera_de_plazo', 'exonerado_penalizacion', 'estado', 'tarea')
    search_fields = ('estudiante__username', 'tarea__titulo')
    # Permite al profesor marcar la exención de forma directa y rápida desde la lista
    list_editable = ('exonerado_penalizacion',)