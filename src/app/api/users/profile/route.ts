import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import crypto from 'crypto';

// PUT - Actualizar perfil o cambiar clave
export async function PUT(request: NextRequest) {
  try {
    const sessionCookie = (await cookies()).get('session');
    if (!sessionCookie) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const decoded = Buffer.from(sessionCookie.value, 'base64').toString();
    const [userId] = decoded.split(':');

    const { name, email, newAccessKey } = await request.json();

    const updateData: { name?: string; email?: string; accessKey?: string } = {};
    
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (newAccessKey) {
      // Generar nueva clave aleatoria
      updateData.accessKey = crypto.randomBytes(8).toString('hex').toUpperCase();
    }

    const user = await db.user.update({
      where: { id: userId },
      data: updateData,
      select: { id: true, name: true, email: true, accessKey: true, role: true }
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('Error actualizando perfil:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// DELETE - Darse de baja
export async function DELETE(request: NextRequest) {
  try {
    const sessionCookie = (await cookies()).get('session');
    if (!sessionCookie) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const decoded = Buffer.from(sessionCookie.value, 'base64').toString();
    const [userId] = decoded.split(':');

    // Verificar si es admin (el admin no puede darse de baja)
    const user = await db.user.findUnique({ where: { id: userId } });
    if (user?.role === 'admin') {
      return NextResponse.json({ error: 'El administrador no puede darse de baja' }, { status: 403 });
    }

    // Marcar como inactivo en lugar de eliminar
    await db.user.update({
      where: { id: userId },
      data: { isActive: false }
    });

    // Eliminar cookie de sesión
    (await cookies()).delete('session');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error en baja:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
