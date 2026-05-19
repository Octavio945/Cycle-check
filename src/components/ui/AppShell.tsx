'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Package, ArrowLeftRight, History,
  Users, FileBarChart2, Settings, Layers, Building2,
  Zap, MoreHorizontal, X
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

const NAV_ITEMS = [
  { href: '/',            icon: LayoutDashboard, label: 'Tableau de bord' },
  { href: '/categories',  icon: Layers,          label: 'Catégories'      },
  { href: '/equipment',   icon: Package,         label: 'Équipements'     },
  { href: '/loans',       icon: ArrowLeftRight,  label: 'Emprunts'        },
  { href: '/history',     icon: History,         label: 'Historique'      },
  { href: '/employees',   icon: Users,           label: 'Employés'        },
  { href: '/departments', icon: Building2,       label: 'Services'        },
  { href: '/reports',     icon: FileBarChart2,   label: 'Rapports'        },
  { href: '/settings',    icon: Settings,        label: 'Paramètres'      },
];

// 4 items principaux + bouton "Plus"
const MOBILE_MAIN = [
  { href: '/',          icon: LayoutDashboard, label: 'Accueil'     },
  { href: '/equipment', icon: Package,         label: 'Équipements' },
  { href: '/loans',     icon: ArrowLeftRight,  label: 'Emprunts'    },
  { href: '/employees', icon: Users,           label: 'Employés'    },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  // Vérifie si la page active n'est pas dans les 4 items principaux
  const isOtherActive = !MOBILE_MAIN.some(item => isActive(item.href));

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--et-bg)' }}>

      {/* ══ SIDEBAR — desktop (md+) ══ */}
      <aside
        className="hidden md:flex flex-col w-60 shrink-0 sticky top-0 h-screen"
        style={{ background: 'var(--et-sidebar-bg)', borderRight: '1px solid var(--et-sidebar-border)' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5" style={{ borderBottom: '1px solid var(--et-sidebar-border)' }}>
          <div
            className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
            style={{ background: 'var(--et-primary)' }}
          >
            <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-sm font-bold tracking-tight" style={{ color: 'var(--et-sidebar-logo)' }}>
              EquiTrack
            </p>
            <p className="text-[10px]" style={{ color: 'var(--et-sidebar-text)' }}>
              Gestion des équipements
            </p>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all"
                style={{
                  background: active ? 'var(--et-sidebar-active-bg)' : 'transparent',
                  color: active ? 'var(--et-sidebar-active)' : 'var(--et-sidebar-text)',
                }}
                onMouseEnter={e => {
                  if (!active) {
                    (e.currentTarget as HTMLElement).style.background = 'var(--et-sidebar-hover)';
                    (e.currentTarget as HTMLElement).style.color = 'var(--et-sidebar-text-hover)';
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                    (e.currentTarget as HTMLElement).style.color = 'var(--et-sidebar-text)';
                  }
                }}
              >
                <Icon
                  className="w-4 h-4 shrink-0"
                  strokeWidth={active ? 2.5 : 2}
                  style={{ color: active ? 'var(--et-sidebar-active)' : 'var(--et-sidebar-text)' }}
                />
                <span className="text-sm" style={{ fontWeight: active ? 600 : 400 }}>
                  {label}
                </span>
                {active && (
                  <span
                    className="ml-auto w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: 'var(--et-sidebar-active)' }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div
          className="px-4 py-4 flex items-center justify-between"
          style={{ borderTop: '1px solid var(--et-sidebar-border)' }}
        >
          <span className="text-[11px]" style={{ color: 'var(--et-sidebar-text)' }}>v1.0.0</span>
          <ThemeToggle />
        </div>
      </aside>

      {/* ══ MAIN CONTENT ══ */}
      <main className="flex-1 flex flex-col overflow-auto min-w-0">
        <div className="flex-1 pb-20 md:pb-0">
          {children}
        </div>
      </main>

      {/* ══ BOTTOM NAV — mobile uniquement ══ */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40"
        style={{
          background: 'var(--et-surface)',
          borderTop: '1px solid var(--et-border)',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
        }}
      >
        <div className="flex items-stretch h-16">
          {/* 4 items principaux */}
          {MOBILE_MAIN.map(({ href, icon: Icon, label }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className="flex-1 flex flex-col items-center justify-center gap-1 transition-colors relative"
                style={{ color: active ? 'var(--et-primary)' : 'var(--et-text-muted)' }}
              >
                {active && (
                  <span
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-0.5 rounded-full"
                    style={{ background: 'var(--et-primary)' }}
                  />
                )}
                <Icon
                  className={`w-5 h-5 transition-transform ${active ? 'scale-110' : ''}`}
                  strokeWidth={active ? 2.5 : 2}
                />
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            );
          })}

          {/* Bouton "Plus" */}
          <button
            onClick={() => setMenuOpen(true)}
            className="flex-1 flex flex-col items-center justify-center gap-1 transition-colors relative"
            style={{ color: isOtherActive ? 'var(--et-primary)' : 'var(--et-text-muted)' }}
          >
            {isOtherActive && (
              <span
                className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-0.5 rounded-full"
                style={{ background: 'var(--et-primary)' }}
              />
            )}
            <MoreHorizontal className="w-5 h-5" strokeWidth={isOtherActive ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Plus</span>
          </button>
        </div>
      </nav>

      {/* ══ MENU SLIDE-UP (mobile) — tous les liens ══ */}
      {menuOpen && (
        <>
          {/* Overlay sombre */}
          <div
            className="md:hidden fixed inset-0 z-50"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }}
            onClick={() => setMenuOpen(false)}
          />

          {/* Panneau du bas */}
          <div
            className="md:hidden fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl overflow-hidden"
            style={{
              background: 'var(--et-surface)',
              boxShadow: '0 -8px 40px rgba(0,0,0,0.15)',
            }}
          >
            {/* Poignée */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: 'var(--et-border)' }} />
            </div>

            {/* Header du panneau */}
            <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid var(--et-border)' }}>
              <div className="flex items-center gap-2">
                <div
                  className="flex items-center justify-center w-7 h-7 rounded-lg"
                  style={{ background: 'var(--et-primary)' }}
                >
                  <Zap className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                </div>
                <span className="font-bold text-sm" style={{ color: 'var(--et-text)' }}>EquiTrack</span>
              </div>
              <button
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-center w-8 h-8 rounded-full"
                style={{ background: 'var(--et-surface-2)' }}
              >
                <X className="w-4 h-4" style={{ color: 'var(--et-text-muted)' }} />
              </button>
            </div>

            {/* Grille de navigation */}
            <div className="p-4 grid grid-cols-3 gap-3 pb-8">
              {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMenuOpen(false)}
                    className="flex flex-col items-center gap-2 p-3 rounded-2xl transition-all"
                    style={{
                      background: active ? 'var(--et-primary-light)' : 'var(--et-surface-2)',
                      border: `1.5px solid ${active ? 'var(--et-primary-muted)' : 'transparent'}`,
                    }}
                  >
                    <div
                      className="flex items-center justify-center w-11 h-11 rounded-xl"
                      style={{
                        background: active ? 'var(--et-primary)' : 'var(--et-surface)',
                        boxShadow: active ? '0 4px 12px rgba(59,130,246,0.3)' : 'none',
                      }}
                    >
                      <Icon
                        className="w-5 h-5"
                        style={{ color: active ? '#fff' : 'var(--et-text-muted)' }}
                        strokeWidth={active ? 2.5 : 2}
                      />
                    </div>
                    <span
                      className="text-[11px] text-center leading-tight"
                      style={{
                        color: active ? 'var(--et-primary)' : 'var(--et-text-secondary)',
                        fontWeight: active ? 600 : 400,
                      }}
                    >
                      {label}
                    </span>
                  </Link>
                );
              })}
            </div>

            {/* Theme toggle en bas */}
            <div
              className="flex items-center justify-between px-5 py-3"
              style={{ borderTop: '1px solid var(--et-border)' }}
            >
              <span className="text-xs" style={{ color: 'var(--et-text-muted)' }}>Thème de l'interface</span>
              <ThemeToggle />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
