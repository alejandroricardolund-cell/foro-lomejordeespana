import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';

// GET - Buscar en temas, subtemas y posts
export async function GET(request: NextRequest) {
  try {
    const sessionCookie = (await cookies()).get('session');
    if (!sessionCookie) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    // Buscar en temas (case-insensitive search)
    const topics = await db.topic.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { description: { contains: query } }
        ]
      },
      select: {
        id: true,
        name: true,
        description: true,
        subtopics: { select: { id: true } }
      }
    });

    // Buscar en subtemas
    const subtopics = await db.subtopic.findMany({
      where: {
        name: { contains: query }
      },
      select: {
        id: true,
        name: true,
        topicId: true,
        topic: { select: { id: true, name: true } },
        posts: { select: { id: true } }
      }
    });

    // Buscar en posts (solo posts principales, no respuestas)
    const posts = await db.post.findMany({
      where: {
        content: { contains: query },
        parentId: null
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        userId: true,
        subtopicId: true,
        author: { select: { id: true, name: true } },
        subtopic: {
          select: {
            id: true,
            name: true,
            topicId: true,
            topic: { select: { id: true, name: true } }
          }
        }
      },
      take: 20
    });

    const results = {
      topics: topics.map(t => ({
        type: 'topic' as const,
        id: t.id,
        title: t.name,
        description: t.description || `${t.subtopics.length} subtemas`,
        link: t.id
      })),
      subtopics: subtopics.map(s => ({
        type: 'subtopic' as const,
        id: s.id,
        title: s.name,
        description: `${s.posts.length} publicaciones en ${s.topic.name}`,
        link: `${s.topic.id}#${s.id}`,
        topicId: s.topic.id
      })),
      posts: posts.map(p => ({
        type: 'post' as const,
        id: p.id,
        title: `Por ${p.author.name}`,
        description: p.content.substring(0, 100) + (p.content.length > 100 ? '...' : ''),
        link: `${p.subtopic.topic.id}#${p.subtopic.id}#${p.id}`,
        topicId: p.subtopic.topic.id,
        subtopicId: p.subtopic.id
      }))
    };

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error en búsqueda:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
