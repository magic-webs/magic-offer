"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

// The engineering-drawing motif from the reference: dashed connectors that
// draw themselves in on load, feeding a highlighted node in the middle.
// Left/right nodes are the customer's phone and the company's dashboard;
// the centre is the wheel itself.
export function HeroDiagram() {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      const paths = gsap.utils.toArray<SVGPathElement>("[data-wire]");
      const nodes = gsap.utils.toArray<SVGGElement>("[data-node]");
      const core = "[data-core]";

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set([...paths, ...nodes, core], { opacity: 1, strokeDashoffset: 0 });
        return;
      }

      gsap.set(nodes, { opacity: 0, scale: 0.9, transformOrigin: "center" });
      gsap.set(core, { opacity: 0, scale: 0.9, transformOrigin: "center" });

      const tl = gsap.timeline({ delay: 0.25 });

      tl.to(core, { opacity: 1, scale: 1, duration: 0.6, ease: "back.out(1.6)" })
        .from(
          paths,
          {
            // Each wire is authored with its own dash pattern, so animate the
            // offset by the measured length rather than a shared constant.
            strokeDashoffset: (i, target: SVGPathElement) => target.getTotalLength(),
            duration: 1.1,
            stagger: 0.08,
            ease: "power2.inOut",
          },
          "-=0.25",
        )
        .to(nodes, { opacity: 1, scale: 1, duration: 0.5, stagger: 0.08, ease: "power3.out" }, "-=0.7");
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <svg
      ref={ref}
      viewBox="0 0 1200 380"
      fill="none"
      aria-hidden="true"
      className="h-full w-full"
    >
      {/* wires */}
      <path
        data-wire
        d="M170 190 C 300 190, 320 96, 470 96 C 545 96, 560 160, 566 186"
        stroke="rgba(255,255,255,0.22)"
        strokeWidth="1.5"
        strokeDasharray="5 6"
      />
      <path
        data-wire
        d="M170 190 C 320 190, 340 292, 470 292 C 545 292, 560 224, 566 196"
        stroke="rgba(255,255,255,0.22)"
        strokeWidth="1.5"
        strokeDasharray="5 6"
      />
      <path
        data-wire
        d="M634 190 C 760 190, 790 96, 930 96 C 1000 96, 1020 150, 1030 176"
        stroke="rgba(255,255,255,0.22)"
        strokeWidth="1.5"
        strokeDasharray="5 6"
      />
      <path
        data-wire
        d="M634 190 C 760 190, 790 292, 930 292 C 1000 292, 1020 232, 1030 204"
        stroke="rgba(255,255,255,0.22)"
        strokeWidth="1.5"
        strokeDasharray="5 6"
      />

      <OutlineNode x={92} y={150} label="Scan" />
      <OutlineNode x={420} y={56} label="Register" />
      <OutlineNode x={420} y={252} label="Spin" />
      <OutlineNode x={880} y={56} label="Prize" />
      <OutlineNode x={880} y={252} label="Webhook" />
      <OutlineNode x={1030} y={150} label="Dashboard" />

      {/* the wheel — the highlighted centre node */}
      <g data-core>
        <text x="566" y="118" fill="#10b981" fontSize="12" fontFamily="var(--font-mono)">
          WHEEL
        </text>
        <rect
          x="534"
          y="128"
          width="132"
          height="124"
          rx="6"
          stroke="#10b981"
          strokeWidth="1.5"
          fill="rgba(16,185,129,0.07)"
        />
        <rect
          x="552"
          y="146"
          width="96"
          height="88"
          rx="4"
          stroke="rgba(16,185,129,0.55)"
          strokeWidth="1.5"
          fill="none"
        />
        <circle cx="600" cy="190" r="26" stroke="#10b981" strokeWidth="1.5" fill="none" />
        <path d="M600 164 L600 216 M574 190 L626 190" stroke="rgba(16,185,129,0.75)" strokeWidth="1.5" />
        <path d="M582 172 L618 208 M618 172 L582 208" stroke="rgba(16,185,129,0.4)" strokeWidth="1.5" />
        {[
          [534, 128],
          [666, 128],
          [534, 252],
          [666, 252],
        ].map(([cx, cy]) => (
          <rect key={`${cx}-${cy}`} x={cx - 3.5} y={cy - 3.5} width="7" height="7" fill="#10b981" />
        ))}
      </g>
    </svg>
  );
}

function OutlineNode({ x, y, label }: { x: number; y: number; label: string }) {
  const w = 88;
  const h = 80;
  return (
    <g data-node>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx="5"
        stroke="rgba(255,255,255,0.14)"
        strokeWidth="1.5"
        fill="rgba(255,255,255,0.02)"
      />
      <text
        x={x + w / 2}
        y={y + h / 2 + 4}
        textAnchor="middle"
        fill="rgba(255,255,255,0.45)"
        fontSize="11"
        fontFamily="var(--font-mono)"
      >
        {label}
      </text>
      {[
        [x, y],
        [x + w, y],
        [x, y + h],
        [x + w, y + h],
      ].map(([cx, cy]) => (
        <rect
          key={`${cx}-${cy}`}
          x={cx - 2.5}
          y={cy - 2.5}
          width="5"
          height="5"
          fill="rgba(255,255,255,0.28)"
        />
      ))}
    </g>
  );
}
