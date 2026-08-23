import type { ReactNode } from "react";
import { SmoothScroll } from "@/components/marketing/SmoothScroll";
import { SiteNav } from "@/components/marketing/SiteNav";
import { SiteFooter } from "@/components/marketing/SiteFooter";

// The public site is dark regardless of the dashboard's light/dark
// preference, so the colours here are literal rather than themed tokens.
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <SmoothScroll>
      <div
        className="min-h-screen bg-[#0a0a0a] text-white"
        style={
          {
            "--site-line": "rgba(255,255,255,0.055)",
            "--site-cell": "72px",
          } as React.CSSProperties
        }
      >
        <noscript>
          {/* GSAP never runs, so un-hide everything it would have revealed. */}
          <style>{`.reveal,.reveal-children>*{opacity:1 !important}`}</style>
        </noscript>
        <SiteNav />
        <main>{children}</main>
        <SiteFooter />
      </div>
    </SmoothScroll>
  );
}
