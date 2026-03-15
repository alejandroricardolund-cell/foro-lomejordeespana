# Foro "Lo Mejor de España"

Foro privado con sistema de invitaciones.

## Despliegue en Vercel

### Paso 1: Crear base de datos (Neon - Gratis)

1. Ve a [neon.tech](https://neon.tech) y crea una cuenta gratis
2. Crea un nuevo proyecto
3. Copia la `DATABASE_URL` y `DIRECT_DATABASE_URL` de la configuración

### Paso 2: Subir a Vercel

1. Ve a [vercel.com](https://vercel.com) y crea una cuenta
2. Haz clic en "Add New Project"
3. Puedes:
   - Subir el ZIP del proyecto directamente
   - O conectar con GitHub y subir el código allí primero
4. En "Environment Variables", añade:
   - `DATABASE_URL` = (tu URL de Neon)
   - `DIRECT_DATABASE_URL` = (tu URL directa de Neon)
5. Haz clic en "Deploy"

### Paso 3: Configurar el dominio

1. En Vercel, ve a tu proyecto → Settings → Domains
2. Añade `lomejordeespaña.es` (y `xn--lomejordeespaa-2nb.es`)
3. Vercel te dará los records DNS necesarios
4. Ve a Hostinger → Dominios → DNS
5. Cambia los nameservers o añade los records A/CNAME que Vercel indica

### Paso 4: Inicializar el foro

1. Accede a tu dominio
2. Verás la opción de "Inicializar Sistema"
3. Se creará el administrador con una clave de acceso
4. ¡Guarda esa clave!

## Funcionalidades

- ✅ Autenticación con claves únicas
- ✅ Temas y subtemas
- ✅ Posts con respuestas/hilos
- ✅ Sistema de likes/dislikes
- ✅ Chat de brainstorming
- ✅ Mensajería privada
- ✅ Panel de administración
- ✅ Búsqueda de contenido
- ✅ Indicador de usuarios en línea

## Tecnologías

- Next.js 15
- Prisma ORM
- PostgreSQL (Neon)
- shadcn/ui
- Tailwind CSS
