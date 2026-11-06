from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Foro, TemaForo, MensajeForo
from .serializers import ForoSerializer, TemaForoSerializer, MensajeForoSerializer
from .models import Conversacion, MensajeDirecto
from .serializers import MensajeDirectoSerializer
from .services import enviar_mensaje_privado

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


class MensajeDirectoViewSet(viewsets.ModelViewSet):
    queryset = MensajeDirecto.objects.all().order_by('enviado_en')
    serializer_class = MensajeDirectoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # El usuario solo puede ver los mensajes de las conversaciones donde participa
        usuario = self.request.user
        conversaciones_ids = usuario.participaciones_conversacion.values_list('conversacion_id', flat=True)
        return MensajeDirecto.objects.filter(conversacion_id__in=conversaciones_ids).order_by('enviado_en')

    def create(self, request, *args, **kwargs):
        conversacion_id = request.data.get('conversacion')
        contenido = request.data.get('contenido')

        try:
            mensaje = enviar_mensaje_privado(
                conversacion_id=conversacion_id,
                remitente=request.user,
                contenido=contenido
            )
            serializer = self.get_serializer(mensaje)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)