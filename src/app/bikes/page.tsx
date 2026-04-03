'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, Bike as BikeIcon, Search, Trash2 } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Bike, PartStatus, formatBikeId } from '@/types';
import ThemeToggle from '@/components/ui/ThemeToggle';
import ConfirmModal from '@/components/ui/ConfirmModal';
import ImageModal from '@/components/ui/ImageModal';

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
  const [zoomImage, setZoomImage] = useState<{ src: string; alt: string } | null>(null);

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

      {/* Modal Zoom Image */}
      {zoomImage && (
        <ImageModal
          src={zoomImage.src}
          alt={zoomImage.alt}
          isOpen={!!zoomImage}
          onClose={() => setZoomImage(null)}
        />
      )}

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBikes.map((bike) => (
              <div key={bike.id} className="relative group bg-[var(--cc-surface)] rounded-2xl overflow-hidden shadow-[var(--cc-shadow-sm)] border border-[var(--cc-border)] hover:border-[var(--cc-primary)] hover:shadow-[var(--cc-shadow)] transition-all">
                {/* Lien principal couvrant toute la carte */}
                <Link
                  href={`/bikes/${bike.id}`}
                  className="absolute inset-0 z-0"
                  aria-label={`Détails du vélo ${formatBikeId(bike)}`}
                />

                {/* Contenu visuel */}
                <div className="relative z-0 pointer-events-none">
                  {/* Zone d'image */}
                  <div className="relative aspect-[4/3] w-full bg-[var(--cc-border-subtle)] overflow-hidden border-b border-[var(--cc-border)]">
                    {bike.photoUrl ? (
                      <Image
                        src={bike.photoUrl}
                        alt={formatBikeId(bike)}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-[var(--cc-text-faint)] opacity-30">
                        <BikeIcon className="w-12 h-12" />
                      </div>
                    )}
                    
                    {/* Badge de statut superposé */}
                    <div className="absolute top-3 right-3 scale-125 origin-top-right">
                      <StatusBadge status={getBikeGlobalStatus(bike)} />
                    </div>
                  </div>

                  {/* Infos */}
                  <div className="p-4 flex flex-col items-start gap-1">
                    <h3
                      className="font-bold text-[var(--cc-text)] truncate text-sm w-full"
                      title={formatBikeId(bike)}
                    >
                      {formatBikeId(bike)}
                    </h3>
                    <div className="flex items-center justify-between w-full">
                      <span className="text-[11px] text-[var(--cc-text-faint)] font-medium">
                        {new Date(bike.updatedAt).toLocaleDateString('fr-FR')}
                      </span>
                      {bike.stickerNumber && bike.stickerNumber !== '--' && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] bg-[var(--cc-primary-light)] text-[var(--cc-primary)] font-bold uppercase tracking-wider">
                          #{bike.stickerNumber}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Boutons d'action superposés (z-index supérieur) */}
                <div className="absolute inset-0 z-10 pointer-events-none">
                  {/* Bouton Zoom */}
                  {bike.photoUrl && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setZoomImage({ src: bike.photoUrl!, alt: formatBikeId(bike) });
                      }}
                      className="absolute bottom-4 right-4 p-2.5 bg-black/60 backdrop-blur-md text-white rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-black/80 pointer-events-auto transform translate-y-2 group-hover:translate-y-0"
                      title="Agrandir"
                    >
                      <Search className="w-5 h-5" />
                    </button>
                  )}

                  {/* Bouton supprimer */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDeleteId(bike.id);
                    }}
                    title="Supprimer ce vélo"
                    className="absolute top-3 right-12 opacity-0 group-hover:opacity-100 p-1.5 bg-red-100 text-red-600 rounded-lg transition-all hover:bg-red-600 hover:text-white pointer-events-auto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
