# Backend — Ingeniería de Software

Backend académico implementado en Django y Django REST Framework (DRF). Expone
una API REST versionada, autenticación JWT y un endpoint WebSocket para
notificaciones en tiempo real. PostgreSQL es la base de datos configurada; los
archivos se almacenan en un servicio compatible con S3, actualmente preparado
para Cloudflare R2.

## Contenido

- [Arquitectura](#arquitectura)
- [Aplicaciones](#aplicaciones)
- [Cómo se comunican las aplicaciones](#cómo-se-comunican-las-aplicaciones)
- [Rutas de la API](#rutas-de-la-api)
- [Autenticación y permisos](#autenticación-y-permisos)
- [Configuración local](#configuración-local)
- [Migraciones y pruebas](#migraciones-y-pruebas)
- [Despliegue en Render](#despliegue-en-render)
- [Estructura de directorios](#estructura-de-directorios)

## Arquitectura

```text
Frontend
   │
   ├── HTTPS / JSON ────────────────┐
   └── WSS / eventos en tiempo real ┤
                                    ▼
                         Django REST Framework
                    autenticación JWT y autorización
                                    │
                 ┌──────────────────┼───────────────────┐
                 ▼                  ▼                   ▼
             PostgreSQL       Apps Django         Cloudflare R2
                 │            usuarios,            archivos
                 │            academico,
                 │            evaluaciones,
                 │            comunicacion,
                 │            archivos y
                 │            notificaciones
                 │
                 └── Outbox y trabajos de notificación
                             │
                             ▼
                     Background Worker
                             │
                             ▼
                     Redis / Channels
                             │
                             ▼
                 Conexiones WebSocket activas
```

Cada aplicación Django agrupa modelos y lógica de un área funcional. Las claves
foráneas entre aplicaciones se declaran con etiquetas como
`'usuarios.Usuarios'` o `'academico.Seccion'`, de modo que las relaciones
persisten en la misma base de datos. `config/settings.py` registra las apps y
configura DRF, JWT, almacenamiento, CORS y Channels; `config/urls.py` reúne las
rutas HTTP y `config/asgi.py` distribuye tráfico HTTP y WebSocket.

Las respuestas REST usan paginación global de 20 elementos. Los endpoints
requieren JWT salvo que una vista indique expresamente lo contrario.

## Aplicaciones

### `usuarios`

Gestiona las cuentas de la plataforma, roles y perfiles de estudiante/docente.
El modelo `Usuarios` es el usuario que usa la autenticación JWT personalizada;
los perfiles se relacionan con entidades académicas como carrera y
departamento.

Rutas bajo `/api/v1/usuarios/`:

| Ruta | Función |
|---|---|
| `POST login/` | Valida correo y contraseña; responde con tokens de acceso/refresh y usuario. |
| `POST refresh/` | Renueva tokens a partir de un refresh token. |
| `GET me/` | Devuelve el perfil del usuario autenticado. |
| `GET read/` | Lista usuarios. |
| `POST create/` | Crea un usuario; el serializador almacena la contraseña con el hash de Django. |
| `PUT update/<id>/` | Actualiza parcialmente un usuario. |
| `POST student-profile/` | Crea el perfil de estudiante; la vista comprueba el rol con ID `1`. |
| `POST teacher-profile/` | Crea el perfil docente; la vista comprueba el rol con ID `1`. |

### `academico`

Modela la estructura académica y sus relaciones: carreras, departamentos,
períodos, asignaturas, secciones, docentes asignados, estados de inscripción e
inscripciones de estudiantes. Las vistas de catálogo e inscripción están bajo
`/api/v1/academico/`:

```text
carreras/                 carreras/<id>/
departamentos/            departamentos/<id>/
periodos-academicos/      periodos-academicos/<id>/
estados-inscripcion/      estados-inscripcion/<id>/
asignaturas/              asignaturas/<id>/
secciones/                secciones/<id>/
secciones-docentes/       secciones-docentes/<id>/
inscripciones/            inscripciones/<id>/
```

Los endpoints de inscripción limitan la lista de estudiantes a sus propias
inscripciones. Los modelos también incluyen `Tarea`, `EntregaTarea`,
`EntregaAcademica` y `AnuncioAcademico`; no todos corresponden a rutas REST
registradas en la configuración actual. En concreto, el `EntregaTareaViewSet`
de esta app no está incluido en `academico/urls.py`.

### `evaluaciones`

Contiene rúbricas, criterios y niveles, tareas, entregas calificadas, criterios
de evaluación, evaluaciones e intentos. Su ruta actualmente registrada es:

| Ruta | Función |
|---|---|
| `POST /api/v1/evaluaciones/create/` | Valida y crea una tarea del modelo `evaluaciones.Tarea`. |

El módulo incluye funciones para iniciar intentos y validaciones de fecha y
límite de intentos. No todas las clases de modelo tienen endpoints HTTP propios.

### `comunicacion`

Gestiona anuncios por sección, foros, temas, respuestas y mensajería directa.
Los ViewSets REST están registrados bajo `/api/v1/comunicacion/`:

| Recurso | Ruta base |
|---|---|
| Anuncios | `anuncios/` |
| Foros | `foros/` |
| Temas | `temas/` |
| Mensajes de foro | `mensajes-foro/` |
| Mensajes directos | `mensajes-directos/` |

Los mensajes directos se validan para que el remitente participe en la
conversación y se cifran antes de guardarse; el serializador los descifra para
su lectura. La app también relaciona anuncios con archivos.

### `archivos`

Define el catálogo `TipoArchivo` y los metadatos de `Archivo`, con referencia al
usuario que lo subió, formato, tamaño, nombre y URL pública. `settings.py`
configura `django-storages` con un backend S3 compatible y endpoint de
Cloudflare R2. La app no tiene actualmente rutas HTTP propias; otras apps
referencian sus modelos para asociar archivos a entregas y anuncios.

### `notificaciones`

Entrega notificaciones persistentes y eventos WebSocket. Está organizada por
responsabilidad:

- `models.py`: catálogo, historial y colas persistentes.
- `signals.py`: conecta anuncios, tareas visibles, calificaciones, foros y
  mensajes directos con el sistema de notificaciones.
- `services.py`: crea notificaciones y trabajos de expansión de audiencia.
- `fanout.py`: expande audiencias de sección en páginas de hasta 500 usuarios.
- `delivery.py`: reclama eventos de salida y los publica en Redis/Channels.
- `consumers.py`, `middleware.py` y `routing.py`: autentican y atienden las
  conexiones WebSocket.

Tablas principales:

| Tabla | Responsabilidad |
|---|---|
| `tipos_notificacion` | Catálogo de códigos activos, por ejemplo `comunicacion` y `evaluacion`. |
| `notificaciones` | Historial visible del destinatario y su estado de lectura. |
| `solicitudes_notificacion` | Trabajos para expandir notificaciones dirigidas a una sección. |
| `eventos_notificacion` | Outbox de eventos por destinatario con intentos y estado de entrega. |

La expansión de audiencias se procesa en segundo plano para evitar cargar a
todos los destinatarios durante una petición HTTP. Los workers reclaman trabajos
con bloqueos de base de datos, guardan cursores para continuar por lotes y
reintentan errores con espera exponencial. La entrega WebSocket es **al menos
una vez**; el cliente debe tratar el ID de la notificación como identificador
idempotente. Los eventos agotados quedan como fallidos para diagnóstico.

REST bajo `/api/v1/notificaciones/`:

| Método y ruta | Función |
|---|---|
| `GET /` | Lista las notificaciones propias; admite `?leida=true`, `?leida=false` y `?tipo=<codigo>`. |
| `GET /tipos/` | Lista tipos activos del catálogo. |
| `GET /no-leidas/contador/` | Devuelve el total de no leídas. |
| `POST /<id>/leer/` | Marca una notificación propia como leída. |
| `POST /leer-todas/` | Marca como leídas todas las notificaciones propias. |

WebSocket autenticado:

```text
wss://<host>/ws/notificaciones/?token=<access_token>
```

El servidor transmite eventos JSON con esta forma:

```json
{
  "type": "notification",
  "notification": {
    "id": 123,
    "titulo": "Nueva tarea",
    "tipo": "evaluacion"
  }
}
```

El frontend debe abrir el WebSocket con el token de acceso actual, atender el
evento `notification` y volver a consultar REST si necesita sincronizar el
historial. El cliente puede enviar `{"type":"ping"}` y recibe `{"type":"pong"}`.

## Cómo se comunican las aplicaciones

1. **Identidad:** las demás apps usan `usuarios.Usuarios`, `PerfilEstudiante` o
   `PerfilDocente` en sus relaciones. DRF autentica solicitudes mediante
   `UsuarioJWTAuthentication`, que busca la cuenta activa en `Usuarios`.
2. **Matrícula y cursos:** `academico` conecta carreras, asignaturas, secciones,
   docentes y estudiantes. `comunicacion` usa `Seccion` para limitar anuncios y
   foros; las solicitudes de notificación usan inscripciones para resolver la
   audiencia.
3. **Evaluación y entregas:** `evaluaciones` relaciona tareas con secciones,
   rúbricas, estudiantes y entregas. Al publicarse una tarea visible o asignarse
   una calificación, sus señales generan notificaciones.
4. **Archivos:** `evaluaciones` y `comunicacion` referencian `archivos.Archivo`;
   el almacenamiento físico se delega a la configuración S3/R2.
5. **Comunicación y notificaciones:** señales de `comunicacion` notifican a
   estudiantes inscritos sobre anuncios/temas y a participantes o autores sobre
   mensajes y respuestas. No se incluye el contenido cifrado de un mensaje
   directo dentro de la notificación.
6. **Tiempo real:** cada notificación y su evento outbox se guardan en la base
   de datos. Un worker publica el evento en el grupo Redis del usuario y cada
   instancia del backend con una conexión WebSocket a ese grupo puede
   transmitirlo al cliente.

> **Nota de mantenimiento:** el código actual contiene modelos con nombres
> similares en `academico` y `evaluaciones` (por ejemplo, tareas y entregas).
> Son modelos distintos, no una misma tabla compartida. Verifica qué modelo
> utiliza cada API antes de extender estas relaciones.

## Rutas de la API

Las rutas raíz están definidas en `config/urls.py`:

| Prefijo | Aplicación |
|---|---|
| `/admin/` | Administración de Django. |
| `/api/v1/usuarios/` | Usuarios, inicio de sesión y perfiles. |
| `/api/v1/academico/` | Catálogos e inscripciones académicas. |
| `/api/v1/evaluaciones/` | Tareas y evaluaciones. |
| `/api/v1/comunicacion/` | Anuncios, foros y mensajería. |
| `/api/v1/notificaciones/` | Historial, catálogo y estado de notificaciones. |
| `/ws/notificaciones/` | Notificaciones en tiempo real por WebSocket. |

El proyecto configura DRF Spectacular como generador de esquemas, pero no
registra actualmente una ruta pública para servir la documentación OpenAPI.

## Autenticación y permisos

- La autenticación REST predeterminada es JWT, con encabezado
  `Authorization: Bearer <access_token>`.
- El token de acceso dura 60 minutos y el refresh 7 días.
- El login valida el correo institucional, la contraseña hasheada y que el
  usuario esté activo.
- El permiso predeterminado es `IsAuthenticated`. Login y refresh son
  explícitamente públicos; cada vista puede declarar su propia política.
- El WebSocket valida el mismo JWT de acceso por el parámetro `token` y valida
  el origen con `WEBSOCKET_ALLOWED_ORIGINS`.
- El endpoint `me/` y las operaciones de perfil utilizan el usuario
  `Usuarios`, no el modelo estándar de usuario Django.

## Configuración local

Desde esta carpeta (`backend/`), crea un entorno virtual e instala dependencias:

```sh
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Configura un archivo `.env` en `backend/` (no agregues secretos al repositorio):

```dotenv
SECRET_KEY=una-clave-secreta-larga
DEBUG=True
DATABASE_URL=postgres://usuario:clave@localhost:5432/ingenieria_software
REDIS_URL=redis://localhost:6379/0
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000
WEBSOCKET_ALLOWED_ORIGINS=http://localhost:3000

R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=...
R2_ACCOUNT_ID=...
R2_CUSTOM_DOMAIN=
```

`SECRET_KEY`, `DATABASE_URL` y las credenciales/cuenta de R2 se leen al iniciar
Django. `R2_CUSTOM_DOMAIN` es opcional; las demás variables R2 deben tener
valores válidos aunque el flujo que estés probando no cargue archivos. En local
puedes usar Redis para probar el comportamiento multi-proceso. Si omites
`REDIS_URL`, Channels usa memoria: sirve para desarrollo de una sola instancia,
pero no distribuye mensajes entre procesos.

Prepara la base de datos y ejecuta el servidor de desarrollo:

```sh
python manage.py migrate
python manage.py runserver
```

Para probar entrega de notificaciones en segundo plano, en otra terminal
ejecuta:

```sh
python manage.py procesar_notificaciones --batch-size 100 --interval 1
```

Para procesar un único ciclo de la cola, agrega `--once`.

## Migraciones y pruebas

Comandos de mantenimiento desde `backend/`:

```sh
python manage.py check
python manage.py makemigrations
python manage.py migrate
python manage.py test
```

Antes de desplegar migraciones nuevas, revisa el resultado de `makemigrations`
y confirma que solo incluye cambios previstos. El estado actual del repositorio
puede mostrar cambios de modelos académicos/evaluaciones que todavía requieren
una migración propia; revísalos por separado en lugar de incluirlos
automáticamente dentro de una migración de notificaciones.

## Despliegue en Render

Render permite WebSockets, así que no es necesario migrar a Railway. Configura
un servicio Web con:

- **Root directory:** `backend`
- **Build/install:** instalar `requirements.txt`
- **Start command:**

  ```sh
  daphne -b 0.0.0.0 -p $PORT config.asgi:application
  ```

- **Variables:** las mismas requeridas para la configuración local, usando
  valores de producción; `DEBUG=False`, `ALLOWED_HOSTS` y los orígenes permitidos
  deben corresponder a los dominios reales.
- **Base de datos y almacenamiento:** PostgreSQL mediante `DATABASE_URL` y
  credenciales R2 mediante las variables `R2_*`.
- **Redis:** crea un servicio Redis compatible y establece `REDIS_URL` con su
  dirección privada.

Ejecuta `python manage.py migrate` en el proceso de despliegue. Crea además un
**Background Worker** de Render, con el mismo código, directorio y variables:

```sh
python manage.py procesar_notificaciones --batch-size 100 --interval 1
```

Puedes escalar workers; `select_for_update(skip_locked=True)` les permite
reclamar trabajos distintos. El servicio web, todos los workers y las instancias
de backend deben compartir PostgreSQL y Redis.

Programa un **Cron Job** diario para eliminar eventos enviados y solicitudes
completadas antiguas, conservando el historial de notificaciones:

```sh
python manage.py limpiar_eventos_notificacion --dias 14
```

## Estructura de directorios

```text
backend/
├── apps/
│   ├── academico/       # Oferta, secciones, docentes, inscripciones y entregas
│   ├── archivos/        # Metadatos de archivos y tipos permitidos
│   ├── comunicacion/    # Anuncios, foros y mensajes
│   ├── evaluaciones/    # Tareas, rúbricas, evaluaciones y calificaciones
│   ├── notificaciones/  # Catálogo, API, WebSocket, outbox y workers
│   └── usuarios/        # Usuarios, roles, JWT y perfiles
├── config/              # Settings, rutas HTTP, ASGI y WSGI
├── manage.py
└── requirements.txt
```

Cada aplicación puede contener `models.py`, `serializers.py`, `views.py`,
`urls.py`, `admin.py`, pruebas y migraciones según su responsabilidad. Las
migraciones versionan el esquema de base de datos; `manage.py` ejecuta tareas
administrativas y workers.
