import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';
import './globals.css';
import { AppProvider } from '../context/AppContext';
import { Navigation } from '../components/Navigation';
import { PWARegistration } from '../components/PWARegistration';

export const metadata: Metadata = {
  title: 'The Living Word | Syro-Malabar Catholic Bible',
  description:
    'A private, contemplative Catholic Bible-reading Progressive Web App for the Syro-Malabar tradition. Daily Scripture habit, reading plans, and personal reflection journal.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'The Living Word',
  },
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/icon-192.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#173B33',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-200">
        <AppProvider>
          <PWARegistration />
          <Suspense fallback={<div className="h-16 border-b border-[var(--border-color)]" />}>
            <Navigation />
          </Suspense>
          <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-12">
            <Suspense fallback={<div className="py-12 text-center text-xs text-[var(--text-muted)]">Loading...</div>}>
              {children}
            </Suspense>
          </main>
        </AppProvider>
      </body>
    </html>
  );
}
