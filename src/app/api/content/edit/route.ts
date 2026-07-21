import { editPage } from '@/lib/github';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);

    if (!body || typeof body !== 'object') {
      return Response.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { slug, title, content, description } = body as Record<string, unknown>;

    if (!slug || typeof slug !== 'string' || slug.trim().length === 0) {
      return Response.json({ error: 'slug is required' }, { status: 400 });
    }
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return Response.json({ error: 'title is required' }, { status: 400 });
    }
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return Response.json({ error: 'content is required' }, { status: 400 });
    }

    const pr = await editPage({
      slug: slug.trim(),
      title: title.trim(),
      content: content.trim(),
      description: typeof description === 'string' ? description.trim() : undefined,
    });

    return Response.json({ success: true, pr });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[api/content/edit]', message);
    return Response.json({ error: message }, { status: 500 });
  }
}
