from django.urls import path

from .views import (
    AsignaturaListCreateView,
    AsignaturaDetailView,
    CarreraListCreateView,
    CarreraDetailView,
    DepartamentoListCreateView,
    DepartamentoDetailView,
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
)

urlpatterns = [
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
