import time

from django.core.management.base import BaseCommand, CommandError

from apps.notificaciones.delivery import procesar_eventos_pendientes
from apps.notificaciones.fanout import procesar_solicitudes_pendientes


class Command(BaseCommand):
    help = 'Entrega por WebSocket los eventos pendientes de notificación.'

    def add_arguments(self, parser):
        parser.add_argument('--batch-size', type=int, default=100)
        parser.add_argument('--interval', type=float, default=1.0)
        parser.add_argument(
            '--once',
            action='store_true',
            help='Procesa un lote y termina.',
        )

    def handle(self, *args, **options):
        batch_size = options['batch_size']
        interval = options['interval']
        if batch_size < 1:
            raise CommandError('--batch-size debe ser mayor que cero.')
        if interval <= 0:
            raise CommandError('--interval debe ser mayor que cero.')

        self.stdout.write('Worker de notificaciones iniciado.')
        while True:
            solicitudes = procesar_solicitudes_pendientes(batch_size=10)
            eventos = procesar_eventos_pendientes(batch_size=batch_size)
            procesados = solicitudes + eventos
            if options['once']:
                self.stdout.write(f'Trabajos procesados: {procesados}')
                return
            if procesados == 0:
                time.sleep(interval)
