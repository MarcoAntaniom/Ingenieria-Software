# Campus Virtual LMS — Frontend (`IngSoftwareLMS`)

Frontend modular y escalable construido con **React 19**, **Vite 8**, **Tailwind CSS v4**, **TanStack React Query v5**, **Zustand v5** y **React Router v7**, integrado con el backend Django REST Framework + Channels (`../backend`).

## Arquitectura Feature-Based

```text
src/
├── app/
│   ├── guards/
│   │   └── RouteGuards.jsx          # GuestRoute, ProtectedRoute y RoleGuard (RBAC)
│   └── layouts/
│       └── AppLayout.jsx            # Shell compartido, navegación por rol y badge en vivo
├── contexts/
│   ├── AuthContext.jsx              # Sesión JWT, renovación silenciosa y sincronización /usuarios/me/
│   └── auth-context.js
├── features/
│   ├── dashboard/                   # Resumen ejecutivo adaptado a Estudiante, Docente y Admin
│   ├── academico/                   # Secciones, aula virtual por sección, inscripciones y catálogos
│   ├── comunicacion/                # Anuncios por sección, foros/temas/hilos y mensajes directos cifrados
│   ├── evaluaciones/                # Creación y seguimiento de tareas evaluadas
│   ├── notificaciones/              # Bandeja REST + cliente WebSocket idempotente en tiempo real
│   └── usuarios/                    # Perfil propio y administración de cuentas/perfiles
├── services/
│   ├── api.js                       # Cliente Axios con interceptores Bearer y refresh automático
│   ├── auth.js                      # Login y cierre de sesión
│   └── session.js                   # Almacenamiento de tokens y usuario
└── shared/
    ├── api/
    │   └── wsClient.js              # Conexión WebSocket con reconexión exponencial y ping/pong
    ├── components/ui/
    │   └── StateViews.jsx           # PageHeader, LoadingState, ErrorState, EmptyState y Modal
    └── lib/
        ├── pagination.js            # Normalizador de respuestas DRF ({ results } y { datos })
        ├── queryKeys.js             # Fábrica centralizada de claves de caché para React Query
        └── roles.js                 # Normalización de roles (Estudiante, Docente, Administrador)
```

## Ejecución local

1. Instala las dependencias:
   ```sh
   cd IngSoftwareLMS
   npm install
   ```
2. Inicia el servidor de desarrollo:
   ```sh
   npm run dev
   ```
3. Variables de entorno opcionales (`.env.local`):
   ```dotenv
   VITE_API_URL=http://localhost:8000/api/v1/
   VITE_WS_URL=ws://localhost:8000/ws/notificaciones/
   ```
