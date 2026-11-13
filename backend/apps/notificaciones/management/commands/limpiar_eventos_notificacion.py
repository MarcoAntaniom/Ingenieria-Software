from datetime import timedelta

from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

from apps.notificaciones.models import EventoNotificacion, SolicitudNotificacion


class Command(BaseCommand):
    help = 'Elimina eventos y solicitudes completadas antiguos; conserva el historial.'

    def add_arguments(self, parser):
        parser.add_argument('--dias', type=int, default=14)
        parser.add_argument('--batch-size', type=int, default=1000)

    def handle(self, *args, **options):
        dias = options['dias']
        batch_size = options['batch_size']
        if dias < 1:
            raise CommandError('--dias debe ser mayor que cero.')
        if batch_size < 1:
            raise CommandError('--batch-size debe ser mayor que cero.')

        fecha_limite = timezone.now() - timedelta(days=dias)
        eventos_eliminados = 0
        while True:
            ids = list(
                EventoNotificacion.objects.filter(
                    estado=EventoNotificacion.Estado.ENVIADO,
                    enviado_en__lt=fecha_limite,
                )
                .order_by('pk')
                .values_list('pk', flat=True)[:batch_size]
            )
            if not ids:
                break
            cantidad, _ = EventoNotificacion.objects.filter(pk__in=ids).delete()
            eventos_eliminados += cantidad

        solicitudes_eliminadas = 0
        while True:
            ids = list(
                SolicitudNotificacion.objects.filter(
                    estado=SolicitudNotificacion.Estado.COMPLETADA,
                    completado_en__lt=fecha_limite,
                )
                .order_by('pk')
                .values_list('pk', flat=True)[:batch_size]
            )
            if not ids:
                break
            cantidad, _ = SolicitudNotificacion.objects.filter(pk__in=ids).delete()
            solicitudes_eliminadas += cantidad

        self.stdout.write(
            f'Eventos enviados eliminados: {eventos_eliminados}; '
            f'solicitudes completadas eliminadas: {solicitudes_eliminadas}.'
        )
