import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const subtopic = await db.subtopic.findUnique({
      where: { id },
      include: {
        topic: true,
        creator: {
          select: { id: true, name: true },
        },
        posts: {
          orderBy: { createdAt: 'desc' },
          include: {
            author: {
              select: { id: true, name: true },
            },
            likes: true,
          },
        },
      },
    })

    if (!subtopic) {
      return NextResponse.json(
        { error: 'Subtema no encontrado' },
        { status: 404 }
      )
    }

    // Calcular likes/dislikes para cada post
    const postsWithCounts = subtopic.posts.map(post => {
      const likes = post.likes.filter(l => l.type === 'like').length
      const dislikes = post.likes.filter(l => l.type === 'dislike').length
      return { ...post, likeCount: likes, dislikeCount: dislikes }
    })

    return NextResponse.json({ 
      subtopic: { ...subtopic, posts: postsWithCounts } 
    })
  } catch (error) {
    console.error('Error obteniendo subtema:', error)
    return NextResponse.json(
      { error: 'Error al obtener subtema' },
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

    // Verificar que es el creador o admin
    const subtopic = await db.subtopic.findUnique({
      where: { id },
    })

    if (!subtopic) {
      return NextResponse.json(
        { error: 'Subtema no encontrado' },
        { status: 404 }
      )
    }

    const user = await db.user.findUnique({
      where: { id: userId },
    })

    if (!user || (subtopic.createdBy !== userId && user.role !== 'admin')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      )
    }

    await db.subtopic.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Subtema eliminado' })
  } catch (error) {
    console.error('Error eliminando subtema:', error)
    return NextResponse.json(
      { error: 'Error al eliminar subtema' },
      { status: 500 }
    )
  }
}
