'use client';

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeft, ArrowUp, BookOpen, Check, ClipboardCopy, Download, Sparkles, ThumbsDown, ThumbsUp } from 'lucide-react';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

type Reaction = 'like' | 'dislike' | null;

const suggestions = [
  'What should I do before my first day?',
  'How do expenses and reimbursement work?',
  'Where can I find health and wellness resources?',
];

export function AskAiChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [reactions, setReactions] = useState<Record<string, Reaction>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(rawMessage: string) {
    const message = rawMessage.trim();
    if (!message || isStreaming) return;

    const requestId = crypto.randomUUID();
    const assistantId = `${requestId}-assistant`;
    const userMessage: Message = { id: requestId, role: 'user', content: message };
    const conversation = [...messages, userMessage];
    setInput('');
    setIsStreaming(true);
    setMessages([
      ...conversation,
      { id: assistantId, role: 'assistant', content: '' },
    ]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: conversation.map(({ role, content }) => ({ role, content })),
        }),
      });

      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(result?.error ?? 'Unable to start the response stream.');
      }
      if (!response.body) {
        throw new Error('Unable to start the response stream.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        setMessages((current) =>
          current.map((item) =>
            item.id === assistantId
              ? { ...item, content: item.content + chunk }
              : item,
          ),
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Something went wrong. Please try again.';
      setMessages((current) =>
        current.map((item) =>
          item.id === assistantId
            ? { ...item, content: errorMessage }
            : item,
        ),
      );
    } finally {
      setIsStreaming(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(input);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void sendMessage(input);
    }
  }

  return (
    <main className="relative flex h-dvh flex-col overflow-hidden bg-[#f7f8fa] dark:bg-fd-background">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-[#e8efff] via-[#f2f5fd] to-transparent dark:from-[#121d40] dark:via-transparent" />
      <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-[#5272c9]/10 blur-3xl dark:bg-[#5272c9]/15" />
      <div className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col overflow-hidden px-4 sm:px-6">
        <div className="shrink-0 pt-4">
          <Link
            href="/docs"
            aria-label="Back to the wiki"
            className="inline-flex size-10 items-center justify-center rounded-full border border-transparent text-[#172b5f] transition hover:border-[#dfe3ea] hover:bg-white hover:shadow-sm dark:text-fd-foreground dark:hover:border-fd-border dark:hover:bg-fd-card"
          >
            <ArrowLeft className="size-5" />
          </Link>
        </div>

        <section
          aria-live="polite"
          className="flex min-h-0 flex-1 flex-col overflow-y-auto py-8 scrollbar-hide sm:py-10 [&]:[-ms-overflow-style:none] [&]:[scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {messages.length === 0 ? (
            <div className="my-auto flex flex-col items-center text-center">
              <span className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#172b5f] to-[#5272c9] text-white shadow-lg shadow-[#172b5f]/20 ring-4 ring-white/60 dark:ring-white/5">
                <Sparkles className="size-8" />
              </span>
              <h2 className="mt-6 text-3xl font-semibold tracking-tight text-[#172b5f] dark:text-white sm:text-4xl">
                Hi, how can I help?
              </h2>
              <p className="mt-3 max-w-lg text-sm leading-6 text-fd-muted-foreground sm:text-base">
                Ask a question and I&apos;ll search the AFE Handbook for the most relevant information.
              </p>

              <div className="mt-10 grid w-full max-w-3xl gap-3 sm:grid-cols-3">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => void sendMessage(suggestion)}
                    className="group flex min-h-28 flex-col justify-between gap-3 rounded-2xl border border-[#dfe3ea] bg-white/80 p-4 text-left text-sm font-medium text-[#172b5f] shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:border-[#8ca3df] hover:shadow-md dark:border-fd-border dark:bg-fd-card dark:text-fd-foreground"
                  >
                    <span className="flex size-8 items-center justify-center rounded-lg bg-[#e7edff] text-[#3755a5] transition-colors group-hover:bg-[#5272c9] group-hover:text-white dark:bg-[#202e57] dark:text-[#b8c6f5]">
                      <BookOpen className="size-4" />
                    </span>
                    <span>{suggestion}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#172b5f] to-[#5272c9] text-white shadow-sm">
                      <Sparkles className="size-4" />
                    </span>
                  )}
                  <div className="flex max-w-[85%] flex-col sm:max-w-[70%]">
                    <div
                      className={
                        message.role === 'user'
                          ? 'whitespace-pre-wrap rounded-2xl rounded-br-md bg-[#172b5f] px-4 py-3 text-sm leading-6 text-white shadow-sm'
                          : 'rounded-2xl rounded-bl-md border border-[#dfe3ea] bg-white px-4 py-3 text-sm leading-6 text-fd-foreground shadow-sm dark:border-fd-border dark:bg-fd-card'
                      }
                    >
                      {message.role === 'assistant' && message.content ? (
                        <div className="prose prose-sm max-w-none text-sm leading-6 [&_a]:text-[#3755a5] [&_a]:underline [&_a]:underline-offset-2 dark:[&_a]:text-[#b8c6f5] [&_pre]:overflow-x-auto [&>:first-child]:mt-0 [&>:last-child]:mb-0">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        message.content
                      )}
                      {!message.content && (
                        <span className="inline-flex gap-1" aria-label="Generating response">
                          <span className="size-1.5 animate-bounce rounded-full bg-[#5272c9]" />
                          <span className="size-1.5 animate-bounce rounded-full bg-[#5272c9] [animation-delay:120ms]" />
                          <span className="size-1.5 animate-bounce rounded-full bg-[#5272c9] [animation-delay:240ms]" />
                        </span>
                      )}
                      {isStreaming && message.role === 'assistant' && message.content && (
                        <span className="ml-1 inline-block h-4 w-0.5 animate-pulse bg-[#5272c9] align-middle" />
                      )}
                    </div>
                    {message.role === 'assistant' && message.content && !isStreaming && (
                      <div className="mt-1.5 flex items-center gap-1 pl-1">
                        <button
                          type="button"
                          aria-label={copiedId === message.id ? 'Copied' : 'Copy response'}
                          onClick={() => {
                            void navigator.clipboard.writeText(message.content);
                            setCopiedId(message.id);
                            setTimeout(() => setCopiedId(null), 2000);
                          }}
                          className={`flex size-7 items-center justify-center rounded-md transition ${copiedId === message.id ? 'text-green-600 dark:text-green-400' : 'text-[#4a5568] hover:bg-[#e7edff] hover:text-[#172b5f] dark:text-fd-muted-foreground dark:hover:bg-fd-accent dark:hover:text-fd-foreground'}`}
                        >
                          {copiedId === message.id ? <Check className="size-4" /> : <ClipboardCopy className="size-4" />}
                        </button>
                        <button
                          type="button"
                          aria-label="Download response"
                          onClick={() => {
                            const blob = new Blob([message.content], { type: 'text/plain' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = 'response.txt';
                            a.click();
                            URL.revokeObjectURL(url);
                          }}
                          className="flex size-7 items-center justify-center rounded-md text-[#4a5568] transition hover:bg-[#e7edff] hover:text-[#172b5f] dark:text-fd-muted-foreground dark:hover:bg-fd-accent dark:hover:text-fd-foreground"
                        >
                          <Download className="size-4" />
                        </button>
                        <button
                          type="button"
                          aria-label="Like response"
                          onClick={() => setReactions((prev) => ({ ...prev, [message.id]: prev[message.id] === 'like' ? null : 'like' }))}
                          className={`flex size-7 items-center justify-center rounded-md transition ${reactions[message.id] === 'like' ? 'bg-[#e7edff] text-[#172b5f] dark:bg-fd-accent dark:text-fd-foreground' : 'text-[#4a5568] hover:bg-[#e7edff] hover:text-[#172b5f] dark:text-fd-muted-foreground dark:hover:bg-fd-accent dark:hover:text-fd-foreground'}`}
                        >
                          <ThumbsUp className="size-4" />
                        </button>
                        <button
                          type="button"
                          aria-label="Dislike response"
                          onClick={() => setReactions((prev) => ({ ...prev, [message.id]: prev[message.id] === 'dislike' ? null : 'dislike' }))}
                          className={`flex size-7 items-center justify-center rounded-md transition ${reactions[message.id] === 'dislike' ? 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400' : 'text-[#4a5568] hover:bg-[#e7edff] hover:text-[#172b5f] dark:text-fd-muted-foreground dark:hover:bg-fd-accent dark:hover:text-fd-foreground'}`}
                        >
                          <ThumbsDown className="size-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </section>

        <div className="shrink-0 pb-3 pt-3">
          <form
            onSubmit={handleSubmit}
            className="mx-auto flex w-full max-w-3xl items-end gap-2 rounded-2xl border border-[#cbd2df] bg-white p-2 shadow-[0_8px_30px_rgba(23,43,95,0.12)] focus-within:border-[#5272c9] focus-within:ring-2 focus-within:ring-[#5272c9]/15 dark:border-fd-border dark:bg-fd-card"
          >
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about the AFE program..."
              aria-label="Message Ask AFE"
              rows={1}
              disabled={isStreaming}
              className="max-h-32 min-h-11 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm text-fd-foreground outline-none placeholder:text-fd-muted-foreground disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              disabled={!input.trim() || isStreaming}
              aria-label="Send message"
              className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#172b5f] text-white transition hover:bg-[#223c7b] disabled:cursor-not-allowed disabled:opacity-35"
            >
              <ArrowUp className="size-5" />
            </button>
          </form>
          <p className="mx-auto mt-2 max-w-3xl text-center text-[11px] text-fd-muted-foreground">
            Ask AFE is a preview and may not have answers yet. Verify important information in the handbook.
          </p>
        </div>
      </div>
    </main>
  );
}
