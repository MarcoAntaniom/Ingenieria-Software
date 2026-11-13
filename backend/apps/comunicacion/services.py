from django.core.exceptions import ValidationError
from .models import Conversacion, ParticipanteConversacion, MensajeDirecto
from .crypto import cifrar_mensaje, descifrar_mensaje

def enviar_mensaje_privado(conversacion_id, remitente, contenido):
    """Cifra y envía un mensaje dentro de una conversación privada."""
    try:
        conversacion = Conversacion.objects.get(id=conversacion_id)
    except Conversacion.DoesNotExist:
        raise ValidationError("La conversación no existe.")

    # Verificar que el remitente sea participante activo de la conversación
    es_participante = ParticipanteConversacion.objects.filter(
        conversacion=conversacion, 
        usuario=remitente
    ).exists()

    if not es_participante:
        raise ValidationError("No tienes permisos para enviar mensajes en esta conversación.")

    if not contenido or not contenido.strip():
        raise ValidationError("El mensaje no puede estar vacío.")

    # Cifrar contenido antes de guardarlo
    contenido_cifrado = cifrar_mensaje(contenido)

    mensaje = MensajeDirecto.objects.create(
        conversacion=conversacion,
        remitente=remitente,
        contenido=contenido_cifrado
    )

    return mensaje