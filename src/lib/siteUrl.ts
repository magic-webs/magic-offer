// Falls back to localhost so registration still works in local dev without
// NEXT_PUBLIC_SITE_URL set; production should always set it (e.g.
// https://win.magicwebs.ai) so the returned link is absolute and correct.
export function getSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  return (configured ?? "http://localhost:3000").replace(/\/+$/, "");
}

export function buildLoginUrl(token: string) {
  return `${getSiteUrl()}/?t=${token}`;
}
