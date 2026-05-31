"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { RefreshCcw, ListFilter, Sparkles, Inbox } from "lucide-react";
import type { Activity } from "@/lib/strava/types";
import { ActivityCard } from "@/components/activity-card";
import { FilterSheet } from "./filter-sheet";
import {
  applyFilters,
  countActiveFilters,
  DEFAULT_FILTERS,
  type ActivityFilters,
} from "./filter-types";
import { cn } from "@/lib/cn";

const PAGE_SIZE = 10;

interface Props {
  initial: Activity[];
  initialHasMore: boolean;
}

export function ActivitiesList({ initial, initialHasMore }: Props) {
  const [activities, setActivities] = useState<Activity[]>(initial);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [filters, setFilters] = useState<ActivityFilters>(DEFAULT_FILTERS);
  const [showFilter, setShowFilter] = useState(false);
  const [isLoadingMore, setLoadingMore] = useState(false);
  const [isRefreshing, startRefresh] = useTransition();
  const [refreshKey, setRefreshKey] = useState(0); // animation key for spinner

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const inflightPage = useRef<number | null>(null);

  const visible = useMemo(() => applyFilters(activities, filters), [activities, filters]);
  const filterCount = countActiveFilters(filters);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    const nextPage = page + 1;
    if (inflightPage.current === nextPage) return;
    inflightPage.current = nextPage;
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/activities?limit=${PAGE_SIZE}&page=${nextPage}`);
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as {
        activities: Activity[];
        hasMore: boolean;
      };
      setActivities((prev) => dedupe([...prev, ...data.activities]));
      setHasMore(Boolean(data.hasMore));
      setPage(nextPage);
    } catch (err) {
      console.error("loadMore failed", err);
      setHasMore(false);
    } finally {
      setLoadingMore(false);
      inflightPage.current = null;
    }
  }, [hasMore, isLoadingMore, page]);

  // IntersectionObserver-driven infinite scroll.
  useEffect(() => {
    if (!hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) void loadMore();
      },
      { rootMargin: "240px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  function refresh() {
    if (isRefreshing) return;
    setRefreshKey((k) => k + 1);
    startRefresh(async () => {
      try {
        const res = await fetch(`/api/activities?limit=${PAGE_SIZE}&page=1&fresh=1`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as { activities: Activity[]; hasMore: boolean };
        setActivities(data.activities);
        setHasMore(Boolean(data.hasMore));
        setPage(1);
      } catch (err) {
        console.error("refresh failed", err);
      }
    });
  }

  return (
    <div className="space-y-5">
      <header className="rise">
        <div className="flex items-end justify-between gap-2">
          <div>
            <div className="eyebrow mb-1 nums">
              {filterCount > 0
                ? `${visible.length} shown · ${activities.length} loaded`
                : `Last ${visible.length} sessions`}
            </div>
            <h1 className="font-display text-[32px] font-bold tracking-tight leading-[1]">
              Recent<span className="text-coral">.</span>
            </h1>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowFilter(true)}
              aria-label="Open filters"
              className={cn(
                "relative inline-flex items-center gap-1.5 px-3 py-2 rounded-pill text-xs font-medium border transition-colors",
                filterCount > 0
                  ? "bg-coral-50 text-coral-700 border-coral-200"
                  : "bg-paper text-ink-700 border-ink-100 hover:border-ink-300",
              )}
            >
              <ListFilter size={14} strokeWidth={2.2} />
              <span>Filter</span>
              {filterCount > 0 && (
                <span className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-coral text-white text-[10px] font-semibold nums">
                  {filterCount}
                </span>
              )}
            </button>

            <button
              onClick={refresh}
              aria-label="Refresh activities"
              disabled={isRefreshing}
              className={cn(
                "size-9 grid place-items-center rounded-pill border transition-all",
                isRefreshing
                  ? "bg-coral text-white border-coral shadow-[0_6px_16px_-6px_rgba(242,84,27,0.55)]"
                  : "bg-coral-50 text-coral-700 border-coral-100 hover:bg-coral-100",
              )}
            >
              <RefreshCcw
                key={refreshKey}
                size={14}
                strokeWidth={2.4}
                className={cn(
                  "transition-transform",
                  isRefreshing && "animate-spin",
                )}
              />
            </button>
          </div>
        </div>
        <div className="rule-coral mt-4" />
      </header>

      {/* Filter summary pills (only shown when filters are active) */}
      {filterCount > 0 && (
        <div className="rise flex flex-wrap gap-2 -mt-1">
          {filters.type !== "all" && (
            <ActiveChip
              label={`Type · ${filters.type}`}
              onClear={() => setFilters((f) => ({ ...f, type: "all" }))}
            />
          )}
          {filters.period !== "all" && (
            <ActiveChip
              label={`Period · ${filters.period === "week" ? "7 days" : filters.period === "month" ? "31 days" : "3 months"}`}
              onClear={() => setFilters((f) => ({ ...f, period: "all" }))}
            />
          )}
          {filters.sort !== "newest" && (
            <ActiveChip
              label={`Sort · ${filters.sort}`}
              onClear={() => setFilters((f) => ({ ...f, sort: "newest" }))}
            />
          )}
          <button
            onClick={() => setFilters(DEFAULT_FILTERS)}
            className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-500 hover:text-coral transition-colors px-2 py-1"
          >
            Clear all
          </button>
        </div>
      )}

      {/* List */}
      {visible.length === 0 ? (
        <EmptyState
          activeFilters={filterCount > 0}
          onClearFilters={() => setFilters(DEFAULT_FILTERS)}
        />
      ) : (
        <ul className="space-y-3 list-none">
          {visible.map((a, i) => (
            <li key={a.id}>
              {/* index controls the stagger animation inside ActivityCard */}
              <ActivityCard activity={a} index={Math.min(i, 8)} />
            </li>
          ))}
        </ul>
      )}

      {/* Load-more sentinel + indicator */}
      {hasMore && filterCount === 0 && (
        <div ref={sentinelRef} className="pt-1 pb-2 flex justify-center">
          {isLoadingMore ? <LoadingDots /> : <span className="h-px w-10 bg-ink-100" />}
        </div>
      )}

      {!hasMore && visible.length > 0 && (
        <div className="pt-2 pb-1 flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.24em] font-semibold text-ink-400">
          <span className="h-px w-8 bg-ink-200" />
          <Sparkles size={11} className="text-coral/70" />
          <span>End of feed</span>
          <span className="h-px w-8 bg-ink-200" />
        </div>
      )}

      <FilterSheet
        open={showFilter}
        onClose={() => setShowFilter(false)}
        filters={filters}
        onApply={setFilters}
        resultCount={applyFilters(activities, filters).length}
      />
    </div>
  );
}

function ActiveChip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 rounded-pill bg-coral-50 border border-coral-200 text-[11px] font-medium text-coral-700 nums">
      <span className="capitalize">{label}</span>
      <button
        onClick={onClear}
        aria-label={`Clear ${label}`}
        className="size-4 rounded-full bg-coral-200/60 hover:bg-coral text-coral-700 hover:text-white grid place-items-center transition-colors leading-none"
      >
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
          <path d="M1 1L7 7M7 1L1 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>
    </span>
  );
}

function EmptyState({
  activeFilters,
  onClearFilters,
}: {
  activeFilters: boolean;
  onClearFilters: () => void;
}) {
  return (
    <div className="card flex flex-col items-center text-center py-12 px-6 gap-4">
      <div className="size-14 rounded-2xl bg-coral-50 grid place-items-center text-coral">
        <Inbox size={22} strokeWidth={2} />
      </div>
      <div className="space-y-1">
        <div className="font-display text-lg font-semibold tracking-tight leading-none">
          {activeFilters ? "Nothing matches that combo" : "No activities yet"}
        </div>
        <p className="text-[12px] text-ink-500 leading-relaxed max-w-[32ch]">
          {activeFilters
            ? "Try widening the period or switching activity type."
            : "Sync a session in Strava and pull to refresh."}
        </p>
      </div>
      {activeFilters && (
        <button onClick={onClearFilters} className="btn-ghost text-xs !px-4 !py-2">
          Clear filters
        </button>
      )}
    </div>
  );
}

function LoadingDots() {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-pill bg-paper border border-ink-100">
      <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-ink-500">
        Loading more
      </span>
      <span className="flex items-center gap-1">
        <Dot delay={0} />
        <Dot delay={120} />
        <Dot delay={240} />
      </span>
    </div>
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

function dedupe(list: Activity[]): Activity[] {
  const seen = new Set<string>();
  const out: Activity[] = [];
  for (const a of list) {
    if (seen.has(a.id)) continue;
    seen.add(a.id);
    out.push(a);
  }
  return out;
}
