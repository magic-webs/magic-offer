// Talks to the /embed.js loader when the landing page is running inside its
// iframe on a merchant's site. A no-op everywhere else, so game components
// can call these unconditionally.

function inEmbed() {
  return typeof window !== "undefined" && window.parent !== window;
}

function post(type: string, payload?: Record<string, unknown>) {
  if (!inEmbed()) return;
  try {
    // The loader validates the origin on its side; we cannot know the
    // merchant's origin here, which is why this targets "*" and never
    // carries anything that is not already public.
    window.parent.postMessage({ source: "magic-offer", type, payload }, "*");
  } catch {
    /* cross-origin restrictions — nothing to do but carry on */
  }
}

// Lets the loader stop re-prompting a visitor who has already entered.
export function notifyEmbedRegistered() {
  post("registered");
}

// Closes the popup from inside the frame.
export function requestEmbedClose() {
  post("close");
}

export function isEmbedded() {
  return inEmbed();
}
