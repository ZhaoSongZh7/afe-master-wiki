import { getRawPageContent, splitFrontmatter } from '@/lib/github';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');

  if (!slug) {
    return Response.json({ error: 'slug query parameter is required' }, { status: 400 });
  }

  try {
    const raw = await getRawPageContent(slug);
    if (!raw) {
      return Response.json({ error: `Page "${slug}" not found` }, { status: 404 });
    }

    const { body } = splitFrontmatter(raw);
    return Response.json({ content: body });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[api/content/raw]', message);
    return Response.json({ error: message }, { status: 500 });
  }
}
