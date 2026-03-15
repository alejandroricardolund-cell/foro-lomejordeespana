import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';

// GET - Obtener lista de miembros activos (para todos los usuarios)
export async function GET() {
  try {
    const sessionCookie = (await cookies()).get('session');
    if (!sessionCookie) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener todos los usuarios activos
    const users = await db.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        accessKey: true,
        keyIsPrivate: true,
        createdAt: true,
        lastActiveAt: true,
        inviter: { select: { name: true } }
      },
      orderBy: { name: 'asc' }
    });

    // Determinar quienes están en línea (últimos 5 minutos)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const members = users.map(user => ({
      ...user,
      isOnline: user.lastActiveAt && new Date(user.lastActiveAt) > fiveMinutesAgo
    }));

    return NextResponse.json({ members });
  } catch (error) {
    console.error('Error obteniendo miembros:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
