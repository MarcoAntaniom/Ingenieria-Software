import { MODULES } from '../features/modules/moduleRegistry'

export function getUserRole(user) {
  const rawRole = [user?.rol?.codigo, user?.rol?.nombre]
    .filter(Boolean)
    .join(' ')
  const role = rawRole
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLocaleLowerCase('es')

  if (/(estudiant|student|alumno)/u.test(role)) return 'student'
  if (/(docent|teacher|profesor)/u.test(role)) return 'teacher'
  if (/(admin|administrador)/u.test(role)) return 'admin'
  return 'unknown'
}

export function getLandingPath(user) {
  const role = getUserRole(user)
  if (role === 'student') return '/dashboard'
  if (role === 'teacher') return '/teacher/sections'
  if (role === 'admin') return '/admin/users'
  return '/403'
}

export function canAccessPath(user, path) {
  const role = getUserRole(user)
  if (path === '/dashboard') return role === 'student'

  const module = MODULES.find((item) => {
    const pattern = new RegExp(
      `^${item.path.replace(/:[^/]+/gu, '[^/]+')}/?$`,
      'u',
    )
    return pattern.test(path)
  })

  return Boolean(module && module.roles.includes(role))
}
