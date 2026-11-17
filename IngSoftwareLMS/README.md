# Campus Virtual LMS — Frontend (`IngSoftwareLMS`)

Aplicación web Single Page Application (SPA) modular construida con **React 19**, **Vite 8**, **Tailwind CSS v4**, **TanStack React Query v5**, **Zustand v5** y **React Router v7**, conectada al backend **Django REST Framework + Channels** (`../backend`).

---

## Arquitectura Feature-Based

```text
src/
├── app/
│   ├── components/
│   │   ├── TopNavbar.jsx            # Barra superior con campana de notificaciones y perfil
│   │   ├── SidebarNav.jsx           # Navegación lateral adaptada dinámicamente al rol
│   │   └── AppFooter.jsx
│   ├── guards/
│   │   └── RouteGuards.jsx          # GuestRoute, ProtectedRoute y RoleGuard (RBAC)
│   └── layouts/
│       └── AppLayout.jsx            # Shell compartido y conexión WebSocket activa
├── contexts/
│   ├── AuthContext.jsx              # Sesión JWT, renovación silenciosa y sincronización /usuarios/me/
│   └── auth-context.js
├── features/
│   ├── auth/                        # Inicio de sesión institucional
│   ├── dashboard/                   # Mis Pendientes, Ficha Académica (Estudiante) y Learning Analytics (Docente/Admin)
│   ├── academico/                   # Cursos, Aula Virtual por Sección (/cursos/:seccionId) y Gestión Académica
│   ├── evaluaciones/                # Creación de tareas, rúbricas, entregas (borrador/definitiva) y calificación 1.0–7.0
│   ├── archivos/                    # Repositorio y carga Drag & Drop de Materiales de Estudio por sección
│   ├── comunicacion/                # Anuncios con adjuntos, foros/temas/hilos y mensajería privada cifrada
│   ├── notificaciones/              # Bandeja REST + store Zustand + cliente WebSocket idempotente en tiempo real
│   └── usuarios/                    # Perfil propio y administración de usuarios/perfiles (Admin)
├── services/
│   ├── api.js                       # Cliente Axios con interceptores Bearer y refresh token automático
│   ├── auth.js                      # Login y cierre de sesión
│   └── session.js                   # Persistencia de tokens y usuario
└── shared/
    ├── api/
    │   └── wsClient.js              # Conexión WebSocket con reconexión exponencial y ping/pong
    ├── components/ui/
    │   ├── FileDropzoneUploader.jsx # Componente Drag & Drop con barra de progreso y validación de 50 MB
    │   └── StateViews.jsx           # PageHeader, LoadingState, ErrorState, EmptyState y Modal
    └── lib/
        ├── pagination.js            # Normalizador de respuestas DRF ({ results } y { datos })
        ├── queryKeys.js             # Fábrica centralizada de claves de caché para React Query
        └── roles.js                 # Normalización de roles (Estudiante, Docente, Administrador)
```

---

## Funcionamiento de los Módulos y Reglas de Negocio

### 1. Autenticación y Control por Roles (`auth` + `RouteGuards`)
- Al iniciar sesión, el cliente almacena los tokens JWT (`access` y `refresh`) y consulta `/api/v1/usuarios/me/`.
- El interceptor de `services/api.js` renueva automáticamente el `access` token ante respuestas `401` usando `/api/v1/usuarios/refresh/`.
- `RoleGuard` restringe las vistas administrativas (`/gestion-academica`, `/gestion-usuarios`) y adapta los controles de creación/edición según el rol (`ESTUDIANTE`, `DOCENTE`, `ADMIN`).

### 2. Dashboard Personalizado (`dashboard`)
- **Vista Estudiante:**
  - **Mis Pendientes:** Lista cronológica priorizada por fecha de vencimiento que se depura automáticamente en cuanto el alumno envía su entrega o vence el plazo.
  - **Mi Ficha Académica:** Resumen de evaluaciones calificadas en escala `1.0` a `7.0`, estado conceptual (`Aprobado` / `Reprobado`) y cálculo automático del promedio general.
- **Vista Docente / Administrador:**
  - **Learning Analytics y Alertas:** Métricas en vivo de entregas recibidas, promedio del curso, conteo de aprobados ($\ge 4.0$) vs. estudiantes en riesgo ($< 4.0$), borradores activos y entregas tardías.

### 3. Aula Virtual por Sección (`academico` — `/cursos/:seccionId`)
Cada sección académica opera como un entorno aislado con cuatro pestañas:
- **Tareas de la Sección:** Creación, entrega y calificación de tareas pertenecientes exclusivamente a esa sección.
- **Materiales de Estudio:** Publicación *Drag & Drop* exclusiva para docentes/administradores asignada obligatoriamente a la sección.
- **Anuncios:** Tablón unidireccional con soporte para archivos adjuntos.
- **Foros de Debate:** Creación de foros temáticos, apertura de hilos de discusión y respuestas anidadas.

### 4. Evaluaciones, Entregas y Calificaciones (`evaluaciones`)
- **Creación de Tareas (`CreateTareaForm.jsx`):**
  - Bloquea la selección de fechas pasadas en el calendario (`min`) y valida en tiempo real que la fecha de término sea posterior a la de apertura antes de enviar.
  - La **fecha y hora de término es opcional**; si se omite, la tarea permanece abierta sin límite de cierre.
  - Permite asociar o crear una **Rúbrica dinámica** con criterios ponderados.
- **Flujo de Entrega (`TareasList.jsx` + `ConfirmSubmitDeliveryModal.jsx`):**
  - El estudiante puede subir archivos (sin permiso para eliminar archivos ya subidos) y guardar en estado **`BORRADOR`** todas las veces que necesite dentro del plazo.
  - Al confirmar el **Envío Definitivo**, pasa a estado **`ENVIADA`**, queda bloqueada contra cambios y emite un **Comprobante Digital (`#COMP-XXXXX`)** con marca de tiempo.
  - **Ventana Tardía de 1 Hora:** Si la tarea admite entregas tardías, habilita como **máximo 1 hora de espera** después de la fecha límite (`LATE_SUBMISSION_MAX_WAIT_MS = 3600000 ms`) y luego bloquea cualquier subida o confirmación.
- **Calificación y Retroalimentación (`EntregasPanel.jsx`):**
  - Al abrir o revisar una entrega enviada, cambia automáticamente a estado **`EN_REVISION`**.
  - Calificación en escala oficial chilena (**`1.0` a `7.0`** con un decimal) y etiqueta conceptual automática (**`APROBADO`** / **`REPROBADO`**).
  - Evaluación interactiva por **rúbrica** (calcula automáticamente la nota sugerida), **descuento automático del 1%** en entregas tardías con casilla de **exención docente**, adjunto de **archivos corregidos** y botón para **reabrir el plazo (`REABIERTA`)** a un estudiante específico.

### 5. Comunicación y Notificaciones en Tiempo Real (`comunicacion` + `notificaciones`)
- **Mensajería Privada Cifrada:** Conversaciones directas e historial de mensajes cifrados en el backend y descifrados de forma transparente para los participantes autorizados.
- **WebSockets (`wsClient.js` + `useRealtimeNotifications.js`):** Conexión autenticada a `/ws/notificaciones/?token=<access_token>` con deduplicación idempotente por `notification.id`, actualización instantánea del contador de no leídas y alertas visuales (`sonner`).

---

## Ejecución y Construcción Local

1. Instalar dependencias:
   ```sh
   cd IngSoftwareLMS
   npm install
   ```
2. Iniciar servidor de desarrollo:
   ```sh
   npm run dev
   ```
3. Compilar para producción:
   ```sh
   npm run build
   ```
4. Variables de entorno opcionales (`.env.local`):
   ```dotenv
   VITE_API_URL=http://localhost:8000/api/v1/
   VITE_WS_URL=ws://localhost:8000/ws/notificaciones/
   ```
