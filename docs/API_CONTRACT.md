# Contrato de API disponible

## Fuente y estado del contrato

La referencia para el trabajo actual es el código versionado en la rama
`TEST_frontend`, commit `7a45ec5770ae0273cecce5932d32d2ead09db47e`, junto con
los cambios locales descritos abajo. Esto **no confirma** que esa versión esté
desplegada. No se hicieron solicitudes de humo a staging. Antes de publicar
una integración, backend debe aprobar el contrato y confirmar el entorno
desplegado.

Prefijo registrado: `/api/v1/`. Las vistas protegidas usan JWT
`Authorization: Bearer <access>`. DRF está configurado con paginación por
página de 20 elementos; las vistas genéricas de lista devuelven
`{ "count", "next", "previous", "results" }`. `page` es el parámetro estándar.
Las vistas `APIView` y algunas acciones de viewset devuelven formas directas.
No se deben asumir filtros que no estén implementados expresamente.

`/admin/` publica la interfaz administrativa de Django, no una API REST para el frontend.

## Usuarios y sesión

| Endpoint | Métodos | Parámetros / cuerpo | Respuesta de éxito | Permisos y observaciones |
|---|---|---|---|---|
| `/usuarios/login/` | `POST` | `{ "correo_institucional": string, "password": string }` | `200 { "mensaje": "Login exitoso", "datos": { "access": string, "refresh": string, "usuario": Usuario } }` | `AllowAny`. Los errores son `400 { "mensaje", "error" }`; el backend diferencia cuenta inactiva de credenciales inválidas. El frontend debe mostrar un mensaje genérico. |
| `/usuarios/me/` | `GET` | Sin parámetros | `200 { "mensaje", "datos": Usuario }` | Autenticado. Úsese tras login/refresh para revalidar el rol en el servidor. |
| `/usuarios/refresh/` | `POST` | `{ "refresh": string }` | `200 { "access": string, "refresh": string }` | `AllowAny`; rota los tokens. No usa cookie HttpOnly. |
| `/usuarios/read/` | `GET` | Sin parámetros | `200 { "mensaje", "datos": Usuario[] }` | Autenticado, sin paginación ni restricción por rol. |
| `/usuarios/create/` | `POST` | Campos de escritura de `Usuario`: `rut`, `nombres`, `apellidos`, `correo_institucional`, `password_hash`, `rol_id`, `activo` | `201 { "mensaje", "usuario": Usuario }` | Autenticado, sin permiso administrativo explícito en esta vista. |
| `/usuarios/update/{id}/` | `PUT` | Campos editables de `Usuario` | `200 { "mensaje", "datos": Usuario }` | Autenticado; no se valida rol administrativo. La vista usa actualización parcial pese al método `PUT`. |
| `/usuarios/student-profile/` | `POST` | `{ "usuario", "carrera", "nivel", "anio_ingreso" }` | `201 { "mensaje", "perfil_estudiante": { "id", "usuario", "carrera", "nivel", "anio_ingreso" } }` | Solo el rol con `rol.id == 1`; respuesta de denegación actual `401`. No tiene `GET`. |
| `/usuarios/teacher-profile/` | `POST` | `{ "usuario", "especialidad", "departamento" }` | `201 { "mensaje", "perfil_docente": { "id", "usuario", "especialidad", "departamento" } }` | Solo el rol con `rol.id == 1`; respuesta de denegación actual `401`. No tiene `GET`. |

`Usuario` en las respuestas contiene `id`, `rut`, `nombres`, `apellidos`, `correo_institucional`, `rol: { id, nombre, codigo }` y `activo`. `password_hash` y `rol_id` son de escritura y no se devuelven.

El rol se obtiene del servidor desde `datos.rol.codigo` en `/usuarios/me/` (también se agrega `rol` como claim del JWT). Los perfiles no se incluyen en `UsuarioSerializer`. Aunque existen relaciones `perfil_estudiante` y `perfil_docente` en el modelo, las rutas de perfil solo permiten crear y no leer el perfil actual; no se puede obtener `perfil_estudiante.id` con los endpoints expuestos.

**No existe** `/usuarios/logout/` en el enrutamiento. El cierre actual del frontend solo puede limpiar la sesión local; la revocación en servidor queda pendiente.

## Académico

La mayoría de las rutas de catálogo usan vistas DRF genéricas y solo requieren
autenticación; no exponer sus operaciones de escritura en la UI. Las rutas de
secciones y asignaciones docentes tienen alcance específico por rol:

| Endpoint | Métodos | Forma de respuesta / campos | Permisos y parámetros |
|---|---|---|---|
| `/academico/carreras/`, `/academico/carreras/{id}/` | Colección/detalle | `{id, codigo, nombre_carrera}` | Autenticado; `page` en colección. |
| `/academico/departamentos/`, `/academico/departamentos/{id}/` | Colección/detalle | `{id, codigo, nombre}` | Autenticado; `page` en colección. |
| `/academico/periodos-academicos/`, `/academico/periodos-academicos/{id}/` | Colección/detalle | `{id, codigo, fecha_inicio, fecha_fin, activo}` | Autenticado; `page` en colección. |
| `/academico/estados-inscripcion/`, `/academico/estados-inscripcion/{id}/` | Colección/detalle | `{id, codigo}` | Autenticado; `page` en colección. |
| `/academico/asignaturas/`, `/academico/asignaturas/{id}/` | Colección/detalle | `{id, carrera: {id, codigo, nombre_carrera}, codigo, nombre}` | `carrera_id` solo para escritura; autenticado. |
| `/academico/secciones/`, `/academico/secciones/{id}/` | Colección/detalle | `{id, asignatura, periodo_academico, numero_seccion}`; objetos anidados con los campos de asignatura y periodo anteriores | `GET` limita a secciones asignadas para docente y matriculadas para estudiante; administrador puede listar todas. Escritura solo administrador. |
| `/academico/secciones-docentes/`, `/academico/secciones-docentes/{id}/` | Colección/detalle | `{id, seccion, docente: string, es_titular}` | `GET` limita al docente autenticado; estudiante recibe lista vacía. Escritura solo administrador. |
| `/academico/inscripciones/`, `/academico/inscripciones/{id}/` | Colección/detalle | `{id, seccion: {id, asignatura, periodo_academico, numero_seccion}, estudiante: string, estado: {id, codigo}, creado_en}` | Autenticado. El listado y detalle limitan al propio perfil únicamente cuando el usuario tiene `perfil_estudiante`; otros usuarios autenticados reciben todas las inscripciones. `?estudiante=` no se declara ni se usa. |

En las inscripciones, `estudiante` es texto, no un objeto de perfil. El objeto `seccion` no incluye docente. No hay campos de avance ni tarea próxima.

## Tareas y entregas

| Endpoint | Métodos | Parámetros / cuerpo | Respuesta de éxito | Permisos y observaciones |
|---|---|---|---|---|
| `/evaluaciones/create/` | `POST` | `{seccion, rubrica, titulo, instrucciones, fecha_apertura, fecha_limite, puntaje_maximo, permitir_entregas_tardias, es_visible}` | `201 { "mensaje": "Tarea creada exitosamente", "tarea": {id, seccion, rubrica, titulo, instrucciones, fecha_apertura, fecha_limite, puntaje_maximo, permitir_entregas_tardias, es_visible} }` | Autenticado, sin verificación de rol docente. No hay GET/listado/detalle/edición de tareas. |
| `/academico/tareas/`, `/academico/tareas/{id}/` | Colección `GET, POST`; detalle `GET, PUT, PATCH, DELETE` | `Tarea`: `{id, seccion, titulo, descripcion, fecha_cierre, permite_atrasados, aplica_penalizacion_atraso}`. Escritura usa `seccion_id` | Colección paginada; acepta `?seccion=<id>` y `page`. Estudiante lee tareas de sus secciones; docente lee y modifica tareas solo en secciones asignadas. Crear exige docente asignado. |
| `/academico/entregas-tareas/`, `/academico/entregas-tareas/{id}/` | `GET`; `POST` en colección no está permitido; escritura genérica no está permitida | Lista paginada. Incluye `tarea_detalles`, `estudiante_nombre`, `archivo_nombre`, estado, comentario y fechas; no entrega una URL pública de archivo. | Estudiante solo ve sus entregas. Docente solo ve entregas `ENVIADO`/`EN_REVISION` de sus secciones; admite `?estado=ENVIADO` o `?estado=EN_REVISION`. |
| `/academico/entregas-tareas/mi-entrega/?tarea=<id>` | `GET` | Entrega serializada o `204 No Content` si aún no existe | Solo estudiante autenticado; la consulta nunca acepta un ID de estudiante. |
| `/academico/entregas-tareas/mis-pendientes/` | `GET` | Colección paginada de tareas con sección y `entrega` propia (borrador, si existe) | Solo estudiante; limita a secciones inscritas, excluye `ENVIADO`/`EN_REVISION`, excluye vencidas no atrasables e incluye tareas vencidas que aceptan atraso. |
| `/academico/entregas-tareas/guardar-borrador/` | `POST` | Multipart: `tarea`, opcional `archivo`, `comentario_estudiante` | Solo estudiante matriculado en la sección; archivos PDF/DOCX/ZIP hasta 50 MB. El servidor valida extensión y tamaño. Estado modificable: `BORRADOR` o `REABIERTA`. |
| `/academico/entregas-tareas/{id}/confirmar-envio/` | `POST` | Sin cuerpo requerido | `{mensaje, comprobante: {id_entrega, tarea, estudiante, archivo, estado, timestamp_oficial, es_fuera_de_plazo}}` | Solo propietario estudiante. Una segunda confirmación se rechaza; no incluye hash ni tamaño. |
| `/academico/entregas-tareas/{id}/comprobante/` | `GET` | Campos persistidos de comprobante: `id_entrega`, `tarea`, `estudiante`, `archivo`, `estado`, `timestamp_oficial`, `es_fuera_de_plazo` | Solo propietario y solo tras envío definitivo; otros usuarios y borradores reciben `404`. |
| `/academico/entregas-tareas/{id}/archivo/` | `GET` | Flujo de archivo `application/octet-stream`, `Content-Disposition: attachment` | Solo estudiante propietario o docente asignado a la sección; se transmite el archivo a través del backend, no se expone URL del storage. |
| `/academico/entregas-tareas/{id}/poner-en-revision/`, `/reabrir-entrega/` | `POST` | `{mensaje, data}` | Solo docente asignado a la sección; reabrir requiere estado `ENVIADO` o `EN_REVISION`. No implementa calificación. |

`academico.Tarea` es el modelo canónico del flujo implementado y ahora se
relaciona con `Seccion`. La relación queda nullable en la base para conservar
tareas antiguas sin sección; el API las omite y exige `seccion_id` al crear.
Hay que asignar manualmente las tareas antiguas desde Django Admin antes de
que vuelvan a aparecer. `EntregaTarea.estudiante` ahora referencia
`usuarios.Usuarios`; la migración relaciona registros anteriores por correo
institucional exacto (sin coincidencia única, la migración aborta antes de
perder la relación). `evaluaciones.Tarea` y `/evaluaciones/create/` siguen
siendo recursos distintos y no forman parte de esta UI.

## Notificaciones

| Endpoint | Métodos | Respuesta / filtros | Permisos y observaciones |
|---|---|---|---|
| `/notificaciones/` | `GET` | Lista paginada de `{id, titulo, mensaje, tipo, datos, leida, creada_en, leida_en}`; filtros `leida=true/false` y `tipo=<codigo>` | Solo devuelve notificaciones del usuario autenticado. |
| `/notificaciones/tipos/` | `GET` | Lista paginada `{codigo, nombre, descripcion}` | Solo tipos activos. |
| `/notificaciones/no-leidas/contador/` | `GET` | `{no_leidas: integer}` | Cuenta del usuario autenticado. |
| `/notificaciones/{id}/leer/` | `POST` | Notificación actualizada | Comprueba destinatario. |
| `/notificaciones/leer-todas/` | `POST` | `204 No Content` | Solo marca las del usuario autenticado. No intentar parsear un cuerpo JSON. |
| `/ws/notificaciones/` | WebSocket | Evento `{type: "notification", notification: ...}`; ping `{type: "ping"}` | El middleware local autentica con `?token=<access>` y ASGI aplica `OriginValidator`. El token en query puede quedar registrado por infraestructura; coordinar rotación, TLS y política de logs antes de producción. |

## Comunicación y archivos

Las URLs locales sí incluyen `comunicacion/` y registran viewsets para
`anuncios/`, `foros/`, `temas/`, `mensajes-foro/` y `mensajes-directos/`.
`mensajes-directos/` limita el queryset a conversaciones donde participa el
usuario; no hay una API para listar/crear conversaciones. Los demás viewsets
exigen autenticación, pero no aíslan lectura por sección ni aplican permisos de
edición/moderación consistentes. No habilitar sus pantallas antes de corregir
ese aislamiento y confirmar paginación/contratos.

`archivos` no publica API. No hay endpoint para almacenamiento/subida firmado,
límites de archivo confirmados ni descarga autorizada.

## Inconsistencias y pendientes de backend

- El README del frontend mencionaba `/academico/cursos/`, pero no existe esa ruta. La ruta disponible es `/academico/inscripciones/`; filtra por perfil estudiante solo cuando el usuario tiene ese perfil. Usuarios sin perfil de estudiante pueden recibir todas las inscripciones.
- La respuesta real de inscripción usa paginación `results` y no contiene docente, avance ni tarea. El frontend muestra solo los campos recibidos.
- La respuesta de login sí envuelve los tokens y `usuario` en `datos`. `/me/` también usa `datos`; refresh no usa envoltura.
- No existe `/usuarios/logout/`; el frontend solo limpia la sesión local.
- No existe lectura del perfil estudiante/docente actual ni perfil embebido en `/usuarios/me/`; el campo `perfil_estudiante.id` esperado por el frontend no está disponible.
- El flujo `academico.Tarea`/`EntregaTarea` ahora filtra por matrícula y asignación docente, con comprobante y descarga protegidos; requiere aplicar y verificar la migración en el entorno de despliegue antes de usarlo allí.
- Hay endpoints de notificaciones REST y WebSocket; para producción, evaluar autenticación WebSocket que no transmita el access token en query string.
- Faltan rutas para calendario, lectura de perfiles estudiante/docente actuales, calificaciones, material y auditoría. La mensajería no publica listado/creación de conversaciones.
- Los viewsets de comunicación y las APIs académicas genéricas tienen permisos insuficientes para lectura/escritura por rol o sección.
- `archivos` no publica API; faltan validación/restricción de tipos y tamaño desde servidor, subida firmada, progreso/cancelación y descarga autorizada.
- El login del backend revela si una cuenta está inactiva; debe normalizar el mensaje en servidor y agregar limitación de intentos. El bloqueo visual del frontend no es defensa contra fuerza bruta.
- Los permisos académicos genéricos solo exigen autenticación; deben añadirse permisos por rol/propiedad en backend. La UI y los guards del cliente no sustituyen esa autorización.
- El perfil de usuario incluye RUT completo y no expone perfiles mediante lectura dedicada. El frontend debe evitar persistir datos de perfil en `storage` y enmascarar el RUT donde se muestre.
- Migración de refresh: habilitar cookie `HttpOnly; Secure; SameSite` en servidor, definir manejo CSRF/rotación y CORS con credenciales, y retirar `sessionStorage` solo cuando el backend publique ese contrato.
