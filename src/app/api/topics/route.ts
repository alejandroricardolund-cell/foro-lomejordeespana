import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';

// GET - Listar todos los temas con subtemas
export async function GET() {
  try {
    const sessionCookie = (await cookies()).get('session');
    if (!sessionCookie) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const topics = await db.topic.findMany({
      include: {
        subtopics: {
          include: {
            creator: { select: { name: true } },
            _count: { select: { posts: true } }
          },
          orderBy: { createdAt: 'asc' }
        },
        creator: { select: { name: true } },
        _count: { select: { subtopics: true, chatMessages: true } }
      },
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json({ topics });
  } catch (error) {
    console.error('Error listando temas:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// POST - Crear nuevo tema (solo admin)
export async function POST(request: NextRequest) {
  try {
    const sessionCookie = (await cookies()).get('session');
    if (!sessionCookie) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const decoded = Buffer.from(sessionCookie.value, 'base64').toString();
    const [userId] = decoded.split(':');

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Solo el administrador puede crear temas' }, { status: 403 });
    }

    const { name, description } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });
    }

    const topic = await db.topic.create({
      data: {
        name,
        description,
        createdBy: userId
      }
    });

    return NextResponse.json({ success: true, topic });
  } catch (error) {
    console.error('Error creando tema:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// DELETE - Eliminar tema (solo admin)
export async function DELETE(request: NextRequest) {
  try {
    const sessionCookie = (await cookies()).get('session');
    if (!sessionCookie) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const decoded = Buffer.from(sessionCookie.value, 'base64').toString();
    const [userId] = decoded.split(':');

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Solo el administrador puede eliminar temas' }, { status: 403 });
    }

    const { id } = await request.json();

    await db.topic.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error eliminando tema:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// PUT - Editar tema (solo admin)
export async function PUT(request: NextRequest) {
  try {
    const sessionCookie = (await cookies()).get('session');
    if (!sessionCookie) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const decoded = Buffer.from(sessionCookie.value, 'base64').toString();
    const [userId] = decoded.split(':');

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Solo el administrador puede editar temas' }, { status: 403 });
    }

    const { id, name, description } = await request.json();

    if (!id || !name) {
      return NextResponse.json({ error: 'ID y nombre son requeridos' }, { status: 400 });
    }

    const topic = await db.topic.update({
      where: { id },
      data: { name, description }
    });

    return NextResponse.json({ success: true, topic });
  } catch (error) {
    console.error('Error editando tema:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
