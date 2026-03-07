import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import crypto from 'crypto';

// POST - Crear admin inicial (solo si no existe ningún usuario)
export async function POST() {
  try {
    // Verificar si ya existe algún usuario
    const existingUsers = await db.user.count();
    
    if (existingUsers > 0) {
      return NextResponse.json({ 
        error: 'Ya existen usuarios en el sistema. Use el panel de administración.' 
      }, { status: 400 });
    }

    // Crear admin inicial
    const accessKey = crypto.randomBytes(8).toString('hex').toUpperCase();
    
    const admin = await db.user.create({
      data: {
        name: 'Administrador',
        email: 'admin@lomejordeespana.es',
        accessKey,
        role: 'admin'
      }
    });

    return NextResponse.json({ 
      success: true,
      message: 'Administrador creado. GUARDE ESTA CLAVE DE ACCESO:',
      accessKey: admin.accessKey
    });
  } catch (error) {
    console.error('Error creando admin:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// GET - Verificar si el sistema está inicializado
export async function GET() {
  try {
    const userCount = await db.user.count();
    return NextResponse.json({ 
      initialized: userCount > 0,
      userCount 
    });
  } catch (error) {
    console.error('Error verificando inicialización:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
