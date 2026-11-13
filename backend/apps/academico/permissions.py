import re
import unicodedata

from rest_framework.permissions import BasePermission, SAFE_METHODS


def _normalized_role(user):
    role = getattr(user, 'rol', None)
    if role is None:
        return ''

    value = f'{getattr(role, "codigo", "")} {getattr(role, "nombre", "")}'
    value = unicodedata.normalize('NFD', value)
    value = ''.join(character for character in value if not unicodedata.combining(character))
    return re.sub(r'[^a-z0-9]+', ' ', value.lower()).strip()


def has_role(user, role):
    normalized = _normalized_role(user)
    codes = {
        'student': ('est', 'student', 'estudiante', 'alumno'),
        'teacher': ('doc', 'teacher', 'docente', 'profesor'),
        'admin': ('adm', 'admin', 'administrador'),
    }
    return any(value in normalized.split() for value in codes[role])


def assigned_section_ids(user):
    from .models import SeccionDocente

    if not has_role(user, 'teacher'):
        return SeccionDocente.objects.none().values_list('seccion_id', flat=True)
    return SeccionDocente.objects.filter(
        docente__usuario=user,
    ).values_list('seccion_id', flat=True)


def enrolled_section_ids(user):
    from .models import Inscripcion

    if not has_role(user, 'student'):
        return Inscripcion.objects.none().values_list('seccion_id', flat=True)
    return Inscripcion.objects.filter(
        estudiante__usuario=user,
    ).values_list('seccion_id', flat=True)


def is_assigned_teacher(user, section):
    from .models import SeccionDocente

    return has_role(user, 'teacher') and SeccionDocente.objects.filter(
        seccion=section,
        docente__usuario=user,
    ).exists()


class IsStudentOrTeacher(BasePermission):
    def has_permission(self, request, view):
        return has_role(request.user, 'student') or has_role(request.user, 'teacher')


class IsStudent(BasePermission):
    def has_permission(self, request, view):
        return has_role(request.user, 'student')


class IsTeacher(BasePermission):
    def has_permission(self, request, view):
        return has_role(request.user, 'teacher')


class IsRoleScopedAcademicUser(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return (
                has_role(request.user, 'student')
                or has_role(request.user, 'teacher')
                or has_role(request.user, 'admin')
            )
        return has_role(request.user, 'admin')
