from django.db.models import Q
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from apps.academico.services import (
    es_admin_usuario,
    es_docente_usuario,
    obtener_secciones_usuario_ids,
)
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
        secciones_ids = obtener_secciones_usuario_ids(self.request.user)
        seccion_id = self.request.query_params.get('seccion')

        if seccion_id:
            try:
                seccion_num = int(seccion_id)
            except (TypeError, ValueError):
                return queryset.none()
            if secciones_ids is not None and seccion_num not in secciones_ids:
                return queryset.none()
            return queryset.filter(seccion_id=seccion_num)

        if secciones_ids is not None:
            queryset = queryset.filter(
                Q(seccion_id__in=secciones_ids) | Q(es_global=True) | Q(seccion__isnull=True)
            )
        return queryset

    def perform_create(self, serializer):
        usuario = self.request.user
        es_global = serializer.validated_data.get('es_global', False)
        seccion = serializer.validated_data.get('seccion')

        if not (es_admin_usuario(usuario) or es_docente_usuario(usuario)):
            raise PermissionDenied('Solo docentes y administradores pueden publicar anuncios.')

        secciones_ids = obtener_secciones_usuario_ids(usuario)
        if not es_global and seccion and secciones_ids is not None and seccion.id not in secciones_ids:
            raise PermissionDenied('No puedes publicar anuncios en una sección que no te corresponde.')

        serializer.save(autor=usuario)

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
        secciones_ids = obtener_secciones_usuario_ids(self.request.user)
        if secciones_ids is not None:
            queryset = queryset.filter(seccion_id__in=secciones_ids)
        seccion_id = self.request.query_params.get('seccion')
        if seccion_id:
            queryset = queryset.filter(seccion_id=seccion_id)
        return queryset

    def perform_create(self, serializer):
        secciones_ids = obtener_secciones_usuario_ids(self.request.user)
        seccion = serializer.validated_data.get('seccion')
        if secciones_ids is not None and (not seccion or seccion.id not in secciones_ids):
            raise PermissionDenied('No puedes crear foros en una sección que no te corresponde.')
        serializer.save(creado_por=self.request.user)

    @action(detail=True, methods=['get'], url_path='temas')
    def listar_temas(self, request, pk=None):
        """Lista todos los temas/hilos de debate de un foro específico."""
        foro = self.get_object()
        temas = foro.temas.select_related('autor').all().order_by('-creado_en')
        serializer = TemaForoSerializer(temas, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class TemaForoViewSet(viewsets.ModelViewSet):
    serializer_class = TemaForoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = TemaForo.objects.select_related('autor').all().order_by('-creado_en')
        secciones_ids = obtener_secciones_usuario_ids(self.request.user)
        if secciones_ids is not None:
            queryset = queryset.filter(foro__seccion_id__in=secciones_ids)
        return queryset

    def perform_create(self, serializer):
        secciones_ids = obtener_secciones_usuario_ids(self.request.user)
        foro = serializer.validated_data.get('foro')
        if secciones_ids is not None and (not foro or foro.seccion_id not in secciones_ids):
            raise PermissionDenied('No puedes publicar temas en un foro que no te corresponde.')
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
    serializer_class = MensajeForoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = MensajeForo.objects.select_related('autor').all().order_by('creado_en')
        secciones_ids = obtener_secciones_usuario_ids(self.request.user)
        if secciones_ids is not None:
            queryset = queryset.filter(tema__foro__seccion_id__in=secciones_ids)
        return queryset

    def perform_create(self, serializer):
        secciones_ids = obtener_secciones_usuario_ids(self.request.user)
        tema = serializer.validated_data.get('tema')
        if secciones_ids is not None and (not tema or tema.foro.seccion_id not in secciones_ids):
            raise PermissionDenied('No puedes responder en un foro que no te corresponde.')
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
