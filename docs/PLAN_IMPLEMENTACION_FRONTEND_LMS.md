# Plan detallado de implementación del frontend LMS

## 1. Propósito

Definir un plan ejecutable para completar el frontend del Campus Virtual LMS,
integrando las capacidades que existen en el backend, identificando los
contratos que deben corregirse o ampliarse y estableciendo criterios de calidad
funcional, responsive, accesibilidad y seguridad.

El objetivo de “100 % funcional” se entiende como:

1. Implementar todos los flujos que el backend soporte de forma estable y con un
   contrato confirmado.
2. No simular ni inventar datos cuando falten endpoints.
3. Registrar como bloqueos explícitos las funciones que necesitan cambios en
   backend; no marcarlas como terminadas hasta que exista contrato, autorización
   y persistencia verificables.

## 2. Alcance y supuestos que deben confirmarse

- El frontend está en `IngSoftwareLMS/` y usa React, Vite, React Router,
  TanStack Query, Axios y Tailwind.
- Existe una sesión JWT con login, consulta de usuario actual, renovación y
  limpieza local de sesión.
- El dashboard consulta inscripciones académicas paginadas.
- Las rutas de módulos están declaradas, pero la mayoría muestra una pantalla
  placeholder.
- La carpeta `backend/` del espacio de trabajo no está rastreada por Git en el
  estado revisado. Antes de desarrollar integraciones, el equipo debe confirmar
  que sus archivos corresponden al backend desplegado y acordar el commit o
  versión del contrato que será la fuente de verdad.
- La documentación actual del contrato no coincide plenamente con las rutas
  presentes en el código local. Debe actualizarse cuando el backend confirme
  esas rutas.

Referencias actuales:

- Contrato documentado: [`API_CONTRACT.md`](./API_CONTRACT.md).
- Frontend: `IngSoftwareLMS/src/`.
- Rutas frontend: `IngSoftwareLMS/src/features/modules/moduleRegistry.js`.
- Cliente HTTP: `IngSoftwareLMS/src/services/api.js`.
- Dashboard y consulta académica: `IngSoftwareLMS/src/components/Dashboard.jsx`
  y `IngSoftwareLMS/src/features/academico/useCursos.js`.

## 3. Estado inicial y brecha

### Implementado parcialmente

- Login y obtención del usuario autenticado.
- Renovación de access token mediante refresh token.
- Guards de rutas por autenticación y rol.
- Shell responsive con navegación móvil.
- Dashboard de estudiante con lista paginada de inscripciones, búsqueda local,
  ordenamiento, estados de carga/error y estado vacío.
- Componentes UI reutilizables para botones, tarjetas, diálogos, carga de
  archivos, texto enriquecido, esqueletos y estados.

### Pendiente en frontend

- Vistas funcionales para la mayoría de las rutas de estudiante, docente y
  administrador.
- Integración de los endpoints académicos y de entregas que aparecen en el
  backend local.
- UI de notificaciones, foros, mensajes, administración y edición.
- Flujos de carga/descarga vinculados a los endpoints de archivos disponibles.
- Pruebas de integración de contratos y pruebas visuales/responsive.

### Pendiente o por confirmar en backend

- Permisos por rol, propiedad y sección en los endpoints CRUD.
- Relación de tareas con sección/curso y fuente de verdad entre los modelos de
  `academico` y `evaluaciones`.
- Corrección de la consulta `mis-pendientes` y prueba de sus filtros.
- Compatibilidad de las relaciones de estudiante/docente con el modelo
  personalizado `Usuarios`.
- Consulta de perfil de estudiante/docente actual.
- Endpoints completos de calendario, conversaciones, calificaciones,
  auditoría y materiales de curso.
- Contrato de cierre/revocación de sesión y almacenamiento seguro del refresh.

## 4. Principios de implementación

1. **Contrato primero:** documentar método, URL, parámetros, cuerpo,
   respuesta, permisos, paginación y errores antes de conectar cada vista.
2. **El servidor es la autoridad:** el frontend puede ocultar acciones por rol,
   pero la autorización debe estar implementada y probada en backend.
3. **Sin datos ficticios:** no completar avance, docente, fechas o estados con
   datos inventados; mostrar “No disponible” o no mostrar el bloque.
4. **Errores visibles y accionables:** distinguir validación, permisos, sesión
   expirada, red, conflicto y errores del servidor; ofrecer reintento cuando
   tenga sentido.
5. **Una fuente de verdad:** mantener estado remoto en TanStack Query; evitar
   duplicar en Zustand o estado local datos que vienen de la API.
6. **Cambios pequeños por módulo:** cada módulo debe poder probarse y revisarse
   sin activar rutas incompletas.
7. **Mobile-first:** los flujos deben funcionar con teclado y pantalla táctil,
   no solo encogerse desde un diseño de escritorio.
8. **Privacidad por defecto:** minimizar la persistencia de datos personales y
   no mostrar RUT completo salvo necesidad aprobada.

## 5. Fases y dependencias

### Fase 0 — Congelar y validar el contrato

**Objetivo:** evitar construir sobre rutas que no estén desplegadas o cuya
respuesta no sea fiable.

#### Tareas

- Confirmar con backend el commit/versión desplegada y comparar:
  - `config/urls.py`
  - `apps/*/urls.py`
  - vistas y serializers asociados
  - modelos y relaciones de autenticación
- Actualizar `docs/API_CONTRACT.md` para reflejar únicamente rutas verificadas.
- Para cada endpoint registrar:
  - método y ruta con prefijo;
  - autenticación requerida;
  - roles y propiedad permitidos;
  - paginación y filtros;
  - campos obligatorios/opcionales y tipos;
  - respuesta exitosa;
  - errores y códigos HTTP;
  - soporte para `multipart/form-data`;
  - condiciones de concurrencia, idempotencia y límites de archivo.
- Ejecutar solicitudes de humo contra un entorno de prueba para confirmar
  comportamiento real, no solo el enrutamiento.
- Resolver la fuente de verdad de tareas:
  - `academico/tareas/` y modelo `academico.Tarea`;
  - `evaluaciones/create/` y modelo `evaluaciones.Tarea`.
- Definir contratos pendientes como bloqueos, no crear pantallas que dependan
  de ellos como si existieran.

#### Criterio de salida

- Contrato versionado y aprobado por frontend/backend.
- Endpoints que fallan por errores de servidor corregidos o excluidos del
  alcance de la siguiente fase.
- No quedan dudas sobre cómo el JWT identifica a `Usuarios` respecto de
  `PerfilEstudiante`, `PerfilDocente` y el modelo estándar de Django.

### Fase 1 — Fundamentos de integración y UI

**Objetivo:** establecer patrones únicos para consultas, formularios,
validaciones, errores y estados visuales.

#### Tareas

- Revisar cliente Axios:
  - prefijo de API y configuración de producción;
  - encabezado Bearer;
  - refresh de una sola solicitud concurrente;
  - prevención de reintentos infinitos;
  - cancelación de solicitudes al desmontar/cambiar de ruta;
  - normalización de respuestas y errores.
- Crear o completar servicios por dominio:
  - `usuarios`
  - `academico`
  - `evaluaciones/entregas`
  - `comunicacion`
  - `notificaciones`
- Para cada recurso separar:
  - funciones de transporte (GET/POST/PATCH/DELETE);
  - hooks de consulta;
  - hooks de mutación;
  - validación de datos de formularios;
  - presentación.
- Definir manejo común de:
  - `{ count, next, previous, results }`;
  - respuestas envelopadas como `{ mensaje, datos }`;
  - respuestas directas de acciones;
  - errores de DRF por campo;
  - `401`, `403`, `404`, `409`, `413`, `429` y `5xx`.
- Implementar piezas UI necesarias:
  - página con título, acciones y breadcrumb;
  - barra de búsqueda/filtros;
  - paginación;
  - tabla adaptable/tarjetas móviles;
  - confirmación para eliminar o publicar;
  - estados de carga, vacío, error y éxito;
  - mensajes accesibles tipo toast/alert.
- Definir convención de formato de fechas y zona horaria institucional.
- Acordar estrategia de invalidación/refetch después de mutaciones.

#### Criterio de salida

- Una consulta paginada y una mutación con formulario implementadas como
  patrones de referencia.
- Errores de API traducidos de forma consistente y sin ocultar fallos.
- No hay lógica de autorización confiada exclusivamente al cliente.

### Fase 2 — Sesión, perfil y navegación común

**Rutas:** `/login`, `/profile`, navegación común.

#### Tareas

- Mantener login con correo institucional y contraseña.
- Verificar que después del login y del refresh se vuelva a consultar `me/` y
  que el rol se derive del usuario del servidor.
- Mostrar mensajes genéricos de credenciales inválidas; no revelar al usuario
   si una cuenta existe o está inactiva.
- Terminar la experiencia de sesión:
  - expiración mientras el usuario está activo;
  - retorno a la página de login;
  - retorno a la ruta original tras autenticarse;
  - estado de “sesión cerrada en este dispositivo” mientras no exista
    revocación en servidor.
- Diseñar perfil de solo lectura y edición únicamente con campos y permisos
  confirmados.
- No ofrecer edición de perfiles estudiante/docente hasta que exista lectura
  del perfil actual y reglas para actualización.
- Revisar navegación por rol y enlaces visibles; no mostrar rutas que solo
  terminan en placeholders.
- Revisar nombre, correo y cualquier dato personal en encabezados y tarjetas;
  enmascarar RUT donde se requiera mostrarlo.

#### Dependencia backend

- `GET usuarios/me/` debe representar el perfil necesario.
- `PUT usuarios/update/{id}/` requiere autorización de edición de ese usuario.
- Confirmar si habrá logout/revocación de refresh y cookie HttpOnly; mantener
  el comportamiento actual hasta que exista ese contrato.

### Fase 3 — Cursos y experiencia académica del estudiante

**Rutas:** `/dashboard`, `/courses/:courseId`.

#### Funciones

- Listar inscripciones del usuario autenticado.
- Manejar paginación de 20 elementos del servidor.
- Mantener búsqueda local claramente limitada a la página cargada; si se
  necesita búsqueda completa, solicitar filtros en backend.
- Mostrar asignatura, código, sección, período y estado de inscripción que
  efectivamente devuelva el contrato.
- Abrir el detalle del curso usando un identificador válido y mostrar:
  - descripción/datos del curso disponibles;
  - docente(s);
  - tareas;
  - anuncios;
  - foros;
  - materiales.
- Mostrar estado vacío cuando no hay inscripciones.
- No mostrar avance, próximo vencimiento o docente como dato real hasta contar
  con un endpoint/relación que los devuelva.
- Manejar una inscripción eliminada o inaccesible sin dejar una vista rota.

#### Dependencias backend

- Acordar endpoint de detalle agregado o contrato de composición de
  `inscripciones`, `secciones`, `secciones-docentes`, tareas y anuncios.
- Incorporar filtros por sección/usuario de forma autorizada en servidor.
- No mandar `estudiante` como filtro del cliente para decidir qué datos puede
  leer el usuario.

### Fase 4 — Tareas, entregas, pendientes y comprobantes del estudiante

**Rutas:** `/student/pending`, `/tasks/:taskId`, `/receipts/:receiptId`.

#### Lista de pendientes

- Consultar tareas asociadas a secciones en las que el estudiante está
  inscrito.
- Mostrar título, curso/sección, fecha límite, política de atraso y estado de
  entrega.
- Filtros: próximas, vencidas permitidas, enviadas y borradores, según el
  contrato.
- Ordenar por fecha límite y mostrar zona horaria.
- Ofrecer estado vacío y paginación si el endpoint la implementa.

#### Detalle y entrega

- Mostrar descripción e instrucciones como texto seguro.
- Mostrar fecha límite y política de entregas tardías.
- Permitir seleccionar archivo, validar en cliente tipo/tamaño como ayuda y
  dejar que servidor vuelva a validar.
- Cargar archivo con `multipart/form-data`.
- Mostrar archivo seleccionado, tamaño, progreso, error y posibilidad de
  cancelar cuando el transporte lo permita.
- Guardar/actualizar borrador.
- Confirmar envío con diálogo claro e indicar que la acción es definitiva.
- Evitar doble envío por doble clic; deshabilitar controles mientras se procesa.
- Actualizar listas/detalle mediante invalidación de consultas.
- Gestionar estados `BORRADOR`, `ENVIADO`, `EN_REVISION` y `REABIERTA` sin
  permitir acciones no admitidas por el servidor.

#### Comprobante

- Presentar únicamente los campos devueltos por confirmación o consulta:
  tarea, archivo, estudiante, estado, timestamp oficial y atraso.
- No fabricar RUT enmascarado, hash, tamaño ni identificadores que la respuesta
  no incluya.
- Permitir imprimir/descargar solo si el backend ofrece datos suficientes para
  un comprobante reproducible.

#### Bloqueos backend

- Corregir `mis-pendientes`: filtrar por inscripciones/secciones reales,
  excluir entregas definitivas y cubrir tareas dentro/fuera de plazo.
- Corregir la relación de `EntregaTarea.estudiante` con el usuario autenticado.
- Confirmar las rutas y métodos efectivos de `entregas-tareas`.
- Definir consulta de entrega/comprobante por tarea y usuario.
- Probar en servidor los límites de tamaño y extensiones admitidas.

### Fase 5 — Notificaciones

**Ruta:** `/notifications`; componente de contador en navegación.

#### REST

- Cargar lista paginada y filtros por `leida` y `tipo`.
- Mostrar título, mensaje, tipo, fecha, estado de lectura y navegación opcional
  según `datos`.
- Marcar una notificación como leída.
- Marcar todas como leídas.
- Mostrar y actualizar contador de no leídas.
- Manejar la respuesta `204` de “leer todas” sin intentar leer cuerpo JSON.

#### Tiempo real

- Conectar al WebSocket con el access token actual solo en el canal autorizado.
- Procesar eventos `notification`, deduplicar por ID y actualizar contador/lista.
- Implementar reconexión con espera incremental y límite razonable.
- Enviar ping si se adopta el mecanismo de keepalive del backend.
- Revalidar REST al reconectar o al volver a primer plano para recuperar eventos
  perdidos.
- Cerrar la conexión al cerrar sesión o cambiar de usuario.

#### Criterio de salida

- La lista REST funciona aunque WebSocket no esté disponible.
- Una notificación repetida no aparece duplicada.
- Errores de conexión no bloquean el resto del LMS.

### Fase 6 — Funciones docentes

**Rutas:** `/teacher/sections`, `/teacher/tasks/new`,
`/teacher/tasks/:taskId/edit`, `/teacher/review`,
`/teacher/announcements`, `/teacher/material`, `/teacher/forums`.

#### Secciones

- Listar secciones del docente autenticado.
- Mostrar curso, período y sección.
- Acceder a estudiantes, tareas, anuncios y foros de la sección.
- No cargar todas las secciones de la institución para filtrarlas solo en el
  navegador.

#### Creación/edición de tareas

- Formulario con campos que existan en el modelo elegido.
- Validar campos requeridos, fechas válidas y límites coherentes.
- Mostrar errores del serializer junto al campo correspondiente.
- Confirmar guardar/publicar y actualizar el detalle/listado.
- Soportar edición solo si existe endpoint GET detalle y PUT/PATCH autorizado.
- No mezclar los campos de los dos modelos de tarea hasta que backend unifique
  o documente su uso.

#### Bandeja de revisión

- Listar entregas por sección/tarea y paginar.
- Filtrar por estado y plazo, si el servidor lo soporta.
- Abrir archivo solo mediante URL/descarga autorizada.
- Marcar “en revisión” y reabrir cuando se permita.
- Mostrar datos de entrega y comentarios.
- Implementar calificación únicamente con endpoint, escala y permisos
  aprobados; no asumir que permitir `PATCH` equivale a un flujo de calificación
  seguro.

#### Anuncios, materiales y foros

- Crear/editar/eliminar anuncios con confirmación y validación.
- Asociar anuncios a una sección real; separar el recurso `Anuncio` de
  comunicación de `AnuncioAcademico` hasta definir cuál se usará.
- Listar y cargar materiales si existe almacenamiento/ruta autorizada.
- Crear foros/temas/respuestas, cerrar/moderar según permisos del backend.

#### Criterio de salida

- Cada acción docente está protegida y validada en backend.
- Una docente solo ve y modifica sus secciones y recursos autorizados.

### Fase 7 — Administración

**Rutas:** `/admin/users`, `/admin/academic`, `/admin/enrollments`,
`/admin/audit`.

#### Usuarios y perfiles

- Tabla paginada/buscable de usuarios.
- Crear usuario con validaciones de correo, RUT, rol y contraseña.
- Actualizar usuario con confirmación cuando se active/desactive una cuenta.
- Alta de perfil estudiante/docente con los catálogos requeridos.
- Prevenir exponer `password_hash` y minimizar RUT completo en pantalla.
- Manejar conflicto de correo/RUT duplicado.

#### Catálogos académicos

- CRUD de carreras, departamentos, períodos académicos, estados, asignaturas,
  secciones y asignación docente.
- Formularios dependientes: carrera para asignatura; asignatura/período para
  sección; sección/docente para asignación.
- Confirmar eliminación, mostrar restricciones por relaciones y no borrar
  datos silenciosamente.

#### Matrículas

- Listar inscripciones, crear, actualizar estado y eliminar según permisos.
- Mostrar relaciones reales y resolver filtros de estudiante/sección/estado.
- Evitar usar `estudiante` como texto libre para identificar personas.

#### Auditoría

- No construir hasta que backend publique eventos de auditoría consultables,
  filtros, permisos y política de retención.
- No considerar el log del navegador como auditoría administrativa.

### Fase 8 — Mensajería y calendario

#### Mensajería

- Necesita endpoints para listar conversaciones del usuario, participantes,
  historial paginado, crear conversación y enviar mensaje.
- Mostrar estados de carga, envío, fallo y reintento sin reenviar duplicados.
- Tratar el contenido descifrado como entrada no confiable al renderizarlo.
- Respetar límites de participantes y autorización de conversación.
- Si no hay endpoint de conversaciones, dejar el módulo bloqueado y explicar
  por qué; no inferir bandejas recorriendo mensajes globales.

#### Foros

- El backend local tiene colecciones de foros, temas y mensajes, además de
  acciones para listar temas/mensajes. Confirmar filtros y permisos de lectura,
  escritura, edición, borrado y moderación.
- Renderizar contenido como texto o sanitizar HTML si el contrato permite HTML.
- Paginar hilos/respuestas si el backend lo soporta; evitar cargar discusiones
  ilimitadas.

#### Calendario

- Requiere endpoint agregado o decisión formal de composición desde tareas,
  períodos y anuncios.
- Definir campos del evento: id, tipo, título, inicio/fin, zona horaria, curso,
  URL y permisos.
- Implementar vista mensual y agenda móvil; filtros por curso/tipo.
- No mostrar eventos construidos con fechas no confirmadas.

### Fase 9 — Responsividad, accesibilidad y pulido transversal

#### Diseño adaptable

- Probar, como mínimo, anchos de 320, 375, 768, 1024 y 1440 px, más zoom del
  navegador al 200 %.
- Mantener navegación móvil accesible; cerrar menú al navegar, con Escape y
  clic fuera; impedir que el foco se pierda detrás de overlays.
- Reemplazar tablas anchas por tarjetas o listas en pantallas pequeñas.
- En formularios:
  - una columna en móvil y columnas adicionales solo cuando haya espacio;
  - controles con etiquetas visibles;
  - botones de acción accesibles sin desplazamiento horizontal;
  - errores asociados a sus campos.
- En diálogos:
  - ancho máximo y altura limitada al viewport;
  - contenido desplazable;
  - foco inicial y retorno de foco;
  - acciones visibles en móvil.
- En listas:
  - filtros plegables o en una columna en móvil;
  - paginación con controles táctiles;
  - preservar búsqueda/filtro al navegar cuando corresponda.
- Verificar textos largos, nombres extensos, fechas y mensajes extensos sin
  desbordamiento.
- Respetar `prefers-reduced-motion` y evitar depender solo del color para
  indicar estado.

#### Accesibilidad

- Navegación completa por teclado y foco visible.
- Jerarquía correcta de encabezados y landmarks.
- Nombre accesible en botones de icono.
- Contraste suficiente en texto, botones y estados.
- Mensajes de carga/error anunciados con `aria-live` o patrones equivalentes.
- Gestión de foco en rutas, diálogos y errores de formulario.
- No usar placeholders como único rótulo.

#### Rendimiento

- Mantener carga diferida de rutas cuando convenga.
- Paginar colecciones grandes.
- Evitar solicitudes repetidas y deduplicar con TanStack Query.
- Cancelar consultas obsoletas de búsqueda.
- Revisar tamaño de bundles e imágenes.
- No abrir una conexión WebSocket por componente; mantener una conexión por
  sesión autenticada.

### Fase 10 — Pruebas, despliegue y verificación

#### Pruebas unitarias/componentes

- Parsers de respuestas y errores.
- Validación de formularios y fechas.
- Guards por rol.
- Estados de carga/vacío/error.
- Acciones de mutación e invalidación de caché.
- Dedupe/reconexión de notificaciones.

#### Pruebas de integración

- Login, refresh y expiración.
- Paginación real.
- Respuestas envolventes y directas.
- Errores de validación de DRF.
- Acceso denegado y recurso inexistente.
- Carga con `multipart/form-data`, cancelación y archivo inválido.
- Flujos de borrador, envío, revisión y reapertura.

#### Pruebas end-to-end

- Estudiante: login → curso → tarea → borrador → envío → comprobante.
- Docente: login → sección → tarea → entrega → revisión/calificación cuando
  esté soportado.
- Administrador: login → usuario/perfil → catálogo → matrícula.
- Notificación: REST → evento WebSocket → marcar leída.
- Navegación móvil de cada rol.

#### Pruebas responsive y accesibilidad

- Capturas en los anchos definidos en Fase 9.
- Verificación de scroll horizontal y foco.
- Pruebas manuales con teclado y lector de pantalla en flujos críticos.
- Contraste y etiquetas de formularios.

#### Despliegue

- Configurar `VITE_API_URL` por entorno.
- Alinear HTTPS/WSS, CORS y orígenes WebSocket.
- Confirmar headers de seguridad y política CSP para API/fuentes.
- No incluir secretos ni tokens en logs.
- Ejecutar build, lint y pruebas antes de publicar.
- Validar smoke tests en staging y observar errores de cliente/API tras el
  despliegue.

## 6. Matriz de endpoints que el frontend debe consumir

Las rutas siguientes deben confirmarse contra la versión desplegada antes de
usarlas. Los prefijos omitidos son `/api/v1/`.

| Dominio | Rutas vistas en el backend local | Uso previsto |
|---|---|---|
| Usuarios | `usuarios/login/`, `usuarios/me/`, `usuarios/refresh/`, `usuarios/read/`, `usuarios/create/`, `usuarios/update/{id}/`, `usuarios/student-profile/`, `usuarios/teacher-profile/` | Sesión, perfil y administración; confirmar permisos y datos de perfil. |
| Académico | `academico/carreras/`, `departamentos/`, `periodos-academicos/`, `estados-inscripcion/`, `asignaturas/`, `secciones/`, `secciones-docentes/`, `inscripciones/` y detalles por ID | Dashboard, catálogos, secciones y matrícula. Colecciones paginadas por defecto. |
| Tareas académicas | `academico/tareas/`, `academico/tareas/{id}/` | CRUD de tareas del modelo académico; confirmar vínculo a sección y modelo definitivo. |
| Entregas | `academico/entregas-tareas/`, `mis-pendientes`, `guardar-borrador`, `{id}/confirmar-envio`, `{id}/poner-en-revision`, `{id}/reabrir-entrega` | Pendientes, carga, envío y revisión; corregir permisos/relaciones antes de integrarlo. |
| Entregas académicas genéricas | `academico/entregas-academicas/`, `academico/entregas-academicas/{id}/` | Carga/consulta genérica; no equivale por sí sola a material de curso o entrega de tarea. |
| Anuncios académicos | `academico/anuncios-academicos/`, `academico/anuncios-academicos/{id}/` | CRUD de anuncios; definir relación con sección y diferencia respecto de comunicación. |
| Evaluaciones | `evaluaciones/create/` | Solo creación de un modelo distinto; no asumir listado ni detalle. |
| Comunicación | `comunicacion/anuncios/`, `foros/`, `temas/`, `mensajes-foro/`, `mensajes-directos/`; acciones anidadas de temas/mensajes | Anuncios, foros y mensajes; falta API completa de conversaciones. |
| Notificaciones | `notificaciones/`, `tipos/`, `no-leidas/contador/`, `{id}/leer/`, `leer-todas/` | Historial, filtros, contador y lectura. |
| Tiempo real | `/ws/notificaciones/?token=<access>` | Eventos de notificación; requiere WSS en producción y manejo de reconexión. |

Las rutas de catálogo genéricas usan operaciones CRUD. No significa que estén
autorizadas funcionalmente para todos los roles: frontend debe esperar a que el
backend establezca permisos de rol y propiedad.

## 7. Requisitos mínimos por pantalla

Toda pantalla funcional debe incluir, según corresponda:

- título claro, contexto y navegación de regreso;
- permiso/rol validado por backend;
- carga inicial y carga de actualización;
- estado vacío con acción siguiente cuando exista;
- error visible y acción de reintento apropiada;
- validación de formulario tanto en cliente como en servidor;
- prevención de doble envío;
- confirmación para acciones destructivas o definitivas;
- formato consistente de fechas, números y estados;
- soporte de paginación y filtros del servidor;
- variante responsive;
- foco, teclado y etiquetas accesibles;
- pruebas de éxito y fallo.

## 8. Riesgos y mitigaciones

| Riesgo | Efecto | Mitigación |
|---|---|---|
| Backend local distinto del desplegado | Llamadas fallidas o datos incompatibles | Congelar versión y probar contrato en staging. |
| Permisos débiles en CRUD | Exposición o modificación de datos | Corregir autorización en backend antes de liberar UI. |
| Modelos de tarea duplicados | Cursos y entregas no se pueden unir coherentemente | Definir modelo canónico y migración/contrato. |
| Relaciones `Usuarios`/perfiles/User | Errores de consulta o aislamiento incorrecto | Resolver tipos/FK y agregar pruebas de acceso por propietario. |
| Búsqueda solo del lado cliente | Resultados incompletos entre páginas | Agregar filtros del lado servidor o comunicar el alcance actual. |
| WebSocket desconectado | Historial en tiempo real incompleto | REST como fuente de verdad y sincronización al reconectar. |
| Contrato de archivo ambiguo | Fallos de subida o enlaces inseguros | Definir tamaño, extensiones, almacenamiento y descarga autorizada. |
| Rutas visibles sin implementación | Confusión de usuarios | Habilitar navegación por módulo al cumplir criterios de salida. |

## 9. Definition of Done global

El LMS se considera terminado cuando:

- Todas las rutas visibles llevan a una función implementada o a un mensaje
  explícito de capacidad aún no disponible.
- Cada funcionalidad incluida consume un endpoint confirmado y no usa datos
  ficticios.
- Todos los roles tienen navegación y permisos coherentes, respaldados en el
  servidor.
- Los flujos críticos de cada rol pasan pruebas end-to-end.
- Las colecciones grandes están paginadas y los filtros se comportan según el
  contrato.
- Las acciones destructivas/definitivas tienen confirmación y estados de
  procesamiento.
- Las pantallas funcionan en móvil, tablet y escritorio sin desbordamiento.
- Los flujos críticos son operables por teclado y anuncian errores/estados.
- `npm run lint`, `npm run build` y las pruebas acordadas pasan en CI.
- La documentación de API y del frontend refleja la versión realmente
  desplegada.
- Los bloqueos de backend restantes están registrados; no se presenta como
  “100 % funcional” una función que dependa de un endpoint inexistente o
  inseguro.

## 10. Orden recomendado de ejecución

1. Confirmar versión desplegada, contrato y permisos (Fase 0).
2. Corregir relaciones, filtros y rutas de tareas/entregas en backend.
3. Estabilizar cliente HTTP, errores, paginación y componentes comunes (Fase 1).
4. Cerrar sesión/perfil y navegación por rol (Fase 2).
5. Completar cursos y detalle académico del estudiante (Fase 3).
6. Completar pendientes, entregas y comprobantes (Fase 4).
7. Integrar notificaciones REST/WebSocket (Fase 5).
8. Construir flujos docentes sobre endpoints y permisos confirmados (Fase 6).
9. Construir administración; mantener auditoría bloqueada hasta tener API
   (Fase 7).
10. Completar conversaciones, foros y calendario a medida que sus contratos
    estén disponibles (Fase 8).
11. Ejecutar regresión responsive, accesibilidad, seguridad y rendimiento en
    todos los roles (Fases 9 y 10).
