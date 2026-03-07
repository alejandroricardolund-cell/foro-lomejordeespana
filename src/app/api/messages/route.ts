import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';

// GET - Obtener mensajes (recibidos o enviados)
export async function GET(request: NextRequest) {
  try {
    const sessionCookie = (await cookies()).get('session');
    if (!sessionCookie) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const decoded = Buffer.from(sessionCookie.value, 'base64').toString();
    const [userId] = decoded.split(':');

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'received'; // 'received' o 'sent'

    const where = type === 'sent' 
      ? { senderId: userId }
      : { receiverId: userId };

    const messages = await db.message.findMany({
      where,
      include: {
        sender: { select: { id: true, name: true } },
        receiver: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Error obteniendo mensajes:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// POST - Enviar mensaje
export async function POST(request: NextRequest) {
  try {
    const sessionCookie = (await cookies()).get('session');
    if (!sessionCookie) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const decoded = Buffer.from(sessionCookie.value, 'base64').toString();
    const [userId] = decoded.split(':');

    const { receiverId, subject, content } = await request.json();

    if (!receiverId || !content) {
      return NextResponse.json({ error: 'Destinatario y contenido son requeridos' }, { status: 400 });
    }

    const message = await db.message.create({
      data: {
        senderId: userId,
        receiverId,
        subject: subject || '(Sin asunto)',
        content
      },
      include: {
        sender: { select: { id: true, name: true } },
        receiver: { select: { id: true, name: true } }
      }
    });

    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error('Error enviando mensaje:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// PUT - Marcar como leído
export async function PUT(request: NextRequest) {
  try {
    const sessionCookie = (await cookies()).get('session');
    if (!sessionCookie) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await request.json();

    await db.message.update({
      where: { id },
      data: { isRead: true }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error actualizando mensaje:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
