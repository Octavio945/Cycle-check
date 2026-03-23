'use client';

import Link from 'next/link';
import { ArrowLeft, List, Info, Moon, Download, Upload, AlertCircle, Trash2 } from 'lucide-react';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { useTheme } from '@/components/ui/ThemeProvider';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { useStore } from '@/store/useStore';
import { useState, useRef } from 'react';
import { cleanDuplicateData } from '@/lib/dataMigration';

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const store = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [cleanStatus, setCleanStatus] = useState<'idle' | 'cleaning' | 'success' | 'error' | 'none'>('idle');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // --- EXPORT ---
  const handleExport = () => {
    // Récupération de l'état complet
    const data = {
      baseParts: store.baseParts,
      bikes: store.bikes,
    };
    
    // Création du fichier JSON
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Téléchargement
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    link.download = `CycleCheck_Backup_${dateStr}.json`;
    link.href = url;
    link.click();
    
    // Cleanup
    URL.revokeObjectURL(url);
  };

  // --- IMPORT ---
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.baseParts && json.bikes) {
          store.importData(json);
          setImportStatus('success');
          setTimeout(() => setImportStatus('idle'), 3000); // Reset UI
        } else {
          setImportStatus('error');
        }
      } catch (err) {
        console.error("Erreur de parsing:", err);
        setImportStatus('error');
      }
    };
    reader.readAsText(file);
    // Reset l'input pour pouvoir ré-importer le même fichier si besoin
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- Nettoyage des Données ---
  const handleCleanData = () => {
    setCleanStatus('cleaning');
    try {
      const result = cleanDuplicateData(store);
      if (result.modified) {
        store.importData({
          baseParts: result.newBaseParts,
          bikes: result.newBikes
        });
      }
      setCleanStatus('success');
      setTimeout(() => setCleanStatus('idle'), 3000);
    } catch (err) {
      console.error("Erreur lors du nettoyage:", err);
      setCleanStatus('error' as const);
      setTimeout(() => setCleanStatus('idle'), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--cc-bg)]">
      <ConfirmModal
        open={showResetConfirm}
        title="Effacer toutes les données ?"
        message="⚠️ Cette action est irréversible. Tous les vélos enregistrés seront supprimés et la liste des pièces sera réinitialisée aux valeurs par défaut. Assurez-vous d'avoir exporté une sauvegarde avant de continuer."
        confirmLabel="Tout effacer"
        onConfirm={() => { store.resetStore(); setShowResetConfirm(false); }}
        onCancel={() => setShowResetConfirm(false)}
      />
      <header className="flex items-center justify-between gap-4 px-4 py-4 bg-[var(--cc-surface)] border-b border-[var(--cc-border)] sticky top-0 z-10 sm:px-6">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 -ml-2 hover:bg-[var(--cc-border-subtle)] rounded-full transition-colors md:hidden">
            <ArrowLeft className="w-5 h-5 text-[var(--cc-text-muted)]" />
          </Link>
          <h1 className="text-xl font-semibold text-[var(--cc-text)]">Paramètres</h1>
        </div>
        <ThemeToggle />
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

        {/* Données & Sauvegarde */}
        <section>
          <h2 className="text-xs font-semibold text-[var(--cc-text-faint)] uppercase tracking-wider mb-2 ml-1 flex items-center gap-2">
            Sécurité &amp; Données <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
          </h2>
          <div className="bg-[var(--cc-surface)] rounded-2xl overflow-hidden shadow-[var(--cc-shadow-sm)] border border-[var(--cc-border)] divide-y divide-[var(--cc-border)]">
            
            {/* Exporter */}
            <button
              onClick={handleExport}
              className="w-full flex items-center gap-4 p-4 hover:bg-[var(--cc-border-subtle)] transition-colors text-left"
            >
              <div className="bg-[var(--cc-primary-light)] p-2 rounded-lg">
                <Download className="w-5 h-5 text-[var(--cc-primary)]" />
              </div>
              <div className="flex-1">
                <span className="block font-medium text-[var(--cc-text)]">Exporter et Sauvegarder</span>
                <span className="block text-xs text-[var(--cc-text-muted)] mt-0.5">
                  Télécharger vos données sur cet appareil (.json)
                </span>
              </div>
            </button>

            {/* Nettoyer doublons */}
            <button
              onClick={handleCleanData}
              disabled={cleanStatus === 'cleaning'}
              className="w-full flex items-center gap-4 p-4 hover:bg-[var(--cc-border-subtle)] transition-colors text-left"
            >
              <div className="bg-violet-100 dark:bg-violet-900/40 p-2 rounded-lg">
                <List className="w-5 h-5 text-violet-600 dark:text-violet-500" />
              </div>
              <div className="flex-1">
                <span className="block font-medium text-[var(--cc-text)]">Nettoyer les données</span>
                <span className="block text-xs text-[var(--cc-text-muted)] mt-0.5">
                  {cleanStatus === 'success' ? (
                    <span className="text-green-600 dark:text-green-500 font-medium">✅ Pièces fusionnées !</span>
                  ) : cleanStatus === 'cleaning' ? (
                    <span className="text-violet-600 font-medium">Nettoyage en cours...</span>
                  ) : (
                    "Corrige et fusionne les noms de pièces en vrac"
                  )}
                </span>
              </div>
            </button>

            {/* Importer */}
            <div>
              <input 
                type="file" 
                accept=".json" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleImport}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center gap-4 p-4 hover:bg-[var(--cc-border-subtle)] transition-colors text-left"
              >
                <div className="bg-amber-100 dark:bg-amber-900/40 p-2 rounded-lg">
                  <Upload className="w-5 h-5 text-amber-600 dark:text-amber-500" />
                </div>
                <div className="flex-1">
                  <span className="block font-medium text-[var(--cc-text)]">Restaurer une sauvegarde</span>
                  <span className="block text-xs text-[var(--cc-text-muted)] mt-0.5">
                    {importStatus === 'success' ? (
                      <span className="text-green-600 dark:text-green-500 font-medium">✅ Restauration réussie !</span>
                    ) : importStatus === 'error' ? (
                      <span className="text-[var(--cc-danger)] font-medium">❌ Fichier invalide</span>
                    ) : (
                      "Importer un fichier CycleCheck_Backup"
                    )}
                  </span>
                </div>
              </button>
            </div>

            {/* Effacer toutes les données */}
            <button
              onClick={() => setShowResetConfirm(true)}
              className="w-full flex items-center gap-4 p-4 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-left"
            >
              <div className="bg-red-100 dark:bg-red-900/40 p-2 rounded-lg">
                <Trash2 className="w-5 h-5 text-[var(--cc-danger)]" />
              </div>
              <div className="flex-1">
                <span className="block font-medium text-[var(--cc-danger)]">Effacer toutes les données</span>
                <span className="block text-xs text-[var(--cc-text-muted)] mt-0.5">
                  Supprimer tous les vélos et réinitialiser les pièces
                </span>
              </div>
            </button>
            
          </div>
          <p className="px-2 mt-2 text-[11px] text-[var(--cc-text-faint)] text-justify">
            Important : Vos vélos sont enregistrés uniquement sur ce navigateur. Il n'y a pas de sauvegarde automatique sur le cloud pour le moment. Pensez à exporter vos données régulièrement pour éviter toute perte.
          </p>
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
