from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    AnuncioAcademicoDetailView,
    AnuncioAcademicoListCreateView,
    AsignaturaListCreateView,
    AsignaturaDetailView,
    CarreraListCreateView,
    CarreraDetailView,
    DepartamentoListCreateView,
    DepartamentoDetailView,
    EntregaAcademicaDetailView,
    EntregaAcademicaListCreateView,
    EntregaTareaViewSet,
    EstadoInscripcionListCreateView,
    EstadoInscripcionDetailView,
    InscripcionListCreateView,
    InscripcionDetailView,
    PeriodoAcademicoListCreateView,
    PeriodoAcademicoDetailView,
    SeccionDocenteListCreateView,
    SeccionDocenteDetailView,
    SeccionListCreateView,
    SeccionDetailView,
    TareaDetailView,
    TareaListCreateView,
)

router = DefaultRouter()
router.register('entregas-tareas', EntregaTareaViewSet, basename='entrega-tarea')

urlpatterns = [
    path('entregas-academicas/', EntregaAcademicaListCreateView.as_view(), name='entregas-academicas-list-create'),
    path('entregas-academicas/<int:pk>/', EntregaAcademicaDetailView.as_view(), name='entregas-academicas-detail'),
    path('anuncios-academicos/', AnuncioAcademicoListCreateView.as_view(), name='anuncios-academicos-list-create'),
    path('anuncios-academicos/<int:pk>/', AnuncioAcademicoDetailView.as_view(), name='anuncios-academicos-detail'),
    path('tareas/', TareaListCreateView.as_view(), name='tareas-list-create'),
    path('tareas/<int:pk>/', TareaDetailView.as_view(), name='tareas-detail'),
    path('carreras/', CarreraListCreateView.as_view(), name='carreras-list-create'),
    path('carreras/<int:pk>/', CarreraDetailView.as_view(), name='carreras-detail'),
    path('departamentos/', DepartamentoListCreateView.as_view(), name='departamentos-list-create'),
    path('departamentos/<int:pk>/', DepartamentoDetailView.as_view(), name='departamentos-detail'),
    path('periodos-academicos/', PeriodoAcademicoListCreateView.as_view(), name='periodos-academicos-list-create'),
    path('periodos-academicos/<int:pk>/', PeriodoAcademicoDetailView.as_view(), name='periodos-academicos-detail'),
    path('estados-inscripcion/', EstadoInscripcionListCreateView.as_view(), name='estados-inscripcion-list-create'),
    path('estados-inscripcion/<int:pk>/', EstadoInscripcionDetailView.as_view(), name='estados-inscripcion-detail'),
    path('asignaturas/', AsignaturaListCreateView.as_view(), name='asignaturas-list-create'),
    path('asignaturas/<int:pk>/', AsignaturaDetailView.as_view(), name='asignaturas-detail'),
    path('secciones/', SeccionListCreateView.as_view(), name='secciones-list-create'),
    path('secciones/<int:pk>/', SeccionDetailView.as_view(), name='secciones-detail'),
    path('secciones-docentes/', SeccionDocenteListCreateView.as_view(), name='secciones-docentes-list-create'),
    path('secciones-docentes/<int:pk>/', SeccionDocenteDetailView.as_view(), name='secciones-docentes-detail'),
    path('inscripciones/', InscripcionListCreateView.as_view(), name='inscripciones-list-create'),
    path('inscripciones/<int:pk>/', InscripcionDetailView.as_view(), name='inscripciones-detail'),
]

urlpatterns += router.urls
