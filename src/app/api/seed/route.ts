import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Función para generar una clave única
function generateAccessKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let key = ''
  for (let i = 0; i < 12; i++) {
    if (i > 0 && i % 4 === 0) key += '-'
    key += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return key
}

// Endpoint para inicializar el sistema con un admin
export async function POST() {
  try {
    // Verificar si ya existe un admin
    const existingAdmin = await db.user.findFirst({
      where: { role: 'admin' },
    })

    if (existingAdmin) {
      return NextResponse.json({
        message: 'Ya existe un administrador',
        admin: {
          id: existingAdmin.id,
          email: existingAdmin.email,
          name: existingAdmin.name,
          accessKey: existingAdmin.accessKey,
        },
      })
    }

    // Crear admin inicial
    const adminKey = generateAccessKey()
    const admin = await db.user.create({
      data: {
        email: 'admin@lomejordeespana.es',
        name: 'Administrador',
        accessKey: adminKey,
        role: 'admin',
        isActive: true,
      },
    })

    return NextResponse.json({
      message: 'Administrador creado exitosamente',
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        accessKey: admin.accessKey,
      },
    })
  } catch (error) {
    console.error('Error creando admin:', error)
    return NextResponse.json(
      { error: 'Error al crear administrador' },
      { status: 500 }
    )
  }
}

// Verificar estado del sistema
export async function GET() {
  try {
    const adminCount = await db.user.count({
      where: { role: 'admin' },
    })
    const userCount = await db.user.count()
    const topicCount = await db.topic.count()

    return NextResponse.json({
      initialized: adminCount > 0,
      stats: {
        users: userCount,
        topics: topicCount,
      },
    })
  } catch (error) {
    console.error('Error verificando estado:', error)
    return NextResponse.json(
      { error: 'Error al verificar estado' },
      { status: 500 }
    )
  }
}
