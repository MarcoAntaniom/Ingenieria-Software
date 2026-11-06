from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Foro, TemaForo, MensajeForo
from .serializers import ForoSerializer, TemaForoSerializer, MensajeForoSerializer

class ForoViewSet(viewsets.ModelViewSet):
    queryset = Foro.objects.all().order_by('-creado_en')
    serializer_class = ForoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        # Asigna automáticamente al usuario logueado como creador del foro
        serializer.save(creado_por=self.request.user)

    @action(detail=True, methods=['get'], url_path='temas')
    def listar_temas(self, request, pk=None):
        """Lista todos los temas/hilos de debate de un foro específico."""
        foro = self.get_object()
        temas = foro.temas.all().order_by('-creado_en')
        serializer = TemaForoSerializer(temas, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class TemaForoViewSet(viewsets.ModelViewSet):
    queryset = TemaForo.objects.all().order_by('-creado_en')
    serializer_class = TemaForoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        # Asigna automáticamente el autor del tema al usuario actual
        serializer.save(autor=self.request.user)

    @action(detail=True, methods=['get'], url_path='mensajes')
    def listar_mensajes(self, request, pk=None):
        """Lista todos los mensajes y respuestas de un tema de foro específico."""
        tema = self.get_object()
        mensajes = tema.mensajes.filter(mensaje_padre__isnull=True).order_by('creado_en')
        serializer = MensajeForoSerializer(mensajes, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class MensajeForoViewSet(viewsets.ModelViewSet):
    queryset = MensajeForo.objects.all().order_by('creado_en')
    serializer_class = MensajeForoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        # Asigna automáticamente el autor del mensaje al usuario actual
        serializer.save(autor=self.request.user)