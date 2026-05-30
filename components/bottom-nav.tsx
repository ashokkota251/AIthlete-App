"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { Home, ListChecks, Sparkles, MessageSquare, User } from "lucide-react";

const tabs = [
  { href: "/dashboard", label: "Home", Icon: Home },
  { href: "/activities", label: "Activity", Icon: ListChecks },
  { href: "/analysis", label: "Analyse", Icon: Sparkles },
  { href: "/coach", label: "Coach", Icon: MessageSquare },
  { href: "/profile", label: "Profile", Icon: User },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 z-30 w-full max-w-[var(--app-max)] px-3 pb-[calc(env(safe-area-inset-bottom,0px)+10px)]"
      aria-label="Primary"
    >
      <div className="relative bg-paper/85 backdrop-blur-xl border border-ink-100/60 rounded-pill shadow-card flex items-center justify-around px-2 py-1.5">
        {tabs.map(({ href, label, Icon }) => {
          const active = pathname?.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex flex-col items-center gap-0.5 py-2 px-3 rounded-pill transition-colors",
                "min-w-[52px]",
                active ? "text-coral" : "text-ink-400 hover:text-ink-700",
              )}
            >
              <Icon size={20} strokeWidth={active ? 2.4 : 2} />
              <span className="text-[10px] font-medium tracking-wider uppercase">
                {label}
              </span>
              {active && (
                <span
                  aria-hidden
                  className="absolute -top-1 left-1/2 -translate-x-1/2 w-6 h-[2px] rounded-full bg-coral"
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
