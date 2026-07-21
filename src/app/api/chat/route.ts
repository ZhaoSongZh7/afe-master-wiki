import { findHandbookContext } from '@/lib/handbook-context';

const API_GATEWAY_URL = 'https://f391uenu7a.execute-api.us-east-1.amazonaws.com/prod/chat';

export const runtime = 'nodejs';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

function isChatMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== 'object') return false;
  const message = value as Record<string, unknown>;
  return (
    (message.role === 'user' || message.role === 'assistant') &&
    typeof message.content === 'string' &&
    message.content.trim().length > 0 &&
    message.content.length <= 5_000
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    messages?: unknown;
  } | null;

  if (
    !Array.isArray(body?.messages) ||
    body.messages.length === 0 ||
    body.messages.length > 20 ||
    !body.messages.every(isChatMessage)
  ) {
    return Response.json({ error: 'A valid conversation is required.' }, { status: 400 });
  }

  const messages = body.messages as ChatMessage[];
  const latestUserMessage = messages.findLast(({ role }) => role === 'user');
  if (!latestUserMessage) {
    return Response.json({ error: 'A user message is required.' }, { status: 400 });
  }

  try {
    const context = await findHandbookContext([latestUserMessage.content]);

    const resp = await fetch(API_GATEWAY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: latestUserMessage.content,
        history: messages.slice(0, -1).map(({ role, content }) => ({ role, content })),
        context: context.text || undefined,
      }),
      signal: request.signal,
    });

    if (!resp.ok) {
      const data = await resp.json().catch(() => ({}));
      return Response.json(
        { error: data.error || 'Failed to get response from AI model.' },
        { status: resp.status },
      );
    }

    const data = await resp.json();

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode(data.reply));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
      },
    });
  } catch (error) {
    console.error('API Gateway request failed', error);
    return Response.json(
      { error: 'Ask AFE could not generate a response. Please try again.' },
      { status: 503 },
    );
  }
}
