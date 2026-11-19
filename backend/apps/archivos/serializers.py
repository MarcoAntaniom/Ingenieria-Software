import re
from rest_framework import serializers
from .models import Archivo, TipoArchivo
from .services import obtener_url_archivo

SECCION_PREFIX_RE = re.compile(r'^materiales/seccion_(\d+)/')


class TipoArchivoSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoArchivo
        fields = ['id', 'extension', 'mime_type', 'tamanio_maximo_bytes']


class ArchivoSerializer(serializers.ModelSerializer):
    tipo_archivo = TipoArchivoSerializer(read_only=True)
    subido_por_nombre = serializers.SerializerMethodField()
    es_material = serializers.SerializerMethodField()
    seccion_id = serializers.SerializerMethodField()
    url_publica = serializers.SerializerMethodField()

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
            'es_material',
            'seccion_id',
        ]
        read_only_fields = fields

    def get_subido_por_nombre(self, obj):
        if obj.subido_por_id:
            return f"{obj.subido_por.nombres} {obj.subido_por.apellidos}".strip()
        return ""

    def get_es_material(self, obj):
        return bool(obj.nombre_almacenamiento and obj.nombre_almacenamiento.startswith('materiales/'))

    def get_seccion_id(self, obj):
        if not obj.nombre_almacenamiento:
            return None
        match = SECCION_PREFIX_RE.match(obj.nombre_almacenamiento)
        return int(match.group(1)) if match else None

    def get_url_publica(self, obj):
        return obtener_url_archivo(obj, request=self.context.get('request'))
