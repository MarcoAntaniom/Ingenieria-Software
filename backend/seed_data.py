import os
import django
from datetime import datetime, date, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.hashers import make_password
from django.utils import timezone
from apps.usuarios.models import Roles, Usuarios, PerfilEstudiante, PerfilDocente
from apps.academico.models import (
    Carrera, Departamento, PeriodoAcademico, EstadoInscripcion,
    Asignatura, Seccion, SeccionDocente, Inscripcion, Tarea as TareaAcademico,
    AnuncioAcademico
)
from apps.evaluaciones.models import Tarea as TareaEvaluacion, EstadoEntrega
from apps.comunicacion.models import Foro, TemaForo, Conversacion, ParticipanteConversacion, MensajeDirecto

def seed():
    print("Iniciando seed de datos para Campus Virtual LMS...")

    # 1. Roles
    rol_admin, _ = Roles.objects.get_or_create(codigo='ADMIN', defaults={'nombre': 'Administrador', 'descripcion': 'Control total del sistema'})
    rol_docente, _ = Roles.objects.get_or_create(codigo='DOCENTE', defaults={'nombre': 'Docente', 'descripcion': 'Profesor titular o adjunto'})
    rol_estudiante, _ = Roles.objects.get_or_create(codigo='ESTUDIANTE', defaults={'nombre': 'Estudiante', 'descripcion': 'Alumno regular de pregrado'})

    # 2. Departamento y Carrera
    depto_info, _ = Departamento.objects.get_or_create(codigo='DCC', defaults={'nombre': 'Departamento de Ciencias de la Computación'})
    carrera_info, _ = Carrera.objects.get_or_create(codigo='ICI', defaults={'nombre_carrera': 'Ingeniería Civil en Informática'})

    # 3. Periodos Académicos
    periodo_actual, _ = PeriodoAcademico.objects.get_or_create(
        codigo='2026-1',
        defaults={
            'fecha_inicio': date(2026, 3, 1),
            'fecha_fin': date(2026, 7, 15),
            'activo': True
        }
    )
    periodo_anterior, _ = PeriodoAcademico.objects.get_or_create(
        codigo='2025-2',
        defaults={
            'fecha_inicio': date(2025, 8, 1),
            'fecha_fin': date(2025, 12, 20),
            'activo': False
        }
    )

    # 4. Estados Inscripción
    estado_en_curso, _ = EstadoInscripcion.objects.get_or_create(codigo='EN_CURSO')
    estado_aprobado, _ = EstadoInscripcion.objects.get_or_create(codigo='APROBADO')
    estado_reprobado, _ = EstadoInscripcion.objects.get_or_create(codigo='REPROBADO')

    # 5. Docentes
    prof1, _ = Usuarios.objects.get_or_create(
        correo_institucional='m.hernandez@universidad.cl',
        defaults={
            'rut': '12.345.678-9',
            'nombres': 'Marcelo',
            'apellidos': 'Hernández Tapia',
            'password_hash': make_password('docente123'),
            'rol': rol_docente,
            'activo': True
        }
    )
    PerfilDocente.objects.get_or_create(usuario=prof1, defaults={'departamento': depto_info, 'especialidad': 'Arquitectura de Software'})

    prof2, _ = Usuarios.objects.get_or_create(
        correo_institucional='c.valenzuela@universidad.cl',
        defaults={
            'rut': '13.456.789-0',
            'nombres': 'Claudia',
            'apellidos': 'Valenzuela Silva',
            'password_hash': make_password('docente123'),
            'rol': rol_docente,
            'activo': True
        }
    )
    PerfilDocente.objects.get_or_create(usuario=prof2, defaults={'departamento': depto_info, 'especialidad': 'Sistemas de Bases de Datos'})

    prof3, _ = Usuarios.objects.get_or_create(
        correo_institucional='r.castro@universidad.cl',
        defaults={
            'rut': '14.567.890-1',
            'nombres': 'Rodrigo',
            'apellidos': 'Castro Mendoza',
            'password_hash': make_password('docente123'),
            'rol': rol_docente,
            'activo': True
        }
    )
    PerfilDocente.objects.get_or_create(usuario=prof3, defaults={'departamento': depto_info, 'especialidad': 'Algoritmos y Estructuras'})

    # 6. Estudiante de demostración
    estudiante, _ = Usuarios.objects.get_or_create(
        correo_institucional='estudiante@universidad.cl',
        defaults={
            'rut': '20.123.456-7',
            'nombres': 'Esteban',
            'apellidos': 'Morales Sepúlveda',
            'password_hash': make_password('estudiante123'),
            'rol': rol_estudiante,
            'activo': True
        }
    )
    perfil_est, _ = PerfilEstudiante.objects.get_or_create(
        usuario=estudiante,
        defaults={'carrera': carrera_info, 'nivel': 7, 'anio_ingreso': 2023}
    )

    # 6.1 Administrador de demostración
    admin_user, _ = Usuarios.objects.get_or_create(
        correo_institucional='admin@universidad.cl',
        defaults={
            'rut': '11.222.333-4',
            'nombres': 'Claudia',
            'apellidos': 'Navarro Gómez',
            'password_hash': make_password('admin123'),
            'rol': rol_admin,
            'activo': True
        }
    )

    # 7. Asignaturas y Secciones (Activas)
    asig_arqui, _ = Asignatura.objects.get_or_create(codigo='INF-321', defaults={'carrera': carrera_info, 'nombre': 'Ingeniería de Software y Arquitectura'})
    sec_arqui, _ = Seccion.objects.get_or_create(asignatura=asig_arqui, periodo_academico=periodo_actual, numero_seccion=1)
    SeccionDocente.objects.get_or_create(seccion=sec_arqui, docente=prof1.perfil_docente, defaults={'es_titular': True})
    Inscripcion.objects.get_or_create(seccion=sec_arqui, estudiante=perfil_est, defaults={'estado': estado_en_curso})

    asig_bd, _ = Asignatura.objects.get_or_create(codigo='INF-412', defaults={'carrera': carrera_info, 'nombre': 'Bases de Datos Distribuidas'})
    sec_bd, _ = Seccion.objects.get_or_create(asignatura=asig_bd, periodo_academico=periodo_actual, numero_seccion=2)
    SeccionDocente.objects.get_or_create(seccion=sec_bd, docente=prof2.perfil_docente, defaults={'es_titular': True})
    Inscripcion.objects.get_or_create(seccion=sec_bd, estudiante=perfil_est, defaults={'estado': estado_en_curso})

    asig_eda, _ = Asignatura.objects.get_or_create(codigo='INF-204', defaults={'carrera': carrera_info, 'nombre': 'Estructuras de Datos y Algoritmos'})
    sec_eda, _ = Seccion.objects.get_or_create(asignatura=asig_eda, periodo_academico=periodo_actual, numero_seccion=1)
    SeccionDocente.objects.get_or_create(seccion=sec_eda, docente=prof3.perfil_docente, defaults={'es_titular': True})
    Inscripcion.objects.get_or_create(seccion=sec_eda, estudiante=perfil_est, defaults={'estado': estado_en_curso})

    asig_cap, _ = Asignatura.objects.get_or_create(codigo='INF-510', defaults={'carrera': carrera_info, 'nombre': 'Taller de Proyecto Capstone'})
    sec_cap, _ = Seccion.objects.get_or_create(asignatura=asig_cap, periodo_academico=periodo_actual, numero_seccion=1)
    SeccionDocente.objects.get_or_create(seccion=sec_cap, docente=prof1.perfil_docente, defaults={'es_titular': True})
    Inscripcion.objects.get_or_create(seccion=sec_cap, estudiante=perfil_est, defaults={'estado': estado_en_curso})

    # Asignatura de periodo archivado
    asig_past, _ = Asignatura.objects.get_or_create(codigo='INF-101', defaults={'carrera': carrera_info, 'nombre': 'Introducción a la Programación'})
    sec_past, _ = Seccion.objects.get_or_create(asignatura=asig_past, periodo_academico=periodo_anterior, numero_seccion=1)
    SeccionDocente.objects.get_or_create(seccion=sec_past, docente=prof3.perfil_docente, defaults={'es_titular': True})
    Inscripcion.objects.get_or_create(seccion=sec_past, estudiante=perfil_est, defaults={'estado': estado_aprobado})

    # 8. Tareas y Pendientes
    now = timezone.now()
    t1, _ = TareaAcademico.objects.get_or_create(
        titulo='Hito 2: Diseño de Arquitectura y Diagramas C4',
        defaults={
            'descripcion': 'Entrega de informe grupal con diagramas de contexto, contenedores y componentes en PlantUML.',
            'fecha_cierre': now + timedelta(days=2, hours=4),
            'permite_atrasados': True,
            'aplica_penalizacion_atraso': True
        }
    )
    t2, _ = TareaAcademico.objects.get_or_create(
        titulo='Laboratorio Práctico: Optimización de Consultas SQL y Particionado',
        defaults={
            'descripcion': 'Script SQL ejecutable con planes de ejecución EXPLAIN ANALYZE y benchmark de índices.',
            'fecha_cierre': now + timedelta(days=5, hours=10),
            'permite_atrasados': False,
            'aplica_penalizacion_atraso': False
        }
    )

    # 9. Anuncios
    AnuncioAcademico.objects.get_or_create(
        titulo='Publicación de pauta para Evaluación Sumativa Hito 2',
        defaults={
            'contenido': 'Estimados alumnos, ya se encuentra disponible en la carpeta de recursos la rúbrica oficial.',
            'autor': prof1,
            'dirigido_a': 'INF-321 Sec. 1'
        }
    )

    print("Seed completado exitosamente.")
    print(f"Estudiante de prueba: {estudiante.correo_institucional} (pass: estudiante123)")
    print(f"Docente de prueba: {prof1.correo_institucional} (pass: docente123)")

if __name__ == '__main__':
    seed()
