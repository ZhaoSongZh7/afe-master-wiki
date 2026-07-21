const responseChunks = ['Coming', ' soon'];

const delay = (milliseconds: number) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { message?: unknown } | null;

  if (typeof body?.message !== 'string' || body.message.trim().length === 0) {
    return Response.json({ error: 'A message is required.' }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      for (const chunk of responseChunks) {
        if (request.signal.aborted) {
          controller.close();
          return;
        }

        controller.enqueue(encoder.encode(chunk));
        await delay(180);
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
    },
  });
}
