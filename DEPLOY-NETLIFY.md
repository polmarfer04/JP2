# Publicar en Netlify + Supabase

Esta opción no necesita servidor Node en Netlify ni disco de Render. Netlify aloja `dist/`; Supabase proporciona Auth, PostgreSQL y Realtime. Los planes gratuitos tienen límites y pueden pausar proyectos inactivos: comprueba las condiciones actuales y reactiva/valida el proyecto antes de viajar. No se ha realizado un despliegue remoto todavía.

## 1. Preparar Supabase

Usa un proyecto dedicado a esta aplicación, porque el esquema crea tablas con nombres como `items` y `profiles`.

1. Abre **SQL Editor** y ejecuta el contenido completo de `supabase/setup.sql`. Crea tablas, permisos por fila (RLS), funciones, Realtime y el itinerario inicial. Se puede repetir sin restaurar actividades borradas.
2. En **Authentication → Users → Add user → Create new user**, crea los cuatro usuarios con sus correos y contraseñas propias. Si eliges confirmarlos manualmente, verifica antes que cada dirección es correcta. No uses el flujo de invitación por correo: esta versión todavía no tiene pantalla para establecer contraseñas desde invitaciones.
3. Copia los cuatro User UID y sustituye los marcadores de `supabase/members.example.sql`. Ejecuta ese archivo en SQL Editor para vincular las cuentas a Pol, Mónica, Leyre y Joaquín. Nadie puede autoasignarse un perfil.
4. Desactiva las nuevas altas públicas en la configuración de Authentication. Aunque se creara una quinta cuenta, las políticas no le permitirían acceder al viaje.
5. En **Project Settings → API** (o **Connect / API Keys**), copia la URL del proyecto y la clave pública **Publishable** o **anon**. Nunca uses **service_role** o **secret** en variables `VITE_*`.

## 2. Preparar Netlify

1. Sube el proyecto completo a tu repositorio de GitHub. No subas `.env`, `data/` ni `node_modules/`.
2. En Netlify, elige **Add new project → Import an existing project**, conecta GitHub y selecciona el repositorio. Si ya tienes sitio, conecta ese repositorio en su configuración de build.
3. `netlify.toml` indica el comando `npm run build:netlify` y el directorio publicado `dist`.
4. Los dos valores públicos del proyecto ya están en `netlify.toml`, así que no hace falta introducirlos para importar este repositorio. Si cambias de proyecto, reemplázalos o define estas variables en Netlify:

| Variable | Valor |
| --- | --- |
| `VITE_SUPABASE_URL` | La URL HTTPS del proyecto, como `https://<referencia>.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Clave pública Publishable o anon |

`VITE_BACKEND=supabase` y Node 24 ya están definidos en `netlify.toml`. No configures las variables `PASSWORD_*` de la versión SQLite en Netlify. Las contraseñas se gestionan en Supabase Auth.

5. Despliega. La compilación falla con un mensaje claro si faltan los valores públicos o se intenta usar una clave privada.
6. En Supabase Authentication → URL Configuration, configura la URL HTTPS de Netlify como Site URL. El inicio de sesión por contraseña no necesita redirecciones; esto deja preparado el dominio para futuros flujos de Auth.

## 3. Comprobar la publicación

- Abre la URL HTTPS desde una ventana privada: solo debe aparecer el acceso, sin itinerario ni datos del grupo.
- Inicia sesión con el correo y contraseña de un viajero.
- Añade una idea desde un móvil; abre otra cuenta en otro navegador y comprueba que aparece automáticamente.
- Comenta, vota y guarda un favorito. El voto es visible para el grupo; el favorito solo para quien lo guarda.
- Recarga ambos navegadores para comprobar persistencia.
- Una cuenta no vinculada a los cuatro perfiles debe recibir un rechazo y no poder consultar datos desde la API pública.

Las pruebas locales ejecutan las políticas PostgreSQL reales con PGlite, además de la integración del modo SQLite. Todavía hace falta verificar Supabase Auth y Realtime contra tu proyecto real. No se ha probado un despliegue remoto con los valores de tu cuenta.

## Desarrollo con Supabase

Copia `.env.example` a `.env`, rellena únicamente los valores públicos y ejecuta `npm run dev`. Vite carga esas variables; la interfaz accede directamente a Supabase. Sin `VITE_BACKEND=supabase`, se conserva la versión local con Express y SQLite. `npm test` comprueba ambos esquemas; `npm run build` comprueba la compilación. Las variables públicas se incorporan al bundle de Vite y es normal que sean visibles: la privacidad depende de las políticas RLS, no de ocultar la clave anon.

Netlify no tiene acceso a la base SQLite local. El SQL solo incorpora el itinerario inicial; si se han creado ideas reales en SQLite, deben migrarse por separado antes de cambiar de backend. Los documentos PDF, la carga de fotos y la recuperación de contraseñas desde la interfaz siguen pendientes. La sesión de Supabase se conserva en el navegador; los datos compartidos residen en PostgreSQL, no en localStorage.

## Subida manual mediante Netlify Drop

Cuando ya se dispone de la URL y la clave pública de Supabase, también se puede compilar con `npm run build:netlify` y publicar el contenido de `dist/` mediante https://app.netlify.com/drop. El comando lee las variables públicas de `.env.local` o del entorno, con prioridad del entorno. Los archivos `_headers` y `_redirects` de la salida conservan las cabeceras de seguridad y el enrutamiento en esta modalidad.

En esta sesión se ha preparado `/workspace/artifacts/japon-2026-netlify.zip`. Descomprímelo y arrastra a Netlify Drop la carpeta que contiene `index.html` y `assets/`. La configuración pública ya está incluida en el bundle; para esta subida manual no es necesario introducir variables en Netlify. No se adjuntan datos privados. El ZIP no crea tablas ni usuarios: completa antes de usar la aplicación los pasos de Supabase de esta guía. Cambiar el proyecto o la clave pública requiere recompilar y subir una nueva versión.
