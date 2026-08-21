// Synthesized sound effects via the Web Audio API — no audio files, so
// nothing to license or ship. Playing anything requires a live AudioContext,
// which browsers only let a page create/resume from a genuine user gesture,
// so `unlockAudio` must be called synchronously inside a click/submit
// handler before any `await`. Once resumed, the context stays usable for
// the rest of the page's life, even from later async callbacks.

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioContextClass =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!audioCtx) audioCtx = new AudioContextClass();
  return audioCtx;
}

export function unlockAudio() {
  const ctx = getAudioContext();
  if (ctx && ctx.state === "suspended") ctx.resume();
}

function playTone(
  ctx: AudioContext,
  time: number,
  freq: number,
  { type = "sine" as OscillatorType, gain = 0.2, attack = 0.01, decay = 0.15 } = {},
) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, time);
  g.gain.exponentialRampToValueAtTime(gain, time + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, time + attack + decay);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(time);
  osc.stop(time + attack + decay + 0.02);
}

// A wheel-of-fortune "click" per peg the pointer passes — bunched up while
// the wheel spins fast, spreading out as it decelerates. Tick k lands at
// t = duration * (1 - sqrt(1 - k/N)), the time-inverse of an ease-out
// angular-velocity curve, so the clicks slow down exactly like the wheel.
export function playSpinSound(durationMs: number) {
  const ctx = getAudioContext();
  if (!ctx) return;
  const start = ctx.currentTime;
  const duration = durationMs / 1000;
  const ticks = 28;
  for (let k = 1; k <= ticks; k++) {
    const t = start + duration * (1 - Math.sqrt(1 - k / ticks));
    playTone(ctx, t, 780 + Math.random() * 80, {
      type: "square",
      gain: 0.12,
      attack: 0.002,
      decay: 0.035,
    });
  }
}

// A short rising chime for a win, timed to land alongside the confetti burst.
export function playWinSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const start = ctx.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
  notes.forEach((freq, i) => {
    playTone(ctx, start + i * 0.1, freq, {
      type: "triangle",
      gain: 0.22,
      attack: 0.015,
      decay: 0.35,
    });
  });
}
