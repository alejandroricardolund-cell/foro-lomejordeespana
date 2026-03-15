import { NextRequest, NextResponse } from 'next/server';
import { put, del } from '@vercel/blob';
import { prisma } from '@/lib/db';

// Subir archivo
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const sessionResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000'}/api/auth/session`, {
      headers: request.headers,
    });
    const session = await sessionResponse.json();
    
    if (!session.authenticated) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'forum';
    
    if (!file) {
      return NextResponse.json({ error: 'No se encontró archivo' }, { status: 400 });
    }

    // Validar tipo de archivo
    const allowedTypes = [
      // Imágenes
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      // Audio
      'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/x-m4a',
      // Video
      'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime',
      // Documentos
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: `Tipo de archivo no permitido: ${file.type}` 
      }, { status: 400 });
    }

    // Validar tamaño (máximo 50MB para videos, 20MB para resto)
    const isVideo = file.type.startsWith('video/');
    const maxSize = isVideo ? 50 * 1024 * 1024 : 20 * 1024 * 1024;
    
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: `Archivo demasiado grande. Máximo ${isVideo ? '50MB' : '20MB'}` 
      }, { status: 400 });
    }

    // Generar nombre único
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const extension = file.name.split('.').pop() || 'bin';
    const filename = `${folder}/${timestamp}-${randomString}.${extension}`;

    // Subir a Vercel Blob
    const blob = await put(filename, file, {
      access: 'public',
      addRandomSuffix: false,
    });

    return NextResponse.json({
      success: true,
      file: {
        url: blob.url,
        name: file.name,
        size: file.size,
        type: file.type,
        key: blob.url, // Usamos la URL como key para Vercel Blob
      }
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ 
      error: 'Error al subir archivo',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Eliminar archivo
export async function DELETE(request: NextRequest) {
  try {
    // Verificar autenticación
    const sessionResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000'}/api/auth/session`, {
      headers: request.headers,
    });
    const session = await sessionResponse.json();
    
    if (!session.authenticated) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json({ error: 'URL requerida' }, { status: 400 });
    }

    // Eliminar de Vercel Blob
    await del(url);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json({ 
      error: 'Error al eliminar archivo' 
    }, { status: 500 });
  }
}
