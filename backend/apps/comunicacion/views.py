from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from .models import Anuncio, Foro, TemaForo, MensajeForo, Conversacion, MensajeDirecto
from .serializers import (
    AnuncioSerializer,
    ForoSerializer,
    TemaForoSerializer,
    MensajeForoSerializer,
    ConversacionSerializer,
    MensajeDirectoSerializer,
)
from .services import enviar_mensaje_privado


class AnuncioViewSet(viewsets.ModelViewSet):
    serializer_class = AnuncioSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Anuncio.objects.select_related('autor').all().order_by('-fijado', '-creado_en')
        seccion_id = self.request.query_params.get('seccion')
        if seccion_id:
            queryset = queryset.filter(seccion_id=seccion_id)
        return queryset

    def perform_create(self, serializer):
        serializer.save(autor=self.request.user)

    def perform_update(self, serializer):
        if serializer.instance.autor_id != self.request.user.pk:
            raise PermissionDenied('Solo el autor puede editar este anuncio.')
        serializer.save()

    def perform_destroy(self, instance):
        if instance.autor_id != self.request.user.pk:
            raise PermissionDenied('Solo el autor puede eliminar este anuncio.')
        instance.delete()


class ForoViewSet(viewsets.ModelViewSet):
    serializer_class = ForoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Foro.objects.select_related('creado_por').all().order_by('-creado_en')
        seccion_id = self.request.query_params.get('seccion')
        if seccion_id:
            queryset = queryset.filter(seccion_id=seccion_id)
        return queryset

    def perform_create(self, serializer):
        serializer.save(creado_por=self.request.user)

    @action(detail=True, methods=['get'], url_path='temas')
    def listar_temas(self, request, pk=None):
        """Lista todos los temas/hilos de debate de un foro específico."""
        foro = self.get_object()
        temas = foro.temas.select_related('autor').all().order_by('-creado_en')
        serializer = TemaForoSerializer(temas, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class TemaForoViewSet(viewsets.ModelViewSet):
    queryset = TemaForo.objects.select_related('autor').all().order_by('-creado_en')
    serializer_class = TemaForoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(autor=self.request.user)

    @action(detail=True, methods=['get'], url_path='mensajes')
    def listar_mensajes(self, request, pk=None):
        """Lista todos los mensajes y respuestas de un tema de foro específico."""
        tema = self.get_object()
        mensajes = tema.mensajes.select_related('autor').filter(
            mensaje_padre__isnull=True
        ).order_by('creado_en')
        serializer = MensajeForoSerializer(mensajes, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class MensajeForoViewSet(viewsets.ModelViewSet):
    queryset = MensajeForo.objects.select_related('autor').all().order_by('creado_en')
    serializer_class = MensajeForoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(autor=self.request.user)


class ConversacionViewSet(viewsets.ModelViewSet):
    serializer_class = ConversacionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        usuario = self.request.user
        conversaciones_ids = usuario.participaciones_conversacion.values_list(
            'conversacion_id', flat=True
        )
        return Conversacion.objects.filter(
            id__in=conversaciones_ids
        ).prefetch_related('participantes__usuario').order_by('-creado_en')


class MensajeDirectoViewSet(viewsets.ModelViewSet):
    serializer_class = MensajeDirectoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        usuario = self.request.user
        conversaciones_ids = usuario.participaciones_conversacion.values_list(
            'conversacion_id', flat=True
        )
        queryset = MensajeDirecto.objects.select_related('remitente').filter(
            conversacion_id__in=conversaciones_ids
        ).order_by('enviado_en')

        conversacion_id = self.request.query_params.get('conversacion')
        if conversacion_id:
            queryset = queryset.filter(conversacion_id=conversacion_id)
        return queryset

    def create(self, request, *args, **kwargs):
        conversacion_id = request.data.get('conversacion')
        contenido = request.data.get('contenido')

        try:
            mensaje = enviar_mensaje_privado(
                conversacion_id=conversacion_id,
                remitente=request.user,
                contenido=contenido,
            )
            serializer = self.get_serializer(mensaje)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
