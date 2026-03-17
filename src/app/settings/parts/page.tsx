'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Edit2, Check, X, Info } from 'lucide-react';
import { useStore } from '@/store/useStore';
import ConfirmModal from '@/components/ui/ConfirmModal';

export default function PartsSettingsPage() {
  const { baseParts, addBasePart, removeBasePart, updateBasePart } = useStore();
  const [newPartName, setNewPartName]   = useState('');
  const [editingId, setEditingId]       = useState<string | null>(null);
  const [editingName, setEditingName]   = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const deleteTargetName = baseParts.find(p => p.id === deleteTargetId)?.name ?? '';

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

  return (
    <div className="flex flex-col w-full max-w-md mx-auto min-h-screen bg-[var(--cc-bg)]">
      {/* Modal suppression */}
      <ConfirmModal
        open={!!deleteTargetId}
        title="Supprimer cette pièce ?"
        message={`La pièce "${deleteTargetName}" sera retirée de la liste commune. Elle ne sera plus ajoutée aux nouveaux vélos.`}
        confirmLabel="Supprimer"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTargetId(null)}
      />

      {/* Header */}
      <header className="flex items-center gap-4 p-4 bg-[var(--cc-surface)] border-b border-[var(--cc-border)] sticky top-0 z-10">
        <Link href="/settings" className="p-2 -ml-2 hover:bg-[var(--cc-border-subtle)] rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6 text-[var(--cc-text-muted)]" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-[var(--cc-text)]">Pièces de base</h1>
          <p className="text-xs text-[var(--cc-text-muted)]">Liste commune à tous les vélos</p>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Formulaire ajout */}
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

        {/* Liste */}
        <div className="bg-[var(--cc-surface)] rounded-2xl shadow-[var(--cc-shadow-sm)] border border-[var(--cc-border)] overflow-hidden">
          <ul className="divide-y divide-[var(--cc-border)]">
            {baseParts.length === 0 ? (
              <li className="p-8 text-center text-[var(--cc-text-muted)]">
                La liste est vide. Ajoutez des pièces ci-dessus.
              </li>
            ) : (
              baseParts.map((part) => (
                <li key={part.id} className="flex items-center justify-between p-4 hover:bg-[var(--cc-border-subtle)] transition-colors">
                  {editingId === part.id ? (
                    <div className="flex-1 flex items-center gap-2 mr-2">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="flex-1 px-3 py-1.5 border border-[var(--cc-primary)] bg-[var(--cc-bg)] text-[var(--cc-text)] rounded focus:outline-none focus:ring-1 focus:ring-[var(--cc-primary)]"
                        autoFocus
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
