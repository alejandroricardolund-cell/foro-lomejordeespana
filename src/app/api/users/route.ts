import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import crypto from 'crypto';

function generateAccessKey(): string {
  return crypto.randomBytes(8).toString('hex').toUpperCase();
}

export async function GET() {
  try {
    const sessionCookie = (await cookies()).get('session');
    if (!sessionCookie) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const decoded = Buffer.from(sessionCookie.value, 'base64').toString();
    const [userId] = decoded.split(':');

    const currentUser = await db.user.findUnique({ where: { id: userId } });
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const users = await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastActiveAt: true,
        accessKey: true,
        keyIsPrivate: true,
        inviter: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const usersWithPrivateKeys = users.map(user => ({
      ...user,
      accessKey: user.keyIsPrivate ? '••••••••••••••••' : user.accessKey
    }));

    return NextResponse.json({ users: usersWithPrivateKeys });
  } catch (error) {
    console.error('Error listando usuarios:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionCookie = (await cookies()).get('session');
    if (!sessionCookie) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const decoded = Buffer.from(sessionCookie.value, 'base64').toString();
    const [adminId] = decoded.split(':');

    const admin = await db.user.findUnique({ where: { id: adminId } });
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Solo el administrador puede invitar usuarios' }, { status: 403 });
    }

    const { name, email } = await request.json();

    if (!name || !email) {
      return NextResponse.json({ error: 'Nombre y email son requeridos' }, { status: 400 });
    }

    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'Ya existe un usuario con ese email' }, { status: 400 });
    }

    const accessKey = generateAccessKey();

    const newUser = await db.user.create({
      data: {
        name,
        email,
        accessKey,
        role: 'member',
        invitedBy: adminId
      }
    });

    return NextResponse.json({ 
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        accessKey: newUser.accessKey
      }
    });
  } catch (error) {
    console.error('Error creando usuario:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
