# React + Vite

## Campus Virtual LMS

### Ejecutar el frontend

Desde esta carpeta, instala las dependencias con `npm install` y ejecuta `npm run dev`.
En desarrollo, Vite reenvía las peticiones `/api/` a Django en `http://127.0.0.1:8000`.
Para producción, define `VITE_API_URL` en `.env.local`, incluyendo el prefijo `/api/v1/`.

### Contrato de autenticación esperado

- `POST usuarios/login/` recibe `correo_institucional` y `password`.
- La respuesta incluye `access`, `refresh` y `user`.
- `POST usuarios/refresh/` recibe `refresh` y devuelve `access`; puede devolver un nuevo `refresh`.
- Los endpoints protegidos usan el token de acceso en la cabecera `Authorization: Bearer`.

El frontend renueva el acceso al cargar y ante respuestas `401`, mantiene el token de
acceso en memoria y guarda el token de renovación en `sessionStorage`. La sesión termina
al cerrar el navegador o cuando el servidor rechaza la renovación. El cierre de sesión
elimina las credenciales locales; para revocar tokens en el servidor hace falta un
endpoint de revocación.

### Seguridad e integración pendiente

El backend Django está en `../backend`; los pasos de instalación y arranque están en
[`backend/README.md`](../backend/README.md). El panel obtiene sus cursos del endpoint
autenticado `/api/v1/academico/cursos/`. El progreso no se inventa: queda como no
disponible hasta que el modelo académico incluya datos de avance.

Las rutas protegidas del frontend solo controlan la navegación: cada endpoint del
backend debe autenticar al usuario y verificar en el servidor su rol, matrícula y
permisos sobre cada curso, entrega y archivo. El refresh token se mantiene en
`sessionStorage` durante esta integración con JWT; para producción, lo preferible es
una cookie `HttpOnly`, `Secure` y `SameSite` con protección CSRF adecuada.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
