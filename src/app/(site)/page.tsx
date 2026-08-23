import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ClipboardList,
  Disc3,
  Gauge,
  ListChecks,
  QrCode,
  Scale,
  Smartphone,
  Sparkles,
  Webhook,
} from "lucide-react";
import { Reveal } from "@/components/marketing/Reveal";
import { HeroDiagram } from "@/components/marketing/HeroDiagram";
import { product } from "@/lib/siteConfig";

export const metadata: Metadata = {
  title: `${product.name} — ${product.tagline}`,
  description: product.description,
};

const features = [
  {
    icon: Disc3,
    title: "Your wheel, your artwork",
    body: "Upload the wheel, background and pointer you designed. Prizes map to segments clockwise from the top — no template to fight.",
  },
  {
    icon: Scale,
    title: "Odds you control",
    body: "Give every prize a weight and the draw follows it exactly. Mark which segments count as a win and which don't.",
  },
  {
    icon: ListChecks,
    title: "Collect what you need",
    body: "Name and phone out of the box, plus any custom fields you add. Answers land on the registration, ready to export.",
  },
  {
    icon: Sparkles,
    title: "One spin per person",
    body: "Registrations dedupe on phone number per company, and everyone gets a magic link back to the result they already won.",
  },
  {
    icon: ClipboardList,
    title: "Live dashboard",
    body: "Every registration and prize the moment it happens, filterable by prize and date, on the web or in your pocket.",
  },
  {
    icon: Webhook,
    title: "Signed webhooks",
    body: "Push registrations and spin results straight into your CRM. Every delivery is HMAC-signed so you can verify it.",
  },
] as const;

const steps = [
  {
    icon: Disc3,
    title: "Build the wheel",
    body: "Add your prizes, set the weights, upload your artwork and choose which details to ask for.",
  },
  {
    icon: QrCode,
    title: "Share one link",
    body: "Every company gets a public URL. Put it behind a QR code on the counter, a story link, or an SMS.",
  },
  {
    icon: Gauge,
    title: "Watch it convert",
    body: "Registrations and wins stream into the dashboard, and out to your own systems over webhooks.",
  },
] as const;

export default function LandingPage() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-16">
        <div className="grid-lines grid-fade pointer-events-none absolute inset-0" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(16,185,129,0.13),transparent)]" />

        <div className="relative mx-auto max-w-6xl px-5">
          <div className="h-[240px] sm:h-[300px] lg:h-[340px]">
            <HeroDiagram />
          </div>

          <Reveal className="mx-auto max-w-3xl pb-24 text-center sm:pb-32">
            <h1 className="font-heading text-[2.6rem] leading-[1.05] font-semibold tracking-tight text-balance sm:text-6xl lg:text-7xl">
              Spin-to-win campaigns that actually convert
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-pretty text-white/55 sm:text-lg">
              {product.description}
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/admin"
                className="group flex w-full items-center justify-center gap-2 rounded-full bg-emerald-500 px-7 py-3.5 text-sm font-semibold text-[#0a0a0a] transition-colors hover:bg-emerald-400 sm:w-auto"
              >
                Start building for free
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <a
                href="#how-it-works"
                className="w-full rounded-full border border-white/20 px-7 py-3.5 text-center text-sm font-semibold text-white transition-colors hover:border-white/40 hover:bg-white/5 sm:w-auto"
              >
                See how it works
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────── */}
      <section id="features" className="relative border-t border-white/10">
        <div className="mx-auto max-w-6xl px-5">
          <Reveal className="py-16 sm:py-20">
            <h2 className="font-heading max-w-2xl text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl">
              Everything a promotion needs, nothing it doesn&apos;t
            </h2>
          </Reveal>

          <Reveal
            stagger={0.09}
            className="grid grid-cols-1 border-t border-l border-white/10 sm:grid-cols-2 lg:grid-cols-3"
          >
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group relative border-r border-b border-white/10 p-7 transition-colors hover:bg-white/[0.025] sm:p-9"
              >
                <feature.icon
                  className="size-5 text-white/70 transition-colors group-hover:text-emerald-400"
                  strokeWidth={1.5}
                />
                <h3 className="font-heading mt-5 text-lg font-semibold tracking-tight">
                  {feature.title}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-white/50">{feature.body}</p>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────── */}
      <section id="how-it-works" className="relative border-t border-white/10">
        <div className="grid-lines pointer-events-none absolute inset-0 opacity-60" />
        <div className="relative mx-auto max-w-6xl px-5 py-20 sm:py-28">
          <div className="grid gap-14 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-20">
            <Reveal className="lg:sticky lg:top-28 lg:self-start">
              <span className="inline-flex items-center gap-2 rounded-md border border-emerald-500/40 px-2.5 py-1 font-mono text-xs text-emerald-400">
                <Disc3 className="size-3.5" /> HOW IT WORKS
              </span>
              <h2 className="font-heading mt-6 text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl">
                Live in an afternoon, not a sprint
              </h2>
              <p className="mt-5 text-sm leading-relaxed text-white/50">
                No SDK to embed and nothing to deploy. Set the wheel up in the dashboard and share
                the link it gives you.
              </p>
              <Link
                href="/admin"
                className="group mt-8 inline-flex items-center gap-2 text-sm font-semibold text-emerald-400 hover:text-emerald-300"
              >
                Open the dashboard
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Reveal>

            <Reveal stagger={0.12} className="space-y-4">
              {steps.map((step, i) => (
                <div
                  key={step.title}
                  className="rounded-2xl border border-white/10 bg-white/[0.02] p-7 backdrop-blur-sm sm:p-8"
                >
                  <div className="flex items-center gap-4">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                      <step.icon className="size-4.5 text-emerald-400" strokeWidth={1.5} />
                    </span>
                    <span className="font-mono text-xs text-white/35">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <h3 className="font-heading mt-5 text-xl font-semibold tracking-tight">
                    {step.title}
                  </h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-white/50">{step.body}</p>
                </div>
              ))}
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Mobile app ───────────────────────────────────────────────── */}
      <section id="mobile" className="relative border-t border-white/10">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:py-28">
          <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-md border border-emerald-500/40 px-2.5 py-1 font-mono text-xs text-emerald-400">
                <Smartphone className="size-3.5" /> MOBILE
              </span>
              <h2 className="font-heading mt-6 text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl">
                Run your wheel
                <br />
                from the shop floor
              </h2>
              <p className="mt-5 max-w-md text-sm leading-relaxed text-white/50">
                The companion app gives you the whole dashboard on your phone — prizes, form fields,
                registrations and webhooks, with the same sign-in you use on the web.
              </p>
              <ul className="mt-8 space-y-3">
                {[
                  "Check today's registrations between customers",
                  "Swap a prize or its odds without opening a laptop",
                  "Filter who won what, by prize or by date",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-white/60">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-emerald-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal y={40} className="relative">
              <div className="relative mx-auto aspect-square w-full max-w-md">
                <div className="grid-lines absolute inset-0 rounded-3xl border border-white/10" />
                <div className="absolute inset-0 rounded-3xl bg-[radial-gradient(circle_at_50%_45%,rgba(16,185,129,0.16),transparent_65%)]" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-[196px] rounded-[2rem] border border-white/15 bg-[#111] p-2.5 shadow-2xl shadow-black/60">
                    <div className="rounded-[1.5rem] border border-white/10 bg-[#0a0a0a] px-4 pt-5 pb-4">
                      <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/15" />
                      <p className="text-[11px] text-white/40">Today</p>
                      <p className="font-heading mt-0.5 text-2xl font-semibold">128 spins</p>
                      <div className="mt-4 space-y-2">
                        {[
                          ["20% off", "42"],
                          ["Free perfume", "11"],
                          ["Try again", "75"],
                        ].map(([label, count]) => (
                          <div
                            key={label}
                            className="flex items-center justify-between rounded-lg bg-white/5 px-2.5 py-2"
                          >
                            <span className="text-[11px] text-white/70">{label}</span>
                            <span className="font-mono text-[11px] text-emerald-400">{count}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 flex items-center justify-between rounded-xl border border-white/10 px-3 py-2.5">
                        {[Disc3, ListChecks, ClipboardList, Gauge].map((Icon, i) => (
                          <Icon
                            key={i}
                            className={`size-3.5 ${i === 0 ? "text-emerald-400" : "text-white/25"}`}
                            strokeWidth={1.5}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Closing CTA ──────────────────────────────────────────────── */}
      <section className="relative border-t border-white/10">
        <div className="grid-lines grid-fade pointer-events-none absolute inset-0" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_60%_at_50%_100%,rgba(16,185,129,0.13),transparent)]" />
        <Reveal className="relative mx-auto max-w-3xl px-5 py-24 text-center sm:py-32">
          <h2 className="font-heading text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-5xl">
            Give people a reason to leave their number
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-pretty text-white/55">
            Set up your first wheel today and start turning walk-ins into a list you own.
          </p>
          <Link
            href="/admin"
            className="group mt-9 inline-flex items-center gap-2 rounded-full bg-emerald-500 px-8 py-3.5 text-sm font-semibold text-[#0a0a0a] transition-colors hover:bg-emerald-400"
          >
            Start building for free
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </Reveal>
      </section>
    </>
  );
}
