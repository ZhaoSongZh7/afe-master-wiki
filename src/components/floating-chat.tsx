'use client';

import {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowUp, Maximize2, Sparkles, X } from 'lucide-react';

/**
 * Floating "Ask Relay" assistant — a circular logo bubble pinned to the
 * bottom-right that opens a compact chat panel. Lets people ask questions
 * without leaving the doc they're reading.
 *
 * Reuses the SAME /api/chat streaming contract as the full-page assistant, so
 * there are no backend changes — it talks to Bedrock exactly like /ask-ai.
 */

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

const SUGGESTIONS = [
  'What do I bring on day one?',
  'How do I request PTO?',
  'Recommend an easy hike near Seattle',
];

export function FloatingChat() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Don't show the bubble on the full-page assistant — it would be redundant.
  if (pathname === '/ask-ai') return null;

  async function sendMessage(raw: string) {
    const message = raw.trim();
    if (!message || isStreaming) return;

    const id = crypto.randomUUID();
    const assistantId = `${id}-a`;
    const conversation = [...messages, { id, role: 'user' as const, content: message }];
    setInput('');
    setIsStreaming(true);
    setMessages([...conversation, { id: assistantId, role: 'assistant', content: '' }]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: conversation.map(({ role, content }) => ({ role, content })),
        }),
      });

      if (!res.ok || !res.body) {
        const result = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(result?.error ?? 'Unable to reach Ask Relay right now.');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((cur) =>
          cur.map((m) => (m.id === assistantId ? { ...m, content: m.content + chunk } : m)),
        );
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Something went wrong. Please try again.';
      setMessages((cur) => cur.map((m) => (m.id === assistantId ? { ...m, content: msg } : m)));
    } finally {
      setIsStreaming(false);
    }
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    void sendMessage(input);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void sendMessage(input);
    }
  }

  return (
    <>
      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-5 z-[60] flex h-[32rem] max-h-[calc(100dvh-7rem)] w-[calc(100vw-2.5rem)] max-w-96 flex-col overflow-hidden rounded-2xl border border-fd-border bg-fd-popover shadow-2xl">
          {/* header */}
          <div className="flex items-center justify-between gap-2 border-b border-fd-border px-4 py-3" style={{ backgroundColor: '#0d2d7d' }}>
            <span className="flex items-center gap-2 font-semibold text-white">
              <Sparkles className="size-4" style={{ color: '#f55c38' }} />
              Ask Relay
            </span>
            <div className="flex items-center gap-1">
              <Link
                href="/ask-ai"
                aria-label="Open full assistant"
                className="flex size-7 items-center justify-center rounded-md text-white/80 transition hover:bg-white/15 hover:text-white"
              >
                <Maximize2 className="size-4" />
              </Link>
              <button
                type="button"
                aria-label="Close chat"
                onClick={() => setOpen(false)}
                className="flex size-7 items-center justify-center rounded-md text-white/80 transition hover:bg-white/15 hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          {/* messages */}
          <div className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <span className="flex size-12 items-center justify-center rounded-2xl text-white" style={{ backgroundColor: '#0d2d7d' }}>
                  <Sparkles className="size-6" style={{ color: '#f55c38' }} />
                </span>
                <p className="mt-3 text-sm font-medium text-fd-foreground">Ask about the AFE program</p>
                <p className="mt-1 text-xs text-fd-muted-foreground">
                  I&apos;ll search the handbook for you.
                </p>
                <div className="mt-4 flex w-full flex-col gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => void sendMessage(s)}
                      className="rounded-lg border border-fd-border bg-fd-card px-3 py-2 text-left text-xs font-medium text-fd-foreground transition hover:bg-fd-accent"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m) => (
                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={
                      m.role === 'user'
                        ? 'max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-sm px-3 py-2 text-sm text-white'
                        : 'max-w-[85%] rounded-2xl rounded-bl-sm border border-fd-border bg-fd-card px-3 py-2 text-sm text-fd-foreground'
                    }
                    style={m.role === 'user' ? { backgroundColor: '#0d2d7d' } : undefined}
                  >
                    {m.role === 'assistant' && m.content ? (
                      <div className="prose prose-sm max-w-none text-sm leading-6 [&_a]:font-medium [&_a]:underline [&_a]:underline-offset-2 [&_a]:[color:#f55c38] [&_pre]:overflow-x-auto [&_code]:text-[0.85em] [&>:first-child]:mt-0 [&>:last-child]:mb-0 dark:prose-invert">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                      </div>
                    ) : m.role === 'user' ? (
                      m.content
                    ) : (
                      <span className="inline-flex gap-1" aria-label="Generating response">
                        <span className="size-1.5 animate-bounce rounded-full" style={{ backgroundColor: '#f55c38' }} />
                        <span className="size-1.5 animate-bounce rounded-full [animation-delay:120ms]" style={{ backgroundColor: '#f55c38' }} />
                        <span className="size-1.5 animate-bounce rounded-full [animation-delay:240ms]" style={{ backgroundColor: '#f55c38' }} />
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={endRef} />
          </div>

          {/* input */}
          <form onSubmit={handleSubmit} className="flex items-end gap-2 border-t border-fd-border p-3">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question…"
              aria-label="Ask Relay a question"
              rows={1}
              disabled={isStreaming}
              className="max-h-24 min-h-9 flex-1 resize-none rounded-lg border border-fd-border bg-fd-background px-3 py-2 text-sm text-fd-foreground outline-none placeholder:text-fd-muted-foreground focus:border-fd-ring disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={!input.trim() || isStreaming}
              aria-label="Send"
              className="flex size-9 shrink-0 items-center justify-center rounded-lg text-white transition hover:opacity-90 disabled:opacity-40"
              style={{ backgroundColor: '#f55c38' }}
            >
              <ArrowUp className="size-5" />
            </button>
          </form>
          <p className="px-3 pb-2 text-center text-[10px] text-fd-muted-foreground">
            Ask Relay is a preview — verify important info in the handbook.
          </p>
        </div>
      )}

      {/* Bubble button */}
      <button
        type="button"
        data-tour="chat-bubble"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close Ask Relay' : 'Open Ask Relay'}
        aria-expanded={open}
        className="fixed bottom-5 right-5 z-[60] flex size-14 items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-black/5 transition hover:scale-105 dark:bg-fd-card dark:ring-white/10"
      >
        {open ? (
          <X className="size-6" style={{ color: '#0d2d7d' }} />
        ) : (
          <img src="/relay-light-trim.png" alt="Ask Relay" className="size-9 object-contain" />
        )}
      </button>
    </>
  );
}
