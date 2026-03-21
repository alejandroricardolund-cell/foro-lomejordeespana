import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = (formData.get('folder') as string) || 'forum';
    
    if (!file) {
      return NextResponse.json({ error: 'No se encontró archivo' }, { status: 400 });
    }

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
      'text/plain', 'text/markdown', 'text/csv', 'application/json',
    ];

    const fileName = file.name.toLowerCase();
    const extraExtensions = ['.md', '.txt', '.json', '.csv', '.note', '.pages', '.numbers', '.key', '.rtf', '.odt', '.zip'];
    const hasExtraExtension = extraExtensions.some(ext => fileName.endsWith(ext));

    if (!allowedTypes.includes(file.type) && !hasExtraExtension) {
      return NextResponse.json({ error: `Tipo no permitido: ${file.type || file.name}` }, { status: 400 });
    }

    const maxSize = file.type.startsWith('video/') ? 50 * 1024 * 1024 : 20 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: `Archivo muy grande. Máx: ${file.type.startsWith('video/') ? '50MB' : '20MB'}` }, { status: 400 });
    }

    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const ext = file.name.split('.').pop() || 'bin';
    const filename = `${folder}/${timestamp}-${randomStr}.${ext}`;

    const blob = await put(filename, file, {
      access: 'public',
    });

    return NextResponse.json({
      success: true,
      file: {
        url: blob.url,
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        key: blob.url,
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
