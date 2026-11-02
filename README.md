# JAPÓN 2026

**Publicación en Netlify + Supabase:** sigue [DEPLOY-NETLIFY.md](DEPLOY-NETLIFY.md). Esa modalidad usa PostgreSQL y Supabase Auth; las instrucciones de SQLite y Render de este documento son la alternativa local.

Aplicación privada para las familias Marhuenda Fernández (MF) y Hoffmann Gaspar (HG). React + Vite, Express y SQLite (Node 24). Sin servicios externos de pago ni claves de API. Los datos se guardan en el servidor y se sincronizan mediante Server-Sent Events; no se usa localStorage como base de datos.

## Desarrollo

```sh
cd /workspace/JP2
npm ci
npm run dev
```

Servidor en puerto 3000. `PORT` permite cambiarlo; `DATA_DIR` selecciona el directorio persistente (por defecto `data/`). No hay contraseñas predeterminadas ni registro público.

## Activar los cuatro usuarios

Configura `PASSWORD_POL`, `PASSWORD_MONICA`, `PASSWORD_LEYRE` y `PASSWORD_JOAQUIN` mediante variables seguras, con contraseñas diferentes de al menos 12 caracteres, y ejecuta `npm run setup-users`. No incluyas los valores en Git ni en comandos guardados. Este comando también permite rotar contraseñas y revoca todas las sesiones. Las variables se necesitan solo para configurar usuarios; el servidor utiliza hashes scrypt con sal individual.

Para introducirlas desde una terminal Bash sin guardarlas en el historial:

```sh
read -rsp 'Contraseña de Pol: ' PASSWORD_POL; echo
read -rsp 'Contraseña de Mónica: ' PASSWORD_MONICA; echo
read -rsp 'Contraseña de Leyre: ' PASSWORD_LEYRE; echo
read -rsp 'Contraseña de Joaquín: ' PASSWORD_JOAQUIN; echo
export PASSWORD_POL PASSWORD_MONICA PASSWORD_LEYRE PASSWORD_JOAQUIN
npm run setup-users
unset PASSWORD_POL PASSWORD_MONICA PASSWORD_LEYRE PASSWORD_JOAQUIN
```

## Validación y producción

```sh
npm test
npm run build
npm start
```

Producción requiere HTTPS en el navegador: la cookie de sesión es Secure y HttpOnly. Coloca un proxy HTTPS delante del puerto 3000 en la misma máquina (loopback), preservando Host y enviando X-Forwarded-Proto: https, habilitando streaming SSE sin buffering. Las mutaciones con un Origin distinto se rechazan. Sirve frontend y API en el mismo origen; no actives CORS indiscriminadamente. Usa una sola instancia de Node y un disco persistente para SQLite; no funciona como almacenamiento compartido entre réplicas. Copias de seguridad: utiliza una copia consistente de SQLite, incluyendo su WAL o la API de backup, antes de actualizaciones. No publiques el directorio `data/`.

## Incluido

- Inicio privado con cuenta atrás, ruta de la familia, actividad próxima e ideas recientes.
- Calendarios MF, HG y Todos: rutas distintas del 6 al 9 de diciembre y planes compartidos del 1 al 6 y del 9 al 14. Invitaciones de Supabase con elección individual de contraseña.
- Calendario de 18 días y vista por ciudad. Crear, editar y eliminar actividades, fechas y horas para reorganizarlas.
- Itinerario inicialmente vacío para añadir los planes del grupo. Se mantienen las fechas del viaje y la ruta. No existe un menú Ciudades separado; las tarjetas de destino abren el itinerario filtrado.
- Muro con enlaces originales, categorías, filtros, búsqueda, estados, favoritos personales, comentarios y tres tipos de voto por persona.
- Conversión transaccional de idea a actividad, evitando conversiones duplicadas.
- Checklist compartida, enlaces a recuerdos y consejos editables.
- Mapa OSM de referencia y búsquedas de ubicación en Maps. No se inventan coordenadas.
- Reservas confirmadas privadas con instrucciones. Todos los miembros pueden editar los datos del grupo.
- Manifiesto para instalación donde el navegador lo admita. No hay caché de información privada.

## Límites de esta primera versión

No incluye carga de PDF/fotos, marcadores geolocalizados por elemento, extracción de vistas previas, notificaciones con historial, avatares editables, recuperación de contraseñas ni Web Share Target. Los enlaces funcionan aunque la plataforma no permita incrustación. Los recuerdos admiten enlaces y texto, no archivos. La instalación PWA depende del navegador; no hay modo offline ni service worker. La sesión dura siete días, con comprobación periódica en SSE y refresco de respaldo cada 30 segundos. No se ha publicado ni validado en móviles físicos.

Las horas son locales: actividades en Japón, Asia/Tokyo; salida y llegada en Barcelona, Europe/Madrid. Los vuelos sin hora proporcionada no reciben una hora inventada. Fotos decorativas remotas de Unsplash y tipografías de Google Fonts pueden requerir acceso de red; los datos funcionales no dependen de ellas.

## Arquitectura

`server/db.js`: esquema e inicialización idempotente. `server/index.js`: sesiones, validación, API, SSE y frontend. `server/users.js`: provisión de usuarios. `src/main.jsx`: vistas y formularios. `src/style.css`: diseño adaptable. `tests/api.test.js`: flujo de integración con base temporal, dos usuarios y reinicio del servidor. SQLite mantiene usuarios, sesiones, actividades/ideas, comentarios, votos y favoritos con integridad referencial.

## Publicación en Render (plan con disco persistente)

`render.yaml` prepara un servicio web Node con HTTPS y disco de 1 GB para SQLite. El plan Starter y el disco tienen coste: revisa el importe en Render antes de crear el servicio. No uses un disco efímero, porque los datos se perderían en un despliegue.

1. Sube estos archivos al repositorio `polmarfer04/JP2` de GitHub.
2. En Render, crea un **Blueprint** desde ese repositorio; detectará `render.yaml`.
3. Introduce las cuatro contraseñas diferentes (12+ caracteres) en los campos seguros `PASSWORD_POL`, `PASSWORD_MONICA`, `PASSWORD_LEYRE`, `PASSWORD_JOAQUIN`. No las envíes por chat.
4. Revisa el coste y crea el servicio. Render proporcionará una URL HTTPS terminada en `.onrender.com`.
5. El primer arranque configura los cuatro usuarios. Los siguientes preservan sus contraseñas, sesiones y datos. Después del primer arranque correcto puedes retirar las variables PASSWORD del panel; para rotarlas sigue el procedimiento de `setup-users`.
6. Abre la URL, inicia sesión, guarda una idea y comprueba desde otro dispositivo que aparece. Reinicia el servicio y confirma que sigue guardada.

El servidor reconoce `RENDER_EXTERNAL_URL` como origen autorizado. Si configuras dominio propio, define `APP_ORIGIN` con su URL HTTPS exacta, sin barra final. No se incluyen documentos privados ni contraseñas en el repositorio. Este archivo prepara el despliegue, pero no crea servicios ni contrata planes automáticamente.
