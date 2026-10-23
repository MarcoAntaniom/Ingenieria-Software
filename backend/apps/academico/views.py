from django.shortcuts import render

# Create your views here.
from rest_framework import generics, permissions

from .models import (
    Asignatura,
    Carrera,
    Departamento,
    EstadoInscripcion,
    Inscripcion,
    PeriodoAcademico,
    Seccion,
    SeccionDocente,
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
)


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
