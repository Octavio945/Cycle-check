'use client';

import Link from 'next/link';
import { ArrowLeft, FileOutput, Wrench, PenTool, ClipboardList, ShoppingCart, Receipt, ListOrdered, Trophy } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { generatePDFReport, generateDevisReport, generateCostRankingReport } from '@/lib/pdfService';
import { useState } from 'react';
import ThemeToggle from '@/components/ui/ThemeToggle';

export default function ReportsPage() {
  const bikes = useStore((state) => state.bikes);
  const [generating, setGenerating] = useState<'repair' | 'replace' | 'global' | 'shopping' | 'devis' | 'cost_all' | 'cost_top20' | null>(null);

  const bikesTotal = bikes.length;
  const bikesWithRepair  = bikes.filter(b => b.parts.some(p => p.status === 'repair')).length;
  const bikesWithReplace = bikes.filter(b => b.parts.some(p => p.status === 'replace')).length;

  const handleGenerate = async (type: 'repair' | 'replace' | 'global' | 'shopping') => {
    setGenerating(type);
    try {
      generatePDFReport(bikes, type);
    } finally {
      setTimeout(() => setGenerating(null), 1000);
    }
  };

  const handleGenerateDevis = async () => {
    setGenerating('devis');
    try {
      generateDevisReport(bikes);
    } finally {
      setTimeout(() => setGenerating(null), 1000);
    }
  };

  const handleGenerateCostRanking = async (top20: boolean) => {
    setGenerating(top20 ? 'cost_top20' : 'cost_all');
    try {
      generateCostRankingReport(bikes, top20 ? 20 : undefined);
    } finally {
      setTimeout(() => setGenerating(null), 1000);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--cc-bg)]">
      <header className="flex items-center justify-between gap-4 px-4 py-4 bg-[var(--cc-surface)] border-b border-[var(--cc-border)] sticky top-0 z-10 sm:px-6">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 -ml-2 hover:bg-[var(--cc-border-subtle)] rounded-full transition-colors md:hidden">
            <ArrowLeft className="w-5 h-5 text-[var(--cc-text-muted)]" />
          </Link>
          <h1 className="text-xl font-semibold text-[var(--cc-text)]">Rapports PDF</h1>
        </div>
        <ThemeToggle />
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 sm:px-6 space-y-5">
        <p className="text-[var(--cc-text-muted)] text-sm">
          Générez des rapports PDF pour planifier vos interventions. Chaque rapport liste les vélos concernés et les pièces à traiter.
        </p>

        {/* Rapport Global */}
        <button
          onClick={() => handleGenerate('global')}
          disabled={generating !== null}
          className="w-full bg-[var(--cc-surface)] p-5 rounded-2xl shadow-[var(--cc-shadow-sm)] border-2 border-[var(--cc-border)] hover:border-indigo-400 hover:bg-[var(--cc-primary-light)] active:scale-[0.98] transition-all group text-left relative overflow-hidden flex items-center justify-between disabled:opacity-70"
        >
          <div className="absolute top-0 right-0 w-28 h-28 bg-indigo-100 dark:bg-indigo-950 rounded-bl-full opacity-40 group-hover:scale-110 transition-transform -z-0" />
          <div className="relative z-10 flex items-center gap-4">
            <div className="bg-[var(--cc-primary-light)] p-3 rounded-xl">
              <ClipboardList className="w-6 h-6 text-[var(--cc-primary)]" />
            </div>
            <div>
              <h2 className="font-bold text-[var(--cc-text)] text-base">Inventaire Global</h2>
              <p className="text-sm text-[var(--cc-text-muted)]">{bikesTotal} vélo{bikesTotal !== 1 ? 's' : ''} au total</p>
            </div>
          </div>
          <div className="relative z-10">
            {generating === 'global' ? (
              <span className="text-xs text-[var(--cc-primary)] font-medium animate-pulse">Génération...</span>
            ) : (
              <FileOutput className="w-5 h-5 text-[var(--cc-primary)] opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </div>
        </button>

        {/* Rapport Liste de Courses */}
        <button
          onClick={() => handleGenerate('shopping')}
          disabled={generating !== null}
          className="w-full bg-[var(--cc-surface)] p-5 rounded-2xl shadow-[var(--cc-shadow-sm)] border-2 border-[var(--cc-border)] hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 active:scale-[0.98] transition-all group text-left relative overflow-hidden flex items-center justify-between disabled:opacity-70"
        >
          <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-100 dark:bg-emerald-900 rounded-bl-full opacity-40 group-hover:scale-110 transition-transform -z-0" />
          <div className="relative z-10 flex items-center gap-4">
            <div className="bg-emerald-100 dark:bg-emerald-900/50 p-3 rounded-xl">
              <ShoppingCart className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="font-bold text-[var(--cc-text)] text-base">Liste de Courses</h2>
              <p className="text-sm text-[var(--cc-text-muted)]">Totaux des pièces à réparer et remplacer</p>
            </div>
          </div>
          <div className="relative z-10">
            {generating === 'shopping' ? (
              <span className="text-xs text-emerald-600 font-medium animate-pulse">Génération...</span>
            ) : (
              <FileOutput className="w-5 h-5 text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </div>
        </button>

        {/* Rapport Réparations */}
        <button
          onClick={() => handleGenerate('repair')}
          disabled={generating !== null}
          className="w-full bg-[var(--cc-surface)] p-5 rounded-2xl shadow-[var(--cc-shadow-sm)] border-2 border-[var(--cc-border)] hover:border-amber-400 hover:bg-[var(--cc-warning-light)] active:scale-[0.98] transition-all group text-left relative overflow-hidden flex items-center justify-between disabled:opacity-70"
        >
          <div className="absolute top-0 right-0 w-28 h-28 bg-amber-100 dark:bg-amber-950 rounded-bl-full opacity-40 group-hover:scale-110 transition-transform -z-0" />
          <div className="relative z-10 flex items-center gap-4">
            <div className="bg-[var(--cc-warning-light)] p-3 rounded-xl">
              <Wrench className="w-6 h-6 text-[var(--cc-warning)]" />
            </div>
            <div>
              <h2 className="font-bold text-[var(--cc-text)] text-base">Vélos à réparer</h2>
              <p className="text-sm text-[var(--cc-text-muted)]">{bikesWithRepair} vélo{bikesWithRepair !== 1 ? 's' : ''} concerné{bikesWithRepair !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="relative z-10">
            {generating === 'repair' ? (
              <span className="text-xs text-[var(--cc-warning)] font-medium animate-pulse">Génération...</span>
            ) : (
              <FileOutput className="w-5 h-5 text-[var(--cc-warning)] opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </div>
        </button>

        {/* Rapport Changements */}
        <button
          onClick={() => handleGenerate('replace')}
          disabled={generating !== null}
          className="w-full bg-[var(--cc-surface)] p-5 rounded-2xl shadow-[var(--cc-shadow-sm)] border-2 border-[var(--cc-border)] hover:border-red-400 hover:bg-[var(--cc-danger-light)] active:scale-[0.98] transition-all group text-left relative overflow-hidden flex items-center justify-between disabled:opacity-70"
        >
          <div className="absolute top-0 right-0 w-28 h-28 bg-red-100 dark:bg-red-950 rounded-bl-full opacity-40 group-hover:scale-110 transition-transform -z-0" />
          <div className="relative z-10 flex items-center gap-4">
            <div className="bg-[var(--cc-danger-light)] p-3 rounded-xl">
              <PenTool className="w-6 h-6 text-[var(--cc-danger)]" />
            </div>
            <div>
              <h2 className="font-bold text-[var(--cc-text)] text-base">Pièces à changer</h2>
              <p className="text-sm text-[var(--cc-text-muted)]">{bikesWithReplace} vélo{bikesWithReplace !== 1 ? 's' : ''} concerné{bikesWithReplace !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="relative z-10">
            {generating === 'replace' ? (
              <span className="text-xs text-[var(--cc-danger)] font-medium animate-pulse">Génération...</span>
            ) : (
              <FileOutput className="w-5 h-5 text-[var(--cc-danger)] opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </div>
        </button>

        {/* Rapport Tableau de Devis */}
        <button
          onClick={handleGenerateDevis}
          disabled={generating !== null}
          className="w-full bg-[var(--cc-surface)] p-5 rounded-2xl shadow-[var(--cc-shadow-sm)] border-2 border-[var(--cc-border)] hover:border-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/30 active:scale-[0.98] transition-all group text-left relative overflow-hidden flex items-center justify-between disabled:opacity-70"
        >
          <div className="absolute top-0 right-0 w-28 h-28 bg-violet-100 dark:bg-violet-900 rounded-bl-full opacity-40 group-hover:scale-110 transition-transform -z-0" />
          <div className="relative z-10 flex items-center gap-4">
            <div className="bg-violet-100 dark:bg-violet-900/50 p-3 rounded-xl">
              <Receipt className="w-6 h-6 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h2 className="font-bold text-[var(--cc-text)] text-base">Tableau de Devis</h2>
              <p className="text-sm text-[var(--cc-text-muted)]">Matrice vélos × pièces avec prix à remplir</p>
            </div>
          </div>
          <div className="relative z-10">
            {generating === 'devis' ? (
              <span className="text-xs text-violet-600 font-medium animate-pulse">Génération...</span>
            ) : (
              <FileOutput className="w-5 h-5 text-violet-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </div>
        </button>

        {/* Classement des Coûts (Tous) */}
        <button
          onClick={() => handleGenerateCostRanking(false)}
          disabled={generating !== null}
          className="w-full bg-[var(--cc-surface)] p-5 rounded-2xl shadow-[var(--cc-shadow-sm)] border-2 border-[var(--cc-border)] hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 active:scale-[0.98] transition-all group text-left relative overflow-hidden flex items-center justify-between disabled:opacity-70"
        >
          <div className="absolute top-0 right-0 w-28 h-28 bg-blue-100 dark:bg-blue-900 rounded-bl-full opacity-40 group-hover:scale-110 transition-transform -z-0" />
          <div className="relative z-10 flex items-center gap-4">
            <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-xl">
              <ListOrdered className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="font-bold text-[var(--cc-text)] text-base">Classement des Coûts</h2>
              <p className="text-sm text-[var(--cc-text-muted)]">Tous les vélos triés du moins cher au plus cher</p>
            </div>
          </div>
          <div className="relative z-10">
            {generating === 'cost_all' ? (
              <span className="text-xs text-blue-600 font-medium animate-pulse">Génération...</span>
            ) : (
              <FileOutput className="w-5 h-5 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </div>
        </button>

        {/* Top 20 Moins Coûteux */}
        <button
          onClick={() => handleGenerateCostRanking(true)}
          disabled={generating !== null}
          className="w-full bg-[var(--cc-surface)] p-5 rounded-2xl shadow-[var(--cc-shadow-sm)] border-2 border-[var(--cc-border)] hover:border-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 active:scale-[0.98] transition-all group text-left relative overflow-hidden flex items-center justify-between disabled:opacity-70"
        >
          <div className="absolute top-0 right-0 w-28 h-28 bg-yellow-100 dark:bg-yellow-900/40 rounded-bl-full opacity-40 group-hover:scale-110 transition-transform -z-0" />
          <div className="relative z-10 flex items-center gap-4">
            <div className="bg-yellow-100 dark:bg-yellow-900/50 p-3 rounded-xl">
              <Trophy className="w-6 h-6 text-yellow-600 dark:text-yellow-500" />
            </div>
            <div>
              <h2 className="font-bold text-[var(--cc-text)] text-base">Top 20 Vélos Économiques</h2>
              <p className="text-sm text-[var(--cc-text-muted)]">Les 20 vélos les moins chers à réparer</p>
            </div>
          </div>
          <div className="relative z-10">
            {generating === 'cost_top20' ? (
              <span className="text-xs text-yellow-600 font-medium animate-pulse">Génération...</span>
            ) : (
              <FileOutput className="w-5 h-5 text-yellow-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </div>
        </button>
      </div>
    </div>
  );
}
