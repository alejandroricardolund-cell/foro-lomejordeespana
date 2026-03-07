import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';

// POST - Crear subtema (cualquier usuario)
export async function POST(request: NextRequest) {
  try {
    const sessionCookie = (await cookies()).get('session');
    if (!sessionCookie) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const decoded = Buffer.from(sessionCookie.value, 'base64').toString();
    const [userId] = decoded.split(':');

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'Usuario no válido' }, { status: 403 });
    }

    const { topicId, name } = await request.json();

    if (!topicId || !name) {
      return NextResponse.json({ error: 'Tema y nombre son requeridos' }, { status: 400 });
    }

    const subtopic = await db.subtopic.create({
      data: {
        name,
        topicId,
        createdBy: userId
      },
      include: {
        creator: { select: { name: true } }
      }
    });

    return NextResponse.json({ success: true, subtopic });
  } catch (error) {
    console.error('Error creando subtema:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// DELETE - Eliminar subtema
export async function DELETE(request: NextRequest) {
  try {
    const sessionCookie = (await cookies()).get('session');
    if (!sessionCookie) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const decoded = Buffer.from(sessionCookie.value, 'base64').toString();
    const [userId] = decoded.split(':');

    const { id } = await request.json();

    const subtopic = await db.subtopic.findUnique({ where: { id } });
    if (!subtopic) {
      return NextResponse.json({ error: 'Subtema no encontrado' }, { status: 404 });
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    
    // Solo el creador o admin puede eliminar
    if (subtopic.createdBy !== userId && user?.role !== 'admin') {
      return NextResponse.json({ error: 'No tiene permiso para eliminar este subtema' }, { status: 403 });
    }

    await db.subtopic.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error eliminando subtema:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
