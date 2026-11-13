from django.contrib import admin

from .models import (
    EventoNotificacion,
    Notificacion,
    SolicitudNotificacion,
    TipoNotificacion,
)


@admin.register(Notificacion)
class NotificacionAdmin(admin.ModelAdmin):
    list_display = ('titulo', 'destinatario', 'tipo', 'leida', 'creada_en')
    list_filter = ('tipo', 'leida', 'creada_en')
    search_fields = ('titulo', 'mensaje', 'destinatario__correo_institucional')
    readonly_fields = ('creada_en', 'leida_en')


@admin.register(TipoNotificacion)
class TipoNotificacionAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'nombre', 'activo')
    list_filter = ('activo',)
    search_fields = ('codigo', 'nombre', 'descripcion')


@admin.register(EventoNotificacion)
class EventoNotificacionAdmin(admin.ModelAdmin):
    list_display = ('notificacion', 'estado', 'intentos', 'disponible_en', 'enviado_en')
    list_filter = ('estado',)
    search_fields = ('notificacion__titulo', 'ultimo_error')
    readonly_fields = (
        'notificacion',
        'estado',
        'intentos',
        'disponible_en',
        'bloqueo_hasta',
        'token_bloqueo',
        'ultimo_error',
        'creado_en',
        'enviado_en',
    )


@admin.register(SolicitudNotificacion)
class SolicitudNotificacionAdmin(admin.ModelAdmin):
    list_display = (
        'titulo',
        'seccion',
        'tipo',
        'estado',
        'intentos',
        'creado_en',
        'completado_en',
    )
    list_filter = ('estado', 'tipo', 'creado_en')
    search_fields = ('titulo', 'mensaje', 'ultimo_error')
    readonly_fields = (
        'seccion',
        'excluido',
        'tipo',
        'titulo',
        'mensaje',
        'datos',
        'ultimo_destinatario_id',
        'estado',
        'intentos',
        'disponible_en',
        'bloqueo_hasta',
        'token_bloqueo',
        'ultimo_error',
        'creado_en',
        'completado_en',
    )
