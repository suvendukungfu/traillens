import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { Cormorant_Garamond, Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import { SessionProvider } from '@/context/SessionContext';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'TrailLens — Look beyond the screen',
  description: 'An offline-first, local AI companion powered by Gemma 3 4B that turns outdoor observations into real-world exploration challenges.',
  keywords: ['outdoor', 'exploration', 'gemma', 'ollama', 'local ai', 'touch grass', 'hacktoberfest'],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`h-full ${cormorant.variable} ${inter.variable}`}>
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans antialiased selection:bg-moss/20 selection:text-moss-dark">
        <SessionProvider>
          <Navbar />
          <main className="flex-1 flex flex-col">{children}</main>
        </SessionProvider>
      </body>
    </html>
  );
}
