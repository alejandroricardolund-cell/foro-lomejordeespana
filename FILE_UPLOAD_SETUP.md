# Sistema de Archivos Adjuntos - Guía de Configuración

## Resumen
Se ha implementado un sistema completo de subida de archivos que permite a los usuarios adjuntar:
- **Imágenes** (JPG, PNG, GIF, WebP) - hasta 8MB cada una
- **Audio** (MP3, WAV, OGG, etc.) - hasta 32MB cada uno
- **Documentos** (PDF, PPT, PPTX) - hasta 16MB cada uno

## Servicio Utilizado: Uploadthing

Se ha elegido **Uploadthing** como servicio de almacenamiento por:

| Característica | Plan Gratuito | Plan Pro ($10/mes) |
|---------------|---------------|-------------------|
| Almacenamiento | 2GB | 100GB |
| Bandwidth/mes | 500GB | Ilimitado |
| Tamaño máx. archivo | 32MB | 64MB |
| Archivos máx. por subida | 5 | 20 |

## Configuración Inicial (OBLIGATORIO)

### Paso 1: Crear cuenta en Uploadthing
1. Ve a [uploadthing.com](https://uploadthing.com)
2. Haz clic en "Sign Up" y crea una cuenta gratuita
3. Verifica tu email

### Paso 2: Crear una nueva aplicación
1. En el dashboard, haz clic en "Create App"
2. Nombra tu app (ejemplo: "foro-lomejordeespana")
3. Selecciona el plan gratuito (Free)

### Paso 3: Obtener las credenciales
1. En tu app, ve a "API Keys"
2. Copia los siguientes valores:
   - `UPLOADTHING_SECRET` (empieza con `sk_live_` o `sk_test_`)
   - `UPLOADTHING_APP_ID`
   - `UPLOADTHING_TOKEN`

### Paso 4: Configurar variables de entorno

#### Para desarrollo local (.env.local):
```env
UPLOADTHING_SECRET=sk_live_tu_clave_aqui
UPLOADTHING_APP_ID=tu_app_id
UPLOADTHING_TOKEN=tu_token
```

#### Para Vercel (producción):
1. Ve a tu proyecto en Vercel Dashboard
2. Settings → Environment Variables
3. Añade las tres variables:
   - `UPLOADTHING_SECRET`
   - `UPLOADTHING_APP_ID`
   - `UPLOADTHING_TOKEN`

## Cambios Realizados en el Código

### Base de Datos (schema.prisma)
- Nuevo modelo `FileAttachment` con campos: url, name, size, type, key
- Relaciones en Post, Message y ChatMessage para archivos adjuntos

### Nuevos Archivos
- `src/lib/uploadthing.ts` - Configuración del servidor
- `src/lib/uploadthing-client.ts` - Hooks para el cliente
- `src/components/file-upload.tsx` - Componente de subida
- `src/app/api/uploadthing/route.ts` - Ruta API de Uploadthing
- `src/app/api/attachments/route.ts` - API para gestionar archivos

### Archivos Modificados
- `src/app/page.tsx` - Integración del componente de subida
- `src/app/api/posts/route.ts` - Soporte para attachments
- `src/app/api/chat/route.ts` - Soporte para attachments
- `src/app/api/messages/route.ts` - Soporte para attachments

## Despliegue a Producción

### Opción 1: Subir cambios a GitHub (recomendado)
```bash
git add .
git commit -m "Add file upload functionality with Uploadthing"
git push origin main
```

### Opción 2: Actualizar archivos en GitHub manualmente
1. Ve a tu repositorio en GitHub
2. Sube cada archivo modificado/creado
3. Vercel desplegará automáticamente

### Verificar que funciona
1. Entra al foro
2. Ve a cualquier subtema
3. Intenta subir una imagen al crear un post
4. Verifica que la imagen aparece correctamente

## Uso del Sistema

### En Posts
- Al crear un post, aparecerá un área de "Haz clic para subir archivos"
- Se pueden subir hasta 5 archivos por post
- Los archivos se muestran debajo del contenido del post

### En Chat
- El componente de subida está debajo del input de mensaje
- Máximo 3 archivos por mensaje
- Los archivos se muestran con un ícono 📎

### En Mensajes Privados
- Similar a posts, hasta 5 archivos por mensaje
- Los archivos se muestran en la conversación

## Solución de Problemas

### Error: "Unauthorized"
- Verifica que las variables de entorno estén configuradas
- Comprueba que UPLOADTHING_SECRET sea correcto

### Error: "File too large"
- Las imágenes tienen límite de 8MB
- El audio tiene límite de 32MB
- Los documentos tienen límite de 16MB

### Los archivos no aparecen
- Verifica la conexión a internet
- Comprueba los logs en Vercel Functions
- Revisa la consola del navegador para errores

## Límites del Plan Gratuito
- 2GB de almacenamiento total
- 500GB de transferencia mensual
- Si se excede, actualizar al plan Pro ($10/mes)

## Alternativas Consideradas
| Servicio | Plan Gratuito | Pros | Contras |
|----------|---------------|------|---------|
| Uploadthing | 2GB storage, 500GB bandwidth | Fácil integración, Next.js nativo | Límite de almacenamiento |
| Cloudflare R2 | 10GB storage, sin egress fees | Sin costos de transferencia | Configuración más compleja |
| Supabase Storage | 5GB storage, 50GB bandwidth | Base de datos incluida | Requiere migración |
| Vercel Blob | Parte del plan Pro | Integración nativa | No hay plan gratuito |

Se eligió Uploadthing por su facilidad de integración y el generoso límite de transferencia mensual.
