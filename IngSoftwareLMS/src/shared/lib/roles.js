/**
 * Utilidades centralizadas para normalizar y verificar roles del backend.
 * En el backend (`apps.usuarios`), un usuario tiene `rol: { id, nombre, codigo }`.
 * El ID 1 se valida explícitamente en vistas administrativas (`student-profile/`, `teacher-profile/`).
 */

export const ROLES = {
  ADMIN: 'admin',
  DOCENTE: 'docente',
  ESTUDIANTE: 'estudiante',
}

export function getUserRoleCode(user) {
  if (!user) return null

  const rawCode =
    user?.rol?.codigo ||
    user?.rol?.nombre ||
    (typeof user?.rol === 'string' ? user.rol : '') ||
    ''

  const normalized = rawCode
    .toString()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim()

  if (
    user?.rol?.id === 1 ||
    normalized.includes('admin') ||
    normalized === 'adm'
  ) {
    return ROLES.ADMIN
  }

  if (
    normalized.includes('docente') ||
    normalized.includes('profesor') ||
    normalized.includes('teacher') ||
    normalized === 'doc'
  ) {
    return ROLES.DOCENTE
  }

  if (
    normalized.includes('estudiante') ||
    normalized.includes('alumno') ||
    normalized.includes('student') ||
    normalized === 'est'
  ) {
    return ROLES.ESTUDIANTE
  }

  // Fallback por defecto para cuentas autenticadas sin código estándar
  return ROLES.ESTUDIANTE
}

export function getRoleLabel(user) {
  if (user?.rol?.nombre) return user.rol.nombre
  const code = getUserRoleCode(user)
  if (code === ROLES.ADMIN) return 'Administrador'
  if (code === ROLES.DOCENTE) return 'Docente'
  return 'Estudiante'
}

export function hasAllowedRole(user, allowedRoles = []) {
  if (!allowedRoles || allowedRoles.length === 0) return true
  const roleCode = getUserRoleCode(user)
  if (!roleCode) return false
  // El administrador tiene acceso transversal si se incluye o para vistas de gestión
  return allowedRoles.includes(roleCode)
}

export function getUserDisplayName(user) {
  if (!user) return 'Usuario'
  return (
    [user.nombres, user.apellidos].filter(Boolean).join(' ') ||
    user.nombre_completo ||
    user.first_name ||
    user.nombre ||
    user.correo_institucional ||
    'Usuario'
  )
}
