'use client';

import { useState, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { ArrowLeft, Trash2, Camera, Plus } from 'lucide-react';
import { PartStatus, BikePart } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import ConfirmModal from '@/components/ui/ConfirmModal';
import ThemeToggle from '@/components/ui/ThemeToggle';

export default function BikeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { bikes, updateBike, removeBike } = useStore();
  const bike = bikes.find((b) => b.id === id);
  const [newPartName, setNewPartName] = useState('');

  // Modal state
  const [deleteBikeModal, setDeleteBikeModal]  = useState(false);
  const [deletePartId, setDeletePartId]         = useState<string | null>(null);

  if (!bike) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-[var(--cc-bg)]">
        <h1 className="text-xl font-bold text-[var(--cc-text)] mb-2">Vélo introuvable</h1>
        <Link href="/bikes" className="text-[var(--cc-primary)] underline">Retour à la flotte</Link>
      </div>
    );
  }

  const handleConfirmDeleteBike = () => {
    removeBike(bike.id);
    router.push('/bikes');
  };

  const handleConfirmDeletePart = () => {
    if (!deletePartId) return;
    updateBike({ ...bike, parts: bike.parts.filter(p => p.id !== deletePartId) });
    setDeletePartId(null);
  };

  const updatePartStatus = (partId: string, status: PartStatus) => {
    const parts = bike.parts.map(p => p.id === partId ? { ...p, status } : p);
    updateBike({ ...bike, parts });
  };

  const handleAddSpecificPart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartName.trim()) return;
    const newPart: BikePart = { id: uuidv4(), name: newPartName.trim(), status: 'good', isSpecific: true };
    updateBike({ ...bike, parts: [...bike.parts, newPart] });
    setNewPartName('');
  };

  const repairCount  = bike.parts.filter(p => p.status === 'repair').length;
  const replaceCount = bike.parts.filter(p => p.status === 'replace').length;

  const PartRow = ({ part }: { part: BikePart }) => (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-[var(--cc-surface)] border border-[var(--cc-border)] rounded-xl mb-2 shadow-[var(--cc-shadow-sm)] gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <span className="font-medium text-[var(--cc-text)] truncate">{part.name}</span>
        {part.isSpecific && (
          <span className="text-[10px] bg-[var(--cc-primary-light)] text-[var(--cc-primary-text)] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider shrink-0">Spécif.</span>
        )}
      </div>
      <div className="flex items-center gap-1 bg-[var(--cc-bg)] p-1 rounded-lg border border-[var(--cc-border)] self-start sm:self-auto">
        {(['good', 'repair', 'replace'] as PartStatus[]).map(s => {
          const labels = { good: 'Bon', repair: 'Réparer', replace: 'Changer' };
          const activeClasses = {
            good:    s === part.status ? 'bg-[var(--cc-success)] text-white' : '',
            repair:  s === part.status ? 'bg-[var(--cc-warning)] text-white' : '',
            replace: s === part.status ? 'bg-[var(--cc-danger)] text-white'  : '',
          };
          return (
            <button
              key={s}
              onClick={() => updatePartStatus(part.id, s)}
              className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${activeClasses[s] || 'text-[var(--cc-text-muted)] hover:bg-[var(--cc-border-subtle)]'}`}
            >
              {labels[s]}
            </button>
          );
        })}
        {part.isSpecific && (
          <button
            onClick={() => setDeletePartId(part.id)}
            className="ml-1 p-1.5 text-[var(--cc-danger)] hover:bg-[var(--cc-danger-light)] rounded-md transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--cc-bg)] pb-20 md:pb-0">
      {/* Modal : supprimer vélo */}
      <ConfirmModal
        open={deleteBikeModal}
        title="Supprimer ce vélo ?"
        message={`Le vélo "${bike.id}" et toutes ses données seront définitivement supprimés. Cette action est irréversible.`}
        confirmLabel="Supprimer"
        onConfirm={handleConfirmDeleteBike}
        onCancel={() => setDeleteBikeModal(false)}
      />

      {/* Modal : supprimer pièce spécifique */}
      <ConfirmModal
        open={!!deletePartId}
        title="Supprimer cette pièce ?"
        message="Cette pièce spécifique sera retirée de ce vélo. Cette action est irréversible."
        confirmLabel="Supprimer"
        onConfirm={handleConfirmDeletePart}
        onCancel={() => setDeletePartId(null)}
      />

      {/* Header */}
      <header className="flex items-center justify-between px-4 py-4 bg-[var(--cc-surface)] border-b border-[var(--cc-border)] sticky top-0 z-10 sm:px-6">
        <div className="flex items-center gap-3">
          <Link href="/bikes" className="p-2 -ml-2 hover:bg-[var(--cc-border-subtle)] rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-[var(--cc-text-muted)]" />
          </Link>
          <h1 className="text-xl font-bold text-[var(--cc-text)] truncate max-w-[200px] sm:max-w-none">{bike.id}</h1>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setDeleteBikeModal(true)}
            className="p-2 text-[var(--cc-danger)] hover:bg-[var(--cc-danger-light)] rounded-full transition-colors"
            title="Supprimer le vélo"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Colonne gauche : photo + résumé */}
        <div className="space-y-4">
          <div className="w-full aspect-square max-w-xs mx-auto lg:max-w-none rounded-2xl bg-[var(--cc-border-subtle)] relative flex items-center justify-center overflow-hidden border border-[var(--cc-border)] shadow-[var(--cc-shadow-sm)]">
            {bike.photoUrl ? (
              <Image src={bike.photoUrl} alt={`Photo du vélo ${bike.id}`} fill className="object-cover" />
            ) : (
              <div className="flex flex-col items-center text-[var(--cc-text-faint)]">
                <Camera className="w-10 h-10 mb-2 opacity-50" />
                <span className="text-sm">Aucune photo</span>
              </div>
            )}
          </div>

          {(repairCount > 0 || replaceCount > 0) ? (
            <div className="bg-[var(--cc-warning-light)] p-4 rounded-xl border border-amber-200 dark:border-amber-900">
              <h2 className="text-sm font-bold text-[var(--cc-warning-text)] mb-2 uppercase tracking-wide">Signalements actifs</h2>
              <div className="flex gap-4">
                {replaceCount > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[var(--cc-danger)] animate-pulse" />
                    <span className="text-sm font-medium text-[var(--cc-danger-text)]">{replaceCount} à changer</span>
                  </div>
                )}
                {repairCount > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[var(--cc-warning)]" />
                    <span className="text-sm font-medium text-[var(--cc-warning-text)]">{repairCount} à réparer</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-[var(--cc-success-light)] p-4 rounded-xl border border-green-200 dark:border-green-900 text-center">
              <div className="w-3 h-3 rounded-full bg-[var(--cc-success)] mx-auto mb-2" />
              <span className="text-sm font-medium text-[var(--cc-success-text)]">Toutes les pièces sont en bon état</span>
            </div>
          )}
        </div>

        {/* Colonne droite : diagnostic */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-[var(--cc-text)]">Diagnostic des pièces</h2>
          <div>
            {bike.parts.map(part => <PartRow key={part.id} part={part} />)}
          </div>

          <div className="bg-[var(--cc-primary-light)] p-4 rounded-xl border border-indigo-200 dark:border-indigo-900">
            <h3 className="text-sm font-bold text-[var(--cc-primary-text)] mb-1">Ajouter une pièce spécifique</h3>
            <p className="text-xs text-[var(--cc-primary-text)] opacity-70 mb-3">Cette pièce sera uniquement visible pour ce vélo.</p>
            <form onSubmit={handleAddSpecificPart} className="flex gap-2">
              <input
                type="text"
                value={newPartName}
                onChange={(e) => setNewPartName(e.target.value)}
                placeholder="Ex: Porte-bagages avant"
                className="flex-1 px-3 py-2 text-sm bg-[var(--cc-surface)] border border-[var(--cc-border)] text-[var(--cc-text)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--cc-primary)] placeholder:text-[var(--cc-text-faint)]"
              />
              <button
                type="submit"
                disabled={!newPartName.trim()}
                className="bg-[var(--cc-primary)] text-white px-4 py-2 text-sm font-medium rounded-lg disabled:opacity-50 hover:opacity-90 transition-opacity flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Ajouter
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
