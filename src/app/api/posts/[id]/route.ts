import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { userId, content } = await request.json()

    if (!userId || !content) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      )
    }

    const post = await db.post.findUnique({
      where: { id },
    })

    if (!post) {
      return NextResponse.json(
        { error: 'Publicación no encontrada' },
        { status: 404 }
      )
    }

    // Solo el autor puede editar
    if (post.userId !== userId) {
      const user = await db.user.findUnique({
        where: { id: userId },
      })
      if (!user || user.role !== 'admin') {
        return NextResponse.json(
          { error: 'No autorizado' },
          { status: 403 }
        )
      }
    }

    const updatedPost = await db.post.update({
      where: { id },
      data: { content },
      include: {
        author: {
          select: { id: true, name: true },
        },
      },
    })

    return NextResponse.json({ post: updatedPost })
  } catch (error) {
    console.error('Error actualizando publicación:', error)
    return NextResponse.json(
      { error: 'Error al actualizar publicación' },
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

    const post = await db.post.findUnique({
      where: { id },
    })

    if (!post) {
      return NextResponse.json(
        { error: 'Publicación no encontrada' },
        { status: 404 }
      )
    }

    // Solo el autor o admin puede eliminar
    const user = await db.user.findUnique({
      where: { id: userId },
    })

    if (post.userId !== userId && (!user || user.role !== 'admin')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      )
    }

    await db.post.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Publicación eliminada' })
  } catch (error) {
    console.error('Error eliminando publicación:', error)
    return NextResponse.json(
      { error: 'Error al eliminar publicación' },
      { status: 500 }
    )
  }
}
