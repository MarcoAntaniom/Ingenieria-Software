import tempfile
from datetime import timedelta

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from apps.usuarios.models import PerfilDocente, PerfilEstudiante, Roles, Usuarios

from .models import (
    Asignatura,
    Carrera,
    Departamento,
    EntregaTarea,
    EstadoInscripcion,
    Inscripcion,
    PeriodoAcademico,
    Seccion,
    SeccionDocente,
    Tarea,
)


class TaskWorkflowApiTests(TestCase):
    def setUp(self):
        self.media_directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.media_directory.cleanup)
        storage_settings = override_settings(
            STORAGES={
                'default': {
                    'BACKEND': 'django.core.files.storage.FileSystemStorage',
                },
                'staticfiles': {
                    'BACKEND': 'django.contrib.staticfiles.storage.StaticFilesStorage',
                },
            },
            MEDIA_ROOT=self.media_directory.name,
        )
        storage_settings.enable()
        self.addCleanup(storage_settings.disable)

        self.student_role = Roles.objects.create(
            codigo='EST',
            nombre='Estudiante',
            descripcion='Estudiante',
        )
        self.teacher_role = Roles.objects.create(
            codigo='DOC',
            nombre='Docente',
            descripcion='Docente',
        )
        self.student = self.create_user(
            self.student_role,
            '10000000-1',
            'estudiante@example.edu',
        )
        self.other_student = self.create_user(
            self.student_role,
            '20000000-2',
            'otro@example.edu',
        )
        self.teacher = self.create_user(
            self.teacher_role,
            '30000000-3',
            'docente@example.edu',
        )
        self.other_teacher = self.create_user(
            self.teacher_role,
            '40000000-4',
            'otro.docente@example.edu',
        )

        carrera = Carrera.objects.create(
            codigo='INF',
            nombre_carrera='Informática',
        )
        departamento = Departamento.objects.create(
            codigo='DEP-INF',
            nombre='Informática',
        )
        periodo = PeriodoAcademico.objects.create(
            codigo='2026-2',
            fecha_inicio='2026-08-01',
            fecha_fin='2026-12-31',
            activo=True,
        )
        asignatura = Asignatura.objects.create(
            carrera=carrera,
            codigo='INF101',
            nombre='Introducción a informática',
        )
        self.section = Seccion.objects.create(
            asignatura=asignatura,
            periodo_academico=periodo,
            numero_seccion=1,
        )
        self.other_section = Seccion.objects.create(
            asignatura=asignatura,
            periodo_academico=periodo,
            numero_seccion=2,
        )

        PerfilEstudiante.objects.create(
            usuario=self.student,
            carrera=carrera,
            nivel=1,
            anio_ingreso=2026,
        )
        PerfilEstudiante.objects.create(
            usuario=self.other_student,
            carrera=carrera,
            nivel=1,
            anio_ingreso=2026,
        )
        PerfilDocente.objects.create(
            usuario=self.teacher,
            departamento=departamento,
        )
        PerfilDocente.objects.create(
            usuario=self.other_teacher,
            departamento=departamento,
        )
        SeccionDocente.objects.create(
            seccion=self.section,
            docente=self.teacher.perfil_docente,
        )
        SeccionDocente.objects.create(
            seccion=self.other_section,
            docente=self.other_teacher.perfil_docente,
        )
        estado = EstadoInscripcion.objects.create(codigo='ACTIVA')
        Inscripcion.objects.create(
            seccion=self.section,
            estudiante=self.student.perfil_estudiante,
            estado=estado,
        )
        Inscripcion.objects.create(
            seccion=self.other_section,
            estudiante=self.other_student.perfil_estudiante,
            estado=estado,
        )

        self.client = APIClient()

    @staticmethod
    def create_user(role, rut, email):
        return Usuarios.objects.create(
            rut=rut,
            nombres=email.split('@')[0],
            apellidos='Usuario',
            correo_institucional=email,
            password_hash='unused',
            rol=role,
        )

    def create_task(self, section=None, *, close_at=None, allows_late=False):
        return Tarea.objects.create(
            seccion=section or self.section,
            titulo='Entrega de laboratorio',
            descripcion='Resuelve los ejercicios.',
            fecha_cierre=close_at or timezone.now() + timedelta(days=2),
            permite_atrasados=allows_late,
        )

    def create_submission(self, task, student, state):
        return EntregaTarea.objects.create(
            tarea=task,
            estudiante=student,
            estado=state,
        )

    def test_student_pending_is_scoped_and_excludes_final_submissions(self):
        pending = self.create_task()
        draft = self.create_task()
        submitted = self.create_task()
        late_allowed = self.create_task(
            close_at=timezone.now() - timedelta(days=1),
            allows_late=True,
        )
        expired = self.create_task(
            close_at=timezone.now() - timedelta(days=1),
            allows_late=False,
        )
        other_section_task = self.create_task(section=self.other_section)
        self.create_submission(
            draft,
            self.student,
            EntregaTarea.EstadoEntrega.BORRADOR,
        )
        self.create_submission(
            submitted,
            self.student,
            EntregaTarea.EstadoEntrega.ENVIADO,
        )

        self.client.force_authenticate(self.student)
        response = self.client.get('/api/v1/academico/entregas-tareas/mis-pendientes/')

        self.assertEqual(response.status_code, 200)
        task_ids = {row['id'] for row in response.data['results']}
        self.assertEqual(task_ids, {pending.id, draft.id, late_allowed.id})
        draft_row = next(row for row in response.data['results'] if row['id'] == draft.id)
        self.assertEqual(draft_row['entrega']['estado'], EntregaTarea.EstadoEntrega.BORRADOR)
        self.assertNotIn(expired.id, task_ids)
        self.assertNotIn(other_section_task.id, task_ids)

    def test_student_cannot_read_or_save_a_task_outside_enrolled_sections(self):
        other_task = self.create_task(section=self.other_section)
        self.client.force_authenticate(self.student)

        detail = self.client.get(f'/api/v1/academico/tareas/{other_task.id}/')
        draft = self.client.post(
            '/api/v1/academico/entregas-tareas/guardar-borrador/',
            {'tarea': other_task.id, 'comentario_estudiante': 'Intento no autorizado'},
        )

        self.assertEqual(detail.status_code, 404)
        self.assertEqual(draft.status_code, 404)

    def test_submission_receipt_is_persistent_and_private_to_its_student(self):
        task = self.create_task()
        self.client.force_authenticate(self.student)
        missing_delivery = self.client.get(
            '/api/v1/academico/entregas-tareas/mi-entrega/',
            {'tarea': task.id},
        )
        self.assertEqual(missing_delivery.status_code, 204)

        draft = self.client.post(
            '/api/v1/academico/entregas-tareas/guardar-borrador/',
            {
                'tarea': task.id,
                'comentario_estudiante': 'Adjunto el trabajo.',
                'archivo': SimpleUploadedFile('trabajo.pdf', b'contenido'),
            },
            format='multipart',
        )

        self.assertEqual(draft.status_code, 200)
        self.assertEqual(draft.data['archivo_nombre'], 'trabajo.pdf')
        current_delivery = self.client.get(
            '/api/v1/academico/entregas-tareas/mi-entrega/',
            {'tarea': task.id},
        )
        self.assertEqual(current_delivery.status_code, 200)
        self.assertEqual(current_delivery.data['id'], draft.data['id'])
        confirmation = self.client.post(
            f'/api/v1/academico/entregas-tareas/{draft.data["id"]}/confirmar-envio/',
        )
        self.assertEqual(confirmation.status_code, 200)
        self.assertEqual(
            confirmation.data['comprobante']['id_entrega'],
            draft.data['id'],
        )

        receipt = self.client.get(
            f'/api/v1/academico/entregas-tareas/{draft.data["id"]}/comprobante/',
        )
        self.assertEqual(receipt.status_code, 200)
        self.assertEqual(receipt.data['archivo'], 'trabajo.pdf')
        self.assertIsNotNone(receipt.data['timestamp_oficial'])
        download = self.client.get(
            f'/api/v1/academico/entregas-tareas/{draft.data["id"]}/archivo/',
        )
        self.assertEqual(download.status_code, 200)
        self.assertEqual(download['Content-Type'], 'application/octet-stream')
        self.assertIn('trabajo.pdf', download['Content-Disposition'])
        download.close()

        self.client.force_authenticate(self.other_student)
        denied_receipt = self.client.get(
            f'/api/v1/academico/entregas-tareas/{draft.data["id"]}/comprobante/',
        )
        denied_download = self.client.get(
            f'/api/v1/academico/entregas-tareas/{draft.data["id"]}/archivo/',
        )
        self.assertEqual(denied_receipt.status_code, 404)
        self.assertEqual(denied_download.status_code, 404)

    def test_invalid_upload_is_returned_as_a_validation_error(self):
        task = self.create_task()
        self.client.force_authenticate(self.student)

        response = self.client.post(
            '/api/v1/academico/entregas-tareas/guardar-borrador/',
            {
                'tarea': task.id,
                'archivo': SimpleUploadedFile('trabajo.exe', b'contenido'),
            },
            format='multipart',
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            EntregaTarea.objects.filter(tarea=task, estudiante=self.student).count(),
            0,
        )

    def test_teacher_can_only_create_tasks_and_review_assigned_sections(self):
        task = self.create_task()
        submission = self.create_submission(
            task,
            self.student,
            EntregaTarea.EstadoEntrega.ENVIADO,
        )
        other_task = self.create_task(section=self.other_section)
        other_submission = self.create_submission(
            other_task,
            self.other_student,
            EntregaTarea.EstadoEntrega.ENVIADO,
        )

        self.client.force_authenticate(self.teacher)
        sections = self.client.get('/api/v1/academico/secciones/')
        self.assertEqual(sections.status_code, 200)
        self.assertEqual(
            {row['id'] for row in sections.data['results']},
            {self.section.id},
        )
        tasks = self.client.get('/api/v1/academico/tareas/')
        self.assertEqual(
            {row['id'] for row in tasks.data['results']},
            {task.id},
        )
        section_tasks = self.client.get(
            '/api/v1/academico/tareas/',
            {'seccion': self.section.id},
        )
        self.assertEqual(
            {row['id'] for row in section_tasks.data['results']},
            {task.id},
        )
        assignments = self.client.get('/api/v1/academico/secciones-docentes/')
        self.assertEqual(assignments.status_code, 200)
        self.assertEqual(assignments.data['count'], 1)
        deliveries = self.client.get('/api/v1/academico/entregas-tareas/')
        self.assertEqual(
            {row['id'] for row in deliveries.data['results']},
            {submission.id},
        )
        self.assertNotIn(other_submission.id, {row['id'] for row in deliveries.data['results']})

        create_task = self.client.post(
            '/api/v1/academico/tareas/',
            {
                'seccion_id': self.section.id,
                'titulo': 'Nueva tarea',
                'descripcion': 'Descripción',
                'fecha_cierre': (timezone.now() + timedelta(days=3)).isoformat(),
                'permite_atrasados': False,
                'aplica_penalizacion_atraso': False,
            },
            format='json',
        )
        self.assertEqual(create_task.status_code, 201)

        review = self.client.post(
            f'/api/v1/academico/entregas-tareas/{submission.id}/poner-en-revision/',
        )
        self.assertEqual(review.status_code, 200)
        reopen = self.client.post(
            f'/api/v1/academico/entregas-tareas/{submission.id}/reabrir-entrega/',
        )
        self.assertEqual(reopen.status_code, 200)
        self.assertEqual(
            reopen.data['data']['estado'],
            EntregaTarea.EstadoEntrega.REABIERTA,
        )

        self.client.force_authenticate(self.other_teacher)
        forbidden_task = self.client.post(
            '/api/v1/academico/tareas/',
            {
                'seccion_id': self.section.id,
                'titulo': 'Tarea fuera de sección',
                'fecha_cierre': (timezone.now() + timedelta(days=3)).isoformat(),
            },
            format='json',
        )
        self.assertEqual(forbidden_task.status_code, 400)
        hidden_submission = self.client.post(
            f'/api/v1/academico/entregas-tareas/{submission.id}/poner-en-revision/',
        )
        self.assertEqual(hidden_submission.status_code, 404)

    def test_student_cannot_create_or_mutate_tasks(self):
        task = self.create_task()
        self.client.force_authenticate(self.student)

        create_task = self.client.post(
            '/api/v1/academico/tareas/',
            {
                'seccion_id': self.section.id,
                'titulo': 'No autorizado',
                'fecha_cierre': (timezone.now() + timedelta(days=3)).isoformat(),
            },
            format='json',
        )
        update_task = self.client.patch(
            f'/api/v1/academico/tareas/{task.id}/',
            {'titulo': 'Cambio no autorizado'},
            format='json',
        )

        self.assertEqual(create_task.status_code, 403)
        self.assertEqual(update_task.status_code, 403)

    def test_unauthenticated_user_cannot_access_tasks_or_submissions(self):
        task = self.create_task()
        tasks = self.client.get('/api/v1/academico/tareas/')
        submissions = self.client.get('/api/v1/academico/entregas-tareas/')

        self.assertEqual(tasks.status_code, 401)
        self.assertEqual(submissions.status_code, 401)
        self.assertTrue(Tarea.objects.filter(pk=task.pk).exists())
