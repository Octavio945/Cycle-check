'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Package, ArrowLeftRight, History,
  Users, FileBarChart2, Settings, Layers, Building2,
  Zap
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

const MOBILE_NAV = [
  { href: '/',          icon: LayoutDashboard, label: 'Accueil'     },
  { href: '/equipment', icon: Package,         label: 'Équipements' },
  { href: '/loans',     icon: ArrowLeftRight,  label: 'Emprunts'    },
  { href: '/employees', icon: Users,           label: 'Employés'    },
  { href: '/settings',  icon: Settings,        label: 'Réglages'    },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

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
            <Zap className="w-4.5 h-4.5 text-white" strokeWidth={2.5} />
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

        {/* Nav */}
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
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--et-sidebar-hover)'; (e.currentTarget as HTMLElement).style.color = 'var(--et-sidebar-text-hover)'; }}
                onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--et-sidebar-text)'; } }}
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

        {/* Bottom */}
        <div
          className="px-4 py-4 flex items-center justify-between"
          style={{ borderTop: '1px solid var(--et-sidebar-border)' }}
        >
          <span className="text-[11px]" style={{ color: 'var(--et-sidebar-text)' }}>
            v1.0.0
          </span>
          <ThemeToggle />
        </div>
      </aside>

      {/* ══ MAIN ══ */}
      <main className="flex-1 flex flex-col overflow-auto min-w-0">
        <div className="flex-1 pb-20 md:pb-0">
          {children}
        </div>
      </main>

      {/* ══ BOTTOM NAV — mobile ══ */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50"
        style={{
          background: 'var(--et-surface)',
          borderTop: '1px solid var(--et-border)',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
        }}
      >
        <div className="flex items-stretch h-16">
          {MOBILE_NAV.map(({ href, icon: Icon, label }) => {
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
                <Icon className={`w-5 h-5 transition-transform ${active ? 'scale-110' : ''}`} strokeWidth={active ? 2.5 : 2} />
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
