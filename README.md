# Campus Digital Integrado — LMS (Ingeniería de Software)

Plataforma web de **Entorno Virtual de Aprendizaje (EVA / LMS)** diseñada para centralizar la gestión académica, publicación de materiales de estudio, evaluación mediante tareas y rúbricas, comunicación institucional cifrada y notificaciones en tiempo real bajo control de acceso basado en roles (**Administrador**, **Docente** y **Estudiante**).

---

## Arquitectura y Stack Tecnológico

| Capa | Tecnologías Principales |
| :--- | :--- |
| **Frontend (`IngSoftwareLMS/`)** | React 19, Vite 8, Tailwind CSS v4, TanStack React Query v5, Zustand v5, React Router v7, Axios (Despliegue en **Cloudflare Pages**). |
| **Backend (`backend/`)** | Python 3.12, Django 6.1, Django REST Framework (DRF), SimpleJWT, Channels + Daphne (ASGI) (Despliegue en **Render**). |
| **Base de Datos y Caché** | **PostgreSQL** (gestionado en **Supabase**) y **Redis** para distribución de eventos WebSocket y colas en segundo plano. |
| **Almacenamiento Cloud** | **Cloudflare R2** (API compatible con S3 mediante `django-storages` y `boto3`) con límite de hasta 50 MB por archivo. |

---

## Estructura del Repositorio

- **[`backend/`](./backend/README.md)**: API REST versionada (`/api/v1/`), servidor WebSocket (`/ws/notificaciones/`), lógica de negocio, cifrado de mensajería y workers de notificaciones.
- **[`IngSoftwareLMS/`](./IngSoftwareLMS/README.md)**: Aplicación Single Page Application (SPA) con arquitectura modular *feature-based*, paneles diferenciados por rol y aula virtual por sección.

---

## Módulos y Reglas de Negocio Principales

1. **Autenticación JWT y Control de Acceso (RBAC):**
   - Inicio de sesión con correo institucional, validación de cuentas activas, renovación automática de tokens (`access` y `refresh`) y aislamiento estricto de datos privados entre estudiantes (cumplimiento Ley N° 19.628).
2. **Gestión Académica y Aula Virtual por Sección:**
   - Administración de carreras, departamentos, períodos académicos, asignaturas, secciones, asignación de docentes e inscripción de estudiantes.
   - Cada sección cuenta con su propia aula virtual aislada con pestañas de **Tareas**, **Materiales de Estudio**, **Anuncios** y **Foros de Debate**.
3. **Tareas, Entregas (Borrador / Definitiva) y Ventana Tardía de 1 Hora:**
   - Creación de tareas con validación de fechas (impidiendo fechas pasadas) y **fecha de término opcional**.
   - Guardado de avances en estado **Borrador** y confirmación de **Envío Definitivo** con emisión de **Comprobante Digital (`#COMP-XXXXX`)** con marca de tiempo.
   - Si una tarea permite entregas tardías, habilita un **máximo de 1 hora de espera** tras la fecha de término y luego **bloquea** automáticamente cualquier subida o envío.
   - Los estudiantes no pueden eliminar archivos ya subidos.
4. **Calificación Escala Chilena (1.0 a 7.0), Rúbricas y Retroalimentación:**
   - Evaluación en escala oficial chilena (**1.0 a 7.0** con un decimal) y estado conceptual automático (**APROBADO** $\ge 4.0$ / **REPROBADO** $< 4.0$).
   - **Descuento automático del 1%** en entregas realizadas dentro de la ventana tardía de 1 hora, con opción de **exención docente** justificada.
   - Asociación de **rúbricas dinámicas** con cálculo automático de nota sugerida, adjunto de archivos corregidos de retroalimentación, paso automático a estado **En Revisión** y **reapertura individual** de entregas (`REABIERTA`).
5. **Materiales de Estudio por Sección:**
   - Carga *Drag & Drop* exclusiva para docentes y administradores, asignada obligatoriamente a una sección académica y almacenada en Cloudflare R2.
6. **Comunicación y Notificaciones en Tiempo Real:**
   - Tablón de anuncios por sección, foros temáticos con hilos de respuesta y mensajería directa privada cifrada en base de datos con `Fernet` (AES/PBKDF2).
   - Notificaciones persistentes (patrón *Outbox*) y entrega en tiempo real mediante **WebSockets** al publicar anuncios, tareas visibles, calificaciones, temas/respuestas de foro y mensajes directos.
7. **Seguimiento Estudiantil y Learning Analytics:**
   - Panel **"Mis Pendientes"** priorizado por fecha de vencimiento (con depuración automática al entregar) y **"Mi Ficha Académica"** para estudiantes.
   - Tablero de **Learning Analytics** para docentes y administradores con métricas de entregas, promedio general y alertas tempranas de estudiantes en riesgo ($< 4.0$).

---

## Inicio Rápido en Desarrollo Local

### 1. Backend (`backend/`)

```sh
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

*(Consulta [`backend/README.md`](./backend/README.md) para el detalle de variables `.env`, worker de notificaciones y despliegue en Render).*

### 2. Frontend (`IngSoftwareLMS/`)

```sh
cd IngSoftwareLMS
npm install
npm run dev
```

*(Consulta [`IngSoftwareLMS/README.md`](./IngSoftwareLMS/README.md) para el detalle de rutas, componentes y configuración de entorno).*
