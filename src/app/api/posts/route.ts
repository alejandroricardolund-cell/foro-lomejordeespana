import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';

// GET - Obtener posts de un subtema
export async function GET(request: NextRequest) {
  try {
    const sessionCookie = (await cookies()).get('session');
    if (!sessionCookie) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const decoded = Buffer.from(sessionCookie.value, 'base64').toString();
    const [userId] = decoded.split(':');

    const { searchParams } = new URL(request.url);
    const subtopicId = searchParams.get('subtopicId');

    if (!subtopicId) {
      return NextResponse.json({ error: 'ID de subtema requerido' }, { status: 400 });
    }

    const posts = await db.post.findMany({
      where: { subtopicId },
      include: {
        author: { select: { id: true, name: true } },
        likes: true,
        attachments: true,
        _count: { select: { likes: true, replies: true } }
      },
      orderBy: { createdAt: 'asc' }
    });

    const postsWithLikes = posts.map(post => {
      const likes = post.likes.filter(l => l.type === 'like').length;
      const dislikes = post.likes.filter(l => l.type === 'dislike').length;
      const userLike = post.likes.find(l => l.userId === userId);
      return {
        id: post.id,
        content: post.content,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        parentId: post.parentId,
        author: post.author,
        likesCount: likes,
        dislikesCount: dislikes,
        userLike: userLike?.type,
        repliesCount: post._count.replies,
        attachments: post.attachments
      };
    });

    return NextResponse.json({ posts: postsWithLikes });
  } catch (error) {
    console.error('Error obteniendo posts:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// POST - Crear post o respuesta
export async function POST(request: NextRequest) {
  try {
    const sessionCookie = (await cookies()).get('session');
    if (!sessionCookie) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const decoded = Buffer.from(sessionCookie.value, 'base64').toString();
    const [userId] = decoded.split(':');

    const { subtopicId, content, parentId, attachments } = await request.json();

    if (!subtopicId || !content) {
      return NextResponse.json({ error: 'Subtema y contenido son requeridos' }, { status: 400 });
    }

    if (parentId) {
      const parentPost = await db.post.findUnique({ where: { id: parentId } });
      if (!parentPost || parentPost.subtopicId !== subtopicId) {
        return NextResponse.json({ error: 'Post padre no válido' }, { status: 400 });
      }
    }

    const post = await db.post.create({
      data: {
        subtopicId,
        userId,
        content,
        parentId: parentId || null
      },
      include: {
        author: { select: { id: true, name: true } }
      }
    });

    if (attachments && attachments.length > 0) {
      await db.fileAttachment.createMany({
        data: attachments.map((att: any) => ({
          url: att.url,
          name: att.name,
          size: att.size,
          type: att.type,
          key: att.key,
          postId: post.id
        }))
      });
    }

    return NextResponse.json({ success: true, post });
  } catch (error) {
    console.error('Error creando post:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// PUT - Editar post (solo el autor)
export async function PUT(request: NextRequest) {
  try {
    const sessionCookie = (await cookies()).get('session');
    if (!sessionCookie) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const decoded = Buffer.from(sessionCookie.value, 'base64').toString();
    const [userId] = decoded.split(':');

    const { id, content } = await request.json();

    const post = await db.post.findUnique({ where: { id } });
    if (!post) {
      return NextResponse.json({ error: 'Post no encontrado' }, { status: 404 });
    }

    if (post.userId !== userId) {
      return NextResponse.json({ error: 'Solo puede editar sus propias publicaciones' }, { status: 403 });
    }

    const updatedPost = await db.post.update({
      where: { id },
      data: { content },
      include: {
        author: { select: { id: true, name: true } }
      }
    });

    return NextResponse.json({ success: true, post: updatedPost });
  } catch (error) {
    console.error('Error editando post:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// DELETE - Eliminar post (autor o admin)
export async function DELETE(request: NextRequest) {
  try {
    const sessionCookie = (await cookies()).get('session');
    if (!sessionCookie) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const decoded = Buffer.from(sessionCookie.value, 'base64').toString();
    const [userId] = decoded.split(':');

    const { id } = await request.json();

    const post = await db.post.findUnique({ where: { id } });
    if (!post) {
      return NextResponse.json({ error: 'Post no encontrado' }, { status: 404 });
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    
    if (post.userId !== userId && user?.role !== 'admin') {
      return NextResponse.json({ error: 'No tiene permiso para eliminar este post' }, { status: 403 });
    }

    await db.post.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error eliminando post:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
