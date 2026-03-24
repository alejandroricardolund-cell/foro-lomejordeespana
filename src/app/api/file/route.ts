import { NextRequest, NextResponse } from 'next/server';

// Mapeo de extensiones a tipos MIME
const MIME_TYPES: Record<string, string> = {
  // Imágenes
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.bmp': 'image/bmp',
  '.ico': 'image/x-icon',
  // Videos
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.ogg': 'video/ogg',
  '.mov': 'video/quicktime',
  '.avi': 'video/x-msvideo',
  // Audio
  '.mp3': 'audio/mpeg',
  '.mpeg': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.oga': 'audio/ogg',
  '.m4a': 'audio/mp4',
  '.aac': 'audio/aac',
  // Documentos
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  // Texto
  '.txt': 'text/plain',
  '.md': 'text/markdown',
  '.csv': 'text/csv',
  '.json': 'application/json',
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
};

// Endpoint proxy para servir archivos con el Content-Type correcto
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    
    if (!url) {
      return NextResponse.json({ error: 'URL requerida' }, { status: 400 });
    }

    // Verificar que la URL es de Vercel Blob Store
    if (!url.includes('blob.vercel-storage.com') && !url.includes('public.blob.vercel-storage.com')) {
      return NextResponse.json({ error: 'URL no permitida' }, { status: 403 });
    }

    // Obtener el archivo
    const response = await fetch(url);
    
    if (!response.ok) {
      return NextResponse.json({ error: 'Error al obtener archivo' }, { status: response.status });
    }

    // Determinar el tipo MIME basado en la extensión
    const urlPath = new URL(url).pathname;
    const extension = urlPath.toLowerCase().substring(urlPath.lastIndexOf('.'));
    let contentType = MIME_TYPES[extension] || 'application/octet-stream';
    
    // Si el servidor ya devolvió un Content-Type válido, usarlo
    const serverContentType = response.headers.get('content-type');
    if (serverContentType && !serverContentType.includes('application/octet-stream')) {
      contentType = serverContentType;
    }

    // Obtener el contenido del archivo
    const arrayBuffer = await response.arrayBuffer();
    
    // Devolver el archivo con el Content-Type correcto
    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Disposition': 'inline',
      },
    });
    
  } catch (error) {
    console.error('Error en proxy de archivo:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
