import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Obtener archivos adjuntos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');
    const messageId = searchParams.get('messageId');
    const chatMessageId = searchParams.get('chatMessageId');

    const where: any = {};
    if (postId) where.postId = postId;
    if (messageId) where.messageId = messageId;
    if (chatMessageId) where.chatMessageId = chatMessageId;

    const attachments = await db.fileAttachment.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ attachments });
  } catch (error) {
    console.error('Error fetching attachments:', error);
    return NextResponse.json({ error: 'Error al obtener archivos' }, { status: 500 });
  }
}

// POST - Crear nuevo archivo adjunto
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, name, size, type, key, postId, messageId, chatMessageId } = body;

    if (!url || !name || !key) {
      return NextResponse.json({ error: 'Faltan datos del archivo' }, { status: 400 });
    }

    const attachment = await db.fileAttachment.create({
      data: {
        url,
        name,
        size: size || 0,
        type: type || 'unknown',
        key,
        postId: postId || null,
        messageId: messageId || null,
        chatMessageId: chatMessageId || null,
      },
    });

    return NextResponse.json({ success: true, attachment });
  } catch (error) {
    console.error('Error creating attachment:', error);
    return NextResponse.json({ error: 'Error al crear archivo' }, { status: 500 });
  }
}

// DELETE - Eliminar archivo adjunto
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, key } = body;

    if (!id && !key) {
      return NextResponse.json({ error: 'Se requiere ID o key del archivo' }, { status: 400 });
    }

    const where = id ? { id } : { key };
    
    await db.fileAttachment.delete({
      where,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting attachment:', error);
    return NextResponse.json({ error: 'Error al eliminar archivo' }, { status: 500 });
  }
}
