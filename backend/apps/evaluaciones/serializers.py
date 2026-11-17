from rest_framework import serializers
from .models import (
    Tarea,
    EntregaTarea,
    EstadoEntrega,
    Rubrica,
    CriteriosRubrica,
    NivelCriterio,
    EvaluacionCriterio,
)


class NivelCriterioSerializer(serializers.ModelSerializer):
    class Meta:
        model = NivelCriterio
        fields = ['id', 'criterio', 'nombre_nivel', 'descripcion', 'puntaje']
        read_only_fields = ['id', 'criterio']


class CriteriosRubricaSerializer(serializers.ModelSerializer):
    niveles = NivelCriterioSerializer(source='criterios', many=True, read_only=True)

    class Meta:
        model = CriteriosRubrica
        fields = [
            'id',
            'rubrica',
            'titulo',
            'descripcion',
            'ponderacion_porcentaje',
            'orden',
            'niveles',
        ]
        read_only_fields = ['id', 'rubrica', 'niveles']


class RubricaSerializer(serializers.ModelSerializer):
    criterios = CriteriosRubricaSerializer(source='rubrica', many=True, read_only=True)

    class Meta:
        model = Rubrica
        fields = [
            'id',
            'docente_creador',
            'titulo',
            'descripcion',
            'es_plantilla_global',
            'creado_en',
            'criterios',
        ]
        read_only_fields = ['id', 'docente_creador', 'creado_en', 'criterios']


class TareaSerializer(serializers.ModelSerializer):
    seccion_info = serializers.SerializerMethodField()
    rubrica_detalle = RubricaSerializer(source='rubrica', read_only=True)
    fecha_limite = serializers.DateTimeField(required=False, allow_null=True)

    class Meta:
        model = Tarea
        fields = [
            'id',
            'seccion',
            'seccion_info',
            'rubrica',
            'rubrica_detalle',
            'titulo',
            'instrucciones',
            'fecha_apertura',
            'fecha_limite',
            'puntaje_maximo',
            'permitir_entregas_tardias',
            'es_visible',
            'creado_en',
        ]
        read_only_fields = ['id', 'seccion_info', 'rubrica_detalle', 'creado_en']

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

    def to_internal_value(self, data):
        if hasattr(data, 'copy'):
            data = data.copy()
        elif isinstance(data, dict):
            data = dict(data)
        if isinstance(data, dict) and data.get('fecha_limite') == '':
            data['fecha_limite'] = None
        if isinstance(data, dict) and data.get('rubrica') == '':
            data['rubrica'] = None
        return super().to_internal_value(data)

    def validate(self, data):
        from django.utils import timezone

        fecha_apertura = data.get('fecha_apertura')
        fecha_limite = data.get('fecha_limite')

        if fecha_apertura and fecha_limite and fecha_limite <= fecha_apertura:
            raise serializers.ValidationError({
                "fecha_limite": "La fecha de término debe ser posterior a la fecha de apertura."
            })
        if fecha_limite and fecha_limite <= timezone.now():
            raise serializers.ValidationError({
                "fecha_limite": "La fecha de término no puede ser una fecha pasada."
            })
        return data


class EntregaTareaEvaluacionSerializer(serializers.ModelSerializer):
    tarea_titulo = serializers.SerializerMethodField()
    tarea_seccion = serializers.SerializerMethodField()
    tarea_fecha_limite = serializers.SerializerMethodField()
    tarea_permitir_entregas_tardias = serializers.SerializerMethodField()
    tarea_rubrica = serializers.SerializerMethodField()
    estudiante_nombre = serializers.SerializerMethodField()
    estado_codigo = serializers.SerializerMethodField()
    es_tardia = serializers.SerializerMethodField()
    estado_conceptual = serializers.SerializerMethodField()
    comprobante = serializers.SerializerMethodField()
    archivos_adjuntos = serializers.SerializerMethodField()
    archivos_retroalimentacion = serializers.SerializerMethodField()
    evaluaciones_criterios = serializers.SerializerMethodField()

    class Meta:
        model = EntregaTarea
        fields = [
            'id',
            'tarea',
            'tarea_titulo',
            'tarea_seccion',
            'tarea_fecha_limite',
            'tarea_permitir_entregas_tardias',
            'tarea_rubrica',
            'estudiante',
            'estudiante_nombre',
            'fecha_envio',
            'nota_final',
            'estado_conceptual',
            'es_tardia',
            'comprobante',
            'observaciones_generales',
            'calificado_por',
            'estado',
            'estado_codigo',
            'calificado_en',
            'archivos_adjuntos',
            'archivos_retroalimentacion',
            'evaluaciones_criterios',
        ]
        read_only_fields = [
            'id',
            'fecha_envio',
            'calificado_por',
            'estado',
            'calificado_en',
            'archivos_adjuntos',
            'archivos_retroalimentacion',
            'evaluaciones_criterios',
        ]

    def get_tarea_titulo(self, obj):
        return obj.tarea.titulo if obj.tarea_id else ''

    def get_tarea_seccion(self, obj):
        return obj.tarea.seccion_id if obj.tarea_id else None

    def get_tarea_fecha_limite(self, obj):
        return obj.tarea.fecha_limite if obj.tarea_id else None

    def get_tarea_permitir_entregas_tardias(self, obj):
        return bool(obj.tarea.permitir_entregas_tardias) if obj.tarea_id else False

    def get_tarea_rubrica(self, obj):
        if obj.tarea_id and obj.tarea.rubrica_id:
            return RubricaSerializer(obj.tarea.rubrica).data
        return None

    def get_estudiante_nombre(self, obj):
        if obj.estudiante_id and obj.estudiante.usuario_id:
            u = obj.estudiante.usuario
            return f'{u.nombres} {u.apellidos}'.strip()
        return ''

    def get_estado_codigo(self, obj):
        return obj.estado.codigo if obj.estado_id else 'ENVIADA'

    def get_es_tardia(self, obj):
        if not obj.tarea_id or not obj.tarea.fecha_limite or not obj.fecha_envio:
            return False
        return obj.fecha_envio > obj.tarea.fecha_limite

    def get_estado_conceptual(self, obj):
        if obj.nota_final is None:
            return None
        try:
            return 'APROBADO' if float(obj.nota_final) >= 4.0 else 'REPROBADO'
        except (TypeError, ValueError):
            return None

    def get_comprobante(self, obj):
        codigo_estado = self.get_estado_codigo(obj)
        if codigo_estado == 'BORRADOR':
            return None
        return {
            'codigo': f'COMP-{obj.id:05d}',
            'timestamp': obj.fecha_envio.isoformat() if obj.fecha_envio else None,
            'estado': codigo_estado,
            'es_tardia': self.get_es_tardia(obj),
        }

    def get_archivos_adjuntos(self, obj):
        estudiante_user_id = (
            obj.estudiante.usuario_id if obj.estudiante_id else None
        )
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
            and (
                estudiante_user_id is None
                or rel.archivo.subido_por_id == estudiante_user_id
            )
        ]

    def get_archivos_retroalimentacion(self, obj):
        estudiante_user_id = (
            obj.estudiante.usuario_id if obj.estudiante_id else None
        )
        if estudiante_user_id is None:
            return []
        relaciones = obj.archivos_adjuntos.select_related('archivo').all()
        return [
            {
                'id': rel.archivo.id,
                'nombre_original': rel.archivo.nombre_original,
                'url_publica': rel.archivo.url_publica,
                'peso_bytes': rel.archivo.peso_bytes,
            }
            for rel in relaciones
            if rel.archivo_id and rel.archivo.subido_por_id != estudiante_user_id
        ]

    def get_evaluaciones_criterios(self, obj):
        evals = obj.evaluaciones_criterios.select_related(
            'criterio', 'nivel_seleccionado'
        ).all()
        return [
            {
                'id': ev.id,
                'criterio_id': ev.criterio_id,
                'criterio_titulo': ev.criterio.titulo if ev.criterio_id else '',
                'nivel_id': ev.nivel_seleccionado_id,
                'nivel_nombre': (
                    ev.nivel_seleccionado.nombre_nivel
                    if ev.nivel_seleccionado_id
                    else ''
                ),
                'puntaje_asignado': float(ev.puntaje_asignado),
                'retroalimentacion': ev.retroalimentacion or '',
            }
            for ev in evals
        ]
