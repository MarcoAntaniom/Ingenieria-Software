# Contrato de API disponible

## Alcance de la auditoría

Contrato revisado en la rama `backend`, commit `f4c59111611ea32474b877b054b4fc3875bf4952`. La rama de trabajo `feat/frontend-lms` no contiene los archivos Python del backend; se leyeron los blobs de la rama `backend` sin cambiarla ni hacerle checkout. Confirmar con backend que ese commit sea el desplegado antes de integrar.

Prefijo registrado: `/api/v1/`. Autenticación global JWT `Authorization: Bearer <access>`. DRF usa `PageNumberPagination`, 20 resultados por página; las vistas genéricas de lista devuelven `{ "count", "next", "previous", "results" }` (sin envoltura `datos`). `page` es el único parámetro estándar de paginación y el tamaño no se puede ajustar por petición. Los endpoints basados en `APIView` devuelven sus formas descritas abajo y no se paginan. No se encontró configuración de `filterset_fields` para las listas académicas; parámetros arbitrarios como `estudiante` no están definidos.

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

Las rutas de catálogo usan vistas DRF genéricas: colecciones `GET, POST`; detalle `GET, PUT, PATCH, DELETE`. Las colecciones son paginadas (20). Todos requieren autenticación, pero no tienen permisos por rol ni filtros específicos.

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

## Evaluaciones y entregas

| Endpoint | Métodos | Parámetros / cuerpo | Respuesta de éxito | Permisos y observaciones |
|---|---|---|---|---|
| `/evaluaciones/create/` | `POST` | `{seccion, rubrica, titulo, instrucciones, fecha_apertura, fecha_limite, puntaje_maximo, permitir_entregas_tardias, es_visible}` | `201 { "mensaje": "Tarea creada exitosamente", "tarea": {id, seccion, rubrica, titulo, instrucciones, fecha_apertura, fecha_limite, puntaje_maximo, permitir_entregas_tardias, es_visible} }` | Autenticado, sin verificación de rol docente. No hay GET/listado/detalle/edición de tareas. |

`EntregaTareaViewSet` y acciones para guardar borrador, confirmar envío, cambiar estado y reabrir aparecen en `apps.academico.views`, pero **no se registran en ninguna URL/router**. No son endpoints consumibles. El comprobante actualmente no incluye RUT enmascarado, tamaño de archivo ni hash; no se debe fabricar esa información en el cliente.

## Comunicación y archivos

No se incluyen URLs de `comunicacion` o `archivos` en `config/urls.py`; `comunicacion` no tiene `urls.py` y `archivos.views` no expone vistas. Aunque hay viewsets/modelos de foros y mensajería en el código, no existe una ruta API publicada. No se encontró endpoint para subida firmada ni metadatos de archivo.

## Inconsistencias y pendientes de backend

- El README del frontend mencionaba `/academico/cursos/`, pero no existe esa ruta. La ruta disponible es `/academico/inscripciones/`; filtra al estudiante desde el usuario autenticado y no acepta `?estudiante=`.
- El frontend intentaba leer `datos` o `results` y asumir docente, avance y tarea; la respuesta real de inscripción usa paginación `results` (o campos `datos` solo en algunas `APIView`) y no contiene docente, avance ni tarea.
- La respuesta de login sí envuelve los tokens y `usuario` en `datos`. `/me/` también usa `datos`; refresh no usa envoltura.
- El frontend llama `/usuarios/logout/`, que no existe.
- No existe lectura del perfil estudiante/docente actual ni perfil embebido en `/usuarios/me/`; el campo `perfil_estudiante.id` esperado por el frontend no está disponible.
- `EntregaTareaViewSet` no está enrutado; faltan endpoints funcionales de tareas y entregas para estudiantes y docentes (borrador, confirmación, revisión, calificación, comprobante verificable y descarga).
- Faltan rutas para calendario, notificaciones, settings/perfil, anuncios, material, foros/mensajería, calificaciones, y administración/auditoría.
- `archivos` no publica API; faltan validación/restricción de tipos y tamaño desde servidor, subida firmada, progreso/cancelación y descarga autorizada.
- El login del backend revela si una cuenta está inactiva; debe normalizar el mensaje en servidor y agregar limitación de intentos. El bloqueo visual del frontend no es defensa contra fuerza bruta.
- Los permisos académicos genéricos solo exigen autenticación; deben añadirse permisos por rol/propiedad en backend. La UI y los guards del cliente no sustituyen esa autorización.
- El perfil de usuario incluye RUT completo y no expone perfiles mediante lectura dedicada. El frontend debe evitar persistir datos de perfil en `storage` y enmascarar el RUT donde se muestre.
- Migración de refresh: habilitar cookie `HttpOnly; Secure; SameSite` en servidor, definir manejo CSRF/rotación y CORS con credenciales, y retirar `sessionStorage` solo cuando el backend publique ese contrato.
