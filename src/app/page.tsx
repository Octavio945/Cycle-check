'use client';

import Link from 'next/link';
import { Bike, Settings, FileText } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useEffect, useState } from 'react';
import ThemeToggle from '@/components/ui/ThemeToggle';

export default function Home() {
  const bikes = useStore((state) => state.bikes);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const totalBikes    = bikes.length;
  const bikesToRepair  = bikes.filter(b => b.parts.some(p => p.status === 'repair')).length;
  const bikesToReplace = bikes.filter(b => b.parts.some(p => p.status === 'replace')).length;

  const stats = [
    { label: 'Total', value: totalBikes,    bg: 'bg-[var(--cc-primary-light)]',  text: 'text-[var(--cc-primary)]',          border: 'border-indigo-200 dark:border-indigo-900' },
    { label: 'À réparer', value: bikesToRepair, bg: 'bg-[var(--cc-warning-light)]', text: 'text-[var(--cc-warning)]',  border: 'border-amber-200 dark:border-amber-900' },
    { label: 'À changer', value: bikesToReplace,bg: 'bg-[var(--cc-danger-light)]', text: 'text-[var(--cc-danger)]', border: 'border-red-200 dark:border-red-900' },
  ];

  return (
    <div className="min-h-screen bg-[var(--cc-bg)]">
      {/* Header mobile */}
      <header className="flex justify-between items-center px-4 py-5 md:hidden">
        <div>
          <h1 className="text-2xl font-bold text-[var(--cc-primary)]">CycleCheck</h1>
          <p className="text-xs text-[var(--cc-text-muted)]">Gestion de flotte de vélos</p>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/settings" className="p-2 bg-[var(--cc-surface)] rounded-full shadow-sm hover:opacity-80 transition-opacity">
            <Settings className="w-5 h-5 text-[var(--cc-text-muted)]" />
          </Link>
        </div>
      </header>

      <div className="px-4 pb-8 sm:px-6 lg:px-10 max-w-5xl mx-auto">
        <div className="hidden md:flex justify-between items-center mt-6 mb-6">
          <h2 className="text-2xl font-bold text-[var(--cc-text)]">Tableau de bord</h2>
          <ThemeToggle />
        </div>

        {/* Statistiques */}
        <section className="bg-[var(--cc-surface)] rounded-2xl p-5 shadow-[var(--cc-shadow-sm)] border border-[var(--cc-border)] mb-6">
          <h2 className="text-base font-semibold text-[var(--cc-text-muted)] mb-4">Aperçu de la flotte</h2>
          <div className="grid grid-cols-3 gap-3 text-center">
            {stats.map(({ label, value, bg, text, border }) => (
              <div key={label} className={`${bg} ${border} py-4 rounded-xl border flex flex-col items-center justify-center`}>
                <span className={`text-3xl font-bold ${text}`}>{mounted ? value : '–'}</span>
                <span className={`text-xs font-medium mt-1 ${text} opacity-80`}>{label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Actions */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/bikes"
            className="bg-[var(--cc-primary)] text-white p-5 rounded-2xl flex items-center justify-between shadow-[var(--cc-shadow)] hover:opacity-90 active:scale-[0.98] transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-2.5 rounded-xl border border-white/30">
                <Bike className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="block font-semibold text-lg leading-tight">Gérer les vélos</span>
                <span className="text-sm text-white/70">Ajouter, voir ou modifier</span>
              </div>
            </div>
            <span className="text-xl group-hover:translate-x-1 transition-transform">→</span>
          </Link>

          <Link
            href="/reports"
            className="bg-[var(--cc-surface)] text-[var(--cc-text)] p-5 rounded-2xl flex items-center justify-between shadow-[var(--cc-shadow-sm)] border border-[var(--cc-border)] hover:border-[var(--cc-primary)] active:scale-[0.98] transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="bg-[var(--cc-border-subtle)] p-2.5 rounded-xl border border-[var(--cc-border)] group-hover:bg-[var(--cc-primary-light)] group-hover:border-indigo-200 transition-colors">
                <FileText className="w-6 h-6 text-[var(--cc-text-muted)] group-hover:text-[var(--cc-primary)] transition-colors" />
              </div>
              <div>
                <span className="block font-semibold text-lg leading-tight">Générer les rapports</span>
                <span className="text-sm text-[var(--cc-text-muted)]">Exporter en PDF</span>
              </div>
            </div>
            <span className="text-xl text-[var(--cc-text-faint)] group-hover:translate-x-1 group-hover:text-[var(--cc-primary)] transition-all">→</span>
          </Link>
        </section>
      </div>
    </div>
  );
}
