from django.core.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from apps.usuarios.models import PerfilEstudiante, PerfilDocente
from apps.archivos.models import Archivo
from .models import (
    IntentoEvaluacion,
    Tarea,
    EntregaTarea,
    EstadoEntrega,
    ArchivoEntrega,
)
from .serializers import TareaSerializer, EntregaTareaEvaluacionSerializer


class TareaView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        queryset = Tarea.objects.select_related(
            'seccion__asignatura'
        ).all().order_by('-creado_en')

        seccion_id = request.query_params.get('seccion')
        if seccion_id:
            queryset = queryset.filter(seccion_id=seccion_id)

        rol_codigo = getattr(getattr(request.user, 'rol', None), 'codigo', '').lower()
        if 'estudiante' in rol_codigo or 'alumno' in rol_codigo:
            queryset = queryset.filter(es_visible=True)

        serializer = TareaSerializer(queryset, many=True)
        return Response(
            {
                "mensaje": "Tareas obtenidas correctamente",
                "datos": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    def post(self, request):
        serializer = TareaSerializer(data=request.data)

        if serializer.is_valid():
            tarea = serializer.save()
            return Response(
                {
                    "mensaje": "Tarea creada exitosamente",
                    "tarea": TareaSerializer(tarea).data,
                },
                status=status.HTTP_201_CREATED,
            )

        return Response(
            {
                "mensaje": "Error al crear la tarea.",
                "error": serializer.errors,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )


class EntregaEvaluacionListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        queryset = EntregaTarea.objects.select_related(
            'tarea', 'estudiante__usuario', 'estado'
        ).prefetch_related('archivos_adjuntos__archivo').all().order_by('-fecha_envio')

        tarea_id = request.query_params.get('tarea')
        if tarea_id:
            queryset = queryset.filter(tarea_id=tarea_id)

        if hasattr(request.user, 'perfil_estudiante'):
            rol_codigo = getattr(getattr(request.user, 'rol', None), 'codigo', '').lower()
            if 'estudiante' in rol_codigo:
                queryset = queryset.filter(estudiante=request.user.perfil_estudiante)

        serializer = EntregaTareaEvaluacionSerializer(queryset, many=True)
        return Response(
            {
                "mensaje": "Entregas obtenidas correctamente",
                "datos": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    def post(self, request):
        tarea_id = request.data.get('tarea')
        estudiante_id = request.data.get('estudiante')
        observaciones = request.data.get('observaciones_generales', '')
        archivos_ids = request.data.get('archivos_ids', [])

        tarea = get_object_or_404(Tarea, pk=tarea_id)

        perfil_estudiante = None
        if estudiante_id:
            perfil_estudiante = PerfilEstudiante.objects.filter(pk=estudiante_id).first()
        if not perfil_estudiante and hasattr(request.user, 'perfil_estudiante'):
            perfil_estudiante = request.user.perfil_estudiante

        if not perfil_estudiante:
            return Response(
                {
                    "mensaje": "Tu cuenta necesita un Perfil de Estudiante vinculado para registrar una entrega.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        estado_enviada, _ = EstadoEntrega.objects.get_or_create(codigo='ENVIADA')

        entrega = EntregaTarea.objects.create(
            tarea=tarea,
            estudiante=perfil_estudiante,
            observaciones_generales=observaciones,
            estado=estado_enviada,
        )

        if isinstance(archivos_ids, list) and archivos_ids:
            archivos = Archivo.objects.filter(id__in=archivos_ids)
            for archivo in archivos:
                ArchivoEntrega.objects.get_or_create(
                    entrega=entrega,
                    archivo=archivo,
                )

        return Response(
            {
                "mensaje": "Entrega registrada exitosamente",
                "datos": EntregaTareaEvaluacionSerializer(entrega).data,
            },
            status=status.HTTP_201_CREATED,
        )


class CalificarEntregaView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        entrega = get_object_or_404(EntregaTarea, pk=pk)
        nota_final = request.data.get('nota_final')
        observaciones = request.data.get('observaciones_generales')

        if nota_final is None:
            return Response(
                {"mensaje": "Se requiere 'nota_final' para calificar la entrega."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        estado_calificada, _ = EstadoEntrega.objects.get_or_create(codigo='CALIFICADA')
        perfil_docente = PerfilDocente.objects.filter(usuario=request.user).first()

        entrega.nota_final = nota_final
        if observaciones is not None:
            entrega.observaciones_generales = observaciones
        entrega.calificado_por = perfil_docente
        entrega.calificado_en = timezone.now()
        entrega.estado = estado_calificada
        entrega.save()

        return Response(
            {
                "mensaje": "Calificación registrada y notificada al estudiante",
                "datos": EntregaTareaEvaluacionSerializer(entrega).data,
            },
            status=status.HTTP_200_OK,
        )


def iniciar_o_enviar_evaluacion(evaluacion, estudiante):
    ahora = timezone.now()

    if ahora < evaluacion.fecha_inicio or ahora > evaluacion.fecha_cierre:
        raise ValidationError("La evaluación no está disponible en este momento (fuera de plazo).")

    intentos_realizados = IntentoEvaluacion.objects.filter(
        evaluacion=evaluacion, estudiante=estudiante
    ).count()

    if intentos_realizados >= evaluacion.intentos_permitidos:
        raise ValidationError(
            f"Has agotado el límite de {evaluacion.intentos_permitidos} intentos permitidos para esta evaluación."
        )

    nuevo_intento = IntentoEvaluacion.objects.create(
        evaluacion=evaluacion,
        estudiante=estudiante,
        numero_intento=intentos_realizados + 1,
        completado=False,
    )
    return nuevo_intento
