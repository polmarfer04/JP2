# Publicar en Netlify + Supabase

Esta opción no necesita servidor Node en Netlify ni disco de Render. Netlify aloja `dist/`; Supabase proporciona Auth, PostgreSQL y Realtime. Los planes gratuitos tienen límites y pueden pausar proyectos inactivos: comprueba las condiciones actuales y reactiva/valida el proyecto antes de viajar. No se ha realizado un despliegue remoto todavía.

## 1. Preparar Supabase

Usa un proyecto dedicado a esta aplicación, porque el esquema crea tablas con nombres como `items` y `profiles`.

1. Abre **SQL Editor** y ejecuta el contenido completo de `supabase/setup.sql`. Crea tablas, permisos por fila (RLS), funciones, Realtime y un itinerario vacío. Se puede repetir sin restaurar actividades borradas.
2. En **Authentication → Users → Add user → Create new user**, crea los cuatro usuarios con sus correos y contraseñas propias. Si eliges confirmarlos manualmente, verifica antes que cada dirección es correcta. También puedes invitarlos por correo siguiendo el procedimiento de invitaciones de familias al final de esta guía.
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
- Una cuenta no vinculada a un perfil autorizado debe recibir un rechazo y no poder consultar datos desde la API pública.

Las pruebas locales ejecutan las políticas PostgreSQL reales con PGlite, además de la integración del modo SQLite. Todavía hace falta verificar Supabase Auth y Realtime contra tu proyecto real. No se ha probado un despliegue remoto con los valores de tu cuenta.

## Desarrollo con Supabase

Copia `.env.example` a `.env`, rellena únicamente los valores públicos y ejecuta `npm run dev`. Vite carga esas variables; la interfaz accede directamente a Supabase. Sin `VITE_BACKEND=supabase`, se conserva la versión local con Express y SQLite. `npm test` comprueba ambos esquemas; `npm run build` comprueba la compilación. Las variables públicas se incorporan al bundle de Vite y es normal que sean visibles: la privacidad depende de las políticas RLS, no de ocultar la clave anon.

Netlify no tiene acceso a la base SQLite local. El SQL inicial no incorpora actividades; si se han creado ideas reales en SQLite, deben migrarse por separado antes de cambiar de backend. Los documentos PDF, la carga de fotos y la recuperación de contraseñas desde la interfaz siguen pendientes. La sesión de Supabase se conserva en el navegador; los datos compartidos residen en PostgreSQL, no en localStorage.

## Subida manual mediante Netlify Drop

Cuando ya se dispone de la URL y la clave pública de Supabase, también se puede compilar con `npm run build:netlify` y publicar el contenido de `dist/` mediante https://app.netlify.com/drop. El comando lee las variables públicas de `.env.local` o del entorno, con prioridad del entorno. Los archivos `_headers` y `_redirects` de la salida conservan las cabeceras de seguridad y el enrutamiento en esta modalidad.

En esta sesión se ha preparado `/workspace/artifacts/japon-2026-netlify.zip`. Descomprímelo y arrastra a Netlify Drop la carpeta que contiene `index.html` y `assets/`. La configuración pública ya está incluida en el bundle; para esta subida manual no es necesario introducir variables en Netlify. No se adjuntan datos privados. El ZIP no crea tablas ni usuarios: completa antes de usar la aplicación los pasos de Supabase de esta guía. Cambiar el proyecto o la clave pública requiere recompilar y subir una nueva versión.

## Vaciar el itinerario de un proyecto ya publicado

Ejecuta `supabase/clear-activities.sql` una sola vez en SQL Editor. Elimina todas las actividades existentes y sus comentarios, votos y favoritos asociados. Conserva usuarios, ideas y sus datos. No repitas esta consulta después de añadir planes nuevos, porque los borraría. Los siguientes despliegues no vuelven a crear actividades iniciales.

## Familias MF y HG e invitaciones sin compartir contraseñas

1. Tras el despliegue de esta versión, ejecuta `supabase/families.sql` en SQL Editor. Asigna MF a Pol, Mónica, Leyre y Joaquín; prepara los perfiles HG de Álvaro, Carla, Walter y Lourdes. Conserva cuentas, contraseñas y actividades. No habilita registro público ni permite cambiar la familia desde el navegador.
2. En Authentication → URL Configuration, establece **Site URL** con la URL HTTPS de la web de Netlify. Si usas un redirect específico, añádelo a Redirect URLs; evita comodines innecesarios.
3. En Authentication → Users → Add user → **Invite user**, introduce el correo de cada miembro HG. No crees una contraseña para ellos. Supabase envía el enlace y crea su cuenta Auth.
4. Copia los User UID, rellena `supabase/hg-members.example.sql` y ejecútalo antes de que intenten entrar. La invitación no concede por sí sola acceso a los datos del viaje: debe existir esta vinculación administrativa.
5. Cada invitado abre su correo, sigue el enlace a la web y elige su contraseña de al menos 12 caracteres. El envío de correos depende de los límites y configuración SMTP de Supabase; si se limita el envío, configura SMTP en su panel o reintenta cuando el proveedor lo permita. No uses enlaces de invitación en un chat compartido.

MF ve su calendario por defecto. HG ve Osaka desde el 1/12, Kanazawa del 6 al 7/12, Takayama del 7 al 9/12 y Tokio del 9 al 14/12. «Todos» muestra solo actividades marcadas como compartidas dentro de los días 1–7 y 9–14 de diciembre; el 6 corresponde a la parte compartida en Kioto antes de separarse las rutas. Cada actividad permite elegir MF, HG o Todos; los calendarios MF y HG incluyen los planes compartidos. Las fechas y ciudades del calendario son orientación de ruta y no crean actividades ni reservas.

Los filtros organizan la visualización, no son barreras de acceso entre familias: todos los miembros invitados siguen colaborando sobre el viaje. Los favoritos siguen siendo personales. La aplicación admite usuarios adicionales sin el antiguo límite de cuatro perfiles.

El 7 de diciembre se comparte el plan en Takayama. El día 8 mantiene itinerarios separados. Si ya ejecutaste `families.sql` antes de añadir este día, aplica `supabase/takayama-shared.sql` para actualizar la validación sin tocar cuentas ni actividades. Las actividades existentes no cambian de familia automáticamente: elige Todos para los planes compartidos del día 7.
