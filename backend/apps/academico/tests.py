from django.test import TestCase
from django.utils import timezone
from apps.academico.models import Carrera, PeriodoAcademico, Asignatura, Seccion

class AcademicoModelTests(TestCase):
    def setUp(self):
        self.carrera = Carrera.objects.create(
            codigo='INF-2023',
            nombre_carrera='Ingeniería Civil en Informática'
        )
        self.periodo = PeriodoAcademico.objects.create(
            codigo='2026-1',
            fecha_inicio=timezone.now().date(),
            fecha_fin=timezone.now().date(),
            activo=True
        )
        self.asignatura = Asignatura.objects.create(
            codigo='INF-321',
            nombre='Ingeniería de Software y Arquitectura',
            carrera=self.carrera
        )

    def test_asignatura_creation(self):
        self.assertEqual(str(self.asignatura), 'Ingeniería de Software y Arquitectura (INF-321)')
        self.assertEqual(self.asignatura.codigo, 'INF-321')

    def test_seccion_creation(self):
        seccion = Seccion.objects.create(
            asignatura=self.asignatura,
            periodo_academico=self.periodo,
            numero_seccion=1
        )
        self.assertEqual(seccion.numero_seccion, 1)
        self.assertEqual(seccion.asignatura.codigo, 'INF-321')
        self.assertEqual(str(seccion), 'INF-321 - Sec. 1 (2026-1)')
