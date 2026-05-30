"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";

type ChatMessage = { role: "user" | "assistant"; content: string };

const STARTERS = [
  "Should I run today?",
  "Plan my next week",
  "Am I overdoing tempo?",
  "How was this week vs last?",
];

const SEED_MESSAGES: ChatMessage[] = [
  {
    role: "assistant",
    content:
      "Welcome back. I've read your last 10 sessions — solid endurance week. What do you want to dig into?",
  },
];

export function ChatWindow({ athleteFirstName }: { athleteFirstName: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>(SEED_MESSAGES);
  const [input, setInput] = useState("");
  const [pending, start] = useTransition();
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
    }
  }, [messages, pending]);

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || pending) return;
    const next: ChatMessage[] = [...messages, { role: "user", content: trimmed }];
    setMessages(next);
    setInput("");
    start(async () => {
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: next }),
        });
        const json = (await res.json()) as { message: string };
        setMessages((m) => [...m, { role: "assistant", content: json.message }]);
      } catch {
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            content: "I lost the connection for a second — try that again?",
          },
        ]);
      }
    });
  }

  return (
    <div
      className="flex flex-col"
      style={{ height: "calc(100dvh - 24px - 110px)", minHeight: "560px" }}
    >
      {/* Header */}
      <header className="rise flex items-center justify-between mb-3">
        <div>
          <div className="eyebrow mb-1 flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulseDot" />
            Online · grounded on your data
          </div>
          <h1 className="font-display-wide text-[28px] leading-[1] text-ink-900">
            Coach<span className="text-coral">.</span>
          </h1>
        </div>
        <span className="size-10 rounded-2xl bg-coral text-white grid place-items-center shadow-glow">
          <Sparkles size={18} />
        </span>
      </header>

      <div className="rule-coral rise delay-1 mb-4" />

      {/* Messages */}
      <div ref={scrollerRef} className="flex-1 space-y-3 overflow-y-auto scroll-hidden pb-4">
        {messages.map((m, i) => (
          <Bubble key={i} role={m.role} delay={Math.min(i, 5)}>
            {m.content}
          </Bubble>
        ))}
        {pending && (
          <Bubble role="assistant" delay={0}>
            <Typing />
          </Bubble>
        )}
      </div>

      {/* Starter chips (only on fresh thread) */}
      {messages.length <= 1 && !pending && (
        <div className="rise delay-3 mb-3 flex gap-2 overflow-x-auto scroll-hidden -mx-1 px-1">
          {STARTERS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="shrink-0 text-[12px] px-3 py-2 rounded-pill border border-coral-100 bg-coral-50/70 text-coral-700 font-medium hover:bg-coral-50"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="rise delay-4 flex items-center gap-2 bg-paper rounded-pill border border-ink-100 px-2 py-1.5 shadow-card"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Ask ${athleteFirstName}'s coach…`}
          className="flex-1 bg-transparent px-3 py-2 text-sm placeholder:text-ink-300"
        />
        <button
          type="submit"
          disabled={pending || !input.trim()}
          className={cn(
            "size-9 rounded-full grid place-items-center text-white transition-transform shrink-0",
            input.trim() && !pending ? "shadow-glow hover:scale-105" : "opacity-50",
          )}
          style={{ background: "linear-gradient(135deg, #FF8A4D 0%, #F2541B 60%, #D8400B 100%)" }}
          aria-label="Send"
        >
          <Send size={15} strokeWidth={2.4} />
        </button>
      </form>
    </div>
  );
}

function Bubble({
  role,
  delay = 0,
  children,
}: {
  role: "user" | "assistant";
  delay?: number;
  children: React.ReactNode;
}) {
  const isUser = role === "user";
  return (
    <div
      className={cn("flex rise", isUser ? "justify-end" : "justify-start")}
      style={{ animationDelay: `${0.04 + delay * 0.05}s` }}
    >
      <div
        className={cn(
          "max-w-[80%] px-4 py-2.5 rounded-2xl text-[14px] leading-relaxed",
          isUser
            ? "text-white rounded-br-md"
            : "bg-paper text-ink-900 rounded-bl-md shadow-card border border-ink-100/60",
        )}
        style={
          isUser
            ? { background: "linear-gradient(135deg, #FF8A4D 0%, #F2541B 70%, #D8400B 100%)" }
            : undefined
        }
      >
        {children}
      </div>
    </div>
  );
}

function Typing() {
  return (
    <span className="inline-flex items-center gap-1 py-1">
      <Dot delay={0} />
      <Dot delay={150} />
      <Dot delay={300} />
    </span>
  );
}

function Dot({ delay }: { delay: number }) {
  return (
    <span
      className="size-1.5 rounded-full bg-coral animate-pulseDot"
      style={{ animationDelay: `${delay}ms` }}
    />
  );
}
