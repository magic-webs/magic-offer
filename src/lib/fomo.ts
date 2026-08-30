// Shared definition of every FOMO (social-proof) notification type, the
// per-offer config shape they are stored in, and the normalizer that turns
// whatever JSON is on `offers.fomoConfig` into a complete, safe object.
//
// Types are split into two families, and the admin UI labels them as such:
//   - "live"      — built from real rows in the DB (winners, signups, counts)
//   - "simulated" — generated within a merchant-configured range
// Merchants should always be able to tell which of their notifications are
// real, so the source is part of the type metadata rather than a UI detail.

export type FomoTypeId =
  | "recent_winner"
  | "recent_signup"
  | "live_visitors"
  | "signup_count"
  | "low_stock"
  | "countdown"
  | "custom";

export type FomoPosition = "bottom-left" | "bottom-right" | "top-left" | "top-right";
export type FomoTheme = "light" | "dark" | "auto";

export interface FomoTypeMeta {
  id: FomoTypeId;
  label: string;
  icon: string;
  source: "live" | "simulated";
  description: string;
  // Placeholders this type can substitute into its template.
  tokens: string[];
  sample: string;
}

export const FOMO_TYPES: FomoTypeMeta[] = [
  {
    id: "recent_winner",
    label: "Recent Winner",
    icon: "🏆",
    source: "live",
    description: "Shows people who actually won a prize on this offer, newest first.",
    tokens: ["{name}", "{prize}", "{time}"],
    sample: "Priya S. just won a Free Coffee — 4 minutes ago",
  },
  {
    id: "recent_signup",
    label: "Recent Signup",
    icon: "🎉",
    source: "live",
    description: "Shows people who recently entered this offer, win or lose.",
    tokens: ["{name}", "{time}"],
    sample: "Rahul M. just joined — 11 minutes ago",
  },
  {
    id: "signup_count",
    label: "Signups Today",
    icon: "🔥",
    source: "live",
    description: "Real number of entries recorded in a rolling time window.",
    tokens: ["{count}", "{hours}"],
    sample: "142 people entered in the last 24 hours",
  },
  {
    id: "low_stock",
    label: "Prizes Running Out",
    icon: "⚡",
    source: "live",
    description: "Counts down from a daily prize allowance as real entries come in.",
    tokens: ["{left}", "{total}"],
    sample: "Only 7 of 100 prizes left today",
  },
  {
    id: "countdown",
    label: "Offer Countdown",
    icon: "⏳",
    source: "live",
    description: "Ticking urgency timer counting down to the offer end time.",
    tokens: ["{time}"],
    sample: "Hurry — offer ends in 04:32:11",
  },
  {
    id: "live_visitors",
    label: "Live Visitors",
    icon: "👀",
    source: "simulated",
    description: "A visitor count drifting inside the range you set. Not measured traffic.",
    tokens: ["{count}"],
    sample: "23 people are viewing this offer right now",
  },
  {
    id: "custom",
    label: "Custom Messages",
    icon: "📣",
    source: "simulated",
    description: "Your own announcements, rotated in with the rest of the feed.",
    tokens: [],
    sample: "Free delivery on every prize redeemed this week",
  },
];

export interface FomoConfig {
  enabled: boolean;
  position: FomoPosition;
  theme: FomoTheme;
  // Milliseconds a single toast stays on screen, and the gap before the next.
  displayMs: number;
  gapMs: number;
  initialDelayMs: number;
  loop: boolean;
  showOnMobile: boolean;
  types: {
    recent_winner: { enabled: boolean; template: string; anonymize: boolean; maxAgeHours: number };
    recent_signup: { enabled: boolean; template: string; anonymize: boolean; maxAgeHours: number };
    signup_count: { enabled: boolean; template: string; windowHours: number; minimum: number };
    low_stock: { enabled: boolean; template: string; dailyTotal: number; floor: number };
    countdown: { enabled: boolean; template: string; endsAt: number | null; rollingHours: number };
    live_visitors: { enabled: boolean; template: string; min: number; max: number };
    custom: { enabled: boolean; messages: string[] };
  };
}

export const DEFAULT_FOMO_CONFIG: FomoConfig = {
  enabled: false,
  position: "bottom-left",
  theme: "auto",
  displayMs: 5000,
  gapMs: 7000,
  initialDelayMs: 4000,
  loop: true,
  showOnMobile: true,
  types: {
    recent_winner: {
      enabled: true,
      template: "{name} just won {prize} — {time}",
      anonymize: true,
      maxAgeHours: 72,
    },
    recent_signup: {
      enabled: true,
      template: "{name} just joined the giveaway — {time}",
      anonymize: true,
      maxAgeHours: 72,
    },
    signup_count: {
      enabled: true,
      template: "{count} people entered in the last {hours} hours",
      windowHours: 24,
      minimum: 5,
    },
    low_stock: {
      enabled: false,
      template: "Only {left} of {total} prizes left today",
      dailyTotal: 100,
      floor: 3,
    },
    countdown: {
      enabled: false,
      template: "Hurry — this offer ends in {time}",
      endsAt: null,
      rollingHours: 24,
    },
    live_visitors: {
      enabled: false,
      template: "{count} people are viewing this offer right now",
      min: 8,
      max: 40,
    },
    custom: {
      enabled: false,
      messages: [],
    },
  },
};

const POSITIONS: FomoPosition[] = ["bottom-left", "bottom-right", "top-left", "top-right"];
const THEMES: FomoTheme[] = ["light", "dark", "auto"];

function bool(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function str(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function num(value: unknown, fallback: number, min: number, max: number) {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

// Every read of `offers.fomoConfig` goes through here, so a partially
// written or hand-edited JSON blob can never crash a customer-facing page.
export function normalizeFomoConfig(raw: unknown): FomoConfig {
  const input = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const types = (input.types && typeof input.types === "object" ? input.types : {}) as Record<
    string,
    unknown
  >;
  const d = DEFAULT_FOMO_CONFIG;
  const pick = (key: FomoTypeId) =>
    (types[key] && typeof types[key] === "object" ? types[key] : {}) as Record<string, unknown>;

  const winner = pick("recent_winner");
  const signup = pick("recent_signup");
  const count = pick("signup_count");
  const stock = pick("low_stock");
  const countdown = pick("countdown");
  const visitors = pick("live_visitors");
  const custom = pick("custom");

  const min = num(visitors.min, d.types.live_visitors.min, 1, 9999);
  const max = num(visitors.max, d.types.live_visitors.max, 1, 9999);
  const endsAt = countdown.endsAt;

  return {
    enabled: bool(input.enabled, d.enabled),
    position: POSITIONS.includes(input.position as FomoPosition)
      ? (input.position as FomoPosition)
      : d.position,
    theme: THEMES.includes(input.theme as FomoTheme) ? (input.theme as FomoTheme) : d.theme,
    displayMs: num(input.displayMs, d.displayMs, 1500, 60000),
    gapMs: num(input.gapMs, d.gapMs, 1000, 300000),
    initialDelayMs: num(input.initialDelayMs, d.initialDelayMs, 0, 300000),
    loop: bool(input.loop, d.loop),
    showOnMobile: bool(input.showOnMobile, d.showOnMobile),
    types: {
      recent_winner: {
        enabled: bool(winner.enabled, d.types.recent_winner.enabled),
        template: str(winner.template, d.types.recent_winner.template),
        anonymize: bool(winner.anonymize, d.types.recent_winner.anonymize),
        maxAgeHours: num(winner.maxAgeHours, d.types.recent_winner.maxAgeHours, 1, 8760),
      },
      recent_signup: {
        enabled: bool(signup.enabled, d.types.recent_signup.enabled),
        template: str(signup.template, d.types.recent_signup.template),
        anonymize: bool(signup.anonymize, d.types.recent_signup.anonymize),
        maxAgeHours: num(signup.maxAgeHours, d.types.recent_signup.maxAgeHours, 1, 8760),
      },
      signup_count: {
        enabled: bool(count.enabled, d.types.signup_count.enabled),
        template: str(count.template, d.types.signup_count.template),
        windowHours: num(count.windowHours, d.types.signup_count.windowHours, 1, 8760),
        minimum: num(count.minimum, d.types.signup_count.minimum, 0, 100000),
      },
      low_stock: {
        enabled: bool(stock.enabled, d.types.low_stock.enabled),
        template: str(stock.template, d.types.low_stock.template),
        dailyTotal: num(stock.dailyTotal, d.types.low_stock.dailyTotal, 1, 1000000),
        floor: num(stock.floor, d.types.low_stock.floor, 0, 100000),
      },
      countdown: {
        enabled: bool(countdown.enabled, d.types.countdown.enabled),
        template: str(countdown.template, d.types.countdown.template),
        endsAt: typeof endsAt === "number" && Number.isFinite(endsAt) ? endsAt : null,
        rollingHours: num(countdown.rollingHours, d.types.countdown.rollingHours, 1, 8760),
      },
      live_visitors: {
        enabled: bool(visitors.enabled, d.types.live_visitors.enabled),
        template: str(visitors.template, d.types.live_visitors.template),
        min,
        // A max below min would make the drift range empty.
        max: Math.max(min, max),
      },
      custom: {
        enabled: bool(custom.enabled, d.types.custom.enabled),
        messages: Array.isArray(custom.messages)
          ? (custom.messages as unknown[])
              .filter((m): m is string => typeof m === "string" && m.trim().length > 0)
              .slice(0, 20)
              .map((m) => m.trim().slice(0, 200))
          : [],
      },
    },
  };
}

// "Priya Sharma" -> "Priya S." so a public feed never leaks a full name.
export function anonymizeName(name: string): string {
  const clean = (name ?? "").trim();
  if (!clean) return "Someone";
  const parts = clean.split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1].charAt(0).toUpperCase()}.`;
}

export function relativeTime(from: number, now = Date.now()): string {
  const seconds = Math.max(0, Math.floor((now - from) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function applyTemplate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}

// hh:mm:ss for the countdown type, dropping the hours segment past a day.
export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  if (days > 0) return `${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

// A single notification as sent to the browser. The countdown type carries
// `countdownEndsAt` + `template` so the client can re-render it every second
// without another round trip; every other type is static text.
export interface FomoItem {
  id: string;
  type: FomoTypeId;
  icon: string;
  text: string;
  countdownEndsAt?: number;
  template?: string;
}

export interface FomoFeed {
  enabled: boolean;
  position: FomoPosition;
  theme: FomoTheme;
  displayMs: number;
  gapMs: number;
  initialDelayMs: number;
  loop: boolean;
  showOnMobile: boolean;
  items: FomoItem[];
}

// Stand-in names/prizes for the admin preview, so a merchant can see their
// templates rendered before a single real entry exists. The live feed served
// to visitors is built from real rows by lib/fomoFeed.ts — never from these.
const SAMPLE_PEOPLE = [
  { name: "Priya S.", prize: "a Free Coffee", minutesAgo: 3 },
  { name: "Rahul M.", prize: "20% OFF", minutesAgo: 11 },
  { name: "Aisha K.", prize: "a Free Dessert", minutesAgo: 26 },
  { name: "Daniel O.", prize: "Buy 1 Get 1", minutesAgo: 74 },
];

// Client-side twin of buildFomoFeed(), used by the admin preview so unsaved
// edits render instantly without a round trip.
export function buildPreviewFomoFeed(config: FomoConfig, now = Date.now()): FomoFeed {
  const t = config.types;
  const items: FomoItem[] = [];
  const icon = (id: FomoTypeId) => FOMO_TYPES.find((x) => x.id === id)!.icon;

  if (t.recent_winner.enabled) {
    SAMPLE_PEOPLE.slice(0, 2).forEach((p, i) => {
      items.push({
        id: `preview-winner-${i}`,
        type: "recent_winner",
        icon: icon("recent_winner"),
        text: applyTemplate(t.recent_winner.template, {
          name: t.recent_winner.anonymize ? p.name : p.name.replace(/\s\w\.$/, " Sharma"),
          prize: p.prize,
          time: relativeTime(now - p.minutesAgo * 60_000, now),
        }),
      });
    });
  }

  if (t.recent_signup.enabled) {
    SAMPLE_PEOPLE.slice(2).forEach((p, i) => {
      items.push({
        id: `preview-signup-${i}`,
        type: "recent_signup",
        icon: icon("recent_signup"),
        text: applyTemplate(t.recent_signup.template, {
          name: t.recent_signup.anonymize ? p.name : p.name.replace(/\s\w\.$/, " Kapoor"),
          time: relativeTime(now - p.minutesAgo * 60_000, now),
        }),
      });
    });
  }

  if (t.signup_count.enabled) {
    items.push({
      id: "preview-count",
      type: "signup_count",
      icon: icon("signup_count"),
      text: applyTemplate(t.signup_count.template, {
        count: Math.max(t.signup_count.minimum, 142),
        hours: t.signup_count.windowHours,
      }),
    });
  }

  if (t.low_stock.enabled) {
    items.push({
      id: "preview-stock",
      type: "low_stock",
      icon: icon("low_stock"),
      text: applyTemplate(t.low_stock.template, {
        left: Math.max(t.low_stock.floor, Math.round(t.low_stock.dailyTotal * 0.07)),
        total: t.low_stock.dailyTotal,
      }),
    });
  }

  if (t.countdown.enabled) {
    const endsAt =
      t.countdown.endsAt && t.countdown.endsAt > now
        ? t.countdown.endsAt
        : now + t.countdown.rollingHours * 3600_000;
    items.push({
      id: "preview-countdown",
      type: "countdown",
      icon: icon("countdown"),
      text: applyTemplate(t.countdown.template, { time: formatDuration(endsAt - now) }),
      countdownEndsAt: endsAt,
      template: t.countdown.template,
    });
  }

  if (t.live_visitors.enabled) {
    items.push({
      id: "preview-visitors",
      type: "live_visitors",
      icon: icon("live_visitors"),
      text: applyTemplate(t.live_visitors.template, {
        count: Math.round((t.live_visitors.min + t.live_visitors.max) / 2),
      }),
    });
  }

  if (t.custom.enabled) {
    t.custom.messages.forEach((message, i) => {
      items.push({
        id: `preview-custom-${i}`,
        type: "custom",
        icon: icon("custom"),
        text: message,
      });
    });
  }

  return {
    enabled: config.enabled,
    position: config.position,
    theme: config.theme,
    displayMs: config.displayMs,
    gapMs: config.gapMs,
    initialDelayMs: config.initialDelayMs,
    loop: config.loop,
    showOnMobile: config.showOnMobile,
    items,
  };
}
