from django.urls import path
from .views import (
    TareaView,
    EntregaEvaluacionListCreateView,
    CalificarEntregaView,
)

urlpatterns = [
    path('create/', view=TareaView.as_view(), name='create'),
    path('tareas/', view=TareaView.as_view(), name='tareas_list_create'),
    path('entregas/', view=EntregaEvaluacionListCreateView.as_view(), name='entregas_list_create'),
    path('entregas/<int:pk>/calificar/', view=CalificarEntregaView.as_view(), name='entregas_calificar'),
]
