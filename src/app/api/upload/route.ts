import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const messageId = formData.get('messageId') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Subir archivo a Vercel Blob
    const blob = await put(file.name, file, {
      access: 'public',
    });

    // Si hay messageId, guardar la referencia en la base de datos
    if (messageId) {
      await db.fileAttachment.create({
        data: {
          messageId: messageId,
          fileName: file.name,
          fileUrl: blob.url,
          fileType: file.type,
          fileSize: file.size,
        },
      });
    }

    return NextResponse.json({
      success: true,
      url: blob.url,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Error uploading file' },
      { status: 500 }
    );
  }
}
