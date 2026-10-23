from django.contrib import admin

# Register your models here.
from django.contrib import admin
from .models import EntregaAcademica

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