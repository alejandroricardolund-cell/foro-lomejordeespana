import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';

// POST - Dar like o dislike
export async function POST(request: NextRequest) {
  try {
    const sessionCookie = (await cookies()).get('session');
    if (!sessionCookie) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const decoded = Buffer.from(sessionCookie.value, 'base64').toString();
    const [userId] = decoded.split(':');

    const { postId, type } = await request.json(); // type: 'like' o 'dislike'

    if (!postId || !type || !['like', 'dislike'].includes(type)) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    // Verificar si ya existe
    const existing = await db.like.findUnique({
      where: { postId_userId: { postId, userId } }
    });

    if (existing) {
      // Si ya existe y es del mismo tipo, eliminar (toggle off)
      if (existing.type === type) {
        await db.like.delete({
          where: { id: existing.id }
        });
        return NextResponse.json({ success: true, action: 'removed' });
      }
      // Si es de diferente tipo, cambiar
      await db.like.update({
        where: { id: existing.id },
        data: { type }
      });
      return NextResponse.json({ success: true, action: 'changed' });
    }

    // Crear nuevo like/dislike
    await db.like.create({
      data: { postId, userId, type }
    });

    return NextResponse.json({ success: true, action: 'created' });
  } catch (error) {
    console.error('Error en like:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
