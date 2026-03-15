import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const topic = await db.topic.findUnique({
      where: { id },
      include: {
        creator: {
          select: { id: true, name: true },
        },
        subtopics: {
          orderBy: { createdAt: 'desc' },
          include: {
            creator: {
              select: { id: true, name: true },
            },
            _count: {
              select: { posts: true },
            },
          },
        },
        chatMessages: {
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: {
            user: {
              select: { id: true, name: true },
            },
          },
        },
      },
    })

    if (!topic) {
      return NextResponse.json(
        { error: 'Tema no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ topic })
  } catch (error) {
    console.error('Error obteniendo tema:', error)
    return NextResponse.json(
      { error: 'Error al obtener tema' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { name, description, userId } = await request.json()

    // Verificar que es admin
    const user = await db.user.findUnique({
      where: { id: userId },
    })

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Solo el administrador puede editar temas' },
        { status: 403 }
      )
    }

    const topic = await db.topic.update({
      where: { id },
      data: { name, description },
    })

    return NextResponse.json({ topic })
  } catch (error) {
    console.error('Error actualizando tema:', error)
    return NextResponse.json(
      { error: 'Error al actualizar tema' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'ID de usuario requerido' },
        { status: 400 }
      )
    }

    // Verificar que es admin
    const user = await db.user.findUnique({
      where: { id: userId },
    })

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Solo el administrador puede eliminar temas' },
        { status: 403 }
      )
    }

    await db.topic.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Tema eliminado' })
  } catch (error) {
    console.error('Error eliminando tema:', error)
    return NextResponse.json(
      { error: 'Error al eliminar tema' },
      { status: 500 }
    )
  }
}
