from django.urls import path
from .views import (
    ArchivoDetailView,
    ArchivoListUploadView,
    TipoArchivoListView,
)

urlpatterns = [
    path('', ArchivoListUploadView.as_view(), name='archivos-list-upload'),
    path('upload/', ArchivoListUploadView.as_view(), name='archivos-upload'),
    path('tipos/', TipoArchivoListView.as_view(), name='archivos-tipos'),
    path('<int:pk>/', ArchivoDetailView.as_view(), name='archivos-detail'),
]
