import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = (formData.get('folder') as string) || 'forum';
    
    if (!file) {
      return NextResponse.json({ error: 'No se encontró archivo' }, { status: 400 });
    }

    // Validar tipo de archivo
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp',
      'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/aac',
      'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain', 'text/markdown', 'text/csv',
      'application/json',
    ];

    const fileName = file.name.toLowerCase();
    const extraExtensions = ['.md', '.txt', '.json', '.csv', '.note', '.pages', '.numbers', '.key', '.rtf', '.odt', '.zip', '.rar'];
    const hasExtraExtension = extraExtensions.some(ext => fileName.endsWith(ext));

    if (!allowedTypes.includes(file.type) && !hasExtraExtension) {
      return NextResponse.json({ 
        error: `Tipo no permitido: ${file.type || file.name}` 
      }, { status: 400 });
    }

    // Validar tamaño
    const maxSize = file.type.startsWith('video/') ? 50 * 1024 * 1024 : 20 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: `Archivo muy grande. Máx: ${file.type.startsWith('video/') ? '50MB' : '20MB'}` 
      }, { status: 400 });
    }

    // Generar nombre único
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const ext = file.name.split('.').pop() || 'bin';
    const filename = `${folder}/${timestamp}-${randomStr}.${ext}`;

    // Obtener el token via GET request interno
    // Usamos la URL del sitio desplegado o localhost
    const baseUrl = process.env.VERCEL 
      ? 'https://foro-lomejordeespana.vercel.app' 
      : 'http://localhost:3000';
    
    console.log('Fetching token from:', `${baseUrl}/api/get-blob-token`);
    const tokenResponse = await fetch(`${baseUrl}/api/get-blob-token`);
    const tokenData = await tokenResponse.json();
    
    if (!tokenData.token) {
      console.error('No se pudo obtener el token de Blob Store');
      return NextResponse.json({ 
        error: 'Error de configuración del servidor',
        details: 'Token no disponible'
      }, { status: 500 });
    }

    const token = tokenData.token;

    // Convertir el archivo a buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Subir usando REST API directamente con Content-Type correcto
    // Añadir contentType como query parameter para asegurar que Vercel lo respete
    const contentTypeEncoded = encodeURIComponent(file.type || 'application/octet-stream');
    const blobResponse = await fetch(`https://blob.vercel-storage.com/${filename}?contentType=${contentTypeEncoded}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': file.type || 'application/octet-stream',
        'x-content-type': file.type || 'application/octet-stream',
      },
      body: buffer,
    });

    if (!blobResponse.ok) {
      const errorText = await blobResponse.text();
      console.error('Blob upload error:', errorText);
      return NextResponse.json({ 
        error: 'Error al subir a Blob Store',
        details: errorText
      }, { status: 500 });
    }

    const blobResult = await blobResponse.json();
    
    return NextResponse.json({
      success: true,
      file: {
        url: blobResult.url,
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        key: blobResult.url,
      }
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ 
      error: 'Error al subir archivo',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
