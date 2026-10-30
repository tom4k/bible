'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  CalendarDays,
  Bookmark,
  BookMarked,
  LineChart,
  Settings,
  Home,
} from 'lucide-react';
import { SyroCrossIcon } from './icons/SyroCrossIcon';

export function Navigation() {
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/bible', label: 'Bible', icon: BookOpen },
    { href: '/plans', label: 'Plans', icon: CalendarDays },
    { href: '/journal', label: 'Journal', icon: BookMarked },
    { href: '/bookmarks', label: 'Bookmarks', icon: Bookmark },
    { href: '/progress', label: 'Progress', icon: LineChart },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  const isLinkActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Desktop Top Header Navigation */}
      <header className="hidden md:block sticky top-0 z-40 backdrop-blur-md bg-[var(--bg-card)]/90 border-b border-[var(--border-color)]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-3 group focus-visible:outline-none"
            aria-label="The Living Word Home"
          >
            <div className="w-10 h-10 rounded-xl bg-[var(--primary-green)] text-[var(--gold)] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <SyroCrossIcon className="w-6 h-6 text-[var(--gold)]" />
            </div>
            <div>
              <span className="font-serif text-lg font-bold tracking-tight text-[var(--primary-green)] dark:text-[var(--gold)] block leading-tight">
                The Living Word
              </span>
              <span className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-medium">
                Syro-Malabar Catholic Bible
              </span>
            </div>
          </Link>

          <nav className="flex items-center gap-1" aria-label="Main Navigation">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isLinkActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? 'bg-[var(--primary-green)] text-white dark:bg-[var(--gold)] dark:text-[#173B33] shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-subtle)]'
                  }`}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Mobile Top App Bar */}
      <div className="md:hidden sticky top-0 z-40 backdrop-blur-md bg-[var(--bg-card)]/90 border-b border-[var(--border-color)] px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[var(--primary-green)] text-[var(--gold)] flex items-center justify-center">
            <SyroCrossIcon className="w-5 h-5 text-[var(--gold)]" />
          </div>
          <div>
            <span className="font-serif font-bold text-sm text-[var(--primary-green)] dark:text-[var(--gold)] block leading-none">
              The Living Word
            </span>
            <span className="text-[9px] uppercase tracking-wider text-[var(--text-muted)] font-semibold">
              NRSV-CE
            </span>
          </div>
        </Link>
        <Link
          href="/settings"
          className="p-2 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-card-subtle)]"
          aria-label="Settings"
        >
          <Settings className="w-5 h-5" />
        </Link>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 backdrop-blur-lg bg-[var(--bg-card)]/95 border-t border-[var(--border-color)] px-2 py-1.5 flex justify-around items-center"
        aria-label="Mobile Navigation"
      >
        {[
          { href: '/', label: 'Home', icon: Home },
          { href: '/bible', label: 'Bible', icon: BookOpen },
          { href: '/plans', label: 'Plans', icon: CalendarDays },
          { href: '/journal', label: 'Journal', icon: BookMarked },
          { href: '/progress', label: 'Progress', icon: LineChart },
        ].map((item) => {
          const Icon = item.icon;
          const active = isLinkActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg text-[10px] font-medium transition-colors ${
                active
                  ? 'text-[var(--primary-green)] dark:text-[var(--gold)] font-bold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              <div
                className={`p-1 rounded-full transition-transform ${
                  active ? 'scale-110' : ''
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
