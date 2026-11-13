# Estado de implementación del frontend LMS

**Fecha de corte:** 13 de noviembre de 2026  
**Proyecto:** Campus Virtual LMS  
**Frontend:** `IngSoftwareLMS/`  
**Fuente backend seleccionada para esta revisión:** código local de `backend/`, según la decisión del usuario  
**Estado global:** implementación parcial; no se debe declarar el LMS terminado ni listo para producción

## 1. Resumen ejecutivo

Se implementaron los flujos locales de tareas/entregas para estudiante y
docente: tareas por sección, borrador, envío definitivo, comprobante persistido,
descarga protegida, secciones asignadas y bandeja de revisión. Se corrigieron
las consultas y permisos backend de esos recursos y se agregaron pruebas de
aislamiento. También siguen disponibles los fundamentos compartidos,
notificaciones REST/WebSocket, perfil de solo lectura, dashboard ajustado y
mejoras de navegación/accesibilidad.

La integración no está lista para producción: todavía requiere aplicar y
validar la migración con datos reales y ejecutar smoke tests autorizados en
staging. La mayoría de los módulos no relacionados (administración, cursos
agregados, calificaciones, materiales, foros, mensajería y calendario) sigue
bloqueada. La rama de desarrollo contiene backend versionado:

- rama `TEST_frontend`, commit base `7a45ec5770ae0273cecce5932d32d2ead09db47e`;
- aún no se confirmó que ese commit esté desplegado;
- las otras rutas genéricas de usuarios, catálogos, matrículas y comunicación
  mantienen permisos insuficientes.

El principio aplicado es: **no consumir una ruta solo porque existe**. También
debe estar definido el contrato y probada la autorización de rol, sección,
propiedad y usuario. No se fabrican datos para completar pantallas.

## 2. Alcance y fuentes consultadas

La rama `TEST_frontend` y el árbol local de `backend/` son la fuente de
desarrollo confirmada por el usuario; eso no demuestra que la misma versión
esté desplegada.

Documentos relacionados:

- [Plan de implementación](./PLAN_IMPLEMENTACION_FRONTEND_LMS.md)
- [Contrato API revisado](./API_CONTRACT.md)
- [README del frontend](../IngSoftwareLMS/README.md)

Se modificaron directamente los modelos, permisos, servicios, vistas, pruebas
y migración de `backend/apps/academico/` para completar tareas y entregas.
También se actualizaron el contrato API, el README del frontend y este estado.

## 3. Cambios realizados en el frontend

### 3.1 Cliente HTTP, sesión y errores

Archivos principales:

- `IngSoftwareLMS/src/services/api.js`
- `IngSoftwareLMS/src/services/api-errors.js`
- `IngSoftwareLMS/src/services/auth.js`
- `IngSoftwareLMS/src/contexts/AuthContext.jsx`

Cambios:

1. `VITE_API_URL` se usa tanto en desarrollo como en producción. Si no está
   configurada, se usa `/api/v1/`. Se normaliza la barra final para que las
   rutas relativas del cliente no dependan del formato exacto de la variable.
2. Se conserva el access token en memoria y el refresh token en `sessionStorage`,
   porque el backend actual no ofrece cookie HttpOnly para refresh.
3. La renovación concurrente se comparte en una sola solicitud. Cuando una
   solicitud recibe `401`, se intenta renovar una vez y se evita el reintento
   infinito de la solicitud original.
4. Después de una renovación iniciada por una respuesta `401`, se vuelve a
   consultar `usuarios/me/` para revalidar el usuario/rol con el servidor. Esa
   consulta tiene una opción para no iniciar otro refresh si devuelve error.
5. Se vacía la caché de TanStack Query al cerrar sesión, expirar la sesión o
   iniciar sesión con otro usuario; así no quedan datos remotos del usuario
   anterior en memoria.
6. La normalización de errores ahora distingue:
   - `400`/`422`: validación y errores por campo;
   - `403`: permiso denegado;
   - `404`: recurso que ya no existe o no está disponible;
   - `409`: conflicto;
   - `413`: archivo por sobre el límite;
   - `429`: exceso de solicitudes;
   - `5xx`: indisponibilidad del servicio;
   - error de red y cancelación de solicitud.
7. El backend no tiene `usuarios/logout/`. El frontend continúa limpiando la
   sesión local y no presenta eso como revocación del token en el servidor.

**Pendiente:** retirar el refresh token de `sessionStorage` solo cuando el
backend publique cookie `HttpOnly; Secure; SameSite`, manejo CSRF, rotación y
CORS con credenciales. También falta revocación/logout en servidor.

### 3.2 Perfil

Archivos principales:

- `IngSoftwareLMS/src/pages/ProfilePage.jsx`
- `IngSoftwareLMS/src/App.jsx`
- `IngSoftwareLMS/src/features/modules/moduleRegistry.js`

`/profile` funciona como vista de solo lectura con los campos que devuelve el
usuario autenticado: nombre, correo institucional, rol, estado de cuenta y
RUT enmascarado. El enmascaramiento conserva solo los últimos cuatro
caracteres. No se persiste el perfil ni se permite editarlo.

La vista informa que no existe un contrato para consultar el perfil completo
de estudiante/docente ni para editarlo. No muestra datos de carrera,
especialidad u otros campos que no devuelve `usuarios/me/`.

### 3.3 Notificaciones

Archivos principales:

- `IngSoftwareLMS/src/services/notifications.js`
- `IngSoftwareLMS/src/features/notificaciones/useNotifications.js`
- `IngSoftwareLMS/src/pages/NotificationsPage.jsx`
- `IngSoftwareLMS/src/components/layout/AppShell.jsx`
- `IngSoftwareLMS/vite.config.js`

La interfaz consume las rutas locales bajo `/api/v1/notificaciones/`:

- lista paginada;
- filtro por `leida=true/false`;
- filtro por código de tipo;
- lista de tipos;
- contador de no leídas;
- marcar una notificación como leída;
- marcar todas como leídas, tratando correctamente el `204 No Content`.

Los datos se mantienen en TanStack Query. Las mutaciones invalidan listas y
contador. La navegación a partir de `datos.url` solo acepta una ruta interna
relativa; no se ofrece un enlace externo sin validar.

El contador se actualiza al recibir foco y cada 60 segundos. La conexión
WebSocket:

- se abre una sola vez mientras la pantalla de notificaciones está montada;
- usa `/ws/notificaciones/`, deriva `ws:`/`wss:` del origen de la API y envía
  ping cada 25 segundos;
- invalida REST al conectarse, recibir un evento o volver a primer plano;
- evita procesar repetidamente el mismo ID durante la vida de la conexión de
  la página;
- reintenta con espera incremental y hasta cinco fallos consecutivos; si
  falla, la lista REST y el contador siguen disponibles.

En desarrollo, Vite reenvía `/ws/` a Django con soporte WebSocket.

**Riesgo pendiente:** el middleware local autentica el WebSocket mediante
`?token=<access>`. Un token en query string puede quedar en logs de proxy,
servidor o monitoreo. Antes de producción deben usarse TLS/WSS y una política
que impida registrar ese valor; preferiblemente el backend debe ofrecer un
mecanismo que no exponga el token en la URL.

### 3.4 Dashboard del estudiante

Archivos principales:

- `IngSoftwareLMS/src/components/Dashboard.jsx`
- `IngSoftwareLMS/src/features/academico/useCursos.js`

Se conserva el listado paginado de `/api/v1/academico/inscripciones/`, la
búsqueda local y el ordenamiento. Se corrigieron los siguientes puntos:

- ya no se muestran bloques de docente, porcentaje de avance o próxima tarea,
  porque el endpoint de inscripciones no los devuelve;
- la búsqueda anuncia que solo busca en la página cargada;
- no se muestra `0 inscripciones` como dato definitivo antes de recibir la
  primera respuesta;
- el mapeo no usa textos ficticios para completar nombre, código o período
  ausentes.

La búsqueda sigue siendo local: no encuentra inscripciones de otras páginas.
El endpoint no declara filtros de búsqueda.

**Bloqueo de seguridad:** el listado limita al estudiante solo cuando el
usuario autenticado tiene `perfil_estudiante`. Para otros usuarios el
queryset puede devolver todas las inscripciones. Antes de habilitar el
dashboard para cualquier rol debe probarse y corregirse el aislamiento
backend. El dashboard permanece protegido por rol en el cliente, pero eso no
sustituye esa corrección.

### 3.5 Tareas, entregas y comprobantes

Archivos principales:

- `backend/apps/academico/models.py`
- `backend/apps/academico/permissions.py`
- `backend/apps/academico/views.py`
- `backend/apps/academico/services.py`
- `backend/apps/academico/serializers.py`
- `backend/apps/academico/migrations/0004_tarea_seccion_alter_entregatarea_estudiante.py`
- `IngSoftwareLMS/src/services/tasks.js`
- `IngSoftwareLMS/src/features/academico/useTasks.js`
- `IngSoftwareLMS/src/pages/StudentPendingPage.jsx`
- `IngSoftwareLMS/src/pages/StudentTaskPage.jsx`
- `IngSoftwareLMS/src/pages/SubmissionReceiptPage.jsx`

`academico.Tarea` quedó acordado como modelo canónico. Las tareas nuevas
requieren una sección, y el API limita la lectura a secciones inscritas o
asignadas al usuario. `mis-pendientes` ahora pagina las tareas de las
inscripciones reales, incluye el borrador propio si existe, excluye envíos
definitivos y aplica la regla de fecha límite/atraso. Estudiantes pueden
guardar borrador, adjuntar PDF/DOCX/ZIP hasta 50 MB, confirmar el envío y
consultar el comprobante persistido. La descarga pasa por una ruta autenticada
y no publica una URL directa del almacenamiento.

La migración convierte `EntregaTarea.estudiante` desde `auth.User` a
`usuarios.Usuarios` mediante una coincidencia única por correo institucional;
si no puede asociar cada fila, aborta sin perder la relación antigua. Tareas
históricas quedan sin sección y ocultas hasta que un administrador las asocie
manualmente desde Django Admin. Hay que probar esta migración con respaldo
antes de aplicarla a un entorno con datos.

### 3.6 Funciones docentes: secciones y revisión

Archivos principales:

- `IngSoftwareLMS/src/pages/TeacherSectionsPage.jsx`
- `IngSoftwareLMS/src/pages/TeacherSectionTasksPage.jsx`
- `IngSoftwareLMS/src/pages/TeacherTaskFormPage.jsx`
- `IngSoftwareLMS/src/pages/TeacherReviewPage.jsx`

El docente autenticado solo consulta las secciones asignadas a su
`PerfilDocente`; puede crear y editar tareas de esas secciones, revisar
entregas enviadas, descargar archivos autorizados, marcar `EN_REVISION` y
reabrirlas. Las consultas de tareas y entregas quedan limitadas también en el
servidor. No se habilitó calificación ni edición/eliminación genérica de
entregas.

**Pendiente:** smoke tests con usuarios reales de prueba en staging y validar
que el almacenamiento configurado permite servir archivos mediante
`FileResponse` sin exponerlos públicamente.

### 3.7 Navegación móvil, accesibilidad y estados

Archivos principales:

- `IngSoftwareLMS/src/components/layout/AppShell.jsx`
- `IngSoftwareLMS/src/components/ui/Modal.jsx`
- `IngSoftwareLMS/src/pages/ModulePage.jsx`

Mejoras realizadas:

- la navegación móvil se abre con el botón accesible y se cierra al navegar,
  con Escape o al activar el área exterior;
- al abrir el menú, el foco pasa al primer enlace, se limita al menú con Tab y
  Shift+Tab, y vuelve al botón al cerrar;
- se bloquea el desplazamiento del documento y se marca el contenido de fondo
  como inerte mientras el menú móvil está abierto;
- el menú cerrado en móvil se oculta del árbol accesible y no recibe foco;
- el diálogo nativo se limita a `90dvh` y permite desplazar su contenido;
- las rutas no habilitadas explican el bloqueo en lugar de simular un módulo
  funcional.

**Pendiente:** pruebas manuales y automatizadas de zoom al 200 %, lector de
pantalla, contraste, tamaños táctiles y anchos 320, 375, 768, 1024 y 1440 px.
Las mejoras implementadas no equivalen a una certificación WCAG.

### 3.8 Módulos bloqueados

Por defecto, la navegación incluye los módulos comunes funcionales y oculta
los que dependen de capacidades o permisos todavía no seguros. El acceso
directo a la ruta muestra el motivo del bloqueo. La variable
`VITE_ENABLE_UNAVAILABLE_MODULES=true` permite mostrar enlaces de esos
módulos para pruebas de UX, pero **no** habilita el acceso backend ni debe
usarse para eludir permisos.

El motivo de cada bloqueo está centralizado en
`IngSoftwareLMS/src/features/modules/moduleRegistry.js`.

## 4. Estado por fases del plan

| Fase | Estado | Detalle |
|---|---|---|
| 0. Contrato | Parcial / bloqueada para producción | Se actualizó `docs/API_CONTRACT.md`; backend base versionado en `TEST_frontend` (`7a45ec5`). Falta registrar el SHA final, aprobación del contrato y smoke test contra staging. |
| 1. Fundamentos UI/API | Parcial | Cliente, refresh, errores, cancelación mediante `AbortSignal` en las consultas de notificaciones y paginación existente. No hay patrones completos de formularios/mutaciones para cada dominio ni suite de contratos frontend. |
| 2. Sesión/perfil/navegación | Parcial | Login y refresh existentes; se revalida `me/` tras refresh; perfil read-only y menú por disponibilidad. Faltan logout/revocación server-side, perfil completo y edición autorizada. |
| 3. Cursos | Parcial | Inscripciones paginadas y filtrado limitado a la página. Detalle agregado del curso no se habilita por falta de aislamiento/contrato; perfil ausente puede exponer inscripciones globales. |
| 4. Tareas/entregas | Implementada localmente | `academico.Tarea` canónica, tareas por sección, FK de entrega alineada con `Usuarios`, filtros de inscripción, plazo, borrador/envío definitivo, comprobante persistido y descarga protegida. Falta validar/aplicar migración con datos y smoke test de staging. |
| 5. Notificaciones | Implementada sobre el contrato local | REST, filtros, lectura, contador y WebSocket con reconexión. Falta confirmar contrato desplegado y resolver el token de WebSocket en query antes de producción. |
| 6. Docentes | Parcial | Secciones/tareas/entregas y acciones de revisión se limitan a asignaciones del docente. Anuncios, materiales y foros siguen bloqueados; falta E2E/staging. |
| 7. Administración | Bloqueada | Los endpoints CRUD de usuarios/catálogos/matrículas solo exigen autenticación; auditoría no tiene endpoint. No se habilita UI administrativa. |
| 8. Mensajes/calendario/foros | Bloqueada parcialmente | Hay rutas locales de foros y mensajes, pero aislamiento y permisos no son suficientes. Mensajería carece de listado/creación de conversaciones y calendario no está publicado. |
| 9. Responsive/accesibilidad | Parcial | Menú móvil, foco, escape, overlays y diálogo mejorados. Faltan pruebas de pantalla, auditoría completa y validación de lector de pantalla/contraste. |
| 10. Pruebas/despliegue | Parcial | `npm run lint`, `npm run build`, `manage.py check`, verificación de migraciones y 7 pruebas focalizadas Django pasan. No hubo E2E, smoke tests contra staging ni validación visual/accesible. |

## 5. Inventario de contratos locales y limitaciones

El prefijo de las rutas siguientes es `/api/v1/`, salvo el WebSocket
`/ws/notificaciones/`. El código local es referencia de desarrollo, no prueba
de despliegue.

### 5.1 Usuarios y sesión

| Ruta | Métodos locales | Uso previsto | Limitación que impide completar la función |
|---|---|---|---|
| `usuarios/login/` | `POST` | Login con `correo_institucional` y `password` | La respuesta permite diferenciar una cuenta inactiva; backend debe usar mensajes genéricos y rate limiting. |
| `usuarios/me/` | `GET` | Usuario actual y rol del servidor | No incluye el perfil estudiante/docente requerido por varias pantallas. |
| `usuarios/refresh/` | `POST` | Renovar tokens | El refresh se envía en el cuerpo y se almacena en `sessionStorage`; no hay cookie HttpOnly. |
| `usuarios/read/` | `GET` | Listar usuarios | Sin paginación ni permiso administrativo explícito; no usar para administración frontend. |
| `usuarios/create/` | `POST` | Crear usuario | Sin permiso administrativo explícito. |
| `usuarios/update/{id}/` | `PUT` | Actualizar usuario | No valida que quien llama sea administrador ni que pueda editar ese usuario. |
| `usuarios/student-profile/` | `POST` | Crear perfil estudiante | No ofrece lectura del perfil actual; permiso/rol reportado como `rol.id == 1` debe verificarse. |
| `usuarios/teacher-profile/` | `POST` | Crear perfil docente | No ofrece lectura del perfil actual; permiso/rol reportado como `rol.id == 1` debe verificarse. |
| `usuarios/logout/` | No existe | Revocar sesión | El cliente solo limpia la sesión local. |

### 5.2 Académico y cursos

Las rutas de catálogo registradas incluyen carreras, departamentos, períodos,
estados de inscripción, asignaturas, secciones, secciones-docentes e
inscripciones. Las rutas de carreras/asignaturas/períodos/estados e
inscripciones aún requieren revisión de permisos. Secciones y asignaciones
docentes ahora filtran lecturas por matrícula/asignación y limitan escrituras
a administrador.

`GET academico/inscripciones/` devuelve una colección DRF paginada, usualmente
con `count`, `next`, `previous` y `results`. El estudiante se limita por
`perfil_estudiante` si esa relación existe. El serializer de inscripción
incluye datos de sección, asignatura/período, estudiante como texto, estado y
fecha de creación; no devuelve avance, docente ni próxima tarea. No hay
`academico/cursos/` ni filtro publicado `?estudiante=`.

Las vistas de detalle de sección y otras colecciones no bastan para construir
un detalle de curso seguro: falta una consulta agregada que compruebe la
inscripción y filtre tareas, anuncios, foros y materiales por esa sección y
por el usuario.

### 5.3 Tareas y entregas

`academico.Tarea` es el modelo acordado para esta integración; el recurso
separado `evaluaciones.Tarea` permanece fuera de alcance. Las tareas API
requieren sección y se limitan a estudiante inscrito/docente asignado. El
viewset de entregas limita filas al propietario estudiante o docente de la
sección; las acciones de revisión validan asignación. `mis-pendientes` ahora
filtra por sección, plazo y envío definitivo, y paginación/archivo/comprobante
tienen rutas explícitas.

La migración `0004` requiere verificar las filas antiguas de entregas: deben
coincidir con exactamente un `Usuarios.correo_institucional`. Si faltan
coincidencias, no aplicar el esquema sin reconciliar esas filas; el proceso
falla antes de retirar la FK vieja. Las tareas existentes sin sección quedan
ocultas hasta asignarles una sección desde Django Admin. No hay calificaciones
ni historial de auditoría aprobado; no se exponen en la UI.

### 5.4 Notificaciones

El código local publica:

- `GET notificaciones/`: página de notificaciones del destinatario, con
  filtros `leida` y `tipo`;
- `GET notificaciones/tipos/`;
- `GET notificaciones/no-leidas/contador/`;
- `POST notificaciones/{id}/leer/`;
- `POST notificaciones/leer-todas/`, respuesta `204`;
- WebSocket `/ws/notificaciones/`, autenticación local con token de query,
  evento `notification`, ping/pong y validación de origen en ASGI.

La lista REST filtra por el usuario autenticado y las acciones de lectura
comprueban destinatario. Aún hay que confirmar estas rutas contra staging y
evitar registrar el token WebSocket en infraestructura de producción.

### 5.5 Comunicación y archivos

El código local registra viewsets bajo `comunicacion/` para anuncios, foros,
temas, mensajes de foro y mensajes directos.

- Mensajes directos se consultan dentro de conversaciones donde participa el
  usuario, pero no existe endpoint para listar o crear conversaciones.
- Foros, temas y mensajes requieren autenticación, pero no garantizan lectura
  aislada por sección y sus acciones no definen una política completa de
  moderación/propiedad.
- Los anuncios separan recursos de comunicación y académicos; debe decidirse
  cuál es el recurso oficial y cómo se asocia a una sección.
- `archivos` no publica API de almacenamiento, subida firmada ni descarga
  autorizada.

### 5.6 APIs ausentes

No hay un contrato local completo para:

- calendario agregado;
- calificaciones visibles para estudiantes;
- perfil actual estudiante/docente y su edición autorizada;
- catálogo de conversaciones, participantes y creación de conversaciones;
- materiales de curso y descarga autorizada;
- eventos de auditoría con filtros/permisos/retención;

## 6. Trabajo pendiente: tareas ejecutables

### Prioridad 0 — Congelar y aprobar backend

1. El backend base está versionado en `TEST_frontend` (`7a45ec5`); registrar el
   SHA final que resulte de estos cambios.
2. Registrar el SHA/version del backend que se ejecuta en staging/producción.
3. Comparar `config/urls.py`, `apps/*/urls.py`, vistas, serializers, modelos,
   autenticación, permisos y settings del WebSocket con el contrato de
   `docs/API_CONTRACT.md`.
4. Ejecutar smoke tests contra staging para login, `me`, refresh, inscripciones
   y notificaciones REST/WebSocket.
5. Corregir el contrato documentado si el backend desplegado difiere del árbol
   local. No configurar rutas frontend contra una versión no aprobada.

**Criterio de aceptación:** commit/version confirmado, contrato revisado por
backend/frontend y respuestas de staging registradas sin secretos.

### Prioridad 1 — Arreglar autorización y aislamiento de datos

Se implementaron permisos de servidor para el flujo de tareas y entregas:

- estudiante únicamente sobre tareas de secciones inscritas y sus entregas;
- docente únicamente sobre secciones asignadas, tareas y entregas de esas
  secciones;
- descargas de archivos y comprobantes limitadas al propietario/docente
  autorizado.

Siguen pendientes los permisos de servidor para:

- administrador en altas/cambios de usuarios, perfiles, catálogos y matrículas;
- estudiante únicamente sobre sus inscripciones (el endpoint actual conserva
  un riesgo para usuarios sin perfil);
- lectura y escritura de anuncios, foros, temas y respuestas según sección y
  propiedad;
- acceso a mensajes solo para participantes de la conversación.

Probar cada permiso con al menos: usuario propietario, otro usuario del mismo
rol, usuario de rol distinto y usuario no autenticado. La UI y los guards
frontend no cuentan como prueba de autorización.

**Criterio de aceptación:** los casos no autorizados responden `403` o `404`
sin filtrar contenido; las pruebas backend cubren lectura, creación,
actualización, borrado y acciones especiales.

### Prioridad 2 — Unificar tareas/entregas y corregir pendientes

1. `academico.Tarea` queda acordado como canónico; la relación `seccion` y la
   migración de estudiante a `usuarios.Usuarios` están implementadas.
2. `mis-pendientes` ahora:
   - usar las secciones reales inscritas por el usuario autenticado;
   - filtrar tareas por esas secciones;
   - excluir envíos definitivos de ese usuario;
   - incluye vencidas solo si se permiten atrasos y pagina resultados.
3. FK de estudiante usa `Usuarios`; asignación docente usa
   `PerfilDocente.usuario`.
4. CRUD de tareas restringido al docente asignado a la sección.
5. Flujo de entrega implementado con borrador, multipart, límite de archivo,
   confirmación única, comprobante, descarga autorizada y reapertura.
6. Falta aplicar y validar la migración con un respaldo, asignar sección a
   tareas históricas y confirmar contrato/almacenamiento en staging.
7. Implementar calificación solo después de aprobar escala, permisos,
   historial/auditoría y contrato.

**Criterio local cumplido:** pruebas para estudiante inscrito/no inscrito,
docente asignado/no asignado, plazos, borrador, envío, comprobante, descarga,
reapertura y archivo inválido. Falta verificación de migración sobre una copia
de datos representativa.

### Prioridad 3 — Completar perfil y sesión

- Agregar `GET` de perfil estudiante/docente actual limitado al usuario
  autenticado, o incluir de forma segura esos perfiles en `usuarios/me/`.
- Definir campos editables y autorización por propiedad antes de habilitar
  formularios de edición.
- Normalizar respuestas de login para no revelar cuentas inactivas y agregar
  limitación de intentos en backend.
- Diseñar logout/revocación y cookie HttpOnly para refresh, con atributos
  Secure/SameSite, protección CSRF, rotación y CORS.
- Mantener el RUT enmascarado en UI y excluir tokens/datos personales de logs.

**Criterio de aceptación:** pruebas de sesión renovada, expiración, cuenta
desactivada, logout en servidor, CSRF/CORS y acceso cruzado a perfiles.

### Prioridad 4 — Completar dominios docente/administración/comunicación

Una vez arreglados permisos y contratos restantes:

- **Docente (parcial):** listar secciones asignadas; crear/editar tareas;
  listar entregas paginadas; revisar/reabrir. Falta crear anuncios asociados a
  sección;
  cargar/descargar material; moderar foros con reglas claras.
- **Administración:** usuarios y perfiles, catálogos académicos y matrículas
  paginadas/buscables; manejar conflictos de correo/RUT y restricciones de
  relaciones; no exponer hashes/credenciales ni RUT completo sin aprobación.
- **Mensajería:** endpoints de conversaciones, participantes, historial
  paginado, creación y envío; autorización por participación; protección
  contra envío duplicado.
- **Foros:** filtros por sección, paginación y permisos de lectura/escritura,
  edición, borrado, cierre y moderación.
- **Calendario:** contrato de eventos agregado que defina ID, tipo, título,
  inicio/fin, zona horaria, curso/sección, permisos, filtros y paginación.
- **Auditoría:** publicar eventos, filtros, autorización y política de
  retención; no usar logs del navegador como auditoría.

### Prioridad 5 — Activar módulo por módulo en el frontend

Para cada endpoint aprobado:

1. Registrar método, URL completa, auth, rol/propiedad, filtros, paginación,
   entrada, salida, errores, tamaño de archivo e idempotencia.
2. Implementar transporte por dominio, hooks de consulta/mutación, validación
   del formulario y presentación, manteniendo el estado remoto en TanStack
   Query.
3. Proveer carga inicial/actualización, estado vacío, error visible y reintento
   adecuado.
4. Asociar errores DRF con campos, impedir doble envío y pedir confirmación
   para acciones destructivas/definitivas.
5. Mantener el módulo oculto hasta que pase las pruebas backend de permiso y
   propiedad.
6. Añadir los casos focalizados de éxito y fallo; después ejecutar flujos E2E
   por rol.

## 7. Matriz de módulos del frontend

| Módulo/ruta | Estado actual | Qué falta para habilitarlo |
|---|---|---|
| `/login` | Operativo con credenciales y rol de servidor | Rate limiting y mensaje genérico en backend; logout/revocación segura. |
| `/dashboard` | Lista inscripciones paginadas y limita búsqueda a página | Corregir el queryset para que usuarios sin perfil estudiante no vean inscripciones globales; validar staging. |
| `/profile` | Solo lectura, RUT enmascarado | Perfil estudiante/docente actual y contrato de edición seguro. |
| `/notifications` | REST, contador, filtros, lectura y WebSocket | Confirmar contrato desplegado; eliminar/mitigar token en query y probar reconexión en staging. |
| `/courses/:courseId` | Bloqueado con explicación | Endpoint agregado que compruebe inscripción y filtre cada recurso por sección/usuario. |
| `/student/pending` | Implementado localmente | Filtrado de matrículas/plazos/entregas; falta ejecutar E2E y probar con backend desplegado. |
| `/tasks/:taskId` | Implementado localmente | Detalle, borrador y envío definitivo autorizados; falta E2E y validar la migración en una copia de datos. |
| `/receipts/:receiptId` | Implementado localmente | Comprobante persistido y descarga autenticada; falta validar almacenamiento/headers en staging. |
| `/student/grades` | Bloqueado | Endpoint y contrato de calificaciones autorizado. |
| `/messages` | Bloqueado | Conversaciones/participantes/historial, permisos, paginación y UX de reintento. |
| `/teacher/sections` | Implementado localmente | Solo secciones asignadas; falta E2E y verificación de staging. |
| `/teacher/tasks/*` | Implementado localmente | CRUD restringido por docente/sección; falta E2E y validar datos históricos. |
| `/teacher/review` | Implementado localmente | Bandeja y acciones autorizadas de revisión/reapertura; calificación sigue fuera de alcance. |
| `/teacher/announcements` | Bloqueado | Recurso canónico, vínculo de sección y permisos de lectura/edición. |
| `/teacher/material` | Bloqueado | Almacenamiento, límites, metadatos y descarga autorizada. |
| `/teacher/forums` | Bloqueado | Aislamiento por sección y permisos de moderación. |
| `/admin/users` | Bloqueado | Permiso administrativo backend, paginación, búsqueda y protección de RUT/datos. |
| `/admin/academic` | Bloqueado | Permisos admin, CRUD validado y formularios de relaciones. |
| `/admin/enrollments` | Bloqueado | Permisos admin, filtros server-side y relaciones verificadas. |
| `/admin/audit` | Bloqueado | API de eventos de auditoría con filtro, permiso y retención. |
| `/calendar` | Bloqueado | Endpoint agregado y contrato de zona horaria/eventos. |

## 8. Pruebas y verificación todavía necesarias

### 8.1 Estado de ejecución local

- `npm run lint` pasó desde `IngSoftwareLMS/`.
- `npm run build` pasó desde `IngSoftwareLMS/` con Vite 8.3.4.
- `backend/venv/Scripts/python.exe manage.py check` pasó.
- `makemigrations --check --dry-run` no detectó migraciones adicionales.
- `manage.py test apps.academico.tests --verbosity 1` pasó (7 pruebas).
- No se ejecutaron E2E, smoke tests contra staging ni prueba visual con navegador.

### 8.2 Verificaciones pendientes

1. Probar la migración `0004` sobre una copia de datos: correspondencia única
   de correos, tareas históricas sin sección y archivos almacenados.
2. Ejecutar las suites Django de usuarios, evaluaciones, comunicación y
   notificaciones, además de las 7 pruebas de `apps.academico.tests`.
3. Levantar backend y frontend de desarrollo; verificar login/refresh,
   dashboard, tareas, entregas, comprobantes y notificaciones REST/WebSocket.
4. Probar permisos cruzados y flujos E2E de estudiante/docente con usuarios
   de prueba autorizados antes del despliegue.
5. Validar anchos 320, 375, 768, 1024 y 1440 px y zoom al 200 %; comprobar
   ausencia de scroll horizontal, teclado, foco, Escape y lector de pantalla.
6. Repetir smoke tests en staging con HTTPS/WSS, CORS y headers de seguridad
   configurados.

## 9. Checklist de seguridad y privacidad para producción

- [ ] Confirmar el SHA final versionado y compararlo con la versión del backend
      desplegado.
- [ ] Probar la migración `0004` con respaldo, reconciliar entregas legadas y
      asignar sección a tareas históricas.
- [ ] Probar autorización en servidor; no considerar los guards React como
      control de acceso.
- [ ] Asegurar aislamiento por usuario, perfil, sección, participación y
      propiedad en todas las consultas y mutaciones.
- [ ] Normalizar login y habilitar rate limiting de servidor.
- [ ] Definir logout/revocación y refresh HttpOnly, Secure, SameSite, CSRF,
      rotación y CORS.
- [ ] No registrar access/refresh tokens, datos de perfil ni contenido privado
      en logs.
- [ ] Cambiar la autenticación WebSocket para no transportar el token en el
      query string; hasta entonces exigir WSS y excluirlo de todos los logs.
- [ ] Validar extensiones, tipo real, tamaño y permisos de archivos en el
      servidor; usar almacenamiento/descargas autorizados.
- [ ] Evitar mostrar RUT completo y no exponer `password_hash` ni secretos.
- [ ] Configurar CSP, orígenes permitidos, HTTPS/WSS y headers de seguridad.
- [ ] Confirmar que errores 4xx/5xx no filtren excepciones, SQL ni detalles
      internos.
- [ ] Ejecutar pruebas de regresión de rol/propiedad y revisión visual antes
      de publicación.

## 10. Definición de terminado

No marcar el LMS como 100 % funcional hasta que:

1. el backend desplegado y el contrato estén versionados y aprobados;
2. todo módulo visible consuma un endpoint confirmado;
3. cada endpoint aplique y tenga pruebas de permisos de rol/propiedad;
4. los bloqueos descritos en las secciones 6 y 7 estén resueltos o permanezcan
   explícitamente deshabilitados;
5. los flujos críticos de cada rol pasen pruebas backend, frontend y E2E;
6. `npm run lint`, `npm run build` y las pruebas acordadas pasen en CI;
7. las pruebas responsive y accesibles cubran móvil, escritorio, zoom y
   teclado;
8. no haya datos ficticios ni datos personales innecesarios;
9. staging confirme HTTPS/WSS, CORS, sesión, archivos y permisos;
10. la documentación refleje exactamente la versión desplegada.
