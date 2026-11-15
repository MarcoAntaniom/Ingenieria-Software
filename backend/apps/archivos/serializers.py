from rest_framework import serializers
from .models import Archivo, TipoArchivo


class TipoArchivoSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoArchivo
        fields = ['id', 'extension', 'mime_type', 'tamanio_maximo_bytes']


class ArchivoSerializer(serializers.ModelSerializer):
    tipo_archivo = TipoArchivoSerializer(read_only=True)
    subido_por_nombre = serializers.SerializerMethodField()

    class Meta:
        model = Archivo
        fields = [
            'id',
            'subido_por',
            'subido_por_nombre',
            'tipo_archivo',
            'nombre_original',
            'nombre_almacenamiento',
            'url_publica',
            'peso_bytes',
            'creado_en',
        ]
        read_only_fields = fields

    def get_subido_por_nombre(self, obj):
        if obj.subido_por_id:
            return f"{obj.subido_por.nombres} {obj.subido_por.apellidos}".strip()
        return ""
