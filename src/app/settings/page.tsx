'use client';

import Link from 'next/link';
import { ArrowLeft, List, Info, Moon } from 'lucide-react';
import { useTheme } from '@/components/ui/ThemeProvider';

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-[var(--cc-bg)]">
      <header className="flex items-center gap-4 px-4 py-4 bg-[var(--cc-surface)] border-b border-[var(--cc-border)] sticky top-0 z-10 sm:px-6">
        <Link href="/" className="p-2 -ml-2 hover:bg-[var(--cc-border-subtle)] rounded-full transition-colors md:hidden">
          <ArrowLeft className="w-5 h-5 text-[var(--cc-text-muted)]" />
        </Link>
        <h1 className="text-xl font-semibold text-[var(--cc-text)]">Paramètres</h1>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 sm:px-6 space-y-6">

        {/* Application */}
        <section>
          <h2 className="text-xs font-semibold text-[var(--cc-text-faint)] uppercase tracking-wider mb-2 ml-1">Application</h2>
          <div className="bg-[var(--cc-surface)] rounded-2xl overflow-hidden shadow-[var(--cc-shadow-sm)] border border-[var(--cc-border)]">
            <Link
              href="/settings/parts"
              className="flex items-center gap-4 p-4 hover:bg-[var(--cc-border-subtle)] transition-colors"
            >
              <div className="bg-[var(--cc-primary-light)] p-2 rounded-lg">
                <List className="w-5 h-5 text-[var(--cc-primary)]" />
              </div>
              <div className="flex-1">
                <span className="block font-medium text-[var(--cc-text)]">Variables &amp; Pièces</span>
                <span className="block text-sm text-[var(--cc-text-muted)]">Gérer la liste commune des pièces</span>
              </div>
              <span className="text-[var(--cc-text-faint)] text-lg">→</span>
            </Link>
          </div>
        </section>

        {/* Apparence */}
        <section>
          <h2 className="text-xs font-semibold text-[var(--cc-text-faint)] uppercase tracking-wider mb-2 ml-1">Apparence</h2>
          <div className="bg-[var(--cc-surface)] rounded-2xl overflow-hidden shadow-[var(--cc-shadow-sm)] border border-[var(--cc-border)]">
            <button
              onClick={toggleTheme}
              className="w-full flex items-center gap-4 p-4 hover:bg-[var(--cc-border-subtle)] transition-colors text-left"
            >
              <div className="bg-[var(--cc-border-subtle)] p-2 rounded-lg">
                <Moon className="w-5 h-5 text-[var(--cc-text-muted)]" />
              </div>
              <div className="flex-1">
                <span className="block font-medium text-[var(--cc-text)]">Mode d&apos;affichage</span>
                <span className="block text-sm text-[var(--cc-text-muted)]">
                  Actuellement : <strong>{theme === 'dark' ? 'Sombre' : 'Clair'}</strong>
                </span>
              </div>
              <div className={`relative w-11 h-6 rounded-full transition-colors ${theme === 'dark' ? 'bg-[var(--cc-primary)]' : 'bg-[var(--cc-border)]'}`}>
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${theme === 'dark' ? 'translate-x-5' : 'translate-x-0'}`} />
              </div>
            </button>
          </div>
        </section>

        {/* À propos */}
        <section>
          <h2 className="text-xs font-semibold text-[var(--cc-text-faint)] uppercase tracking-wider mb-2 ml-1">À propos</h2>
          <div className="bg-[var(--cc-surface)] rounded-2xl overflow-hidden shadow-[var(--cc-shadow-sm)] border border-[var(--cc-border)]">
            <div className="flex items-center gap-4 p-4">
              <div className="bg-[var(--cc-border-subtle)] p-2 rounded-lg">
                <Info className="w-5 h-5 text-[var(--cc-text-muted)]" />
              </div>
              <div className="flex-1">
                <span className="block font-medium text-[var(--cc-text)]">Version</span>
                <span className="block text-sm text-[var(--cc-text-muted)]">CycleCheck 1.0.0</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
