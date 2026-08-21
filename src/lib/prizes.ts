export type PrizeId = "perfume_1" | "perfume_2" | "perfume_3" | "no_win";

export interface Prize {
  id: PrizeId;
  label: string;
  weight: number;
  color: string;
  image?: string;
}

// Order here is clockwise starting at the top of the wheel (top, right,
// bottom, left) to match the 4 fixed quadrants in the UI. `weight` drives
// the actual server-side odds and is intentionally decoupled from wedge
// size — every wedge is a visually equal quarter, but 1 & 2 free perfumes
// are still far more likely to be drawn than 3, per the brief.
export const PRIZES: Prize[] = [
  {
    id: "perfume_1",
    label: "Get 1 Free Perfume",
    weight: 48,
    color: "#8b5cf6",
    image: "/perfume/p1.png",
  },
  {
    id: "perfume_2",
    label: "Get 2 Free Perfumes",
    weight: 36,
    color: "#ec4899",
    image: "/perfume/p2.png",
  },
  {
    id: "perfume_3",
    label: "Get 3 Free Perfumes",
    weight: 6,
    color: "#f59e0b",
    image: "/perfume/p3.png",
  },
  { id: "no_win", label: "Better Luck Next Time", weight: 10, color: "#3b82f6" },
];

export interface PrizeArc extends Prize {
  start: number;
  end: number;
}

// Fixed equal quadrants (90deg each), in PRIZES order, centered on the
// cardinal directions (top, right, bottom, left) with boundaries on the
// diagonals — start/end are absolute angles (0 = top, clockwise), and can
// go negative (e.g. -45..45 for the top quadrant). Intentionally NOT
// proportional to `weight`.
export function getPrizeArcs(): PrizeArc[] {
  const span = 360 / PRIZES.length;
  return PRIZES.map((p, i) => ({
    ...p,
    start: i * span - span / 2,
    end: i * span + span / 2,
  }));
}

export function getPrize(id: PrizeId): Prize {
  const prize = PRIZES.find((p) => p.id === id);
  if (!prize) throw new Error(`Unknown prize id: ${id}`);
  return prize;
}

// Server-only: the actual weighted draw. Never call this from client code.
export function drawWeightedPrize(): Prize {
  const total = PRIZES.reduce((sum, p) => sum + p.weight, 0);
  let r = Math.random() * total;
  for (const p of PRIZES) {
    if (r < p.weight) return p;
    r -= p.weight;
  }
  return PRIZES[PRIZES.length - 1];
}
