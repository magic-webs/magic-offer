import type { Metadata } from 'next';
import { Geist_Mono, Montserrat } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { product } from '@/lib/siteConfig';
import './globals.css';

// Real weights rather than just 500 — without 600/700 the browser
// synthesises every semibold and bold on the site, which smears headings.
const montserrat = Montserrat({
  variable: '--font-montserrat',
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: `${product.name} — ${product.tagline}`,
    template: `%s`,
  },
  description: product.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${montserrat.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
