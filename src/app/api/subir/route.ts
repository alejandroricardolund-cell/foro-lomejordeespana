import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export async function POST(request: NextRequest) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  
  if (!token) {
    return NextResponse.json({ error: 'Sin token' }, { status: 500 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File;
  
  if (!file) {
    return NextResponse.json({ error: 'No hay archivo' }, { status: 400 });
  }

  const ext = file.name.split('.').pop() || 'bin';
  const filename = `forum/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

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
}
