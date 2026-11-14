# Campus Virtual LMS

## Desarrollo

Desde esta carpeta instala dependencias con `npm ci` y ejecuta `npm run dev`.
En desarrollo el cliente usa `/api/v1/`; Vite reenvía `/api/` a Django en
`http://127.0.0.1:8000`. En producción define `VITE_API_URL` con el origen y
prefijo `/api/v1/` del servidor (ver `.env.example`).

## Contrato de API disponible

- `POST usuarios/login/` recibe `correo_institucional` y `password`; los tokens
  y usuario vienen dentro de `datos`.
- `GET usuarios/me/` devuelve el perfil actual en `datos`. El frontend consulta
  este endpoint tras login y refresh; obtiene el rol del servidor en
  `datos.rol.codigo`.
- `POST usuarios/refresh/` recibe `refresh` y devuelve `access` y un nuevo
  `refresh`.
- Los endpoints protegidos usan `Authorization: Bearer`.
- El backend actual no publica `usuarios/logout/` ni un `GET` para consultar el
  perfil estudiante/docente.

El contrato detallado, sus envolturas, campos, permisos, paginación e
inconsistencias está en [`docs/API_CONTRACT.md`](../docs/API_CONTRACT.md). Se
auditó la rama `backend` en el commit indicado allí; esa carpeta no está
materializada en la rama frontend.

El panel consulta `/api/v1/academico/inscripciones/` sin enviar un ID del
cliente. El backend filtra por el usuario autenticado cuando existe un perfil
estudiante. No existe `/academico/cursos/` ni un filtro `?estudiante=`. El
listado usa paginación del servidor (`page`, 20 resultados); la búsqueda del
cliente solo filtra la página cargada porque no hay filtros de búsqueda
publicados. Avance, docente y tareas no se devuelven y se muestran como «Sin
datos»; no se ofrecen pestañas que dependan de esos datos.

## Rutas y roles de interfaz

- Público: `/login`.
- Estudiante: `/dashboard` (inscripciones disponibles).
- Docente: `/teacher/sections`; administrador: `/admin/users`.
- Módulos comunes: `/profile`, `/notifications`, `/calendar`.
- Estudiante: `/courses/:courseId`, `/tasks/:taskId`,
  `/receipts/:receiptId`, `/student/pending`, `/student/grades`, `/messages`.
- Docente: `/teacher/tasks/new`, `/teacher/tasks/:taskId/edit`,
  `/teacher/review`, `/teacher/announcements`, `/teacher/material`,
  `/teacher/forums`.
- Administrador: `/admin/academic`, `/admin/enrollments`, `/admin/audit`.
- Errores de interfaz: `/403` y cualquier ruta desconocida muestra 404.

Los módulos sin endpoint muestran «Módulo no disponible» y nunca usan datos
ficticios. `VITE_ENABLE_UNAVAILABLE_MODULES=true` permite mostrar sus enlaces
adicionales en la navegación; activarlo no habilita operaciones del backend.
Los guards y el rol en memoria son solo UX: la autorización efectiva corresponde
al servidor.

## Sesión y seguridad

El access token se mantiene en memoria; el refresh token permanece en
`sessionStorage` mientras el backend no admita cookie HttpOnly. No se persisten
datos del perfil. Para migrar, el backend debe ofrecer cookie
`HttpOnly; Secure; SameSite`, protección CSRF, rotación y CORS con credenciales;
entonces se elimina el refresh de `sessionStorage`.

Los errores de 403 muestran una pantalla de permiso denegado y los 5xx un
mensaje amigable. El bloqueo visual del login (5 intentos por 60 segundos) no
sustituye rate limiting en el servidor.

Para producción configura CSP (incluyendo los orígenes permitidos para fuentes
y API), `X-Frame-Options: DENY` o `frame-ancestors 'none'` en CSP y
`Referrer-Policy: strict-origin-when-cross-origin` en el servidor.
