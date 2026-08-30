import type { Metadata } from "next";
import EmbedPreviewLoader from "./loader";

export const metadata: Metadata = {
  title: "Embed test page",
  // A dummy storefront is not something anyone should find in search.
  robots: { index: false, follow: false },
};

// A throwaway storefront that loads the real /embed.js, so a merchant can
// try their exit-intent settings against actual browser events before
// pasting the snippet onto their own site. Linked from the offer's
// Embed & Exit Intent tab.
export default async function EmbedPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string; o?: string }>;
}) {
  const { slug, o: offerId } = await searchParams;

  if (!slug) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-950 p-8 text-center text-neutral-300">
        <div className="max-w-md">
          <h1 className="text-xl font-semibold text-white">Nothing to preview</h1>
          <p className="mt-2 text-sm text-neutral-400">
            This page needs a company slug. Open it from an offer&apos;s{" "}
            <span className="text-neutral-200">Embed &amp; Exit Intent</span> tab, or add{" "}
            <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs">?slug=your-company</code> to
            the URL.
          </p>
        </div>
      </main>
    );
  }

  const products = [
    { name: "Ceramic Pour-Over", price: "$38.00" },
    { name: "Single-Origin Beans", price: "$21.50" },
    { name: "Burr Grinder", price: "$129.00" },
    { name: "Insulated Tumbler", price: "$26.00" },
    { name: "Filter Papers (100)", price: "$8.00" },
    { name: "Gooseneck Kettle", price: "$74.00" },
  ];

  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <EmbedPreviewLoader slug={slug} offerId={offerId} />

      {/* Padding at the top clears the floating test-controls bar. */}
      <header className="border-b pt-28">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <span className="text-lg font-bold tracking-tight">NORTHBREW</span>
          <nav className="hidden gap-7 text-sm text-neutral-600 sm:flex">
            <span>Shop</span>
            <span>Brewing</span>
            <span>Journal</span>
            <span>Stockists</span>
          </nav>
          <span className="text-sm text-neutral-600">Cart (0)</span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-14">
        <section className="border-b pb-14">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
            Sample store
          </p>
          <h1 className="mt-3 max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
            This is a stand-in for your website.
          </h1>
          <p className="mt-4 max-w-xl text-neutral-600">
            The embed script is running on this page exactly as it would on yours. Scroll, wait, go
            idle, or move your pointer up out of the window — whichever triggers you switched on
            will fire here.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button className="rounded-full bg-neutral-900 px-6 py-3 text-sm font-medium text-white">
              Shop all
            </button>
            {/* Handy target for testing the click-selector trigger. */}
            <button className="win-a-prize rounded-full border border-neutral-300 px-6 py-3 text-sm font-medium">
              Win a prize
            </button>
          </div>
          <p className="mt-3 text-xs text-neutral-500">
            The second button carries the class{" "}
            <code className="rounded bg-neutral-100 px-1.5 py-0.5">win-a-prize</code> — set that as
            your click selector to test it.
          </p>
        </section>

        <section className="py-14">
          <h2 className="text-2xl font-bold tracking-tight">Featured</h2>
          <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <article key={product.name}>
                <div className="aspect-square rounded-xl bg-neutral-100" />
                <h3 className="mt-3 text-sm font-medium">{product.name}</h3>
                <p className="text-sm text-neutral-500">{product.price}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Enough page to make the scroll-depth trigger meaningful. */}
        <section className="space-y-5 border-t py-14 text-neutral-600">
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900">
            Filler, so scrolling means something
          </h2>
          {Array.from({ length: 6 }).map((_, i) => (
            <p key={i} className="max-w-2xl leading-relaxed">
              Roasted in small batches and shipped within a day. This block exists only so the page
              is tall enough for a scroll-depth trigger to be worth testing — keep scrolling to
              watch it fire at the percentage you configured.
            </p>
          ))}
        </section>
      </main>

      <footer className="border-t py-10 text-center text-xs text-neutral-500">
        Sample storefront for testing the Magic Offer embed. Not a real shop.
      </footer>
    </div>
  );
}
