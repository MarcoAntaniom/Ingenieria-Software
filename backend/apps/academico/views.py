import os

from django.db.models import Prefetch, Q
from django.utils import timezone
from django.http import FileResponse
from rest_framework import status, viewsets, generics, permissions
from rest_framework.decorators import action
from rest_framework.exceptions import MethodNotAllowed, NotFound, ValidationError
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import (
    AnuncioAcademico,
    Asignatura,
    Carrera,
    Departamento,
    EntregaAcademica,
    EstadoInscripcion,
    Inscripcion,
    PeriodoAcademico,
    Seccion,
    SeccionDocente,
    Tarea,
    EntregaTarea,
)
from .serializers import (
    AnuncioAcademicoSerializer,
    AsignaturaSerializer,
    CarreraSerializer,
    DepartamentoSerializer,
    EntregaAcademicaSerializer,
    EstadoInscripcionSerializer,
    InscripcionSerializer,
    PeriodoAcademicoSerializer,
    SeccionDocenteSerializer,
    SeccionSerializer,
    TareaSerializer,
    EntregaTareaSerializer,
    TareaPendienteSerializer,
)
from .services import (
    guardar_borrador_entrega, 
    confirmar_envio_definitivo, 
    cambiar_estado_revision, 
    reabrir_entrega
)
from .permissions import (
    IsRoleScopedAcademicUser,
    IsStudent,
    IsStudentOrTeacher,
    IsTeacher,
    assigned_section_ids,
    enrolled_section_ids,
    has_role,
)


class EntregaAcademicaListCreateView(generics.ListCreateAPIView):
    queryset = EntregaAcademica.objects.all().order_by('id')
    serializer_class = EntregaAcademicaSerializer
    permission_classes = [permissions.IsAuthenticated]


class EntregaAcademicaDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = EntregaAcademica.objects.all()
    serializer_class = EntregaAcademicaSerializer
    permission_classes = [permissions.IsAuthenticated]


class AnuncioAcademicoListCreateView(generics.ListCreateAPIView):
    queryset = AnuncioAcademico.objects.all()
    serializer_class = AnuncioAcademicoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(autor=self.request.user)


class AnuncioAcademicoDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = AnuncioAcademico.objects.all()
    serializer_class = AnuncioAcademicoSerializer
    permission_classes = [permissions.IsAuthenticated]


class TareaListCreateView(generics.ListCreateAPIView):
    serializer_class = TareaSerializer

    def get_permissions(self):
        role_permission = IsTeacher if self.request.method != 'GET' else IsStudentOrTeacher
        return [IsAuthenticated(), role_permission()]

    def get_queryset(self):
        queryset = Tarea.objects.filter(
            seccion__isnull=False,
        ).select_related(
            'seccion__asignatura',
            'seccion__periodo_academico',
        ).order_by('id')
        user = self.request.user
        if has_role(user, 'student'):
            queryset = queryset.filter(seccion_id__in=enrolled_section_ids(user))
        elif has_role(user, 'teacher'):
            queryset = queryset.filter(seccion_id__in=assigned_section_ids(user))
        else:
            return queryset.none()

        section_id = self.request.query_params.get('seccion')
        if section_id:
            try:
                section_id = int(section_id)
            except ValueError:
                raise ValidationError({'seccion': 'Indica una sección válida.'})
            queryset = queryset.filter(seccion_id=section_id)
        return queryset


class TareaDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TareaSerializer

    def get_permissions(self):
        role_permission = IsTeacher if self.request.method not in permissions.SAFE_METHODS else IsStudentOrTeacher
        return [IsAuthenticated(), role_permission()]

    def get_queryset(self):
        queryset = Tarea.objects.filter(
            seccion__isnull=False,
        ).select_related(
            'seccion__asignatura',
            'seccion__periodo_academico',
        )
        user = self.request.user
        if has_role(user, 'student'):
            return queryset.filter(seccion_id__in=enrolled_section_ids(user))
        if has_role(user, 'teacher'):
            return queryset.filter(seccion_id__in=assigned_section_ids(user))
        return queryset.none()


class CarreraListCreateView(generics.ListCreateAPIView):
    queryset = Carrera.objects.all().order_by('id')
    serializer_class = CarreraSerializer
    permission_classes = [permissions.IsAuthenticated]


class CarreraDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Carrera.objects.all()
    serializer_class = CarreraSerializer
    permission_classes = [permissions.IsAuthenticated]


class DepartamentoListCreateView(generics.ListCreateAPIView):
    queryset = Departamento.objects.all().order_by('id')
    serializer_class = DepartamentoSerializer
    permission_classes = [permissions.IsAuthenticated]


class DepartamentoDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Departamento.objects.all()
    serializer_class = DepartamentoSerializer
    permission_classes = [permissions.IsAuthenticated]


class PeriodoAcademicoListCreateView(generics.ListCreateAPIView):
    queryset = PeriodoAcademico.objects.all().order_by('id')
    serializer_class = PeriodoAcademicoSerializer
    permission_classes = [permissions.IsAuthenticated]


class PeriodoAcademicoDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = PeriodoAcademico.objects.all()
    serializer_class = PeriodoAcademicoSerializer
    permission_classes = [permissions.IsAuthenticated]


class EstadoInscripcionListCreateView(generics.ListCreateAPIView):
    queryset = EstadoInscripcion.objects.all().order_by('id')
    serializer_class = EstadoInscripcionSerializer
    permission_classes = [permissions.IsAuthenticated]


class EstadoInscripcionDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = EstadoInscripcion.objects.all()
    serializer_class = EstadoInscripcionSerializer
    permission_classes = [permissions.IsAuthenticated]


class AsignaturaListCreateView(generics.ListCreateAPIView):
    queryset = Asignatura.objects.select_related('carrera').all().order_by('id')
    serializer_class = AsignaturaSerializer
    permission_classes = [permissions.IsAuthenticated]


class AsignaturaDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Asignatura.objects.select_related('carrera').all()
    serializer_class = AsignaturaSerializer
    permission_classes = [permissions.IsAuthenticated]


class SeccionListCreateView(generics.ListCreateAPIView):
    serializer_class = SeccionSerializer

    def get_permissions(self):
        return [IsAuthenticated(), IsRoleScopedAcademicUser()]

    def get_queryset(self):
        queryset = Seccion.objects.select_related(
            'asignatura',
            'periodo_academico',
        ).order_by('id')
        user = self.request.user
        if has_role(user, 'teacher'):
            return queryset.filter(id__in=assigned_section_ids(user))
        if has_role(user, 'student'):
            return queryset.filter(id__in=enrolled_section_ids(user))
        return queryset


class SeccionDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = SeccionSerializer

    def get_permissions(self):
        return [IsAuthenticated(), IsRoleScopedAcademicUser()]

    def get_queryset(self):
        queryset = Seccion.objects.select_related(
            'asignatura',
            'periodo_academico',
        )
        user = self.request.user
        if has_role(user, 'teacher'):
            return queryset.filter(id__in=assigned_section_ids(user))
        if has_role(user, 'student'):
            return queryset.filter(id__in=enrolled_section_ids(user))
        return queryset


class SeccionDocenteListCreateView(generics.ListCreateAPIView):
    serializer_class = SeccionDocenteSerializer

    def get_permissions(self):
        return [IsAuthenticated(), IsRoleScopedAcademicUser()]

    def get_queryset(self):
        queryset = SeccionDocente.objects.select_related(
            'seccion',
            'docente',
        ).order_by('id')
        user = self.request.user
        if has_role(user, 'teacher'):
            return queryset.filter(docente__usuario=user)
        if has_role(user, 'student'):
            return queryset.none()
        return queryset


class SeccionDocenteDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = SeccionDocenteSerializer

    def get_permissions(self):
        return [IsAuthenticated(), IsRoleScopedAcademicUser()]

    def get_queryset(self):
        queryset = SeccionDocente.objects.select_related('seccion', 'docente')
        user = self.request.user
        if has_role(user, 'teacher'):
            return queryset.filter(docente__usuario=user)
        if has_role(user, 'student'):
            return queryset.none()
        return queryset


class InscripcionListCreateView(generics.ListCreateAPIView):
    serializer_class = InscripcionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        usuario = self.request.user
        qs = Inscripcion.objects.select_related(
            'seccion__asignatura', 
            'seccion__periodo_academico', 
            'estudiante', 
            'estado'
        )
        
        # Si el usuario conectado es estudiante, retorna únicamente sus inscripciones
        if hasattr(usuario, 'perfil_estudiante'):
            return qs.filter(estudiante=usuario.perfil_estudiante).order_by('id')
            
        # Comportamiento por defecto (ej. para un Administrador)
        return qs.all().order_by('id')



class InscripcionDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = InscripcionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        usuario = self.request.user
        qs = Inscripcion.objects.select_related(
            'seccion__asignatura', 
            'seccion__periodo_academico', 
            'estudiante', 
            'estado'
        )
        
        # Si el usuario conectado es estudiante, restringe el acceso únicamente a SUS inscripciones
        if hasattr(usuario, 'perfil_estudiante'):
            return qs.filter(estudiante=usuario.perfil_estudiante)
            
        # Comportamiento por defecto (ej. para un Administrador que necesite editar cualquier inscripción)
        return qs.all()


class EntregaTareaViewSet(viewsets.ModelViewSet):
    serializer_class = EntregaTareaSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        role_permission = {
            'create': IsStudentOrTeacher,
            'list': IsStudentOrTeacher,
            'retrieve': IsStudentOrTeacher,
            'mis_pendientes': IsStudent,
            'mi_entrega': IsStudent,
            'guardar_borrador': IsStudent,
            'confirmar_envio': IsStudent,
            'comprobante': IsStudent,
            'archivo': IsStudentOrTeacher,
            'poner_en_revision': IsTeacher,
            'reabrir': IsTeacher,
        }.get(getattr(self, 'action', None))
        if role_permission is None:
            return [IsAuthenticated(), permissions.IsAdminUser()]
        return [IsAuthenticated(), role_permission()]

    def get_queryset(self):
        user = self.request.user
        queryset = EntregaTarea.objects.select_related(
            'tarea__seccion__asignatura',
            'tarea__seccion__periodo_academico',
            'estudiante',
        )
        if has_role(user, 'student'):
            return queryset.filter(estudiante=user).order_by(
                '-fecha_modificacion',
                '-id',
            )
        if has_role(user, 'teacher'):
            queryset = queryset.filter(
                tarea__seccion_id__in=assigned_section_ids(user),
                estado__in=(
                    EntregaTarea.EstadoEntrega.ENVIADO,
                    EntregaTarea.EstadoEntrega.EN_REVISION,
                ),
            )
            state = self.request.query_params.get('estado')
            if state:
                allowed_states = {
                    EntregaTarea.EstadoEntrega.ENVIADO,
                    EntregaTarea.EstadoEntrega.EN_REVISION,
                }
                if state not in allowed_states:
                    raise ValidationError({'estado': 'El estado solicitado no es válido.'})
                queryset = queryset.filter(estado=state)
            return queryset.order_by('-fecha_envio_definitivo', '-id')
        return queryset.none()

    def create(self, request, *args, **kwargs):
        raise MethodNotAllowed('POST')

    @action(detail=False, methods=['get'], url_path='mi-entrega')
    def mi_entrega(self, request):
        try:
            tarea_id = int(request.query_params.get('tarea'))
        except (TypeError, ValueError):
            raise ValidationError({'tarea': 'Indica una tarea válida.'})

        entrega = self.get_queryset().filter(tarea_id=tarea_id).first()
        if entrega is None:
            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response(self.get_serializer(entrega).data)

    @action(detail=False, methods=['post'], url_path='guardar-borrador')
    def guardar_borrador(self, request):
        try:
            tarea_id = int(request.data.get('tarea'))
        except (TypeError, ValueError):
            raise ValidationError({'tarea': 'Indica una tarea válida.'})

        tarea = Tarea.objects.filter(
            pk=tarea_id,
            seccion_id__in=enrolled_section_ids(request.user),
        ).first()
        if tarea is None:
            raise NotFound('La tarea no está disponible para este estudiante.')

        archivo = request.FILES.get('archivo')
        comentario = request.data.get('comentario_estudiante', '')

        borrador = guardar_borrador_entrega(
            tarea=tarea,
            estudiante=request.user,
            archivo=archivo,
            comentario=comentario,
        )
        serializer = self.get_serializer(borrador)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='confirmar-envio')
    def confirmar_envio(self, request, pk=None):
        borrador = self.get_object()
        entrega = confirmar_envio_definitivo(
            entrega_id=borrador.pk,
            estudiante=request.user,
        )
        comprobante = {
            'mensaje': 'Entrega definitiva realizada con éxito.',
            'comprobante': {
                'id_entrega': entrega.id,
                'tarea': entrega.tarea.titulo,
                'estudiante': (
                    f'{request.user.nombres} {request.user.apellidos}'.strip()
                ),
                'archivo': (
                    entrega.archivo.name.rsplit('/', 1)[-1]
                    if entrega.archivo
                    else None
                ),
                'estado': entrega.estado,
                'timestamp_oficial': entrega.fecha_envio_definitivo,
                'es_fuera_de_plazo': entrega.es_fuera_de_plazo,
            }
        }
        return Response(comprobante, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'], url_path='comprobante')
    def comprobante(self, request, pk=None):
        entrega = self.get_object()
        if entrega.fecha_envio_definitivo is None:
            raise NotFound('No existe un comprobante para esta entrega.')
        return Response({
            'id_entrega': entrega.id,
            'tarea': entrega.tarea.titulo,
            'estudiante': f'{request.user.nombres} {request.user.apellidos}'.strip(),
            'archivo': (
                entrega.archivo.name.rsplit('/', 1)[-1]
                if entrega.archivo
                else None
            ),
            'estado': entrega.estado,
            'timestamp_oficial': entrega.fecha_envio_definitivo,
            'es_fuera_de_plazo': entrega.es_fuera_de_plazo,
        })

    @action(detail=True, methods=['get'], url_path='archivo')
    def archivo(self, request, pk=None):
        entrega = self.get_object()
        if not entrega.archivo:
            raise NotFound('Esta entrega no tiene un archivo disponible.')

        response = FileResponse(
            entrega.archivo.open('rb'),
            as_attachment=True,
            filename=os.path.basename(entrega.archivo.name),
            content_type='application/octet-stream',
        )
        response['X-Content-Type-Options'] = 'nosniff'
        return response

    @action(detail=True, methods=['post'], url_path='poner-en-revision')
    def poner_en_revision(self, request, pk=None):
        entrega = self.get_object()
        entrega = cambiar_estado_revision(
            entrega_id=entrega.pk,
            docente=request.user,
        )
        serializer = self.get_serializer(entrega)
        return Response(
            {
                'mensaje': 'La entrega ahora está en revisión.',
                'data': serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=['post'], url_path='reabrir-entrega')
    def reabrir(self, request, pk=None):
        entrega = self.get_object()
        entrega = reabrir_entrega(
            entrega_id=entrega.pk,
            docente=request.user,
        )
        serializer = self.get_serializer(entrega)
        return Response(
            {
                'mensaje': 'La entrega ha sido reabierta para el estudiante.',
                'data': serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=['get'], url_path='mis-pendientes')
    def mis_pendientes(self, request):
        entregas_usuario = EntregaTarea.objects.filter(
            estudiante=request.user,
        )
        definitive_states = (
            EntregaTarea.EstadoEntrega.ENVIADO,
            EntregaTarea.EstadoEntrega.EN_REVISION,
        )
        tareas = Tarea.objects.filter(
            seccion_id__in=enrolled_section_ids(request.user),
        ).filter(
            Q(fecha_cierre__gte=timezone.now()) | Q(permite_atrasados=True),
        ).exclude(
            entregas__estudiante=request.user,
            entregas__estado__in=definitive_states,
        ).select_related(
            'seccion__asignatura',
            'seccion__periodo_academico',
        ).prefetch_related(
            Prefetch(
                'entregas',
                queryset=entregas_usuario,
                to_attr='entregas_usuario',
            ),
        ).order_by('fecha_cierre', 'id').distinct()

        page = self.paginate_queryset(tareas)
        serializer = TareaPendienteSerializer(
            page if page is not None else tareas,
            many=True,
            context=self.get_serializer_context(),
        )
        if page is not None:
            return self.get_paginated_response(serializer.data)
        return Response(serializer.data, status=status.HTTP_200_OK)