'use client';

import Link from 'next/link';
import { ArrowLeft, FileOutput, Wrench, PenTool } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { generatePDFReport } from '@/lib/pdfService';
import { useState } from 'react';

export default function ReportsPage() {
  const bikes = useStore((state) => state.bikes);
  const [generating, setGenerating] = useState<'repair' | 'replace' | null>(null);

  const bikesWithRepair  = bikes.filter(b => b.parts.some(p => p.status === 'repair')).length;
  const bikesWithReplace = bikes.filter(b => b.parts.some(p => p.status === 'replace')).length;

  const handleGenerate = async (type: 'repair' | 'replace') => {
    setGenerating(type);
    try {
      generatePDFReport(bikes, type);
    } finally {
      setTimeout(() => setGenerating(null), 1000);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--cc-bg)]">
      <header className="flex items-center gap-4 px-4 py-4 bg-[var(--cc-surface)] border-b border-[var(--cc-border)] sticky top-0 z-10 sm:px-6">
        <Link href="/" className="p-2 -ml-2 hover:bg-[var(--cc-border-subtle)] rounded-full transition-colors md:hidden">
          <ArrowLeft className="w-5 h-5 text-[var(--cc-text-muted)]" />
        </Link>
        <h1 className="text-xl font-semibold text-[var(--cc-text)]">Rapports PDF</h1>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 sm:px-6 space-y-5">
        <p className="text-[var(--cc-text-muted)] text-sm">
          Générez des rapports PDF pour planifier vos interventions. Chaque rapport liste les vélos concernés et les pièces à traiter.
        </p>

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
      </div>
    </div>
  );
}
