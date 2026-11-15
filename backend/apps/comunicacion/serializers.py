from rest_framework import serializers
from apps.usuarios.models import Usuarios
from apps.archivos.models import Archivo
from .models import (
    Anuncio,
    ArchivoAnuncio,
    Foro,
    TemaForo,
    MensajeForo,
    Conversacion,
    ParticipanteConversacion,
    MensajeDirecto,
)
from .crypto import descifrar_mensaje


class AnuncioSerializer(serializers.ModelSerializer):
    autor_nombre = serializers.SerializerMethodField()
    archivos_ids = serializers.ListField(
        child=serializers.IntegerField(min_value=1),
        write_only=True,
        required=False,
    )
    archivos_adjuntos = serializers.SerializerMethodField()

    class Meta:
        model = Anuncio
        fields = [
            'id',
            'seccion',
            'autor',
            'autor_nombre',
            'titulo',
            'contenido',
            'fijado',
            'creado_en',
            'archivos_ids',
            'archivos_adjuntos',
        ]
        read_only_fields = ['autor', 'autor_nombre', 'creado_en', 'archivos_adjuntos']

    def get_autor_nombre(self, obj):
        if obj.autor_id:
            return f'{obj.autor.nombres} {obj.autor.apellidos}'.strip()
        return ''

    def get_archivos_adjuntos(self, obj):
        relaciones = obj.archivos.select_related('archivo').all()
        return [
            {
                'id': rel.archivo.id,
                'nombre_original': rel.archivo.nombre_original,
                'url_publica': rel.archivo.url_publica,
                'peso_bytes': rel.archivo.peso_bytes,
            }
            for rel in relaciones
            if rel.archivo_id
        ]

    def create(self, validated_data):
        archivos_ids = validated_data.pop('archivos_ids', [])
        anuncio = super().create(validated_data)
        if archivos_ids:
            archivos = Archivo.objects.filter(id__in=archivos_ids)
            for archivo in archivos:
                ArchivoAnuncio.objects.get_or_create(
                    anuncio=anuncio,
                    archivo=archivo,
                )
        return anuncio


class MensajeForoSerializer(serializers.ModelSerializer):
    autor_nombre = serializers.SerializerMethodField()
    respuestas = serializers.PrimaryKeyRelatedField(many=True, read_only=True)

    class Meta:
        model = MensajeForo
        fields = [
            'id',
            'tema',
            'autor',
            'autor_nombre',
            'mensaje_padre',
            'respuestas',
            'contenido',
            'creado_en',
            'editado_en',
        ]
        read_only_fields = ['autor', 'creado_en', 'editado_en']

    def get_autor_nombre(self, obj):
        return f'{obj.autor.nombres} {obj.autor.apellidos}'.strip()


class TemaForoSerializer(serializers.ModelSerializer):
    autor_nombre = serializers.SerializerMethodField()
    mensajes_count = serializers.SerializerMethodField()

    class Meta:
        model = TemaForo
        fields = [
            'id',
            'foro',
            'autor',
            'autor_nombre',
            'titulo',
            'contenido',
            'cerrado',
            'creado_en',
            'mensajes_count',
        ]
        read_only_fields = ['autor', 'creado_en']

    def get_autor_nombre(self, obj):
        return f'{obj.autor.nombres} {obj.autor.apellidos}'.strip()

    def get_mensajes_count(self, obj):
        return obj.mensajes.count()


class ForoSerializer(serializers.ModelSerializer):
    creado_por_nombre = serializers.SerializerMethodField()
    temas_count = serializers.SerializerMethodField()

    class Meta:
        model = Foro
        fields = [
            'id',
            'seccion',
            'creado_por',
            'creado_por_nombre',
            'titulo',
            'descripcion',
            'activo',
            'creado_en',
            'temas_count',
        ]
        read_only_fields = ['creado_por', 'creado_en']

    def get_creado_por_nombre(self, obj):
        return f'{obj.creado_por.nombres} {obj.creado_por.apellidos}'.strip()

    def get_temas_count(self, obj):
        return obj.temas.count()


class ConversacionSerializer(serializers.ModelSerializer):
    participantes_ids = serializers.ListField(
        child=serializers.IntegerField(min_value=1),
        write_only=True,
        required=False,
    )
    participantes_info = serializers.SerializerMethodField()

    class Meta:
        model = Conversacion
        fields = [
            'id',
            'titulo',
            'es_grupal',
            'creado_por',
            'creado_en',
            'participantes_ids',
            'participantes_info',
        ]
        read_only_fields = ['creado_por', 'creado_en', 'participantes_info']

    def get_participantes_info(self, obj):
        participantes = obj.participantes.select_related('usuario').all()
        return [
            {
                'usuario_id': p.usuario_id,
                'nombre': f'{p.usuario.nombres} {p.usuario.apellidos}'.strip(),
                'correo': p.usuario.correo_institucional,
                'es_administrador': p.es_administrador,
            }
            for p in participantes
        ]

    def create(self, validated_data):
        participantes_ids = validated_data.pop('participantes_ids', [])
        creador = self.context['request'].user
        conversacion = Conversacion.objects.create(
            creado_por=creador,
            **validated_data,
        )
        ParticipanteConversacion.objects.get_or_create(
            conversacion=conversacion,
            usuario=creador,
            defaults={'es_administrador': True},
        )
        if participantes_ids:
            usuarios = Usuarios.objects.filter(id__in=participantes_ids)
            for usuario in usuarios:
                ParticipanteConversacion.objects.get_or_create(
                    conversacion=conversacion,
                    usuario=usuario,
                    defaults={'es_administrador': False},
                )
        return conversacion


class MensajeDirectoSerializer(serializers.ModelSerializer):
    remitente_nombre = serializers.SerializerMethodField()
    contenido = serializers.SerializerMethodField()

    class Meta:
        model = MensajeDirecto
        fields = [
            'id',
            'conversacion',
            'remitente',
            'remitente_nombre',
            'contenido',
            'enviado_en',
        ]
        read_only_fields = ['remitente', 'enviado_en']

    def get_contenido(self, obj):
        return descifrar_mensaje(obj.contenido)

    def get_remitente_nombre(self, obj):
        return f'{obj.remitente.nombres} {obj.remitente.apellidos}'.strip()
