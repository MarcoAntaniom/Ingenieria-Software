from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from apps.academico.models import EntregaTarea

class Command(BaseCommand):
    help = 'Elimina automáticamente los borradores de entregas abandonados cuyas tareas cerraron hace más de X días.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dias',
            type=int,
            default=7,
            help='Número de días después del cierre de la tarea para considerar un borrador como eliminable.'
        )

    def handle(self, *args, **options):
        dias_limite = options['dias']
        ahora = timezone.now()
        limite_tiempo = ahora - timedelta(days=dias_limite)

        # Seleccionar entregas en estado BORRADOR cuya tarea cerró hace más del tiempo límite
        borradores_huérfanos = EntregaTarea.objects.filter(
            estado=EntregaTarea.EstadoEntrega.BORRADOR,
            tarea__fecha_cierre__lt=limite_tiempo
        )

        cantidad, _ = borradores_huérfanos.delete()

        self.stdout.write(
            self.style.SUCCESS(
                f'Depuración completada exitosamente. Se eliminaron {cantidad} borradores obsoletos.'
            )
        )