"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatDuration, type FomoFeed, type FomoItem } from "@/lib/fomo";

const POSITION_CLASS: Record<string, string> = {
  "bottom-left": "bottom-5 left-5 items-start",
  "bottom-right": "bottom-5 right-5 items-end",
  "top-left": "top-5 left-5 items-start",
  "top-right": "top-5 right-5 items-end",
};

function useIsDark(theme: FomoFeed["theme"]) {
  const [systemDark, setSystemDark] = useState(false);

  useEffect(() => {
    if (theme !== "auto" || typeof window === "undefined") return;
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemDark(query.matches);
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, [theme]);

  return theme === "dark" || (theme === "auto" && systemDark);
}

// Countdown items carry an end timestamp instead of finished text, so this
// re-renders the one visible toast every second rather than polling the API.
function useTicker(active: boolean) {
  const [, force] = useState(0);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => force((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [active]);
}

function itemText(item: FomoItem): string {
  if (item.type === "countdown" && item.countdownEndsAt) {
    return (item.template ?? "{time}").replace(
      /\{time\}/g,
      formatDuration(item.countdownEndsAt - Date.now()),
    );
  }
  return item.text;
}

export interface FomoNotificationsProps {
  // Hosted page: fetch the feed for this offer. Admin preview: pass `feed`
  // directly so unsaved edits show up immediately.
  companySlug?: string;
  offerId?: string;
  feed?: FomoFeed;
  // Renders inside a relatively-positioned parent instead of the viewport,
  // for the boxed preview in the admin.
  contained?: boolean;
}

export default function FomoNotifications({
  companySlug,
  offerId,
  feed: providedFeed,
  contained = false,
}: FomoNotificationsProps) {
  const [feed, setFeed] = useState<FomoFeed | null>(providedFeed ?? null);
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (providedFeed) setFeed(providedFeed);
  }, [providedFeed]);

  useEffect(() => {
    setIndex(0);
    setVisible(false);
    setDismissed(false);
  }, [providedFeed]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const query = window.matchMedia("(max-width: 767px)");
    setIsMobile(query.matches);
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (providedFeed || !companySlug) return;
    let cancelled = false;
    const url = `/api/w/${companySlug}/fomo${offerId ? `?o=${encodeURIComponent(offerId)}` : ""}`;
    fetch(url)
      .then((res) => res.json())
      .then((data: FomoFeed) => {
        if (!cancelled) setFeed(data);
      })
      .catch(() => {
        /* social proof is decorative — a failed fetch just shows nothing */
      });
    return () => {
      cancelled = true;
    };
  }, [companySlug, offerId, providedFeed]);

  const items = useMemo(() => feed?.items ?? [], [feed]);
  const active = !!feed?.enabled && items.length > 0 && !dismissed && (feed.showOnMobile || !isMobile);

  // Show → hide → gap → next, looping when configured to.
  useEffect(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (!active || !feed) return;

    const push = (fn: () => void, ms: number) => {
      timers.current.push(setTimeout(fn, ms));
    };

    push(() => {
      setVisible(true);
      push(() => {
        setVisible(false);
        push(() => {
          setIndex((prev) => {
            const next = prev + 1;
            if (next < items.length) return next;
            return feed.loop ? 0 : prev;
          });
        }, 350);
      }, feed.displayMs);
    }, index === 0 ? feed.initialDelayMs : feed.gapMs);

    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, [active, feed, index, items.length]);

  const current = items[index];
  const dark = useIsDark(feed?.theme ?? "auto");
  useTicker(!!current && current.type === "countdown" && visible);

  if (!active || !current) return null;

  const positionClass = POSITION_CLASS[feed!.position] ?? POSITION_CLASS["bottom-left"];

  return (
    <div
      aria-live="polite"
      className={`${contained ? "absolute" : "fixed"} z-50 flex max-w-[min(340px,calc(100vw-2rem))] flex-col gap-2 ${positionClass}`}
    >
      <div
        className={`flex items-center gap-3 rounded-2xl border px-4 py-2.5 text-sm shadow-xl transition-all duration-300 ${
          visible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
        } ${
          dark
            ? "border-white/10 bg-neutral-900 text-neutral-100"
            : "border-black/5 bg-white text-neutral-900"
        }`}
      >
        <span className="text-xl leading-none">{current.icon}</span>
        <span className="flex-1 leading-snug">{itemText(current)}</span>
        <button
          type="button"
          aria-label="Dismiss notifications"
          onClick={() => setDismissed(true)}
          className="shrink-0 text-base opacity-40 transition-opacity hover:opacity-90"
        >
          ×
        </button>
      </div>
    </div>
  );
}
