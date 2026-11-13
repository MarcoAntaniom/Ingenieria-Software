from rest_framework import serializers
from .models import Anuncio, Foro, TemaForo, MensajeForo, Conversacion, MensajeDirecto
from .crypto import descifrar_mensaje


class AnuncioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Anuncio
        fields = [
            'id',
            'seccion',
            'autor',
            'titulo',
            'contenido',
            'fijado',
            'creado_en',
        ]
        read_only_fields = ['autor', 'creado_en']


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
            'editado_en'
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
            'mensajes_count'
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
            'temas_count'
        ]
        read_only_fields = ['creado_por', 'creado_en']

    def get_creado_por_nombre(self, obj):
        return f'{obj.creado_por.nombres} {obj.creado_por.apellidos}'.strip()

    def get_temas_count(self, obj):
        return obj.temas.count()


# --- NUEVO SERIALIZADOR PARA MENSAJERÍA PRIVADA CIFRADA ---

class MensajeDirectoSerializer(serializers.ModelSerializer):
    remitente_nombre = serializers.SerializerMethodField()
    contenido = serializers.SerializerMethodField()  # Sobrescribimos para descifrar en lectura

    class Meta:
        model = MensajeDirecto
        fields = [
            'id', 
            'conversacion', 
            'remitente', 
            'remitente_nombre', 
            'contenido', 
            'enviado_en'
        ]
        read_only_fields = ['remitente', 'enviado_en']

    def get_contenido(self, obj):
        # Desencripta el contenido cifrado de la base de datos al ser consultado
        return descifrar_mensaje(obj.contenido)

    def get_remitente_nombre(self, obj):
        return f'{obj.remitente.nombres} {obj.remitente.apellidos}'.strip()