import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';

// Función helper para verificar si el usuario es admin
async function verifyAdmin() {
  const sessionCookie = (await cookies()).get('session');
  if (!sessionCookie) return null;

  const decoded = Buffer.from(sessionCookie.value, 'base64').toString();
  const [userId] = decoded.split(':');

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user || user.role !== 'admin') return null;

  return user;
}

// GET - Obtener todos los usuarios (solo admin)
export async function GET() {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const users = await db.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastActiveAt: true,
        accessKey: true,
        inviter: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    return NextResponse.json({ error: 'Error al obtener usuarios' }, { status: 500 });
  }
}

// PUT - Actualizar usuario (activar/desactivar, cambiar rol)
export async function PUT(request: NextRequest) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { userId, action } = await request.json();

    if (!userId || !action) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 });
    }

    // Verificar que el usuario objetivo existe
    const targetUser = await db.user.findUnique({ where: { id: userId } });
    if (!targetUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // No permitir modificar al propio admin
    if (userId === admin.id) {
      return NextResponse.json({ error: 'No puedes modificarte a ti mismo' }, { status: 400 });
    }

    let updatedUser;

    switch (action) {
      case 'toggleActive':
        updatedUser = await db.user.update({
          where: { id: userId },
          data: { isActive: !targetUser.isActive },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            lastActiveAt: true
          }
        });
        break;

      case 'toggleRole':
        // No permitir cambiar el rol del único admin
        if (targetUser.role === 'admin') {
          const adminCount = await db.user.count({ where: { role: 'admin' } });
          if (adminCount <= 1) {
            return NextResponse.json(
              { error: 'No se puede cambiar el rol del último administrador' },
              { status: 400 }
            );
          }
        }
        updatedUser = await db.user.update({
          where: { id: userId },
          data: { role: targetUser.role === 'admin' ? 'member' : 'admin' },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            lastActiveAt: true
          }
        });
        break;

      default:
        return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
    }

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('Error actualizando usuario:', error);
    return NextResponse.json({ error: 'Error al actualizar usuario' }, { status: 500 });
  }
}

// DELETE - Eliminar usuario
export async function DELETE(request: NextRequest) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'ID de usuario requerido' }, { status: 400 });
    }

    // No permitir eliminar al propio admin
    if (userId === admin.id) {
      return NextResponse.json({ error: 'No puedes eliminarte a ti mismo' }, { status: 400 });
    }

    // Verificar que el usuario existe
    const targetUser = await db.user.findUnique({ where: { id: userId } });
    if (!targetUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // No permitir eliminar al último admin
    if (targetUser.role === 'admin') {
      const adminCount = await db.user.count({ where: { role: 'admin' } });
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: 'No se puede eliminar al último administrador' },
          { status: 400 }
        );
      }
    }

    await db.user.delete({ where: { id: userId } });

    return NextResponse.json({ success: true, message: 'Usuario eliminado' });
  } catch (error) {
    console.error('Error eliminando usuario:', error);
    return NextResponse.json({ error: 'Error al eliminar usuario' }, { status: 500 });
  }
}
