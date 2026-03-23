'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Edit2, Check, X, Info, ListChecks, Search } from 'lucide-react';
import { useStore } from '@/store/useStore';
import ConfirmModal from '@/components/ui/ConfirmModal';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { PART_PRICES } from '@/lib/dataMigration';

// Liste complète catalogue (basée sur le dictionnaire de prix), triée alphabétiquement
const CATALOGUE_PARTS = Object.keys(PART_PRICES).sort((a, b) =>
  a.localeCompare(b, 'fr', { sensitivity: 'base' })
);

export default function PartsSettingsPage() {
  const { baseParts, addBasePart, removeBasePart, updateBasePart } = useStore();
  const [newPartName, setNewPartName]       = useState('');
  const [editingId, setEditingId]           = useState<string | null>(null);
  const [editingName, setEditingName]       = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [showLoadConfirm, setShowLoadConfirm] = useState(false);
  const [loadStatus, setLoadStatus]         = useState<'idle' | 'done'>('idle');
  const [search, setSearch]                 = useState('');

  const deleteTargetName = baseParts.find(p => p.id === deleteTargetId)?.name ?? '';

  // Pièces existantes triées alphabétiquement, filtrées par recherche
  const sortedParts = [...baseParts].sort((a, b) =>
    a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' })
  );
  const filteredParts = search.trim()
    ? sortedParts.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    : sortedParts;

  // Pièces du catalogue pas encore dans la liste
  const existingNames = new Set(baseParts.map(p => p.name));
  const partsToAdd = CATALOGUE_PARTS.filter(name => !existingNames.has(name));

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPartName.trim()) {
      addBasePart(newPartName.trim());
      setNewPartName('');
    }
  };

  const handleStartEdit = (id: string, name: string) => {
    setEditingId(id);
    setEditingName(name);
  };

  const handleSaveEdit = (id: string) => {
    if (editingName.trim()) {
      updateBasePart(id, editingName.trim());
      setEditingId(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleConfirmDelete = () => {
    if (deleteTargetId) {
      removeBasePart(deleteTargetId);
      setDeleteTargetId(null);
    }
  };

  const handleLoadFullList = () => {
    partsToAdd.forEach(name => addBasePart(name));
    setShowLoadConfirm(false);
    setLoadStatus('done');
    setTimeout(() => setLoadStatus('idle'), 3000);
  };

  return (
    <div className="flex flex-col w-full max-w-md mx-auto min-h-screen bg-[var(--cc-bg)]">

      {/* Modal : suppression */}
      <ConfirmModal
        open={!!deleteTargetId}
        title="Supprimer cette pièce ?"
        message={`La pièce "${deleteTargetName}" sera retirée de la liste commune. Elle ne sera plus ajoutée aux nouveaux vélos.`}
        confirmLabel="Supprimer"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTargetId(null)}
      />

      {/* Modal : charger catalogue complet */}
      <ConfirmModal
        open={showLoadConfirm}
        title="Charger le catalogue complet ?"
        message={
          partsToAdd.length === 0
            ? 'Toutes les pièces du catalogue sont déjà dans votre liste.'
            : `${partsToAdd.length} pièce${partsToAdd.length > 1 ? 's' : ''} seront ajoutée${partsToAdd.length > 1 ? 's' : ''} : ${partsToAdd.join(', ')}.`
        }
        confirmLabel="Charger"
        onConfirm={handleLoadFullList}
        onCancel={() => setShowLoadConfirm(false)}
      />

      {/* Header */}
      <header className="flex items-center justify-between gap-4 p-4 bg-[var(--cc-surface)] border-b border-[var(--cc-border)] sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link href="/settings" className="p-2 -ml-2 hover:bg-[var(--cc-border-subtle)] rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-[var(--cc-text-muted)]" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-[var(--cc-text)]">Pièces de base</h1>
            <p className="text-xs text-[var(--cc-text-muted)]">
              {baseParts.length} pièce{baseParts.length !== 1 ? 's' : ''} — liste commune à tous les vélos
            </p>
          </div>
        </div>
        <ThemeToggle />
      </header>

      <div className="p-4 space-y-4">

        {/* Formulaire : ajouter une pièce manuellement */}
        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            type="text"
            value={newPartName}
            onChange={(e) => setNewPartName(e.target.value)}
            placeholder="Nouvelle pièce (ex: Guidon)"
            className="flex-1 px-4 py-3 rounded-xl border border-[var(--cc-border)] bg-[var(--cc-surface)] text-[var(--cc-text)] placeholder:text-[var(--cc-text-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--cc-primary)] shadow-sm"
          />
          <button
            type="submit"
            disabled={!newPartName.trim()}
            className="bg-[var(--cc-primary)] text-white p-3 rounded-xl shadow-sm disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            <Plus className="w-6 h-6" />
          </button>
        </form>

        {/* Bouton : charger le catalogue complet */}
        <button
          onClick={() => setShowLoadConfirm(true)}
          disabled={partsToAdd.length === 0}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-[var(--cc-border)] bg-[var(--cc-surface)] hover:bg-[var(--cc-primary-light)] hover:border-indigo-400 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          <ListChecks className="w-5 h-5 text-[var(--cc-primary)] shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="block font-medium text-[var(--cc-text)]">Charger le catalogue complet</span>
            <span className="block text-xs text-[var(--cc-text-muted)] mt-0.5">
              {loadStatus === 'done' ? (
                <span className="text-green-600 dark:text-green-400 font-medium">✅ Catalogue chargé avec succès !</span>
              ) : partsToAdd.length === 0 ? (
                'Toutes les pièces du catalogue sont déjà présentes'
              ) : (
                `Ajouter ${partsToAdd.length} pièce${partsToAdd.length > 1 ? 's' : ''} manquante${partsToAdd.length > 1 ? 's' : ''} depuis le catalogue`
              )}
            </span>
          </div>
        </button>

        {/* Barre de recherche */}
        {baseParts.length > 0 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--cc-text-faint)]" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher une pièce..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[var(--cc-border)] bg-[var(--cc-surface)] text-[var(--cc-text)] placeholder:text-[var(--cc-text-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--cc-primary)] shadow-sm text-sm"
            />
          </div>
        )}

        {/* Liste triée alphabétiquement */}
        <div className="bg-[var(--cc-surface)] rounded-2xl shadow-[var(--cc-shadow-sm)] border border-[var(--cc-border)] overflow-hidden">
          <ul className="divide-y divide-[var(--cc-border)]">
            {baseParts.length === 0 ? (
              <li className="p-8 text-center text-[var(--cc-text-muted)]">
                La liste est vide. Ajoutez des pièces ci-dessus.
              </li>
            ) : filteredParts.length === 0 ? (
              <li className="p-6 text-center text-[var(--cc-text-muted)] text-sm">
                Aucune pièce ne correspond à &quot;{search}&quot;.
              </li>
            ) : (
              filteredParts.map((part) => (
                <li key={part.id} className="flex items-center justify-between p-4 hover:bg-[var(--cc-border-subtle)] transition-colors">
                  {editingId === part.id ? (
                    <div className="flex-1 flex items-center gap-2 mr-2">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="flex-1 px-3 py-1.5 border border-[var(--cc-primary)] bg-[var(--cc-bg)] text-[var(--cc-text)] rounded focus:outline-none focus:ring-1 focus:ring-[var(--cc-primary)]"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit(part.id);
                          if (e.key === 'Escape') handleCancelEdit();
                        }}
                      />
                      <button onClick={() => handleSaveEdit(part.id)} className="p-1.5 text-[var(--cc-success)] hover:bg-[var(--cc-success-light)] rounded">
                        <Check className="w-5 h-5" />
                      </button>
                      <button onClick={handleCancelEdit} className="p-1.5 text-[var(--cc-text-faint)] hover:bg-[var(--cc-border-subtle)] rounded">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="font-medium text-[var(--cc-text)]">{part.name}</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleStartEdit(part.id, part.name)}
                          className="p-2 text-[var(--cc-text-faint)] hover:text-[var(--cc-primary)] hover:bg-[var(--cc-primary-light)] rounded-lg transition-colors"
                          aria-label="Modifier"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTargetId(part.id)}
                          className="p-2 text-[var(--cc-text-faint)] hover:text-[var(--cc-danger)] hover:bg-[var(--cc-danger-light)] rounded-lg transition-colors"
                          aria-label="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="bg-[var(--cc-primary-light)] p-4 rounded-xl border border-indigo-200 dark:border-indigo-900 text-sm text-[var(--cc-primary-text)] flex gap-3">
          <Info className="w-5 h-5 text-[var(--cc-primary)] shrink-0" />
          <p>Ces pièces apparaîtront automatiquement (en &quot;Bon état&quot;) pour chaque nouveau vélo ajouté à la flotte.</p>
        </div>

      </div>
    </div>
  );
}
