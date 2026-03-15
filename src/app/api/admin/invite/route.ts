import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

function generateAccessKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let key = ''
  for (let i = 0; i < 12; i++) {
    if (i > 0 && i % 4 === 0) key += '-'
    key += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return key
}

// Invitar nuevo usuario (solo admin)
export async function POST(request: NextRequest) {
  try {
    const { adminId, name, email } = await request.json()

    if (!adminId || !name || !email) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      )
    }

    // Verificar que el que invita es admin
    const admin = await db.user.findUnique({
      where: { id: adminId },
    })

    if (!admin || admin.role !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      )
    }

    // Verificar si el email ya existe
    const existingUser = await db.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'El email ya está registrado' },
        { status: 400 }
      )
    }

    // Crear usuario con clave única
    const accessKey = generateAccessKey()
    const newUser = await db.user.create({
      data: {
        email,
        name,
        accessKey,
        role: 'member',
        isActive: true,
        invitedBy: adminId,
      },
    })

    return NextResponse.json({
      message: 'Usuario invitado exitosamente',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        accessKey: newUser.accessKey,
      },
    })
  } catch (error) {
    console.error('Error invitando usuario:', error)
    return NextResponse.json(
      { error: 'Error al invitar usuario' },
      { status: 500 }
    )
  }
}
