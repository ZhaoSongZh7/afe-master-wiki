'use client';

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeft, ArrowUp, BookOpen, Check, ClipboardCopy, Download, Sparkles, Square, ThumbsDown, ThumbsUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

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
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [reactions, setReactions] = useState<Record<string, Reaction>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isStreaming = streamingMessageId !== null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: isStreaming ? 'auto' : 'smooth' });
  }, [isStreaming, messages]);

  async function sendMessage(rawMessage: string) {
    const message = rawMessage.trim();
    if (!message || isStreaming) return;

    const requestId = crypto.randomUUID();
    const assistantId = `${requestId}-assistant`;
    const abortController = new AbortController();
    const userMessage: Message = { id: requestId, role: 'user', content: message };
    const conversation = [...messages, userMessage];
    abortControllerRef.current = abortController;
    setInput('');
    setStreamingMessageId(assistantId);
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
        signal: abortController.signal,
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
      setMessages((current) =>
        current.map((item) => {
          if (item.id !== assistantId) return item;
          if (abortController.signal.aborted) {
            return item.content ? item : { ...item, content: '_Response stopped._' };
          }
          const errorMessage =
            error instanceof Error
              ? error.message
              : 'Something went wrong. Please try again.';
          return { ...item, content: errorMessage };
        }),
      );
    } finally {
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
      }
      setStreamingMessageId((current) => current === assistantId ? null : current);
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
    <main className="relative flex h-dvh flex-col overflow-hidden bg-fd-background">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(ellipse_at_top,_var(--relay-signal-soft),_transparent_65%)]" />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--relay-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--relay-border)_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-40 [mask-image:linear-gradient(to_bottom,black_5%,transparent_78%)]" />
      <div className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col overflow-hidden px-4 sm:px-6">
        <header className="flex shrink-0 items-center justify-between border-b border-fd-border/60 py-4">
          <Link
            href="/docs"
            aria-label="Back to the wiki"
            className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-foreground"
          >
            <ArrowLeft className="size-4" />
            <span className="hidden sm:inline">Back to handbook</span>
          </Link>
          <Badge variant="outline" className="bg-fd-card/70 shadow-sm">
            <Sparkles className="size-3.5 text-fd-primary" />
            Relay AI
          </Badge>
        </header>

        <section
          aria-live="polite"
          className="flex min-h-0 flex-1 flex-col overflow-y-auto py-8 scrollbar-hide sm:py-10 [&]:[-ms-overflow-style:none] [&]:[scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {messages.length === 0 ? (
            <div className="my-auto flex flex-col items-center text-center">
              <span className="flex size-16 items-center justify-center rounded-2xl bg-fd-primary text-white shadow-lg shadow-fd-primary/20 ring-8 ring-fd-accent">
                <Sparkles className="size-8" />
              </span>
              <Badge className="mt-6">Search-powered answers</Badge>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-fd-foreground sm:text-4xl">
                What can I help you find?
              </h2>
              <p className="mt-3 max-w-lg text-sm leading-6 text-fd-muted-foreground sm:text-base">
                Ask a question and I&apos;ll search the AFE Handbook for the most relevant information.
              </p>

              <Card className="mt-10 w-full max-w-3xl bg-fd-card/80 shadow-lg shadow-fd-primary/5 backdrop-blur">
                <CardContent className="grid gap-3 p-3 sm:grid-cols-3">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => void sendMessage(suggestion)}
                    className="group flex min-h-28 flex-col justify-between gap-3 rounded-xl border border-fd-border bg-fd-background p-4 text-left text-sm font-medium text-fd-foreground transition-all hover:-translate-y-0.5 hover:border-fd-primary/50 hover:bg-fd-accent hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring"
                  >
                    <span className="flex size-8 items-center justify-center rounded-lg bg-fd-accent text-fd-primary transition-colors group-hover:bg-fd-primary group-hover:text-white">
                      <BookOpen className="size-4" />
                    </span>
                    <span>{suggestion}</span>
                  </button>
                ))}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-fd-primary text-white shadow-sm shadow-fd-primary/20">
                      <Sparkles className="size-4" />
                    </span>
                  )}
                  <div className="flex max-w-[85%] flex-col sm:max-w-[70%]">
                    <div
                      className={
                        message.role === 'user'
                          ? 'whitespace-pre-wrap rounded-2xl rounded-br-md bg-fd-foreground px-4 py-3 text-sm leading-6 text-fd-background shadow-sm'
                          : 'rounded-2xl rounded-bl-md border border-fd-border bg-fd-card px-4 py-3 text-sm leading-6 text-fd-foreground shadow-sm'
                      }
                    >
                      {message.role === 'assistant' && message.content ? (
                        <div className="prose prose-sm max-w-none text-sm leading-6 [&_a]:text-fd-primary [&_a]:underline [&_a]:underline-offset-2 [&_pre]:overflow-x-auto [&>:first-child]:mt-0 [&>:last-child]:mb-0">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              a: ({ href, title, children }) => (
                                <a href={href} title={title} target="_blank" rel="noopener noreferrer">
                                  {children}
                                </a>
                              ),
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        message.content
                      )}
                      {!message.content && (
                        <span className="flex items-center gap-2 text-relay-ink-muted" aria-label="Generating response">
                          <span className="relay-pulse h-0.5 w-10 rounded-full bg-relay-signal" aria-hidden />
                          <span className="text-xs">Searching the handbook…</span>
                        </span>
                      )}
                      {streamingMessageId === message.id && message.content && (
                        <span className="ml-1 inline-block h-4 w-0.5 animate-pulse bg-fd-primary align-middle" />
                      )}
                    </div>
                    {message.role === 'assistant' && message.content && streamingMessageId !== message.id && (
                      <div className="mt-1.5 flex items-center gap-1 pl-1">
                        <button
                          type="button"
                          aria-label={copiedId === message.id ? 'Copied' : 'Copy response'}
                          onClick={() => {
                            void navigator.clipboard.writeText(message.content);
                            setCopiedId(message.id);
                            setTimeout(() => setCopiedId(null), 2000);
                          }}
                          className={`flex size-7 items-center justify-center rounded-md transition ${copiedId === message.id ? 'text-green-600 dark:text-green-400' : 'text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-foreground'}`}
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
                          className="flex size-7 items-center justify-center rounded-md text-fd-muted-foreground transition hover:bg-fd-accent hover:text-fd-foreground"
                        >
                          <Download className="size-4" />
                        </button>
                        <button
                          type="button"
                          aria-label="Like response"
                          onClick={() => setReactions((prev) => ({ ...prev, [message.id]: prev[message.id] === 'like' ? null : 'like' }))}
                          className={`flex size-7 items-center justify-center rounded-md transition ${reactions[message.id] === 'like' ? 'bg-fd-accent text-fd-foreground' : 'text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-foreground'}`}
                        >
                          <ThumbsUp className="size-4" />
                        </button>
                        <button
                          type="button"
                          aria-label="Dislike response"
                          onClick={() => setReactions((prev) => ({ ...prev, [message.id]: prev[message.id] === 'dislike' ? null : 'dislike' }))}
                          className={`flex size-7 items-center justify-center rounded-md transition ${reactions[message.id] === 'dislike' ? 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400' : 'text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-foreground'}`}
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
            className="mx-auto flex w-full max-w-3xl items-end gap-2 rounded-2xl border border-fd-border bg-fd-card p-2 shadow-lg shadow-fd-primary/10 focus-within:border-fd-primary focus-within:ring-2 focus-within:ring-fd-primary/15"
          >
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isStreaming ? 'You can type your next question…' : 'Ask about the AFE program...'}
              aria-label="Message Ask AFE"
              rows={1}
              className="max-h-32 min-h-11 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm text-fd-foreground outline-none placeholder:text-fd-muted-foreground"
            />
            {isStreaming ? (
              <Button
                type="button"
                size="icon"
                onClick={() => abortControllerRef.current?.abort()}
                aria-label="Stop generating"
                className="shrink-0 rounded-xl"
              >
                <Square className="size-4 fill-current" />
              </Button>
            ) : (
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim()}
                aria-label="Send message"
                className="shrink-0 rounded-xl"
              >
                <ArrowUp className="size-5" />
              </Button>
            )}
          </form>
          <p className="mx-auto mt-2 max-w-3xl text-center text-[11px] text-fd-muted-foreground">
            Ask AFE is a preview and may not have answers yet. Verify important information in the handbook.
          </p>
        </div>
      </div>
    </main>
  );
}
