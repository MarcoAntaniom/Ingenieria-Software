from rest_framework import serializers
from .models import Tarea, EntregaTarea, EstadoEntrega, Rubrica


class RubricaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rubrica
        fields = [
            'id',
            'docente_creador',
            'titulo',
            'descripcion',
            'es_plantilla_global',
            'creado_en',
        ]
        read_only_fields = ['id', 'creado_en']


class TareaSerializer(serializers.ModelSerializer):
    seccion_info = serializers.SerializerMethodField()

    class Meta:
        model = Tarea
        fields = [
            'id',
            'seccion',
            'seccion_info',
            'rubrica',
            'titulo',
            'instrucciones',
            'fecha_apertura',
            'fecha_limite',
            'puntaje_maximo',
            'permitir_entregas_tardias',
            'es_visible',
            'creado_en',
        ]
        read_only_fields = ['id', 'seccion_info', 'creado_en']

    def get_seccion_info(self, obj):
        if not obj.seccion_id:
            return None
        asignatura = getattr(obj.seccion, 'asignatura', None)
        return {
            'id': obj.seccion_id,
            'numero_seccion': obj.seccion.numero_seccion,
            'codigo_asignatura': getattr(asignatura, 'codigo', ''),
            'nombre_asignatura': getattr(asignatura, 'nombre', ''),
        }

    def validate(self, data):
        fecha_apertura = data.get('fecha_apertura')
        fecha_limite = data.get('fecha_limite')

        if fecha_apertura and fecha_limite and fecha_limite <= fecha_apertura:
            raise serializers.ValidationError({
                "fecha_limite": "La fecha límite debe ser posterior a la fecha de apertura."
            })
        return data


class EntregaTareaEvaluacionSerializer(serializers.ModelSerializer):
    tarea_titulo = serializers.SerializerMethodField()
    estudiante_nombre = serializers.SerializerMethodField()
    estado_codigo = serializers.SerializerMethodField()
    archivos_adjuntos = serializers.SerializerMethodField()

    class Meta:
        model = EntregaTarea
        fields = [
            'id',
            'tarea',
            'tarea_titulo',
            'estudiante',
            'estudiante_nombre',
            'fecha_envio',
            'nota_final',
            'observaciones_generales',
            'calificado_por',
            'estado',
            'estado_codigo',
            'calificado_en',
            'archivos_adjuntos',
        ]
        read_only_fields = [
            'id',
            'fecha_envio',
            'calificado_por',
            'estado',
            'calificado_en',
            'archivos_adjuntos',
        ]

    def get_tarea_titulo(self, obj):
        return obj.tarea.titulo if obj.tarea_id else ''

    def get_estudiante_nombre(self, obj):
        if obj.estudiante_id and obj.estudiante.usuario_id:
            u = obj.estudiante.usuario
            return f'{u.nombres} {u.apellidos}'.strip()
        return ''

    def get_estado_codigo(self, obj):
        return obj.estado.codigo if obj.estado_id else 'ENVIADA'

    def get_archivos_adjuntos(self, obj):
        relaciones = obj.archivos_adjuntos.select_related('archivo').all()
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
