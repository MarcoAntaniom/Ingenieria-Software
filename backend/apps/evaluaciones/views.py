from datetime import timedelta
from decimal import Decimal, InvalidOperation
from django.core.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from apps.academico.services import obtener_secciones_usuario_ids
from apps.usuarios.models import PerfilEstudiante, PerfilDocente
from apps.archivos.models import Archivo
from .models import (
    IntentoEvaluacion,
    Tarea,
    EntregaTarea,
    EstadoEntrega,
    ArchivoEntrega,
    Rubrica,
    CriteriosRubrica,
    NivelCriterio,
    EvaluacionCriterio,
)
from .serializers import (
    TareaSerializer,
    EntregaTareaEvaluacionSerializer,
    RubricaSerializer,
)

MAX_ESPERA_ENTREGA_TARDIA = timedelta(hours=1)


def es_docente_o_admin(usuario):
    if not usuario or not getattr(usuario, 'is_authenticated', False):
        return False
    rol = getattr(usuario, 'rol', None)
    if getattr(rol, 'id', None) == 1:
        return True
    codigo = (getattr(rol, 'codigo', '') or '').lower()
    nombre = (getattr(rol, 'nombre', '') or '').lower()
    if any(k in codigo or k in nombre for k in ('admin', 'docente', 'profesor', 'teacher')):
        return True
    if hasattr(usuario, 'perfil_docente'):
        return True
    return False


def verificar_bloqueo_plazo_tarea(tarea, ahora=None):
    """
    Evalúa las reglas de plazo de una tarea:
    - Si no tiene `fecha_limite`, nunca está bloqueada por plazo.
    - Si aún no supera `fecha_limite`, está dentro de plazo.
    - Si superó `fecha_limite` y `permitir_entregas_tardias` es False, se bloquea de inmediato.
    - Si `permitir_entregas_tardias` es True, permite un máximo de 1 hora de espera
      (`fecha_limite + 1 hora`) y luego se bloquea definitivamente.
    """
    if not tarea.fecha_limite:
        return False, None

    ahora = ahora or timezone.now()
    if ahora <= tarea.fecha_limite:
        return False, None

    if not tarea.permitir_entregas_tardias:
        return (
            True,
            "El tiempo de subida para esta tarea ya venció y no tiene habilitadas las entregas tardías. No se permite entregar nada.",
        )

    limite_maximo_tardio = tarea.fecha_limite + MAX_ESPERA_ENTREGA_TARDIA
    if ahora > limite_maximo_tardio:
        return (
            True,
            "El plazo máximo de 1 hora de espera para entregas tardías ya venció. La entrega se encuentra bloqueada.",
        )

    return False, None


class RubricaListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        queryset = Rubrica.objects.prefetch_related(
            'rubrica__criterios'
        ).all().order_by('-creado_en')
        serializer = RubricaSerializer(queryset, many=True)
        return Response(
            {
                "mensaje": "Rúbricas obtenidas correctamente",
                "datos": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    def post(self, request):
        if not es_docente_o_admin(request.user):
            return Response(
                {"mensaje": "Solo docentes y administradores pueden crear rúbricas."},
                status=status.HTTP_403_FORBIDDEN,
            )

        perfil_docente = PerfilDocente.objects.filter(usuario=request.user).first()
        if not perfil_docente:
            perfil_docente = PerfilDocente.objects.first()
        if not perfil_docente:
            return Response(
                {"mensaje": "Se requiere un perfil docente registrado para crear una rúbrica."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        titulo = (request.data.get('titulo') or '').strip()
        if not titulo:
            return Response(
                {"mensaje": "El título de la rúbrica es obligatorio."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        rubrica = Rubrica.objects.create(
            docente_creador=perfil_docente,
            titulo=titulo,
            descripcion=(request.data.get('descripcion') or '').strip() or None,
            es_plantilla_global=bool(request.data.get('es_plantilla_global', True)),
        )

        criterios_data = request.data.get('criterios') or []
        for idx, crit in enumerate(criterios_data, start=1):
            crit_titulo = (crit.get('titulo') or '').strip()
            if not crit_titulo:
                continue
            ponderacion = crit.get('ponderacion_porcentaje', 100)
            criterio_obj = CriteriosRubrica.objects.create(
                rubrica=rubrica,
                titulo=crit_titulo,
                descripcion=(crit.get('descripcion') or '').strip() or None,
                ponderacion_porcentaje=ponderacion,
                orden=crit.get('orden', idx),
            )
            niveles_data = crit.get('niveles') or [
                {"nombre_nivel": "Excelente", "descripcion": "Cumple totalmente el criterio", "puntaje": 7.0},
                {"nombre_nivel": "Suficiente", "descripcion": "Cumple parcialmente el criterio", "puntaje": 4.0},
                {"nombre_nivel": "Insuficiente", "descripcion": "No cumple el criterio", "puntaje": 1.0},
            ]
            for niv in niveles_data:
                NivelCriterio.objects.create(
                    criterio=criterio_obj,
                    nombre_nivel=(niv.get('nombre_nivel') or 'Nivel').strip(),
                    descripcion=(niv.get('descripcion') or 'Nivel de evaluación').strip(),
                    puntaje=niv.get('puntaje', 7.0),
                )

        return Response(
            {
                "mensaje": "Rúbrica creada exitosamente",
                "datos": RubricaSerializer(rubrica).data,
            },
            status=status.HTTP_201_CREATED,
        )


class TareaView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        queryset = Tarea.objects.select_related(
            'seccion__asignatura', 'rubrica'
        ).prefetch_related('rubrica__rubrica__criterios').all().order_by('-creado_en')

        secciones_ids = obtener_secciones_usuario_ids(request.user)
        if secciones_ids is not None:
            queryset = queryset.filter(seccion_id__in=secciones_ids)

        seccion_id = request.query_params.get('seccion')
        if seccion_id:
            queryset = queryset.filter(seccion_id=seccion_id)

        if not es_docente_o_admin(request.user):
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
        if not es_docente_o_admin(request.user):
            return Response(
                {"mensaje": "Solo docentes y administradores pueden crear tareas."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = TareaSerializer(data=request.data)

        if serializer.is_valid():
            secciones_ids = obtener_secciones_usuario_ids(request.user)
            seccion_obj = serializer.validated_data.get('seccion')
            if secciones_ids is not None and (not seccion_obj or seccion_obj.id not in secciones_ids):
                return Response(
                    {"mensaje": "No tienes permiso para crear tareas en una sección que no te corresponde."},
                    status=status.HTTP_403_FORBIDDEN,
                )
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
            'tarea__rubrica', 'estudiante__usuario', 'estado'
        ).prefetch_related(
            'archivos_adjuntos__archivo__tipo_archivo',
            'evaluaciones_criterios__criterio',
            'evaluaciones_criterios__nivel_seleccionado',
        ).all().order_by('-fecha_envio')

        secciones_ids = obtener_secciones_usuario_ids(request.user)
        if secciones_ids is not None:
            queryset = queryset.filter(tarea__seccion_id__in=secciones_ids)

        tarea_id = request.query_params.get('tarea')
        if tarea_id:
            queryset = queryset.filter(tarea_id=tarea_id)

        seccion_id = request.query_params.get('seccion')
        if seccion_id:
            queryset = queryset.filter(tarea__seccion_id=seccion_id)

        # Cumplimiento Ley 19.628 (RNF-05 / HU-14): aislamiento estricto entre estudiantes
        if not es_docente_o_admin(request.user):
            if hasattr(request.user, 'perfil_estudiante'):
                queryset = queryset.filter(estudiante=request.user.perfil_estudiante)
            else:
                queryset = queryset.none()

        serializer = EntregaTareaEvaluacionSerializer(
            queryset, many=True, context={'request': request}
        )
        return Response(
            {
                "mensaje": "Entregas obtenidas correctamente",
                "datos": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    def post(self, request):
        """
        Permite guardar una entrega en estado BORRADOR (`es_borrador: true`) o
        enviarla definitivamente (`es_borrador: false`).
        - Si la entrega ya fue enviada (`ENVIADA` / `EN_REVISION` / `CALIFICADA`), bloquea cambios
          salvo que el docente la haya puesto en estado `REABIERTA`.
        - Si ya pasó la `fecha_limite` de la tarea:
          * Si `permitir_entregas_tardias` es `False`, bloquea de inmediato.
          * Si `permitir_entregas_tardias` es `True`, permite máximo 1 hora de espera y luego bloquea.
        """
        tarea_id = request.data.get('tarea')
        estudiante_id = request.data.get('estudiante')
        observaciones = request.data.get('observaciones_generales', '')
        archivos_ids = request.data.get('archivos_ids', [])
        es_borrador = request.data.get('es_borrador', True)
        if isinstance(es_borrador, str):
            es_borrador = es_borrador.lower() in {'true', '1', 'borrador'}

        tarea = get_object_or_404(Tarea, pk=tarea_id)

        perfil_estudiante = None
        if estudiante_id and es_docente_o_admin(request.user):
            perfil_estudiante = PerfilEstudiante.objects.filter(pk=estudiante_id).first()
        if not perfil_estudiante and hasattr(request.user, 'perfil_estudiante'):
            perfil_estudiante = request.user.perfil_estudiante

        if not perfil_estudiante:
            return Response(
                {
                    "mensaje": "Tu cuenta necesita un Perfil de Estudiante vinculado para guardar o enviar una entrega.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        entrega_existente = EntregaTarea.objects.select_related('estado').filter(
            tarea=tarea,
            estudiante=perfil_estudiante,
        ).first()

        es_reabierta = (
            entrega_existente is not None
            and entrega_existente.estado.codigo == 'REABIERTA'
        )

        if (
            entrega_existente
            and entrega_existente.estado.codigo not in ('BORRADOR', 'REABIERTA')
        ):
            return Response(
                {
                    "mensaje": "Esta entrega ya fue enviada de forma definitiva y no se puede modificar a menos que el docente la reabra.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        ahora = timezone.now()
        if not es_reabierta:
            bloqueada, motivo_bloqueo = verificar_bloqueo_plazo_tarea(tarea, ahora)
            if bloqueada:
                return Response(
                    {"mensaje": motivo_bloqueo},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        codigo_objetivo = 'BORRADOR' if es_borrador else 'ENVIADA'
        estado_obj, _ = EstadoEntrega.objects.get_or_create(codigo=codigo_objetivo)

        if entrega_existente:
            entrega = entrega_existente
            if observaciones is not None:
                entrega.observaciones_generales = observaciones
            entrega.estado = estado_obj
            entrega.fecha_envio = ahora
            entrega.save()
        else:
            entrega = EntregaTarea.objects.create(
                tarea=tarea,
                estudiante=perfil_estudiante,
                observaciones_generales=observaciones,
                estado=estado_obj,
            )

        if isinstance(archivos_ids, list) and archivos_ids:
            archivos = Archivo.objects.filter(id__in=archivos_ids)
            for archivo in archivos:
                ArchivoEntrega.objects.get_or_create(
                    entrega=entrega,
                    archivo=archivo,
                )

        # Si es envío definitivo, exige que exista al menos un archivo o comentario
        total_adjuntos = entrega.archivos_adjuntos.count()
        if not es_borrador and total_adjuntos == 0 and not (entrega.observaciones_generales or '').strip():
            estado_borrador, _ = EstadoEntrega.objects.get_or_create(codigo='BORRADOR')
            entrega.estado = estado_borrador
            entrega.save(update_fields=['estado'])
            return Response(
                {
                    "mensaje": "Debes adjuntar al menos un archivo antes de confirmar el envío definitivo.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        mensaje_exito = (
            "Borrador guardado correctamente. Puedes seguir editándolo antes del envío definitivo."
            if es_borrador
            else "¡Entrega definitiva enviada con éxito! Se ha emitido tu comprobante digital con marca de tiempo."
        )

        return Response(
            {
                "mensaje": mensaje_exito,
                "datos": EntregaTareaEvaluacionSerializer(entrega, context={'request': request}).data,
            },
            status=status.HTTP_200_OK if entrega_existente else status.HTTP_201_CREATED,
        )


class ConfirmarEntregaDefinitivaView(APIView):
    """
    Confirma el envío definitivo de una entrega que estaba en estado BORRADOR o REABIERTA,
    bloqueándola contra cualquier modificación futura y emitiendo su comprobante.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        entrega = get_object_or_404(
            EntregaTarea.objects.select_related('tarea', 'estado'),
            pk=pk,
        )

        if hasattr(request.user, 'perfil_estudiante'):
            if entrega.estudiante_id != request.user.perfil_estudiante.id:
                return Response(
                    {"mensaje": "No puedes confirmar la entrega de otro estudiante."},
                    status=status.HTTP_403_FORBIDDEN,
                )

        if entrega.estado.codigo not in ('BORRADOR', 'REABIERTA'):
            return Response(
                {"mensaje": "Esta entrega ya fue enviada de forma definitiva y no admite cambios."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ahora = timezone.now()
        if entrega.estado.codigo != 'REABIERTA':
            bloqueada, motivo_bloqueo = verificar_bloqueo_plazo_tarea(entrega.tarea, ahora)
            if bloqueada:
                return Response(
                    {"mensaje": motivo_bloqueo},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        if entrega.archivos_adjuntos.count() == 0 and not (entrega.observaciones_generales or '').strip():
            return Response(
                {"mensaje": "No puedes enviar definitivamente un borrador sin archivos ni contenido."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        estado_enviada, _ = EstadoEntrega.objects.get_or_create(codigo='ENVIADA')
        entrega.estado = estado_enviada
        entrega.fecha_envio = ahora
        entrega.save(update_fields=['estado', 'fecha_envio'])

        return Response(
            {
                "mensaje": "¡Entrega definitiva confirmada! Se ha emitido tu comprobante digital y la entrega ha quedado cerrada.",
                "datos": EntregaTareaEvaluacionSerializer(entrega, context={'request': request}).data,
            },
            status=status.HTTP_200_OK,
        )


class MarcarEnRevisionEntregaView(APIView):
    """
    Cambia el estado de la entrega a 'EN_REVISION' cuando el docente abre/evalúa el trabajo (RF-23).
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        if not es_docente_o_admin(request.user):
            return Response(
                {"mensaje": "Solo docentes y administradores pueden poner una entrega en revisión."},
                status=status.HTTP_403_FORBIDDEN,
            )

        entrega = get_object_or_404(
            EntregaTarea.objects.select_related('tarea', 'estado'),
            pk=pk,
        )

        if entrega.estado.codigo == 'ENVIADA':
            estado_revision, _ = EstadoEntrega.objects.get_or_create(codigo='EN_REVISION')
            entrega.estado = estado_revision
            entrega.save(update_fields=['estado'])

        return Response(
            {
                "mensaje": "La entrega se encuentra ahora En Revisión.",
                "datos": EntregaTareaEvaluacionSerializer(entrega, context={'request': request}).data,
            },
            status=status.HTTP_200_OK,
        )


class ReabrirEntregaView(APIView):
    """
    Permite al docente reabrir el plazo de entrega para un estudiante específico,
    habilitando un nuevo intento (RF-30 / HU-08).
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        if not es_docente_o_admin(request.user):
            return Response(
                {"mensaje": "Solo docentes y administradores pueden reabrir una entrega."},
                status=status.HTTP_403_FORBIDDEN,
            )

        entrega = get_object_or_404(
            EntregaTarea.objects.select_related('tarea', 'estado'),
            pk=pk,
        )

        estado_reabierta, _ = EstadoEntrega.objects.get_or_create(codigo='REABIERTA')
        entrega.estado = estado_reabierta
        entrega.save(update_fields=['estado'])

        return Response(
            {
                "mensaje": "Entrega reabierta exitosamente para que el estudiante pueda realizar un nuevo envío.",
                "datos": EntregaTareaEvaluacionSerializer(entrega, context={'request': request}).data,
            },
            status=status.HTTP_200_OK,
        )


class CalificarEntregaView(APIView):
    """
    Registra la calificación en escala chilena (1.0 a 7.0 con un decimal),
    calcula el estado conceptual (Aprobado >= 4.0 / Reprobado < 4.0),
    aplica el descuento automático del 1% por atraso (salvo exención docente),
    permite evaluar con rúbrica y adjuntar archivos corregidos de retroalimentación.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        if not es_docente_o_admin(request.user):
            return Response(
                {"mensaje": "Solo docentes y administradores pueden calificar entregas."},
                status=status.HTTP_403_FORBIDDEN,
            )

        entrega = get_object_or_404(
            EntregaTarea.objects.select_related('tarea', 'estado'),
            pk=pk,
        )
        nota_final_raw = request.data.get('nota_final')
        observaciones = request.data.get('observaciones_generales')
        eximir_penalizacion = request.data.get('eximir_penalizacion', False)
        if isinstance(eximir_penalizacion, str):
            eximir_penalizacion = eximir_penalizacion.lower() in {'true', '1'}
        archivos_retro_ids = request.data.get('archivos_retroalimentacion_ids', [])
        criterios_evaluados = request.data.get('evaluaciones_criterios', [])

        if nota_final_raw is None:
            return Response(
                {"mensaje": "Se requiere 'nota_final' para calificar la entrega."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            nota_base = Decimal(str(nota_final_raw)).quantize(Decimal('0.1'))
        except (InvalidOperation, TypeError, ValueError):
            return Response(
                {"mensaje": "La nota ingresada no tiene un formato numérico válido."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if nota_base < Decimal('1.0') or nota_base > Decimal('7.0'):
            return Response(
                {
                    "mensaje": "La calificación debe estar en la escala oficial chilena entre 1.0 y 7.0.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        es_tardia = bool(
            entrega.tarea_id
            and entrega.tarea.fecha_limite
            and entrega.fecha_envio
            and entrega.fecha_envio > entrega.tarea.fecha_limite
        )

        # Descuento automático del 1% por hora de atraso (1h máx.) salvo exención docente (RF-21 / RF-22)
        if es_tardia and not eximir_penalizacion:
            nota_calculada = max(
                Decimal('1.0'),
                (nota_base * Decimal('0.99')).quantize(Decimal('0.1')),
            )
        else:
            nota_calculada = nota_base

        estado_calificada, _ = EstadoEntrega.objects.get_or_create(codigo='CALIFICADA')
        perfil_docente = PerfilDocente.objects.filter(usuario=request.user).first()

        entrega.nota_final = nota_calculada
        if observaciones is not None:
            entrega.observaciones_generales = observaciones
        entrega.calificado_por = perfil_docente
        entrega.calificado_en = timezone.now()
        entrega.estado = estado_calificada
        entrega.save()

        # Adjuntar archivo(s) corregido(s) de retroalimentación docente (RF-29)
        if isinstance(archivos_retro_ids, list) and archivos_retro_ids:
            archivos = Archivo.objects.filter(id__in=archivos_retro_ids)
            for arch in archivos:
                ArchivoEntrega.objects.get_or_create(
                    entrega=entrega,
                    archivo=arch,
                )

        # Guardar detalle de evaluación por rúbrica si fue enviado (RF-27 / RF-28)
        if isinstance(criterios_evaluados, list) and criterios_evaluados:
            EvaluacionCriterio.objects.filter(entrega=entrega).delete()
            for item in criterios_evaluados:
                criterio_id = item.get('criterio_id')
                nivel_id = item.get('nivel_id')
                if not criterio_id or not nivel_id:
                    continue
                nivel_obj = NivelCriterio.objects.filter(
                    pk=nivel_id, criterio_id=criterio_id
                ).first()
                if nivel_obj:
                    EvaluacionCriterio.objects.create(
                        entrega=entrega,
                        criterio_id=criterio_id,
                        nivel_seleccionado=nivel_obj,
                        puntaje_asignado=nivel_obj.puntaje,
                        retroalimentacion=item.get('retroalimentacion') or None,
                    )

        return Response(
            {
                "mensaje": "Calificación registrada y notificada al estudiante",
                "datos": EntregaTareaEvaluacionSerializer(entrega, context={'request': request}).data,
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
