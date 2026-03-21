import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export async function POST(request: NextRequest) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  
  if (!token) {
    return NextResponse.json({ 
      error: 'Token no configurado',
      debug: Object.keys(process.env).filter(k => k.includes('BLOB'))
    }, { status: 500 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = (formData.get('folder') as string) || 'forum';
    
    if (!file) {
      return NextResponse.json({ error: 'No se encontró archivo' }, { status: 400 });
    }

    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const ext = file.name.split('.').pop() || 'bin';
    const filename = `${folder}/${timestamp}-${randomStr}.${ext}`;

    const blob = await put(filename, file, {
      access: 'public',
      token: token,
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
    return NextResponse.json({ 
      error: 'Error al subir',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
