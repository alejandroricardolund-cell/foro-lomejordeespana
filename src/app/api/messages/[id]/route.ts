import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const message = await db.message.findUnique({
      where: { id },
      include: {
        sender: {
          select: { id: true, name: true, email: true },
        },
        receiver: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    if (!message) {
      return NextResponse.json(
        { error: 'Mensaje no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ message })
  } catch (error) {
    console.error('Error obteniendo mensaje:', error)
    return NextResponse.json(
      { error: 'Error al obtener mensaje' },
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
    const { userId, markAsRead } = await request.json()

    const message = await db.message.findUnique({
      where: { id },
    })

    if (!message) {
      return NextResponse.json(
        { error: 'Mensaje no encontrado' },
        { status: 404 }
      )
    }

    // Solo el receptor puede marcar como leído
    if (message.receiverId !== userId) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      )
    }

    const updatedMessage = await db.message.update({
      where: { id },
      data: { isRead: markAsRead },
    })

    return NextResponse.json({ message: updatedMessage })
  } catch (error) {
    console.error('Error actualizando mensaje:', error)
    return NextResponse.json(
      { error: 'Error al actualizar mensaje' },
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

    const message = await db.message.findUnique({
      where: { id },
    })

    if (!message) {
      return NextResponse.json(
        { error: 'Mensaje no encontrado' },
        { status: 404 }
      )
    }

    // Tanto el emisor como el receptor pueden eliminar
    if (message.receiverId !== userId && message.senderId !== userId) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      )
    }

    // Eliminar archivos adjuntos primero
    await db.fileAttachment.deleteMany({
      where: { messageId: id },
    })

    await db.message.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Mensaje eliminado' })
  } catch (error) {
    console.error('Error eliminando mensaje:', error)
    return NextResponse.json(
      { error: 'Error al eliminar mensaje' },
      { status: 500 }
    )
  }
}
