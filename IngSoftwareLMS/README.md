# Campus Virtual LMS

## Desarrollo

Desde esta carpeta instala dependencias con `npm ci` y ejecuta `npm run dev`.
Por defecto el cliente usa `/api/v1/`; Vite reenvía `/api/` y `/ws/` a Django
en `http://127.0.0.1:8000`. `VITE_API_URL` permite cambiar el prefijo en
cualquier entorno (ver `.env.example`).

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
inconsistencias está en [`docs/API_CONTRACT.md`](../docs/API_CONTRACT.md). El
código está versionado en la rama `TEST_frontend`; aún no se confirmó que
coincida con el backend desplegado ni se ejecutaron pruebas contra staging.

El panel consulta `/api/v1/academico/inscripciones/` sin enviar un ID del
cliente. El backend filtra por el usuario autenticado cuando existe un perfil
estudiante. No existe `/academico/cursos/` ni un filtro `?estudiante=`. El
listado usa paginación del servidor (`page`, 20 resultados); la búsqueda del
cliente solo filtra la página cargada porque no hay filtros de búsqueda
publicados. El panel no muestra avance, docente ni tareas porque el endpoint
no devuelve esos datos.

## Rutas y roles de interfaz

- Público: `/login`.
- Estudiante: `/dashboard` (inscripciones disponibles), `/student/pending`,
  `/tasks/:taskId` y `/receipts/:receiptId` (tareas, borrador, envío definitivo
  y comprobante).
- Docente: `/teacher/sections`, `/teacher/sections/:sectionId/tasks`,
  `/teacher/tasks/new`, `/teacher/tasks/:taskId/edit` y `/teacher/review`
  (solo secciones asignadas).
- Todos los roles: `/profile` (solo lectura) y `/notifications` (REST,
  contador y WebSocket).
- El resto de rutas de estudiante, docente y administración indica el bloqueo
  concreto de backend; las operaciones no se exponen mientras falten endpoints
  o autorización por rol/propiedad.
- Errores de interfaz: `/403` y cualquier ruta desconocida muestra 404.

Los módulos bloqueados se ocultan de la navegación y, si se accede a su URL,
muestran el motivo sin usar datos ficticios.
`VITE_ENABLE_UNAVAILABLE_MODULES=true` permite mostrar sus enlaces; activarlo
no habilita operaciones del backend. Los guards y el rol en memoria son solo
UX: la autorización efectiva corresponde al servidor.

Tareas y entregas usan `academico.Tarea` como modelo canónico. El backend
limita las consultas a matrículas y asignaciones docentes, y valida archivos
PDF/DOCX/ZIP hasta 50 MB. La migración requiere reasignar manualmente las
tareas antiguas sin sección; no se debe aplicar a staging/producción hasta
probarla con respaldo de datos.

## Sesión y seguridad

El access token se mantiene en memoria; el refresh token permanece en
`sessionStorage` mientras el backend no admita cookie HttpOnly. No se persisten
datos del perfil. Para migrar, el backend debe ofrecer cookie
`HttpOnly; Secure; SameSite`, protección CSRF, rotación y CORS con credenciales;
entonces se elimina el refresh de `sessionStorage`.

Los errores de 403 muestran una pantalla de permiso denegado; también se
normalizan errores de validación, conflicto, archivo demasiado grande, límite
de solicitudes y fallos 5xx. El bloqueo visual del login (5 intentos por 60
segundos) no sustituye rate limiting en el servidor.

El WebSocket local de notificaciones autentica con el access token en la URL.
Antes de producción, backend e infraestructura deben confirmar TLS y evitar que
los query strings con tokens queden registrados.

Para producción configura CSP (incluyendo los orígenes permitidos para fuentes
y API), `X-Frame-Options: DENY` o `frame-ancestors 'none'` en CSP y
`Referrer-Policy: strict-origin-when-cross-origin` en el servidor.
