import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';

// GET - Obtener mensajes de chat de un tema
export async function GET(request: NextRequest) {
  try {
    const sessionCookie = (await cookies()).get('session');
    if (!sessionCookie) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const topicId = searchParams.get('topicId');

    if (!topicId) {
      return NextResponse.json({ error: 'ID de tema requerido' }, { status: 400 });
    }

    const messages = await db.chatMessage.findMany({
      where: { topicId },
      include: {
        user: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Error obteniendo chat:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// POST - Enviar mensaje al chat
export async function POST(request: NextRequest) {
  try {
    const sessionCookie = (await cookies()).get('session');
    if (!sessionCookie) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const decoded = Buffer.from(sessionCookie.value, 'base64').toString();
    const [userId] = decoded.split(':');

    const { topicId, message } = await request.json();

    if (!topicId || !message) {
      return NextResponse.json({ error: 'Tema y mensaje son requeridos' }, { status: 400 });
    }

    const chatMessage = await db.chatMessage.create({
      data: {
        topicId,
        userId,
        message
      },
      include: {
        user: { select: { id: true, name: true } }
      }
    });

    return NextResponse.json({ success: true, message: chatMessage });
  } catch (error) {
    console.error('Error enviando mensaje:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
