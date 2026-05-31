"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";
import { renderMarkdown } from "@/lib/markdown";

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
      "Welcome back. I've read your last 10 sessions and your training load — what do you want to dig into?",
  },
];

export function ChatWindow({ athleteFirstName }: { athleteFirstName: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>(SEED_MESSAGES);
  const [input, setInput] = useState("");
  const [pending, start] = useTransition();
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const seededFromUrl = useRef(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
    }
  }, [messages, pending]);

  // Deep-link prefill: /coach?q=... auto-sends the question once.
  useEffect(() => {
    if (seededFromUrl.current) return;
    const q = searchParams?.get("q");
    if (q && q.trim().length > 0) {
      seededFromUrl.current = true;
      send(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

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
      <header className="reveal flex items-center justify-between mb-3">
        <div>
          <div className="eyebrow flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-good animate-pulseDot" />
            Online · grounded on your data
          </div>
          <h1 className="mt-1.5 font-display font-bold text-[28px] leading-[1]">
            Coach<span className="text-coral">.</span>
          </h1>
        </div>
        <span
          className="size-11 rounded-2xl text-white grid place-items-center shadow-glow"
          style={{ background: "linear-gradient(135deg, #FF8A3D 0%, #F2541B 60%, #C8420F 100%)" }}
        >
          <Sparkles size={20} strokeWidth={2.2} />
        </span>
      </header>

      <div className="rule-coral reveal delay-1 mb-3" />

      {/* Messages */}
      <div
        ref={scrollerRef}
        className="flex-1 space-y-3 overflow-y-auto scroll-hidden pb-4"
      >
        {messages.map((m, i) => (
          <Bubble key={i} role={m.role} delay={Math.min(i, 5)} content={m.content} />
        ))}
        {pending && (
          <CoachBubbleShell delay={0}>
            <Typing />
          </CoachBubbleShell>
        )}
      </div>

      {/* Starter chips (only on fresh thread) */}
      {messages.length <= 1 && !pending && (
        <div className="reveal delay-3 mb-3 flex gap-2 overflow-x-auto scroll-hidden -mx-1 px-1">
          {STARTERS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="shrink-0 text-[12px] px-3 py-2 rounded-pill border border-coral-100 bg-coral-50/70 text-coral-700 font-semibold hover:bg-coral-50 transition-colors"
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
        className="reveal delay-4 flex items-center gap-2 bg-paper rounded-pill border border-line px-2 py-1.5 shadow-soft"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Ask ${athleteFirstName}'s coach…`}
          className="flex-1 bg-transparent px-3 py-2 text-[14px] placeholder:text-ink-300"
        />
        <button
          type="submit"
          disabled={pending || !input.trim()}
          className={cn(
            "size-9 rounded-full grid place-items-center text-white transition-transform shrink-0",
            input.trim() && !pending ? "shadow-glow hover:scale-105" : "opacity-50",
          )}
          style={{ background: "linear-gradient(135deg, #FF8A3D 0%, #F2541B 60%, #C8420F 100%)" }}
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
  content,
}: {
  role: "user" | "assistant";
  delay?: number;
  content: string;
}) {
  if (role === "user") {
    return (
      <div
        className="flex justify-end reveal"
        style={{ animationDelay: `${0.04 + delay * 0.05}s` }}
      >
        <div
          className="max-w-[78%] px-4 py-2.5 rounded-2xl rounded-br-md text-white text-[14px] leading-relaxed shadow-soft"
          style={{ background: "linear-gradient(135deg, #FF8A3D 0%, #F2541B 70%, #C8420F 100%)" }}
        >
          {content}
        </div>
      </div>
    );
  }

  return (
    <CoachBubbleShell delay={delay}>
      <div
        className="md-coach"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
      />
    </CoachBubbleShell>
  );
}

function CoachBubbleShell({
  delay,
  children,
}: {
  delay: number;
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex gap-2.5 reveal"
      style={{ animationDelay: `${0.04 + delay * 0.05}s` }}
    >
      <span
        className="size-[30px] rounded-xl bg-coral-soft grid place-items-center text-coral shrink-0 mt-1"
        aria-hidden
      >
        <Sparkles size={14} strokeWidth={2.2} />
      </span>
      <div className="flex-1 min-w-0 max-w-[calc(100%-42px)]">
        <div className="bg-paper text-ink rounded-2xl rounded-tl-md shadow-soft border border-line px-4 py-3">
          {children}
        </div>
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
