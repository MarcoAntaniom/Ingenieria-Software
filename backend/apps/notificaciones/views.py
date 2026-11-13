from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Notificacion, TipoNotificacion
from .serializers import NotificacionSerializer, TipoNotificacionSerializer


class NotificacionListView(generics.ListAPIView):
    serializer_class = NotificacionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Notificacion.objects.filter(
            destinatario=self.request.user,
        ).select_related('tipo')
        tipo = self.request.query_params.get('tipo')
        if tipo:
            queryset = queryset.filter(tipo__codigo=tipo)
        if self.request.query_params.get('leida', '').lower() in {'true', '1'}:
            return queryset.filter(leida=True)
        if self.request.query_params.get('leida', '').lower() in {'false', '0'}:
            return queryset.filter(leida=False)
        return queryset


class TipoNotificacionListView(generics.ListAPIView):
    serializer_class = TipoNotificacionSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = TipoNotificacion.objects.filter(activo=True)


class NotificacionUnreadCountView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        cantidad = Notificacion.objects.filter(
            destinatario=request.user,
            leida=False,
        ).count()
        return Response({'no_leidas': cantidad})


class NotificacionReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        notificacion = get_object_or_404(
            Notificacion,
            pk=pk,
            destinatario=request.user,
        )
        if not notificacion.leida:
            notificacion.leida = True
            notificacion.leida_en = timezone.now()
            notificacion.save(update_fields=['leida', 'leida_en'])
        return Response(NotificacionSerializer(notificacion).data)


class NotificacionesReadAllView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        ahora = timezone.now()
        Notificacion.objects.filter(
            destinatario=request.user,
            leida=False,
        ).update(leida=True, leida_en=ahora)
        return Response(status=status.HTTP_204_NO_CONTENT)
