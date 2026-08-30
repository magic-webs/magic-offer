"use client";

import { useEffect, useState } from "react";

// Loads the real /embed.js on this page exactly the way a merchant's site
// would, so the test page exercises the actual loader rather than a mock of
// it. `data-preview="1"` is the one difference: it bypasses frequency
// capping so the popup can be triggered over and over while tuning settings.
export default function EmbedPreviewLoader({
  slug,
  offerId,
}: {
  slug: string;
  offerId?: string;
}) {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [lastTrigger, setLastTrigger] = useState<string | null>(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "/embed.js";
    script.async = true;
    script.setAttribute("data-magic-offer", slug);
    if (offerId) script.setAttribute("data-offer-id", offerId);
    script.setAttribute("data-preview", "1");
    script.onload = () => setStatus("ready");
    script.onerror = () => setStatus("error");
    document.body.appendChild(script);

    const onOpen = (e: Event) => {
      setLastTrigger((e as CustomEvent<{ source?: string }>).detail?.source ?? "unknown");
    };
    window.addEventListener("magicoffer:open", onOpen);

    return () => {
      window.removeEventListener("magicoffer:open", onOpen);
      script.remove();
      // The loader is a singleton guarded by __loaded; drop the flag and its
      // shadow root so a fast-refresh or navigation re-arms cleanly.
      const globals = window as unknown as { MagicOffer?: { __loaded?: boolean } };
      if (globals.MagicOffer) delete globals.MagicOffer;
      document.querySelectorAll("[data-magic-offer-root]").forEach((el) => el.remove());
    };
  }, [slug, offerId]);

  function call(method: "open" | "close" | "reset") {
    const api = (window as unknown as {
      MagicOffer?: Record<string, () => void>;
    }).MagicOffer;
    api?.[method]?.();
  }

  return (
    <div className="fixed left-1/2 top-4 z-[2147483100] w-[min(680px,calc(100vw-2rem))] -translate-x-1/2 rounded-2xl border border-emerald-500/30 bg-neutral-900/95 p-4 text-neutral-100 shadow-2xl backdrop-blur">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold">
            <span
              className={`h-2 w-2 rounded-full ${
                status === "ready"
                  ? "bg-emerald-400"
                  : status === "error"
                    ? "bg-red-400"
                    : "bg-amber-400"
              }`}
            />
            Embed test page
            <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-normal uppercase tracking-wide">
              frequency cap off
            </span>
          </p>
          <p className="mt-1 text-xs text-neutral-400">
            {status === "error"
              ? "The loader script failed to load."
              : "Move your mouse up and out of the browser window to fire exit intent. On a phone, flick upward near the top of the page."}
          </p>
          {lastTrigger && (
            <p className="mt-1.5 text-xs text-emerald-400">
              Last opened by: <span className="font-mono">{lastTrigger}</span>
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => call("open")}
            className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-emerald-500"
          >
            Open now
          </button>
          <button
            type="button"
            onClick={() => call("close")}
            className="rounded-md border border-white/15 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-white/10"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => call("reset")}
            className="rounded-md border border-white/15 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-white/10"
          >
            Reset cap
          </button>
        </div>
      </div>
    </div>
  );
}
