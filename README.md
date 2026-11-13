# Ingenieria-Software

## Notificaciones en tiempo real (backend)

El backend expone notificaciones persistentes por REST y eventos en tiempo real por
WebSocket. Render admite WebSockets, por lo que no es necesario migrar a Railway.
Redis es necesario para compartir los eventos entre procesos o instancias; sin
`REDIS_URL`, el entorno usa un canal en memoria para desarrollo/local.

La creación de notificaciones, el almacenamiento y la entrega WebSocket están
separados. Las notificaciones se escriben en la base de datos junto a un evento
outbox; workers independientes reclaman eventos con bloqueos de base de datos
sin colisionar y reintentan fallos con espera exponencial. La entrega es
**al menos una vez**: el cliente debe tratar el `notification.id` como clave
idempotente porque una caída después del envío puede ocasionar una repetición.

### Despliegue en Render

Configura el directorio raíz del servicio como `backend`, instala dependencias
desde `requirements.txt` y utiliza este comando de inicio:

```sh
daphne -b 0.0.0.0 -p $PORT config.asgi:application
```

Ejecuta `python manage.py migrate` durante el despliegue. Crea un servicio Redis
(Render Key Value o un Redis compatible) y define `REDIS_URL` en el backend con
su URL privada. Configura también `ALLOWED_HOSTS` y `CORS_ALLOWED_ORIGINS` con
los dominios reales del backend y frontend. Por defecto, los orígenes WebSocket
permitidos son los de `CORS_ALLOWED_ORIGINS`; puedes sobrescribirlos con
`WEBSOCKET_ALLOWED_ORIGINS`. En producción, conecta siempre un Redis compartido
para no perder mensajes entre procesos ni instancias.

Crea además un **Background Worker** de Render, con el mismo repositorio,
directorio raíz y variables de entorno del backend, y como comando de inicio:

```sh
python manage.py procesar_notificaciones --batch-size 100 --interval 1
```

Puedes escalar el número de workers según el volumen; cada worker reclama
lotes independientes. El API y el worker deben usar la misma base de datos y
Redis. El worker procesa los eventos pendientes aproximadamente cada segundo.
Redis distribuye los eventos a las instancias del backend que mantienen las
conexiones WebSocket.

Programa un Cron Job diario de Render con el comando
`python manage.py limpiar_eventos_notificacion --dias 14` para retirar por lotes
los registros de entrega ya enviados. El historial de notificaciones de usuarios
se conserva; los eventos fallidos no se borran automáticamente.

### API

Todas estas rutas REST requieren autenticación JWT de acceso como el resto de la API.

- `GET /api/v1/notificaciones/` lista las notificaciones propias. Acepta
  `?leida=true`, `?leida=false` y `?tipo=comunicacion` (código del catálogo).
- `GET /api/v1/notificaciones/tipos/` lista los tipos activos del catálogo.
- `GET /api/v1/notificaciones/no-leidas/contador/` devuelve `{"no_leidas": N}`.
- `POST /api/v1/notificaciones/<id>/leer/` marca una notificación propia como leída.
- `POST /api/v1/notificaciones/leer-todas/` marca todas las propias como leídas.

El WebSocket autenticado es `wss://<backend>/ws/notificaciones/?token=<access_token>`.
Cada evento llega como JSON con forma
`{"type":"notification","notification":{...}}`. El token se valida con el mismo
JWT de acceso del resto de la API; usa siempre `wss://` en producción y no
almacenes la URL completa en logs del cliente.

Se crean notificaciones al publicar anuncios, tareas visibles, calificaciones,
nuevos temas de foro, respuestas a temas y mensajes directos. El mensaje privado
no se incluye en el contenido de la notificación.

El catálogo `tipos_notificacion` se puede consultar por API y administrar en
Django Admin. Las tablas `notificaciones` y `eventos_notificacion` almacenan,
respectivamente, el historial del usuario y el estado de entrega/reintentos.
Los avisos de sección se encolan como `solicitudes_notificacion` y el worker
expande la audiencia en páginas de 500 usuarios; esto evita resolver grupos
grandes durante la petición HTTP. Los eventos y solicitudes que agotan los
reintentos quedan en estado `fallido` para diagnóstico desde Django Admin. El
catálogo incluye `comunicacion` y `evaluacion`; para agregar nuevos tipos, crea
un registro activo en Django Admin antes de emitir notificaciones con ese código.
