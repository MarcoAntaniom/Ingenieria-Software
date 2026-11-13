from rest_framework import serializers

from .models import Notificacion, TipoNotificacion


class NotificacionSerializer(serializers.ModelSerializer):
    tipo = serializers.CharField(source='tipo.codigo', read_only=True)

    class Meta:
        model = Notificacion
        fields = [
            'id',
            'titulo',
            'mensaje',
            'tipo',
            'datos',
            'leida',
            'creada_en',
            'leida_en',
        ]
        read_only_fields = fields


class TipoNotificacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoNotificacion
        fields = ['codigo', 'nombre', 'descripcion']
        read_only_fields = fields
