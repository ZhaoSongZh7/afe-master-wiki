'use client';

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';
import { ArrowUp, BookOpen, MessageCircleQuestion, Sparkles } from 'lucide-react';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

const suggestions = [
  'What should I do before my first day?',
  'How do expenses and reimbursement work?',
  'Where can I find health and wellness resources?',
];

export function AskAiChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
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
    <main className="relative flex min-h-[calc(100vh-4rem)] flex-1 overflow-hidden bg-[#f7f8fa] dark:bg-fd-background">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-[#e8efff] to-transparent dark:from-[#121d40]" />
      <div className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 sm:px-6">
        <header className="flex items-center gap-3 border-b border-[#dfe3ea] py-5 dark:border-fd-border">
          <span className="flex size-10 items-center justify-center rounded-xl bg-[#172b5f] text-white shadow-sm">
            <Sparkles className="size-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-semibold text-[#172b5f] dark:text-white">Ask AFE</h1>
              <span className="rounded-full bg-[#e7edff] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#3755a5] dark:bg-[#202e57] dark:text-[#b8c6f5]">
                Preview
              </span>
            </div>
            <p className="text-xs text-fd-muted-foreground">Your AFE Handbook assistant</p>
          </div>
        </header>

        <section
          aria-live="polite"
          className="flex flex-1 flex-col overflow-y-auto py-8 sm:py-10"
        >
          {messages.length === 0 ? (
            <div className="my-auto flex flex-col items-center text-center">
              <span className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#172b5f] to-[#5272c9] text-white shadow-lg shadow-[#172b5f]/15">
                <MessageCircleQuestion className="size-8" />
              </span>
              <h2 className="mt-6 text-2xl font-semibold tracking-tight text-[#172b5f] dark:text-white sm:text-3xl">
                Hi, how can I help?
              </h2>
              <p className="mt-2 max-w-lg text-sm leading-6 text-fd-muted-foreground sm:text-base">
                Ask a question and I&apos;ll search the AFE Handbook for the most relevant information.
              </p>

              <div className="mt-8 grid w-full max-w-3xl gap-3 sm:grid-cols-3">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => void sendMessage(suggestion)}
                    className="group flex min-h-28 flex-col justify-between rounded-2xl border border-[#dfe3ea] bg-white p-4 text-left text-sm font-medium text-[#172b5f] shadow-sm transition hover:-translate-y-0.5 hover:border-[#8ca3df] hover:shadow-md dark:border-fd-border dark:bg-fd-card dark:text-fd-foreground"
                  >
                    <BookOpen className="size-5 text-[#5272c9] transition-transform group-hover:scale-110" />
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
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#172b5f] text-white">
                      <Sparkles className="size-4" />
                    </span>
                  )}
                  <div
                    className={
                      message.role === 'user'
                        ? 'max-w-[85%] rounded-2xl rounded-br-md bg-[#172b5f] px-4 py-3 text-sm leading-6 text-white sm:max-w-[70%]'
                        : 'max-w-[85%] rounded-2xl rounded-bl-md border border-[#dfe3ea] bg-white px-4 py-3 text-sm leading-6 text-fd-foreground shadow-sm dark:border-fd-border dark:bg-fd-card'
                    }
                  >
                    {message.content || (
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
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </section>

        <div className="sticky bottom-0 bg-gradient-to-t from-[#f7f8fa] via-[#f7f8fa] to-transparent pb-5 pt-5 dark:from-fd-background dark:via-fd-background">
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
