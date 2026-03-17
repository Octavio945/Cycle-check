'use client';

import Link from 'next/link';
import { Bike, Settings, FileText, Activity, TrendingDown } from 'lucide-react';
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

  // --- NOUVELLES STATISTIQUES ---
  // Calcul du taux de santé (vélos 100% bons / total)
  const bikesInGoodCondition = bikes.filter(b => b.parts.every(p => p.status === 'good')).length;
  const healthRate = totalBikes > 0 ? Math.round((bikesInGoodCondition / totalBikes) * 100) : 100;

  // Calcul du Top 3 des pannes
  const partFailures: Record<string, number> = {};
  bikes.forEach(bike => {
    bike.parts.forEach(p => {
      if (p.status === 'repair' || p.status === 'replace') {
        partFailures[p.name] = (partFailures[p.name] || 0) + 1;
      }
    });
  });
  const topFailures = Object.entries(partFailures)
    .sort((a, b) => b[1] - a[1]) // Tri décroissant
    .slice(0, 3); // Garder le top 3

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

        {/* Intelligence Métier (Taux de santé & Top pannes) */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          
          {/* Taux de Santé */}
          <div className="bg-[var(--cc-surface)] rounded-2xl p-5 shadow-[var(--cc-shadow-sm)] border border-[var(--cc-border)] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-[var(--cc-text-muted)] flex items-center gap-2 mb-1">
                <Activity className="w-4 h-4 text-emerald-500" /> Taux de Santé
              </h3>
              <p className="text-3xl font-bold text-[var(--cc-text)]">
                {mounted ? `${healthRate}%` : '–'}
              </p>
              <p className="text-xs text-[var(--cc-text-faint)] mt-1">
                {mounted ? `${bikesInGoodCondition} vélos en parfait état` : 'Calcul...'}
              </p>
            </div>
            {/* Cercle de progression visuel */}
            <div className="relative w-16 h-16 rounded-full flex items-center justify-center border-4" 
                 style={{ borderColor: healthRate > 75 ? '#10b981' : healthRate > 50 ? '#f59e0b' : '#ef4444' }}>
              <span className="text-base font-bold" style={{ color: healthRate > 75 ? '#10b981' : healthRate > 50 ? '#f59e0b' : '#ef4444' }}>
                {mounted ? `${healthRate}%` : ''}
              </span>
            </div>
          </div>

          {/* Palmarès des Pannes */}
          <div className="bg-[var(--cc-surface)] rounded-2xl p-5 shadow-[var(--cc-shadow-sm)] border border-[var(--cc-border)] flex flex-col justify-center">
            <h3 className="text-sm font-semibold text-[var(--cc-text-muted)] flex items-center gap-2 mb-3">
              <TrendingDown className="w-4 h-4 text-rose-500" /> Pièces les plus fragiles
            </h3>
            {mounted && topFailures.length > 0 ? (
              <div className="space-y-2">
                {topFailures.map(([name, count], index) => (
                  <div key={name} className="flex justify-between items-center text-sm">
                    <span className="flex items-center gap-2">
                      <span className="text-[10px] bg-[var(--cc-border-subtle)] text-[var(--cc-text-muted)] px-1.5 py-0.5 rounded font-bold">{index + 1}</span>
                      <span className="font-medium text-[var(--cc-text)] truncate max-w-[120px]">{name}</span>
                    </span>
                    <span className="text-[var(--cc-danger)] font-semibold">{count} panne{count > 1 ? 's' : ''}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--cc-text-faint)] italic py-2">
                {mounted ? 'Aucune panne recensée pour le moment.' : 'Chargement...'}
              </p>
            )}
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
