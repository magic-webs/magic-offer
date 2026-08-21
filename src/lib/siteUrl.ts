// Falls back to localhost so registration still works in local dev without
// NEXT_PUBLIC_SITE_URL set; production should always set it (e.g.
// https://win.magicwebs.ai) so the returned link is absolute and correct.
export function getSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  return (configured ?? "http://localhost:3000").replace(/\/+$/, "");
}

// A falsy `companySlug` keeps the original global magic-link shape
// (`/?t=<token>`) so existing production links never break; a company
// slug namespaces the link under `/w/<slug>` for every other company.
export function buildLoginUrl(token: string, companySlug?: string | null) {
  return companySlug
    ? `${getSiteUrl()}/w/${companySlug}?t=${token}`
    : `${getSiteUrl()}/?t=${token}`;
}
