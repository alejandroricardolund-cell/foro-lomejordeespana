import { NextResponse } from 'next/server';
import { list } from '@vercel/blob';

export async function GET() {
  try {
    const hasToken = !!process.env.BLOB_READ_WRITE_TOKEN;
    
    if (!hasToken) {
      return NextResponse.json({
        status: 'error',
        message: 'BLOB_READ_WRITE_TOKEN no está configurado',
        help: 'Ve a Vercel Dashboard > Storage > foro-files > Settings y copia el token a las variables de entorno'
      });
    }

    const { blobs } = await list();
    
    return NextResponse.json({
      status: 'ok',
      message: 'Blob Store conectado correctamente',
      tokenConfigured: true,
      filesCount: blobs.length,
      recentFiles: blobs.slice(0, 5).map(b => ({
        url: b.url,
        uploadedAt: b.uploadedAt
      }))
    });
    
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Error al conectar con Blob Store',
      details: error instanceof Error ? error.message : 'Unknown error',
      help: 'Verifica que el Blob Store esté correctamente vinculado al proyecto en Vercel'
    });
  }
}
