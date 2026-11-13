from rest_framework import serializers

from apps.usuarios.models import PerfilDocente, PerfilEstudiante
from .models import (
    Asignatura,
    AnuncioAcademico,
    Carrera,
    Departamento,
    EstadoInscripcion,
    Inscripcion,
    PeriodoAcademico,
    Seccion,
    SeccionDocente,
    Tarea,
    EntregaTarea,
    EntregaAcademica,
)
from .validators import validar_tamanio_archivo, validador_extensiones
from .permissions import is_assigned_teacher


class CarreraSerializer(serializers.ModelSerializer):
    class Meta:
        model = Carrera
        fields = ['id', 'codigo', 'nombre_carrera']


class DepartamentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Departamento
        fields = ['id', 'codigo', 'nombre']


class PeriodoAcademicoSerializer(serializers.ModelSerializer):
    class Meta:
        model = PeriodoAcademico
        fields = ['id', 'codigo', 'fecha_inicio', 'fecha_fin', 'activo']


class EstadoInscripcionSerializer(serializers.ModelSerializer):
    class Meta:
        model = EstadoInscripcion
        fields = ['id', 'codigo']


class AsignaturaSerializer(serializers.ModelSerializer):
    carrera = CarreraSerializer(read_only=True)
    carrera_id = serializers.PrimaryKeyRelatedField(
        queryset=Carrera.objects.all(),
        source='carrera',
        write_only=True,
    )

    class Meta:
        model = Asignatura
        fields = ['id', 'carrera', 'carrera_id', 'codigo', 'nombre']


class SeccionSerializer(serializers.ModelSerializer):
    asignatura = AsignaturaSerializer(read_only=True)
    periodo_academico = PeriodoAcademicoSerializer(read_only=True)
    asignatura_id = serializers.PrimaryKeyRelatedField(
        queryset=Asignatura.objects.all(),
        source='asignatura',
        write_only=True,
    )
    periodo_academico_id = serializers.PrimaryKeyRelatedField(
        queryset=PeriodoAcademico.objects.all(),
        source='periodo_academico',
        write_only=True,
    )

    class Meta:
        model = Seccion
        fields = [
            'id',
            'asignatura',
            'asignatura_id',
            'periodo_academico',
            'periodo_academico_id',
            'numero_seccion',
        ]


class SeccionDocenteSerializer(serializers.ModelSerializer):
    seccion = SeccionSerializer(read_only=True)
    docente = serializers.StringRelatedField(read_only=True)
    seccion_id = serializers.PrimaryKeyRelatedField(
        queryset=Seccion.objects.all(),
        source='seccion',
        write_only=True,
    )
    docente_id = serializers.PrimaryKeyRelatedField(
        queryset=PerfilDocente.objects.all(),
        source='docente',
        write_only=True,
    )

    class Meta:
        model = SeccionDocente
        fields = ['id', 'seccion', 'seccion_id', 'docente', 'docente_id', 'es_titular']


class InscripcionSerializer(serializers.ModelSerializer):
    seccion = SeccionSerializer(read_only=True)
    estudiante = serializers.StringRelatedField(read_only=True)
    estado = EstadoInscripcionSerializer(read_only=True)
    seccion_id = serializers.PrimaryKeyRelatedField(
        queryset=Seccion.objects.all(),
        source='seccion',
        write_only=True,
    )
    estudiante_id = serializers.PrimaryKeyRelatedField(
        queryset=PerfilEstudiante.objects.all(),
        source='estudiante',
        write_only=True,
    )
    estado_id = serializers.PrimaryKeyRelatedField(
        queryset=EstadoInscripcion.objects.all(),
        source='estado',
        write_only=True,
    )

    class Meta:
        model = Inscripcion
        fields = [
            'id',
            'seccion',
            'seccion_id',
            'estudiante',
            'estudiante_id',
            'estado',
            'estado_id',
            'creado_en',
        ]


class EntregaAcademicaSerializer(serializers.ModelSerializer):
    archivo = serializers.FileField(validators=[validador_extensiones, validar_tamanio_archivo])

    class Meta:
        model = EntregaAcademica
        fields = ['id', 'titulo', 'archivo', 'fecha_creacion']


class AnuncioAcademicoSerializer(serializers.ModelSerializer):
    autor = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = AnuncioAcademico
        fields = ['id', 'titulo', 'contenido', 'autor', 'fecha_publicacion', 'dirigido_a']
        read_only_fields = ['autor', 'fecha_publicacion']


# --- SERIALIZADORES PARA TAREAS Y ENTREGAS CON BORRADOR ---

class TareaSerializer(serializers.ModelSerializer):
    seccion = SeccionSerializer(read_only=True)
    seccion_id = serializers.PrimaryKeyRelatedField(
        queryset=Seccion.objects.all(),
        source='seccion',
        write_only=True,
        required=True,
    )

    class Meta:
        model = Tarea
        fields = [
            'id',
            'seccion',
            'seccion_id',
            'titulo',
            'descripcion',
            'fecha_cierre',
            'permite_atrasados',
            'aplica_penalizacion_atraso',
        ]

    def validate(self, attrs):
        seccion = attrs.get('seccion')
        if seccion is None and self.instance:
            seccion = self.instance.seccion
        if not is_assigned_teacher(self.context['request'].user, seccion):
            raise serializers.ValidationError(
                {'seccion_id': 'Debes estar asignado a la sección de esta tarea.'}
            )
        return attrs


class EntregaTareaSerializer(serializers.ModelSerializer):
    archivo = serializers.FileField(
        validators=[validador_extensiones, validar_tamanio_archivo],
        required=False,
        write_only=True,
    )
    tarea_detalles = TareaSerializer(source='tarea', read_only=True)
    archivo_nombre = serializers.SerializerMethodField()
    estudiante_nombre = serializers.SerializerMethodField()

    class Meta:
        model = EntregaTarea
        fields = [
            'id',
            'tarea',
            'tarea_detalles',
            'estudiante_nombre',
            'archivo',
            'archivo_nombre',
            'estado',
            'comentario_estudiante',
            'fecha_envio',
            'fecha_modificacion',
            'fecha_envio_definitivo',
            'es_fuera_de_plazo',
            'exonerado_penalizacion',
            'calificacion_original',
            'calificacion_final',
        ]
        read_only_fields = [
            'tarea',
            'estado',
            'fecha_envio',
            'fecha_modificacion',
            'fecha_envio_definitivo',
            'es_fuera_de_plazo',
            'exonerado_penalizacion',
            'calificacion_original',
            'calificacion_final',
        ]

    def get_archivo_nombre(self, obj):
        return obj.archivo.name.rsplit('/', 1)[-1] if obj.archivo else None

    def get_estudiante_nombre(self, obj):
        return f'{obj.estudiante.nombres} {obj.estudiante.apellidos}'.strip()


class TareaPendienteSerializer(TareaSerializer):
    entrega = serializers.SerializerMethodField()

    class Meta(TareaSerializer.Meta):
        fields = TareaSerializer.Meta.fields + ['entrega']

    def get_entrega(self, obj):
        entregas = getattr(obj, 'entregas_usuario', [])
        if not entregas:
            return None

        entrega = entregas[0]
        return {
            'id': entrega.id,
            'estado': entrega.estado,
            'archivo_nombre': (
                entrega.archivo.name.rsplit('/', 1)[-1]
                if entrega.archivo
                else None
            ),
            'comentario_estudiante': entrega.comentario_estudiante,
            'fecha_envio_definitivo': entrega.fecha_envio_definitivo,
        }