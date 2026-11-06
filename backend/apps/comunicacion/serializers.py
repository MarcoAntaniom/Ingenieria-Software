from rest_framework import serializers
from .models import Foro, TemaForo, MensajeForo

class MensajeForoSerializer(serializers.ModelSerializer):
    autor_nombre = serializers.ReadOnlyField(source='autor.username')
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


class TemaForoSerializer(serializers.ModelSerializer):
    autor_nombre = serializers.ReadOnlyField(source='autor.username')
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

    def get_mensajes_count(self, obj):
        return obj.mensajes.count()


class ForoSerializer(serializers.ModelSerializer):
    creado_por_nombre = serializers.ReadOnlyField(source='creado_por.username')
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

    def get_temas_count(self, obj):
        return obj.temas.count()