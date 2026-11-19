from django.urls import path
from .views import (
    TareaView,
    RubricaListCreateView,
    EntregaEvaluacionListCreateView,
    ConfirmarEntregaDefinitivaView,
    MarcarEnRevisionEntregaView,
    ReabrirEntregaView,
    CalificarEntregaView,
)

urlpatterns = [
    path('create/', view=TareaView.as_view(), name='create'),
    path('tareas/', view=TareaView.as_view(), name='tareas_list_create'),
    path('rubricas/', view=RubricaListCreateView.as_view(), name='rubricas_list_create'),
    path('entregas/', view=EntregaEvaluacionListCreateView.as_view(), name='entregas_list_create'),
    path('entregas/<int:pk>/confirmar-envio/', view=ConfirmarEntregaDefinitivaView.as_view(), name='entregas_confirmar_envio'),
    path('entregas/<int:pk>/en-revision/', view=MarcarEnRevisionEntregaView.as_view(), name='entregas_en_revision'),
    path('entregas/<int:pk>/reabrir/', view=ReabrirEntregaView.as_view(), name='entregas_reabrir'),
    path('entregas/<int:pk>/calificar/', view=CalificarEntregaView.as_view(), name='entregas_calificar'),
]
