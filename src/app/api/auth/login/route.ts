import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';

// Intentos fallidos por IP (en memoria, para producción usar Redis)
const failedAttempts = new Map<string, { count: number; lastAttempt: number; blockedUntil: number }>();

export async function POST(request: NextRequest) {
  try {
    const { accessKey } = await request.json();
    
    if (!accessKey || typeof accessKey !== 'string') {
      return NextResponse.json({ error: 'Clave de acceso requerida' }, { status: 400 });
    }

    // Obtener IP del cliente
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    const clientKey = `ip_${ip}`;

    // Verificar si está bloqueado
    const attempts = failedAttempts.get(clientKey);
    const now = Date.now();

    if (attempts) {
      // Verificar si está en período de espera de 5 segundos
      if (now - attempts.lastAttempt < 5000 && attempts.count > 0) {
        const waitTime = Math.ceil((5000 - (now - attempts.lastAttempt)) / 1000);
        return NextResponse.json({ 
          error: `Espere ${waitTime} segundos antes de reintentar`,
          waitTime 
        }, { status: 429 });
      }

      // Verificar si está bloqueado por 3 errores
      if (attempts.count >= 3 && attempts.blockedUntil > now) {
        const remainingTime = Math.ceil((attempts.blockedUntil - now) / 1000);
        return NextResponse.json({ 
          error: `Acceso bloqueado. Intente más tarde.`,
          blocked: true,
          remainingTime 
        }, { status: 403 });
      }

      // Resetear contador si pasó el tiempo de bloqueo (5 minutos)
      if (attempts.blockedUntil && now > attempts.blockedUntil) {
        failedAttempts.delete(clientKey);
      }
    }

    // Buscar usuario por clave de acceso
    const user = await db.user.findUnique({
      where: { accessKey }
    });

    // Registrar intento de acceso
    await db.accessAttempt.create({
      data: {
        keyUsed: accessKey,
        success: !!user,
        userId: user?.id || null,
      }
    });

    if (!user || !user.isActive) {
      // Incrementar contador de intentos fallidos
      const currentAttempts = failedAttempts.get(clientKey) || { count: 0, lastAttempt: 0, blockedUntil: 0 };
      const newCount = currentAttempts.count + 1;
      
      failedAttempts.set(clientKey, {
        count: newCount,
        lastAttempt: now,
        blockedUntil: newCount >= 3 ? now + 300000 : 0 // 5 minutos de bloqueo
      });

      if (newCount >= 3) {
        return NextResponse.json({ 
          error: 'Demasiados intentos. Acceso bloqueado temporalmente.',
          blocked: true 
        }, { status: 403 });
      }

      return NextResponse.json({ 
        error: 'Clave de acceso incorrecta',
        attemptsLeft: 3 - newCount
      }, { status: 401 });
    }

    // Login exitoso - limpiar intentos fallidos
    failedAttempts.delete(clientKey);

    // Crear sesión (usando cookie)
    const sessionToken = Buffer.from(`${user.id}:${Date.now()}`).toString('base64');
    
    (await cookies()).set('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 días
      path: '/'
    });

    // Guardar token en base de datos para validación
    await db.user.update({
      where: { id: user.id },
      data: { updatedAt: new Date() }
    });

    return NextResponse.json({ 
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
