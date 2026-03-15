import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Crear nuevo subtema
export async function POST(request: NextRequest) {
  try {
    const { topicId, name, userId } = await request.json()

    if (!topicId || !name || !userId) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      )
    }

    // Verificar que el usuario está activo
    const user = await db.user.findUnique({
      where: { id: userId },
    })

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: 'Usuario no autorizado' },
        { status: 403 }
      )
    }

    const subtopic = await db.subtopic.create({
      data: {
        topicId,
        name,
        createdBy: userId,
      },
      include: {
        creator: {
          select: { id: true, name: true },
        },
      },
    })

    return NextResponse.json({ subtopic })
  } catch (error) {
    console.error('Error creando subtema:', error)
    return NextResponse.json(
      { error: 'Error al crear subtema' },
      { status: 500 }
    )
  }
}

// Obtener subtemas de un tema
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const topicId = searchParams.get('topicId')

    if (!topicId) {
      return NextResponse.json(
        { error: 'ID de tema requerido' },
        { status: 400 }
      )
    }

    const subtopics = await db.subtopic.findMany({
      where: { topicId },
      orderBy: { createdAt: 'desc' },
      include: {
        creator: {
          select: { id: true, name: true },
        },
        _count: {
          select: { posts: true },
        },
      },
    })

    return NextResponse.json({ subtopics })
  } catch (error) {
    console.error('Error obteniendo subtemas:', error)
    return NextResponse.json(
      { error: 'Error al obtener subtemas' },
      { status: 500 }
    )
  }
}
