const allRoles = ['student', 'teacher', 'admin']

export const MODULES = [
  { key: 'profile', title: 'Perfil y configuración', path: '/profile', icon: 'manage_accounts', roles: allRoles },
  { key: 'notifications', title: 'Notificaciones', path: '/notifications', icon: 'notifications', roles: allRoles },
  { key: 'calendar', title: 'Calendario', path: '/calendar', icon: 'calendar_month', roles: allRoles },
  { key: 'course-detail', title: 'Detalle del curso', path: '/courses/:courseId', icon: 'menu_book', roles: ['student'] },
  { key: 'task-detail', title: 'Detalle de tarea', path: '/tasks/:taskId', icon: 'assignment', roles: ['student'] },
  { key: 'receipt', title: 'Comprobante de entrega', path: '/receipts/:receiptId', icon: 'receipt_long', roles: ['student'] },
  { key: 'student-pending', title: 'Mis pendientes', path: '/student/pending', icon: 'pending_actions', roles: ['student'] },
  { key: 'student-grades', title: 'Calificaciones', path: '/student/grades', icon: 'grade', roles: ['student'] },
  { key: 'messages', title: 'Mensajería', path: '/messages', icon: 'mail', roles: ['student'] },
  { key: 'teacher-sections', title: 'Mis secciones', path: '/teacher/sections', icon: 'groups', roles: ['teacher'] },
  { key: 'teacher-task-create', title: 'Crear tarea', path: '/teacher/tasks/new', icon: 'add_task', roles: ['teacher'] },
  { key: 'teacher-task-edit', title: 'Editar tarea', path: '/teacher/tasks/:taskId/edit', icon: 'edit_document', roles: ['teacher'] },
  { key: 'teacher-review', title: 'Bandeja de corrección', path: '/teacher/review', icon: 'fact_check', roles: ['teacher'] },
  { key: 'teacher-announcements', title: 'Anuncios', path: '/teacher/announcements', icon: 'campaign', roles: ['teacher'] },
  { key: 'teacher-material', title: 'Material de curso', path: '/teacher/material', icon: 'folder_open', roles: ['teacher'] },
  { key: 'teacher-forum', title: 'Moderación del foro', path: '/teacher/forums', icon: 'forum', roles: ['teacher'] },
  { key: 'admin-users', title: 'Usuarios y roles', path: '/admin/users', icon: 'manage_accounts', roles: ['admin'] },
  { key: 'admin-academic', title: 'Carreras y secciones', path: '/admin/academic', icon: 'account_tree', roles: ['admin'] },
  { key: 'admin-enrollments', title: 'Matrículas', path: '/admin/enrollments', icon: 'how_to_reg', roles: ['admin'] },
  { key: 'admin-audit', title: 'Auditoría', path: '/admin/audit', icon: 'policy', roles: ['admin'] },
]

export const SHOW_UNAVAILABLE_MODULES =
  import.meta.env.VITE_ENABLE_UNAVAILABLE_MODULES === 'true'
