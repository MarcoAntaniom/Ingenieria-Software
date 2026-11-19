from datetime import date
from django.test import SimpleTestCase, TestCase
from django.urls import resolve
from rest_framework.test import APIClient

from apps.usuarios.models import Roles, Usuarios, PerfilEstudiante, PerfilDocente
from .models import (
    Asignatura,
    Carrera,
    Departamento,
    EstadoInscripcion,
    Inscripcion,
    PeriodoAcademico,
    Seccion,
    SeccionDocente,
)


class SeccionFilteringByUserTests(TestCase):
    def setUp(self):
        self.rol_admin = Roles.objects.create(nombre='Administrador', codigo='admin', descripcion='Admin')
        self.rol_docente = Roles.objects.create(nombre='Docente', codigo='docente', descripcion='Docente')
        self.rol_estudiante = Roles.objects.create(nombre='Estudiante', codigo='estudiante', descripcion='Estudiante')

        self.carrera = Carrera.objects.create(codigo='ING', nombre_carrera='Ingenieria')
        self.depto = Departamento.objects.create(codigo='DCC', nombre='Computacion')
        self.periodo = PeriodoAcademico.objects.create(
            codigo='2026-1',
            fecha_inicio=date(2026, 3, 1),
            fecha_fin=date(2026, 7, 31),
            activo=True,
        )
        self.estado_inscrito = EstadoInscripcion.objects.create(codigo='INSCRITO')

        self.asig1 = Asignatura.objects.create(carrera=self.carrera, codigo='INF101', nombre='Programacion')
        self.asig2 = Asignatura.objects.create(carrera=self.carrera, codigo='INF102', nombre='Bases de Datos')
        self.asig3 = Asignatura.objects.create(carrera=self.carrera, codigo='INF103', nombre='Redes')

        self.sec1 = Seccion.objects.create(asignatura=self.asig1, periodo_academico=self.periodo, numero_seccion=1)
        self.sec2 = Seccion.objects.create(asignatura=self.asig2, periodo_academico=self.periodo, numero_seccion=1)
        self.sec3 = Seccion.objects.create(asignatura=self.asig3, periodo_academico=self.periodo, numero_seccion=1)

        self.admin_user = Usuarios.objects.create(
            rut='1-9',
            nombres='Admin',
            apellidos='Uno',
            correo_institucional='admin@test.cl',
            password_hash='x',
            rol=self.rol_admin,
        )

        self.docente1_user = Usuarios.objects.create(
            rut='2-7',
            nombres='Docente',
            apellidos='Uno',
            correo_institucional='doc1@test.cl',
            password_hash='x',
            rol=self.rol_docente,
        )
        self.docente1 = PerfilDocente.objects.create(usuario=self.docente1_user, departamento=self.depto)
        SeccionDocente.objects.create(seccion=self.sec1, docente=self.docente1, es_titular=True)

        self.docente2_user = Usuarios.objects.create(
            rut='3-5',
            nombres='Docente',
            apellidos='Dos',
            correo_institucional='doc2@test.cl',
            password_hash='x',
            rol=self.rol_docente,
        )
        self.docente2 = PerfilDocente.objects.create(usuario=self.docente2_user, departamento=self.depto)
        SeccionDocente.objects.create(seccion=self.sec2, docente=self.docente2, es_titular=True)

        self.est1_user = Usuarios.objects.create(
            rut='4-3',
            nombres='Estudiante',
            apellidos='Uno',
            correo_institucional='est1@test.cl',
            password_hash='x',
            rol=self.rol_estudiante,
        )
        self.est1 = PerfilEstudiante.objects.create(
            usuario=self.est1_user,
            carrera=self.carrera,
            nivel=1,
            anio_ingreso=2026,
        )
        Inscripcion.objects.create(seccion=self.sec1, estudiante=self.est1, estado=self.estado_inscrito)

        self.est2_user = Usuarios.objects.create(
            rut='5-1',
            nombres='Estudiante',
            apellidos='Dos',
            correo_institucional='est2@test.cl',
            password_hash='x',
            rol=self.rol_estudiante,
        )
        self.est2 = PerfilEstudiante.objects.create(
            usuario=self.est2_user,
            carrera=self.carrera,
            nivel=1,
            anio_ingreso=2026,
        )
        Inscripcion.objects.create(seccion=self.sec2, estudiante=self.est2, estado=self.estado_inscrito)
        Inscripcion.objects.create(seccion=self.sec3, estudiante=self.est2, estado=self.estado_inscrito)

    def _get_seccion_ids(self, user):
        client = APIClient()
        client.force_authenticate(user=user)
        resp = client.get('/api/v1/academico/secciones/')
        self.assertEqual(resp.status_code, 200)
        data = resp.data.get('results', resp.data)
        return [item['id'] for item in data]

    def test_admin_sees_all_sections(self):
        ids = self._get_seccion_ids(self.admin_user)
        self.assertEqual(ids, [self.sec1.id, self.sec2.id, self.sec3.id])

    def test_docente_sees_only_assigned_sections(self):
        self.assertEqual(self._get_seccion_ids(self.docente1_user), [self.sec1.id])
        self.assertEqual(self._get_seccion_ids(self.docente2_user), [self.sec2.id])

    def test_estudiante_sees_only_enrolled_sections(self):
        self.assertEqual(self._get_seccion_ids(self.est1_user), [self.sec1.id])
        self.assertEqual(self._get_seccion_ids(self.est2_user), [self.sec2.id, self.sec3.id])

    def test_detail_restricted_to_user_sections(self):
        client = APIClient()
        client.force_authenticate(user=self.est1_user)
        self.assertEqual(client.get(f'/api/v1/academico/secciones/{self.sec1.id}/').status_code, 200)
        self.assertEqual(client.get(f'/api/v1/academico/secciones/{self.sec2.id}/').status_code, 404)


class AcademicApiEndpointTests(SimpleTestCase):
    def test_new_academic_models_have_list_and_detail_endpoints(self):
        endpoint_paths = (
            '/api/v1/academico/entregas-academicas/',
            '/api/v1/academico/entregas-academicas/1/',
            '/api/v1/academico/anuncios-academicos/',
            '/api/v1/academico/anuncios-academicos/1/',
            '/api/v1/academico/tareas/',
            '/api/v1/academico/tareas/1/',
            '/api/v1/academico/entregas-tareas/',
        )

        for endpoint_path in endpoint_paths:
            with self.subTest(endpoint_path=endpoint_path):
                self.assertIsNotNone(resolve(endpoint_path))
