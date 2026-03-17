'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Bike, FileText, Settings } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', icon: Home, label: 'Accueil' },
  { href: '/bikes', icon: Bike, label: 'Flotte' },
  { href: '/reports', icon: FileText, label: 'Rapports' },
  { href: '/settings', icon: Settings, label: 'Réglages' },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <div className="flex min-h-screen bg-[var(--cc-bg)]">

      {/* ── SIDEBAR (Tablette/Desktop : largeur ≥ 768px) ── */}
      <aside className="hidden md:flex flex-col w-64 bg-[var(--cc-surface)] border-r border-[var(--cc-border)] shadow-[var(--cc-shadow-sm)] shrink-0 sticky top-0 h-screen">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-[var(--cc-border)]">
          <h1 className="text-2xl font-bold text-[var(--cc-primary)]">CycleCheck</h1>
          <p className="text-xs text-[var(--cc-text-muted)] mt-0.5">Gestion de flotte</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                  active
                    ? 'bg-[var(--cc-primary-light)] text-[var(--cc-primary)]'
                    : 'text-[var(--cc-text-muted)] hover:bg-[var(--cc-border-subtle)] hover:text-[var(--cc-text)]'
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${active ? 'text-[var(--cc-primary)]' : 'text-[var(--cc-text-faint)]'}`} />
                {label}
                {active && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--cc-primary)]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer sidebar : version */}
        <div className="px-5 py-4 border-t border-[var(--cc-border)] flex items-center justify-center">
          <span className="text-xs text-[var(--cc-text-faint)]">CycleCheck v1.0</span>
        </div>
      </aside>

      {/* ── CONTENU PRINCIPAL ── */}
      <main className="flex-1 flex flex-col overflow-auto">
        <div className="flex-1 pb-20 md:pb-0">
          {children}
        </div>
      </main>

      {/* ── BOTTOM NAV (Mobile uniquement : largeur < 768px) ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[var(--cc-surface)] border-t border-[var(--cc-border)] shadow-[0_-2px_12px_rgba(0,0,0,0.08)] z-50">
        <div className="flex items-stretch h-16">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors relative ${
                  active ? 'text-[var(--cc-primary)]' : 'text-[var(--cc-text-faint)] hover:text-[var(--cc-text-muted)]'
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform ${active ? 'scale-110' : ''}`} />
                <span className="text-[10px] font-medium">{label}</span>
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[var(--cc-primary)] rounded-full" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
