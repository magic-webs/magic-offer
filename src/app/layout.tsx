import type { Metadata } from 'next';
import { Geist_Mono, Montserrat } from 'next/font/google';
import './globals.css';

const montserrat = Montserrat({
  variable: '--font-montserrat',
  weight: "500",
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Spin & Win | Magic Offer',
  description: 'Spin the wheel for a chance to win free perfume.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${montserrat.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
