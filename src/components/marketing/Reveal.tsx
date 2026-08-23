"use client";

import { useEffect, useRef, type ElementType, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Distance in px the element travels up into place. */
  y?: number;
  delay?: number;
  /** Staggers direct children instead of animating the wrapper as one block. */
  stagger?: number;
  as?: ElementType;
  id?: string;
};

// Elements start hidden via the `.reveal` class in globals.css (not inline
// styles) so a no-JS or reduced-motion visitor still sees the content —
// see the noscript and prefers-reduced-motion overrides there.
export function Reveal({
  children,
  className,
  y = 28,
  delay = 0,
  stagger,
  as: Tag = "div",
  id,
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const targets = stagger ? Array.from(el.children) : el;

    const ctx = gsap.context(() => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set(targets, { opacity: 1, y: 0 });
        return;
      }
      gsap.fromTo(
        targets,
        { opacity: 0, y },
        {
          opacity: 1,
          y: 0,
          duration: 0.85,
          delay,
          stagger: stagger ?? 0,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
        },
      );
    }, el);

    return () => ctx.revert();
  }, [y, delay, stagger]);

  return (
    <Tag
      id={id}
      ref={ref}
      className={`${stagger ? "reveal-children" : "reveal"} ${className ?? ""}`}
    >
      {children}
    </Tag>
  );
}
