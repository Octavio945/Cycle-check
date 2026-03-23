'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Bike as BikeIcon, Search, Trash2 } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Bike, PartStatus, formatBikeId } from '@/types';
import ThemeToggle from '@/components/ui/ThemeToggle';
import ConfirmModal from '@/components/ui/ConfirmModal';

const getBikeGlobalStatus = (bike: Bike): PartStatus => {
  if (bike.parts.some(p => p.status === 'replace')) return 'replace';
  if (bike.parts.some(p => p.status === 'repair')) return 'repair';
  return 'good';
};

const StatusBadge = ({ status }: { status: PartStatus }) => {
  const config = {
    good:    { cls: 'bg-[var(--cc-success)]',  title: 'Bon état' },
    repair:  { cls: 'bg-[var(--cc-warning)] animate-pulse', title: 'À réparer' },
    replace: { cls: 'bg-[var(--cc-danger)] animate-pulse',  title: 'À changer' },
  }[status];
  return <div className={`w-3 h-3 rounded-full shadow-sm ${config.cls}`} title={config.title} />;
};

export default function BikesPage() {
  const { bikes, removeBike } = useStore();
  const [filter, setFilter] = useState<'all' | 'repair' | 'replace'>('all');
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Tri par numéro séquentiel croissant
  const sortedBikes = [...bikes].sort(
    (a, b) => (a.sequentialNumber ?? 0) - (b.sequentialNumber ?? 0)
  );

  const filteredBikes = sortedBikes.filter((bike) => {
    if (search) {
      const fullId = formatBikeId(bike).toLowerCase();
      const seq = bike.id.toLowerCase();
      const sticker = (bike.stickerNumber ?? '').toLowerCase();
      const q = search.toLowerCase();
      if (!fullId.includes(q) && !seq.includes(q) && !sticker.includes(q)) return false;
    }
    if (filter === 'all') return true;
    const gs = getBikeGlobalStatus(bike);
    if (filter === 'repair') return gs === 'repair' || gs === 'replace';
    if (filter === 'replace') return gs === 'replace';
    return true;
  });

  const bikeToDelete = bikes.find(b => b.id === deleteId);

  const handleConfirmDelete = () => {
    if (deleteId) removeBike(deleteId);
    setDeleteId(null);
  };

  const filterConfig = {
    all:     { label: 'Tous',      active: 'bg-[var(--cc-text)] text-white dark:bg-[var(--cc-border)]',                  inactive: '' },
    repair:  { label: 'À réparer', active: 'bg-[var(--cc-warning-light)] text-[var(--cc-warning-text)] border-amber-300', inactive: '' },
    replace: { label: 'À changer', active: 'bg-[var(--cc-danger-light)] text-[var(--cc-danger-text)] border-red-300',    inactive: '' },
  };

  return (
    <div className="min-h-screen bg-[var(--cc-bg)]">
      {/* Modal confirmation suppression */}
      <ConfirmModal
        open={!!deleteId}
        title="Supprimer ce vélo ?"
        message={`Le vélo "${bikeToDelete ? formatBikeId(bikeToDelete) : ''}" et toutes ses données seront définitivement supprimés. Cette action est irréversible.`}
        confirmLabel="Supprimer"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteId(null)}
      />

      {/* Header */}
      <header className="flex items-center justify-between px-4 py-4 bg-[var(--cc-surface)] border-b border-[var(--cc-border)] sticky top-0 z-10 sm:px-6 lg:px-10">
        <h1 className="text-xl font-semibold text-[var(--cc-text)]">
          Flotte <span className="text-[var(--cc-text-faint)] font-normal text-base">({filteredBikes.length})</span>
        </h1>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/bikes/new"
            className="flex items-center gap-2 bg-[var(--cc-primary)] text-white px-4 py-2 rounded-xl font-medium text-sm hover:opacity-90 active:scale-95 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" /> Ajouter
          </Link>
        </div>
      </header>

      <div className="px-4 pt-4 pb-8 sm:px-6 lg:px-10 max-w-5xl mx-auto space-y-4">
        {/* Recherche + filtres */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--cc-text-faint)]" />
            <input
              type="text"
              placeholder="Rechercher par numéro, sticker…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-[var(--cc-surface)] border border-[var(--cc-border)] rounded-xl text-sm text-[var(--cc-text)] placeholder:text-[var(--cc-text-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--cc-primary)] shadow-sm"
            />
          </div>
          <div className="flex gap-2 text-sm">
            {(['all', 'repair', 'replace'] as const).map((f) => {
              const { label, active, inactive } = filterConfig[f];
              const isActive = filter === f;
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-xl whitespace-nowrap transition-all border border-[var(--cc-border)] font-medium ${
                    isActive
                      ? active || 'bg-[var(--cc-primary-light)] text-[var(--cc-primary-text)] border-indigo-200'
                      : `${inactive} bg-[var(--cc-surface)] text-[var(--cc-text-muted)] hover:bg-[var(--cc-border-subtle)]`
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Grille */}
        {filteredBikes.length === 0 ? (
          <div className="text-center py-16 flex flex-col items-center">
            <div className="bg-[var(--cc-border-subtle)] p-5 rounded-full mb-4">
              <BikeIcon className="w-10 h-10 text-[var(--cc-text-faint)]" />
            </div>
            <h3 className="font-semibold text-[var(--cc-text)] mb-1">Aucun vélo</h3>
            <p className="text-sm text-[var(--cc-text-muted)]">
              {bikes.length === 0 ? 'Ajoutez votre premier vélo à la flotte.' : 'Aucun résultat pour ces filtres.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredBikes.map((bike) => (
              <div key={bike.id} className="relative group">
                <Link
                  href={`/bikes/${bike.id}`}
                  className="bg-[var(--cc-surface)] rounded-2xl p-4 shadow-[var(--cc-shadow-sm)] border border-[var(--cc-border)] hover:border-[var(--cc-primary)] hover:shadow-[var(--cc-shadow)] active:scale-95 transition-all flex flex-col min-h-[130px]"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-[var(--cc-border-subtle)] p-2 rounded-lg text-[var(--cc-text-faint)] group-hover:bg-[var(--cc-primary-light)] group-hover:text-[var(--cc-primary)] transition-colors">
                      <BikeIcon className="w-5 h-5" />
                    </div>
                    <StatusBadge status={getBikeGlobalStatus(bike)} />
                  </div>
                  <div className="mt-auto">
                    <h3
                      className="font-bold text-[var(--cc-text)] truncate text-sm"
                      title={formatBikeId(bike)}
                    >
                      {formatBikeId(bike)}
                    </h3>
                    <span className="text-[11px] text-[var(--cc-text-faint)] mt-0.5 block">
                      {new Date(bike.updatedAt).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </Link>

                {/* Bouton supprimer */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteId(bike.id);
                  }}
                  title="Supprimer ce vélo"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 focus:opacity-100 p-1.5 bg-[var(--cc-danger-light)] text-[var(--cc-danger)] rounded-lg transition-all hover:bg-[var(--cc-danger)] hover:text-white shadow-sm z-10"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
