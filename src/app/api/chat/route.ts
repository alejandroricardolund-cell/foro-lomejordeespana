import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';

// GET - Obtener mensajes de chat de un tema O subtema
export async function GET(request: NextRequest) {
  try {
    const sessionCookie = (await cookies()).get('session');
    if (!sessionCookie) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const topicId = searchParams.get('topicId');
    const subtopicId = searchParams.get('subtopicId');

    if (!topicId && !subtopicId) {
      return NextResponse.json({ error: 'ID de tema o subtema requerido' }, { status: 400 });
    }

    // Si llega topicId busca por tema, si llega subtopicId busca por subtema
    const where = topicId ? { topicId } : { subtopicId };

    const messages = await db.chatMessage.findMany({
      where,
      include: {
        user: { select: { id: true, name: true } },
        attachments: true
      },
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Error obteniendo chat:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// POST - Enviar mensaje al chat (tema O subtema)
export async function POST(request: NextRequest) {
  try {
    const sessionCookie = (await cookies()).get('session');
    if (!sessionCookie) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const decoded = Buffer.from(sessionCookie.value, 'base64').toString();
    const [userId] = decoded.split(':');

    const { topicId, subtopicId, message, attachments } = await request.json();

    // Permitir mensajes si hay topicId O subtopicId, y si hay texto o archivos
    if ((!topicId && !subtopicId) || (!message && (!attachments || attachments.length === 0))) {
      return NextResponse.json({ error: 'Se requiere mensaje o archivos adjuntos' }, { status: 400 });
    }

    // Preparamos los datos dinámicamente
    const chatData: any = {
      userId,
      message: message || ''
    };
    
    if (topicId) chatData.topicId = topicId;
    if (subtopicId) chatData.subtopicId = subtopicId;

    const chatMessage = await db.chatMessage.create({
      data: chatData,
      include: {
        user: { select: { id: true, name: true } }
      }
    });

    // Crear los archivos adjuntos si existen
    if (attachments && attachments.length > 0) {
      await db.fileAttachment.createMany({
        data: attachments.map((att: any) => ({
          url: att.url,
          name: att.name,
          size: att.size,
          type: att.type,
          key: att.key,
          chatMessageId: chatMessage.id
        }))
      });
    }

    return NextResponse.json({ success: true, message: chatMessage });
  } catch (error) {
    console.error('Error enviando mensaje:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
