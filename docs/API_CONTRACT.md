# Contrato de API disponible

## Fuente y estado del contrato

La referencia para el trabajo actual es el código presente en `backend/`. Esa
carpeta no está rastreada por Git en esta rama, por lo que su contenido no tiene
un commit/version verificable y **no se puede afirmar que corresponda al
backend desplegado**. No se hicieron solicitudes de humo a staging. Antes de
publicar una integración, backend debe versionar y aprobar este contrato y
confirmar el entorno desplegado.

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

Las rutas de catálogo usan vistas DRF genéricas: colecciones `GET, POST`;
detalle `GET, PUT, PATCH, DELETE`. Las colecciones son paginadas (20). En el
código local, estas vistas solo requieren autenticación; no implementan
permisos por rol/propiedad ni filtros específicos. No exponer sus operaciones
de escritura en la UI hasta que el backend corrija y pruebe esos permisos.

| Endpoint | Métodos | Forma de respuesta / campos | Permisos y parámetros |
|---|---|---|---|
| `/academico/carreras/`, `/academico/carreras/{id}/` | Colección/detalle | `{id, codigo, nombre_carrera}` | Autenticado; `page` en colección. |
| `/academico/departamentos/`, `/academico/departamentos/{id}/` | Colección/detalle | `{id, codigo, nombre}` | Autenticado; `page` en colección. |
| `/academico/periodos-academicos/`, `/academico/periodos-academicos/{id}/` | Colección/detalle | `{id, codigo, fecha_inicio, fecha_fin, activo}` | Autenticado; `page` en colección. |
| `/academico/estados-inscripcion/`, `/academico/estados-inscripcion/{id}/` | Colección/detalle | `{id, codigo}` | Autenticado; `page` en colección. |
| `/academico/asignaturas/`, `/academico/asignaturas/{id}/` | Colección/detalle | `{id, carrera: {id, codigo, nombre_carrera}, codigo, nombre}` | `carrera_id` solo para escritura; autenticado. |
| `/academico/secciones/`, `/academico/secciones/{id}/` | Colección/detalle | `{id, asignatura, periodo_academico, numero_seccion}`; objetos anidados con los campos de asignatura y periodo anteriores | IDs de relación solo para escritura; autenticado. |
| `/academico/secciones-docentes/`, `/academico/secciones-docentes/{id}/` | Colección/detalle | `{id, seccion, docente: string, es_titular}` | IDs de relación solo para escritura; autenticado, sin filtro del docente actual. |
| `/academico/inscripciones/`, `/academico/inscripciones/{id}/` | Colección/detalle | `{id, seccion: {id, asignatura, periodo_academico, numero_seccion}, estudiante: string, estado: {id, codigo}, creado_en}` | Autenticado. El listado y detalle limitan al propio perfil únicamente cuando el usuario tiene `perfil_estudiante`; otros usuarios autenticados reciben todas las inscripciones. `?estudiante=` no se declara ni se usa. |

En las inscripciones, `estudiante` es texto, no un objeto de perfil. El objeto `seccion` no incluye docente. No hay campos de avance ni tarea próxima.

## Tareas y entregas

| Endpoint | Métodos | Parámetros / cuerpo | Respuesta de éxito | Permisos y observaciones |
|---|---|---|---|---|
| `/evaluaciones/create/` | `POST` | `{seccion, rubrica, titulo, instrucciones, fecha_apertura, fecha_limite, puntaje_maximo, permitir_entregas_tardias, es_visible}` | `201 { "mensaje": "Tarea creada exitosamente", "tarea": {id, seccion, rubrica, titulo, instrucciones, fecha_apertura, fecha_limite, puntaje_maximo, permitir_entregas_tardias, es_visible} }` | Autenticado, sin verificación de rol docente. No hay GET/listado/detalle/edición de tareas. |
| `/academico/tareas/`, `/academico/tareas/{id}/` | `GET, POST`; detalle `GET, PUT, PATCH, DELETE` | Serializador del modelo `academico.Tarea` | Colección paginada; detalle según serializer | Autenticado, sin verificación de rol docente ni propiedad de sección. No usar para flujos docentes hasta corregir permisos. |
| `/academico/entregas-tareas/`, `/academico/entregas-tareas/{id}/` | CRUD de `ModelViewSet` | Serializador del modelo `EntregaTarea` | Colección paginada o detalle según serializer | La consulta cambia entre estudiante/docente, pero no valida de forma confiable propiedad de sección ni el vínculo estudiante/usuario. Requiere pruebas y correcciones antes de integrar. |
| `/academico/entregas-tareas/mis-pendientes/` | `GET` | Sin parámetros declarados | Lista directa de tareas | La implementación calcula secciones inscritas pero no las aplica al queryset; no usar. |
| `/academico/entregas-tareas/guardar-borrador/` | `POST` | Multipart: `tarea`, `archivo`, `comentario_estudiante` | Entrega serializada | Autenticado; revisar vínculo de identidad, validación de archivo, excepciones y permisos antes de integrar. |
| `/academico/entregas-tareas/{id}/confirmar-envio/` | `POST` | Sin cuerpo requerido | `{mensaje, comprobante: {id_entrega, tarea, estudiante, archivo, estado, timestamp_oficial, es_fuera_de_plazo}}` | Autenticado; el servicio verifica al estudiante, pero el alcance no está probado. La respuesta no incluye hash ni tamaño. |
| `/academico/entregas-tareas/{id}/poner-en-revision/`, `/reabrir-entrega/` | `POST` | Sin cuerpo requerido | `{mensaje, data}` | No usar hasta verificar rol docente y propiedad de sección; las vistas capturan excepciones genéricas y responden `400`. |

El modelo `evaluaciones.Tarea` de `/evaluaciones/create/` es distinto del modelo
`academico.Tarea`; aún debe definirse una fuente de verdad. El comprobante no
debe completar datos que no envía el servidor.

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
- `EntregaTareaViewSet` está enrutado en el árbol local, pero tiene defectos de consulta/relación y no autoriza de forma suficiente las acciones docentes. No habilitarlo en frontend hasta corregir y probar estos riesgos.
- Hay endpoints de notificaciones REST y WebSocket; para producción, evaluar autenticación WebSocket que no transmita el access token en query string.
- Faltan rutas para calendario, lectura de perfiles estudiante/docente actuales, calificaciones, material y auditoría. La mensajería no publica listado/creación de conversaciones.
- Los viewsets de comunicación y las APIs académicas genéricas tienen permisos insuficientes para lectura/escritura por rol o sección.
- `archivos` no publica API; faltan validación/restricción de tipos y tamaño desde servidor, subida firmada, progreso/cancelación y descarga autorizada.
- El login del backend revela si una cuenta está inactiva; debe normalizar el mensaje en servidor y agregar limitación de intentos. El bloqueo visual del frontend no es defensa contra fuerza bruta.
- Los permisos académicos genéricos solo exigen autenticación; deben añadirse permisos por rol/propiedad en backend. La UI y los guards del cliente no sustituyen esa autorización.
- El perfil de usuario incluye RUT completo y no expone perfiles mediante lectura dedicada. El frontend debe evitar persistir datos de perfil en `storage` y enmascarar el RUT donde se muestre.
- Migración de refresh: habilitar cookie `HttpOnly; Secure; SameSite` en servidor, definir manejo CSRF/rotación y CORS con credenciales, y retirar `sessionStorage` solo cuando el backend publique ese contrato.
