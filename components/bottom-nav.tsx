"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  House,
  Footprints,
  ChartLine,
  MessageCircle,
  CircleUserRound,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";

interface Tab {
  href: string;
  label: string;
  Icon: LucideIcon;
  matchPrefix?: string[];
}

const TABS: Tab[] = [
  { href: "/dashboard", label: "Home", Icon: House },
  { href: "/activities", label: "Activity", Icon: Footprints, matchPrefix: ["/activities"] },
  { href: "/analysis", label: "Analyse", Icon: ChartLine },
  { href: "/coach", label: "Coach", Icon: MessageCircle },
  { href: "/profile", label: "Profile", Icon: CircleUserRound },
];

export function BottomNav() {
  const pathname = usePathname() ?? "";
  const activeIndex = TABS.findIndex((t) =>
    (t.matchPrefix ?? [t.href]).some((p) => pathname === p || pathname.startsWith(`${p}/`)),
  );

  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 left-1/2 -translate-x-1/2 z-40 w-full max-w-[480px] md:max-w-[560px] px-3"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 10px)" }}
    >
      <div className="relative flex items-center justify-around gap-1 rounded-[28px] bg-paper/92 backdrop-blur-xl border border-line/80 px-2 py-2 shadow-[0_18px_40px_-18px_rgba(20,16,8,0.18),0_4px_14px_-4px_rgba(20,16,8,0.06)]">
        {TABS.map((tab, i) => (
          <NavItem key={tab.href} tab={tab} active={i === activeIndex} prefetch />
        ))}
      </div>
    </nav>
  );
}

interface NavItemProps {
  tab: Tab;
  active: boolean;
  prefetch?: boolean;
}

function NavItem({ tab, active, prefetch = true }: NavItemProps) {
  const { Icon, href, label } = tab;
  return (
    <Link
      href={href}
      prefetch={prefetch}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex items-center justify-center gap-1.5 rounded-pill",
        "h-10 transition-all duration-300 ease-[cubic-bezier(0.2,0.7,0.2,1)]",
        "select-none active:scale-[0.94]",
        active
          ? "bg-coral-soft text-coral px-3.5 flex-1 max-w-[120px]"
          : "size-10 text-[#9c948d] hover:text-ink",
      )}
    >
      <Icon
        size={active ? 18 : 21}
        strokeWidth={active ? 2.4 : 1.9}
        className="shrink-0 transition-all duration-300"
      />
      <span
        className={cn(
          "font-display text-[12px] font-semibold tracking-tight whitespace-nowrap overflow-hidden",
          "transition-all duration-300",
          active ? "max-w-[80px] opacity-100" : "max-w-0 opacity-0",
        )}
      >
        {label}
      </span>
    </Link>
  );
}
