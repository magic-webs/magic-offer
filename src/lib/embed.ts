// Per-offer configuration for the website embed: which triggers open the
// offer popup on the merchant's own site (exit intent and friends), how
// often it may reappear, and how the modal looks.
//
// The loader script served from /embed.js reads the normalized version of
// this over /api/w/<slug>/embed-config, so anything added here has to stay
// JSON-serializable and backwards-tolerant.

export type EmbedFrequency = "always" | "session" | "daily" | "once";
export type LauncherPosition = "bottom-right" | "bottom-left";

export interface EmbedTriggers {
  // Desktop: pointer leaves the viewport through the top edge.
  exitIntent: boolean;
  // How close to the top the pointer must get before it counts as leaving.
  exitSensitivity: number;
  // Mobile has no mouseleave — these are the stand-ins.
  mobileScrollUp: boolean;
  mobileBackButton: boolean;
  // 0 disables each of these secondary triggers.
  inactivitySeconds: number;
  timeOnPageSeconds: number;
  scrollPercent: number;
  // Any element matching this selector opens the popup on click.
  clickSelector: string;
}

export interface EmbedConfig {
  enabled: boolean;
  triggers: EmbedTriggers;
  frequency: EmbedFrequency;
  // Grace period after page load before any trigger is allowed to fire, so
  // a pointer already near the top of the window does not fire instantly.
  armAfterSeconds: number;
  showFomo: boolean;
  launcher: { enabled: boolean; text: string; position: LauncherPosition; color: string };
  modal: {
    width: number;
    height: number;
    radius: number;
    overlayOpacity: number;
    closeOnOverlayClick: boolean;
  };
  // Origins allowed to load this offer in an iframe. Empty = any origin.
  allowedDomains: string[];
}

export const DEFAULT_EMBED_CONFIG: EmbedConfig = {
  enabled: false,
  triggers: {
    exitIntent: true,
    exitSensitivity: 20,
    mobileScrollUp: true,
    mobileBackButton: false,
    inactivitySeconds: 0,
    timeOnPageSeconds: 0,
    scrollPercent: 0,
    clickSelector: "",
  },
  frequency: "session",
  armAfterSeconds: 3,
  showFomo: true,
  launcher: {
    enabled: false,
    text: "🎁 Win a prize",
    position: "bottom-right",
    color: "#10b981",
  },
  modal: {
    width: 460,
    height: 640,
    radius: 20,
    overlayOpacity: 70,
    closeOnOverlayClick: true,
  },
  allowedDomains: [],
};

export const EMBED_FREQUENCIES: { value: EmbedFrequency; label: string; hint: string }[] = [
  { value: "once", label: "Once ever", hint: "A visitor sees the popup a single time, ever." },
  { value: "session", label: "Once per session", hint: "Resets when the browser tab is closed." },
  { value: "daily", label: "Once per day", hint: "Resets at midnight in the visitor's timezone." },
  { value: "always", label: "Every trigger", hint: "Fires each time. Best kept for testing." },
];

const FREQUENCIES: EmbedFrequency[] = ["always", "session", "daily", "once"];
const LAUNCHER_POSITIONS: LauncherPosition[] = ["bottom-right", "bottom-left"];
const HEX_RE = /^#[0-9a-fA-F]{6}$/;
// Deliberately narrow: this string is injected into querySelectorAll on the
// merchant's page, so quotes and angle brackets have no business in it.
const SELECTOR_RE = /^[a-zA-Z0-9\s.#_\-[\]="':,>+~()]*$/;

function bool(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function num(value: unknown, fallback: number, min: number, max: number) {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

function text(value: unknown, fallback: string, maxLength: number) {
  return typeof value === "string" && value.trim()
    ? value.trim().slice(0, maxLength)
    : fallback;
}

export function normalizeEmbedConfig(raw: unknown): EmbedConfig {
  const input = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const d = DEFAULT_EMBED_CONFIG;
  const triggers = (input.triggers && typeof input.triggers === "object"
    ? input.triggers
    : {}) as Record<string, unknown>;
  const launcher = (input.launcher && typeof input.launcher === "object"
    ? input.launcher
    : {}) as Record<string, unknown>;
  const modal = (input.modal && typeof input.modal === "object" ? input.modal : {}) as Record<
    string,
    unknown
  >;

  const rawSelector = typeof triggers.clickSelector === "string" ? triggers.clickSelector.trim() : "";
  const launcherColor = typeof launcher.color === "string" ? launcher.color.trim() : "";

  return {
    enabled: bool(input.enabled, d.enabled),
    triggers: {
      exitIntent: bool(triggers.exitIntent, d.triggers.exitIntent),
      exitSensitivity: num(triggers.exitSensitivity, d.triggers.exitSensitivity, 0, 200),
      mobileScrollUp: bool(triggers.mobileScrollUp, d.triggers.mobileScrollUp),
      mobileBackButton: bool(triggers.mobileBackButton, d.triggers.mobileBackButton),
      inactivitySeconds: num(triggers.inactivitySeconds, d.triggers.inactivitySeconds, 0, 3600),
      timeOnPageSeconds: num(triggers.timeOnPageSeconds, d.triggers.timeOnPageSeconds, 0, 3600),
      scrollPercent: num(triggers.scrollPercent, d.triggers.scrollPercent, 0, 100),
      clickSelector:
        rawSelector.length <= 200 && SELECTOR_RE.test(rawSelector) ? rawSelector : "",
    },
    frequency: FREQUENCIES.includes(input.frequency as EmbedFrequency)
      ? (input.frequency as EmbedFrequency)
      : d.frequency,
    armAfterSeconds: num(input.armAfterSeconds, d.armAfterSeconds, 0, 600),
    showFomo: bool(input.showFomo, d.showFomo),
    launcher: {
      enabled: bool(launcher.enabled, d.launcher.enabled),
      text: text(launcher.text, d.launcher.text, 60),
      position: LAUNCHER_POSITIONS.includes(launcher.position as LauncherPosition)
        ? (launcher.position as LauncherPosition)
        : d.launcher.position,
      color: HEX_RE.test(launcherColor) ? launcherColor : d.launcher.color,
    },
    modal: {
      width: num(modal.width, d.modal.width, 280, 1200),
      height: num(modal.height, d.modal.height, 320, 1200),
      radius: num(modal.radius, d.modal.radius, 0, 48),
      overlayOpacity: num(modal.overlayOpacity, d.modal.overlayOpacity, 0, 100),
      closeOnOverlayClick: bool(modal.closeOnOverlayClick, d.modal.closeOnOverlayClick),
    },
    allowedDomains: Array.isArray(input.allowedDomains)
      ? (input.allowedDomains as unknown[])
          .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
          .map((v) => v.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, ""))
          .slice(0, 25)
      : [],
  };
}

// The copy-paste snippet shown in the admin Embed tab and in the docs.
export function buildEmbedSnippet(siteUrl: string, slug: string, offerId: string) {
  return [
    "<!-- Magic Offer — exit-intent popup -->",
    `<script async src="${siteUrl}/embed.js"`,
    `  data-magic-offer="${slug}"`,
    `  data-offer-id="${offerId}"></script>`,
  ].join("\n");
}

// Shopify/WordPress/GTM all end up doing the same thing, but merchants tend
// to look for their platform by name, so the admin lists them separately.
export function buildPlatformSnippets(siteUrl: string, slug: string, offerId: string) {
  const script = buildEmbedSnippet(siteUrl, slug, offerId);
  return {
    html: script,
    gtm: [
      "// Google Tag Manager → New Tag → Custom HTML",
      script,
    ].join("\n"),
    shopify: [
      "<!-- Shopify: Online Store → Themes → Edit code → layout/theme.liquid",
      "     Paste immediately before the closing </body> tag. -->",
      script,
    ].join("\n"),
    wordpress: [
      "<?php // functions.php of your active theme",
      "add_action('wp_footer', function () { ?>",
      script,
      "<?php });",
    ].join("\n"),
    react: [
      "// Next.js / React — app/layout.tsx",
      'import Script from "next/script";',
      "",
      "<Script",
      `  src="${siteUrl}/embed.js"`,
      `  data-magic-offer="${slug}"`,
      `  data-offer-id="${offerId}"`,
      '  strategy="afterInteractive"',
      "/>",
    ].join("\n"),
  };
}
