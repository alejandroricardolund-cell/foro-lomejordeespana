import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const sessionCookie = (await cookies()).get('session');
    
    if (!sessionCookie) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // Decodificar el token
    const decoded = Buffer.from(sessionCookie.value, 'base64').toString();
    const [userId] = decoded.split(':');

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    if (!user || !user.isActive) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // Actualizar última actividad del usuario
    await db.user.update({
      where: { id: userId },
      data: { lastActiveAt: new Date() }
    });

    return NextResponse.json({ 
      authenticated: true,
      user 
    });

  } catch (error) {
    console.error('Error verificando sesión:', error);
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
