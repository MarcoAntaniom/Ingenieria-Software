from django.contrib import admin
from .models import Foro, TemaForo, MensajeForo

@admin.register(Foro)
class ForoAdmin(admin.ModelAdmin):
    list_display = ('titulo', 'seccion', 'creado_por', 'activo', 'creado_en')
    list_filter = ('activo', 'creado_en', 'seccion')
    search_fields = ('titulo', 'descripcion')

@admin.register(TemaForo)
class TemaForoAdmin(admin.ModelAdmin):
    list_display = ('titulo', 'foro', 'autor', 'cerrado', 'creado_en')
    list_filter = ('cerrado', 'creado_en', 'foro')
    search_fields = ('titulo', 'contenido', 'autor__username')

@admin.register(MensajeForo)
class MensajeForoAdmin(admin.ModelAdmin):
    list_display = ('tema', 'autor', 'mensaje_padre', 'creado_en')
    list_filter = ('creado_en', 'tema')
    search_fields = ('contenido', 'autor__username')