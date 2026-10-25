from rest_framework import serializers
from .models import *

class TareaSerializer(serializers.ModelSerializer):

    class Meta:
        model = Tarea
        fields = [
            'id',
            'seccion', 
            'rubrica', 
            'titulo', 
            'instrucciones', 
            'fecha_apertura', 
            'fecha_limite', 
            'puntaje_maximo',
            'permitir_entregas_tardias',
            'es_visible'
        ]

        read_only_fields = ['id']

    def validate(self, data):
        fecha_apertura = data.get('fecha_apertura')
        fecha_limite = data.get('fecha_limite')

        # Verifica que la fecha de apertura sea mayor que la fecha limite.
        if fecha_apertura and fecha_limite and fecha_limite <= fecha_apertura:
            raise serializers.ValidationError({
                "fecha_limite": "La fecha límite debe ser posterior a la fecha de apertura."
            })
        return data
