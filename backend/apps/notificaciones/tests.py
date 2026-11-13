from datetime import timedelta
from unittest.mock import patch

from asgiref.sync import async_to_sync
from channels.db import database_sync_to_async
from channels.testing import WebsocketCommunicator
from django.conf import settings
from django.core.management import call_command
from django.test import TestCase, TransactionTestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.academico.models import (
    Asignatura,
    Carrera,
    EstadoInscripcion,
    Inscripcion,
    PeriodoAcademico,
    Seccion,
)
from apps.comunicacion.models import Conversacion, MensajeDirecto, ParticipanteConversacion
from apps.usuarios.models import PerfilEstudiante, Roles, Usuarios
from config.asgi import application

from .models import (
    EventoNotificacion,
    Notificacion,
    SolicitudNotificacion,
    TipoNotificacion,
)
from .services import crear_notificaciones
from .delivery import procesar_eventos_pendientes
from .fanout import procesar_solicitudes_pendientes


WEBSOCKET_TEST_ORIGIN = next(
    (
        origin
        for origin in settings.WEBSOCKET_ALLOWED_ORIGINS
        if origin != '*'
    ),
    'https://localhost',
)


class NotificacionApiTests(TestCase):
    def setUp(self):
        rol = Roles.objects.create(
            nombre='Estudiante',
            codigo='EST',
            descripcion='Rol de estudiante',
        )
        self.usuario = Usuarios.objects.create(
            rut='12345678-9',
            nombres='Ana',
            apellidos='Pérez',
            correo_institucional='ana@example.edu',
            password_hash='hash',
            rol=rol,
        )
        self.otro_usuario = Usuarios.objects.create(
            rut='98765432-1',
            nombres='Luis',
            apellidos='Rojas',
            correo_institucional='luis@example.edu',
            password_hash='hash',
            rol=rol,
        )
        self.tipo_evaluacion, _ = TipoNotificacion.objects.get_or_create(
            codigo='evaluacion',
            defaults={'nombre': 'Evaluación'},
        )
        self.tipo_comunicacion, _ = TipoNotificacion.objects.get_or_create(
            codigo='comunicacion',
            defaults={'nombre': 'Comunicación'},
        )
        self.notificacion = Notificacion.objects.create(
            destinatario=self.usuario,
            titulo='Nueva tarea',
            mensaje='Se publicó una tarea.',
            tipo=self.tipo_evaluacion,
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.usuario)

    def test_usuario_solo_lista_sus_notificaciones_y_puede_marcarla_leida(self):
        Notificacion.objects.create(
            destinatario=self.otro_usuario,
            titulo='Privada',
            mensaje='No debe aparecer.',
            tipo=self.tipo_comunicacion,
        )

        respuesta = self.client.get('/api/v1/notificaciones/')

        self.assertEqual(respuesta.status_code, 200)
        self.assertEqual(respuesta.data['count'], 1)
        self.assertEqual(respuesta.data['results'][0]['id'], self.notificacion.id)

        respuesta = self.client.post(
            f'/api/v1/notificaciones/{self.notificacion.id}/leer/',
        )

        self.assertEqual(respuesta.status_code, 200)
        self.notificacion.refresh_from_db()
        self.assertTrue(self.notificacion.leida)
        self.assertIsNotNone(self.notificacion.leida_en)

    def test_contador_de_no_leidas(self):
        respuesta = self.client.get('/api/v1/notificaciones/no-leidas/contador/')

        self.assertEqual(respuesta.status_code, 200)
        self.assertEqual(respuesta.data, {'no_leidas': 1})

    def test_limpieza_conserva_el_historial_de_notificaciones(self):
        evento = EventoNotificacion.objects.create(
            notificacion=self.notificacion,
            estado=EventoNotificacion.Estado.ENVIADO,
        )
        EventoNotificacion.objects.filter(pk=evento.pk).update(
            enviado_en=timezone.now() - timedelta(days=20),
        )

        call_command('limpiar_eventos_notificacion', dias=14, batch_size=10)

        self.assertFalse(EventoNotificacion.objects.filter(pk=evento.pk).exists())
        self.assertTrue(Notificacion.objects.filter(pk=self.notificacion.pk).exists())

    def test_lista_catalogo_y_filtra_por_codigo(self):
        respuesta = self.client.get('/api/v1/notificaciones/tipos/')

        self.assertEqual(respuesta.status_code, 200)
        self.assertIn('evaluacion', [
            tipo['codigo']
            for tipo in respuesta.data['results']
        ])

        respuesta = self.client.get('/api/v1/notificaciones/?tipo=evaluacion')

        self.assertEqual(respuesta.status_code, 200)
        self.assertEqual(respuesta.data['results'][0]['tipo'], 'evaluacion')

    def test_publicar_anuncio_notifica_a_estudiantes_inscritos(self):
        carrera = Carrera.objects.create(codigo='INF', nombre_carrera='Informática')
        periodo = PeriodoAcademico.objects.create(
            codigo='2026-1',
            fecha_inicio='2026-03-01',
            fecha_fin='2026-07-31',
            activo=True,
        )
        asignatura = Asignatura.objects.create(
            carrera=carrera,
            codigo='INF101',
            nombre='Introducción a la informática',
        )
        seccion = Seccion.objects.create(
            asignatura=asignatura,
            periodo_academico=periodo,
            numero_seccion=1,
        )
        tercer_usuario = Usuarios.objects.create(
            rut='11223344-5',
            nombres='Tomás',
            apellidos='Gómez',
            correo_institucional='tomas@example.edu',
            password_hash='hash',
            rol=self.usuario.rol,
        )
        for estudiante in (self.otro_usuario, tercer_usuario):
            PerfilEstudiante.objects.create(
                usuario=estudiante,
                carrera=carrera,
                nivel=1,
                anio_ingreso=2026,
            )
        estado = EstadoInscripcion.objects.create(codigo='ACTIVA')
        for estudiante in (self.otro_usuario, tercer_usuario):
            Inscripcion.objects.create(
                seccion=seccion,
                estudiante=estudiante.perfil_estudiante,
                estado=estado,
            )

        respuesta = self.client.post(
            '/api/v1/comunicacion/anuncios/',
            {
                'seccion': seccion.id,
                'titulo': 'Cambio de sala',
                'contenido': 'La clase será en la sala 2.',
            },
            format='json',
        )

        self.assertEqual(respuesta.status_code, 201)
        solicitud = SolicitudNotificacion.objects.get(seccion=seccion)
        self.assertFalse(
            Notificacion.objects.filter(destinatario=tercer_usuario).exists(),
        )
        with patch('apps.notificaciones.fanout.BATCH_SIZE', 1):
            self.assertEqual(procesar_solicitudes_pendientes(), 1)
            solicitud.refresh_from_db()
            self.assertEqual(solicitud.estado, SolicitudNotificacion.Estado.PENDIENTE)
            self.assertTrue(
                Notificacion.objects.filter(destinatario=self.otro_usuario).exists(),
            )
            self.assertFalse(
                Notificacion.objects.filter(destinatario=tercer_usuario).exists(),
            )
            self.assertEqual(procesar_solicitudes_pendientes(), 1)
            solicitud.refresh_from_db()
            self.assertEqual(solicitud.estado, SolicitudNotificacion.Estado.PENDIENTE)
            self.assertEqual(procesar_solicitudes_pendientes(), 0)
        solicitud.refresh_from_db()
        self.assertEqual(solicitud.estado, SolicitudNotificacion.Estado.COMPLETADA)
        notificacion = Notificacion.objects.get(destinatario=self.otro_usuario)
        self.assertEqual(notificacion.tipo.codigo, 'comunicacion')
        self.assertEqual(notificacion.datos['seccion_id'], seccion.id)

    def test_mensaje_directo_notifica_a_los_otros_participantes(self):
        conversacion = Conversacion.objects.create(creado_por=self.usuario)
        ParticipanteConversacion.objects.create(
            conversacion=conversacion,
            usuario=self.usuario,
        )
        ParticipanteConversacion.objects.create(
            conversacion=conversacion,
            usuario=self.otro_usuario,
        )

        MensajeDirecto.objects.create(
            conversacion=conversacion,
            remitente=self.usuario,
            contenido='contenido cifrado',
        )

        notificacion = Notificacion.objects.get(destinatario=self.otro_usuario)
        self.assertEqual(notificacion.mensaje, 'Ana Pérez te envió un mensaje.')
        self.assertEqual(notificacion.datos['conversacion_id'], conversacion.id)


class NotificacionWebSocketTests(TestCase):
    def test_websocket_rechaza_conexiones_sin_jwt(self):
        async def connect():
            communicator = WebsocketCommunicator(
                application,
                '/ws/notificaciones/',
                headers=[(b'origin', WEBSOCKET_TEST_ORIGIN.encode('utf-8'))],
            )
            connected, close_code = await communicator.connect()
            return connected

        connected = async_to_sync(connect)()

        self.assertFalse(connected)


class NotificacionDeliveryTests(TestCase):
    def test_error_de_redis_reagenda_entrega_sin_perder_notificacion(self):
        rol = Roles.objects.create(
            nombre='Estudiante',
            codigo='EST',
            descripcion='Rol de estudiante',
        )
        usuario = Usuarios.objects.create(
            rut='12345678-9',
            nombres='Ana',
            apellidos='Pérez',
            correo_institucional='ana@example.edu',
            password_hash='hash',
            rol=rol,
        )
        tipo, _ = TipoNotificacion.objects.get_or_create(
            codigo='evaluacion',
            defaults={'nombre': 'Evaluación'},
        )
        crear_notificaciones(
            [usuario.id],
            titulo='Nueva tarea',
            mensaje='Hay una tarea disponible.',
            tipo=tipo.codigo,
        )

        class ChannelLayerFallido:
            async def group_send(self, *args, **kwargs):
                raise RuntimeError('Redis no disponible')

        with (
            patch(
                'apps.notificaciones.delivery.get_channel_layer',
                return_value=ChannelLayerFallido(),
            ),
            self.assertLogs('apps.notificaciones.delivery', level='ERROR'),
        ):
            procesar_eventos_pendientes()

        evento = EventoNotificacion.objects.get(
            notificacion__destinatario=usuario,
        )
        self.assertEqual(evento.estado, EventoNotificacion.Estado.PENDIENTE)
        self.assertEqual(evento.intentos, 1)
        self.assertIn('Redis no disponible', evento.ultimo_error)
        self.assertGreater(evento.disponible_en, evento.creado_en - timedelta(seconds=1))


class NotificacionWebSocketAuthTests(TransactionTestCase):
    @override_settings(CHANNEL_LAYERS={
        'default': {'BACKEND': 'channels.layers.InMemoryChannelLayer'},
    })
    def test_websocket_autenticado_recibe_eventos_de_notificacion(self):
        rol = Roles.objects.create(
            nombre='Estudiante',
            codigo='EST',
            descripcion='Rol de estudiante',
        )
        usuario = Usuarios.objects.create(
            rut='12345678-9',
            nombres='Ana',
            apellidos='Pérez',
            correo_institucional='ana@example.edu',
            password_hash='hash',
            rol=rol,
        )
        access_token = str(RefreshToken.for_user(usuario).access_token)
        TipoNotificacion.objects.get_or_create(
            codigo='evaluacion',
            defaults={'nombre': 'Evaluación'},
        )

        async def connect_and_receive():
            communicator = WebsocketCommunicator(
                application,
                f'/ws/notificaciones/?token={access_token}',
                headers=[(b'origin', WEBSOCKET_TEST_ORIGIN.encode('utf-8'))],
            )
            connected, close_code = await communicator.connect(timeout=10)
            if connected:
                await database_sync_to_async(crear_notificaciones)(
                    [usuario.id],
                    titulo='Nueva tarea',
                    mensaje='Hay una tarea disponible.',
                    tipo='evaluacion',
                    datos={'tarea_id': 9},
                )
                await database_sync_to_async(procesar_eventos_pendientes)(
                    batch_size=10,
                )
                notification = await communicator.receive_json_from()
                await communicator.disconnect()
                return connected, notification, close_code
            return connected, None, close_code

        connected, notification, close_code = async_to_sync(connect_and_receive)()

        self.assertTrue(connected, f'El WebSocket se cerró con código {close_code}.')
        self.assertEqual(notification['type'], 'notification')
        self.assertEqual(notification['notification']['titulo'], 'Nueva tarea')
