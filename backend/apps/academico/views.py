from django.shortcuts import render
from rest_framework import status, viewsets, generics, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import (
    Asignatura,
    Carrera,
    Departamento,
    EstadoInscripcion,
    Inscripcion,
    PeriodoAcademico,
    Seccion,
    SeccionDocente,
    EntregaTarea,
)
from .serializers import (
    AsignaturaSerializer,
    CarreraSerializer,
    DepartamentoSerializer,
    EstadoInscripcionSerializer,
    InscripcionSerializer,
    PeriodoAcademicoSerializer,
    SeccionDocenteSerializer,
    SeccionSerializer,
    EntregaTareaSerializer,  # <-- Agregado para evitar errores de importación
)
from .services import guardar_borrador_entrega, confirmar_envio_definitivo


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
    queryset = Inscripcion.objects.select_related('seccion', 'estudiante', 'estado').all().order_by('id')
    serializer_class = InscripcionSerializer
    permission_classes = [permissions.IsAuthenticated]


class InscripcionDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Inscripcion.objects.select_related('seccion', 'estudiante', 'estado').all()
    serializer_class = InscripcionSerializer
    permission_classes = [permissions.IsAuthenticated]


class EntregaTareaViewSet(viewsets.ModelViewSet):
    serializer_class = EntregaTareaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Los estudiantes solo ven sus propias entregas/borradores
        return EntregaTarea.objects.filter(estudiante=self.request.user)

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
            serializer = self.get_serializer(entrega)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)