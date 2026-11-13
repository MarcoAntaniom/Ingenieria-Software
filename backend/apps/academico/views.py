from django.shortcuts import render
from rest_framework import status, viewsets, generics, permissions
from rest_framework.decorators import action
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
)
from .services import (
    guardar_borrador_entrega, 
    confirmar_envio_definitivo, 
    cambiar_estado_revision, 
    reabrir_entrega
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
    queryset = Tarea.objects.all().order_by('id')
    serializer_class = TareaSerializer
    permission_classes = [permissions.IsAuthenticated]


class TareaDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Tarea.objects.all()
    serializer_class = TareaSerializer
    permission_classes = [permissions.IsAuthenticated]


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
    queryset = Seccion.objects.select_related('asignatura', 'periodo_academico').all().order_by('id')
    serializer_class = SeccionSerializer
    permission_classes = [permissions.IsAuthenticated]


class SeccionDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Seccion.objects.select_related('asignatura', 'periodo_academico').all()
    serializer_class = SeccionSerializer
    permission_classes = [permissions.IsAuthenticated]


class SeccionDocenteListCreateView(generics.ListCreateAPIView):
    queryset = SeccionDocente.objects.select_related('seccion', 'docente').all().order_by('id')
    serializer_class = SeccionDocenteSerializer
    permission_classes = [permissions.IsAuthenticated]


class SeccionDocenteDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = SeccionDocente.objects.select_related('seccion', 'docente').all()
    serializer_class = SeccionDocenteSerializer
    permission_classes = [permissions.IsAuthenticated]


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

    def get_queryset(self):
        user = self.request.user
        # Si el usuario es docente, permitirle ver las entregas de sus secciones asignadas
        if hasattr(user, 'perfil_docente') or SeccionDocente.objects.filter(docente=user).exists():
            return EntregaTarea.objects.all()
        # Los estudiantes solo ven sus propias entregas/borradores
        return EntregaTarea.objects.filter(estudiante=user)

    @action(detail=False, methods=['post'], url_path='guardar-borrador')
    def guardar_borrador(self, request):
        tarea_id = request.data.get('tarea')
        archivo = request.FILES.get('archivo')
        comentario = request.data.get('comentario_estudiante', '')

        try:
            borrador = guardar_borrador_entrega(
                tarea_id=tarea_id,
                estudiante=request.user,
                archivo=archivo,
                comentario=comentario
            )
            serializer = self.get_serializer(borrador)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='confirmar-envio')
    def confirmar_envio(self, request, pk=None):
        try:
            entrega = confirmar_envio_definitivo(entrega_id=pk, estudiante=request.user)
            
            # Estructura del Comprobante con Timestamp para el Frontend / Estudiante
            comprobante = {
                "mensaje": "¡Entrega definitiva realizada con éxito!",
                "comprobante": {
                    "id_entrega": entrega.id,
                    "tarea": entrega.tarea.titulo,
                    "estudiante": request.user.get_full_name() or request.user.username,
                    "archivo": entrega.archivo.name if entrega.archivo else None,
                    "estado": entrega.estado,
                    "timestamp_oficial": entrega.fecha_envio_definitivo.isoformat(), # Marca de tiempo exacta
                    "es_fuera_de_plazo": entrega.es_fuera_de_plazo
                }
            }
            return Response(comprobante, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='poner-en-revision')
    def poner_en_revision(self, request, pk=None):
        try:
            entrega = cambiar_estado_revision(entrega_id=pk, docente=request.user)
            serializer = self.get_serializer(entrega)
            return Response({"mensaje": "La entrega ahora está En revisión", "data": serializer.data}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='reabrir-entrega')
    def reabrir(self, request, pk=None):
        try:
            entrega = reabrir_entrega(entrega_id=pk, docente=request.user)
            serializer = self.get_serializer(entrega)
            return Response({"mensaje": "La entrega ha sido Reabierta para el estudiante", "data": serializer.data}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


    @action(detail=False, methods=['get'], url_path='mis-pendientes')
    def mis_pendientes(self, request):
        """
        Retorna las tareas que el estudiante actual tiene pendientes 
        (tareas donde no cuenta con un envío definitivo).
        """
        estudiante = request.user
        
        # 1. Obtener IDs de tareas donde el estudiante ya hizo un envío definitivo
        tareas_enviadas_ids = EntregaTarea.objects.filter(
            estudiante=estudiante,
            estado=EntregaTarea.EstadoEntrega.ENVIADO
        ).values_list('tarea_id', flat=True)

        # 2. Asumiendo que el estudiante pertenece a secciones inscritas, 
        # filtramos las tareas de sus secciones que NO están en la lista de enviadas.
        # (Ajusta el filtro de secciones según cómo tengas relacionada la inscripción)
        from .models import Tarea, Inscripcion
        
        secciones_estudiante = Inscripcion.objects.filter(
            estudiante=estudiante
        ).values_list('seccion_id', flat=True)

        # Tareas de las secciones del alumno que no han sido enviadas definitivamente
        tareas_pendientes = Tarea.objects.filter(
            fecha_cierre__gte=timezone.now()
        ).exclude(
            id__in=tareas_enviadas_ids
        ).distinct()

        # Opcional: Serializar o devolver un listado claro para el frontend
        data = [{
            "tarea_id": t.id,
            "titulo": t.titulo,
            "descripcion": t.descripcion,
            "fecha_cierre": t.fecha_cierre,
            "permite_atrasados": t.permite_atrasados
        } for t in tareas_pendientes]

        return Response(data, status=status.HTTP_200_OK)