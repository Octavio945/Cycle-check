'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Camera, ImagePlus, Bike as BikeIcon, X, Hash } from 'lucide-react';
import { useStore } from '@/store/useStore';
import Image from 'next/image';
import CameraCapture from '@/components/ui/CameraCapture';
import ThemeToggle from '@/components/ui/ThemeToggle';

export default function NewBikePage() {
  const router = useRouter();
  const { bikes, addBike } = useStore();

  // Calcul du prochain numéro séquentiel
  const nextSeq = bikes.reduce((max, b) => Math.max(max, b.sequentialNumber ?? 0), 0) + 1;
  const paddedSeq = String(nextSeq).padStart(3, '0');

  const [stickerNumber, setStickerNumber] = useState('');
  const [photoUrl, setPhotoUrl]           = useState<string | undefined>();
  const [cameraOpen, setCameraOpen]       = useState(false);

  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleGallerySelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPhotoUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSticker = stickerNumber.trim() || '--';
    addBike(cleanSticker, photoUrl);
    router.push(`/bikes/${paddedSeq}`);
  };

  // Aperçu du futur identifiant complet
  const previewId = `VELO-${paddedSeq}-${stickerNumber.trim() || '--'}`;

  return (
    <>
      {cameraOpen && (
        <CameraCapture
          onCapture={(dataUrl) => setPhotoUrl(dataUrl)}
          onClose={() => setCameraOpen(false)}
        />
      )}

      <div className="min-h-screen bg-[var(--cc-bg)]">
        <header className="flex items-center justify-between gap-4 p-4 bg-[var(--cc-surface)] border-b border-[var(--cc-border)] sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <Link href="/bikes" className="p-2 -ml-2 hover:bg-[var(--cc-border-subtle)] rounded-full transition-colors">
              <ArrowLeft className="w-6 h-6 text-[var(--cc-text-muted)]" />
            </Link>
            <h1 className="text-xl font-semibold text-[var(--cc-text)]">Ajouter un vélo</h1>
          </div>
          <ThemeToggle />
        </header>

        <form onSubmit={handleSubmit} className="max-w-xl mx-auto p-4 sm:p-6 flex flex-col gap-6">

          {/* Photo */}
          <section className="flex flex-col items-center gap-4">
            <div className="w-36 h-36 rounded-full border-2 border-dashed border-[var(--cc-primary)] bg-[var(--cc-primary-light)] flex items-center justify-center overflow-hidden relative shadow-sm">
              {photoUrl ? (
                <>
                  <Image src={photoUrl} alt="Aperçu du vélo" fill className="object-cover" />
                  <button
                    type="button"
                    onClick={() => setPhotoUrl(undefined)}
                    className="absolute top-1.5 right-1.5 bg-black/60 text-white rounded-full p-1 hover:bg-black/80 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center text-[var(--cc-primary)]">
                  <BikeIcon className="w-10 h-10 mb-1 opacity-70" />
                  <span className="text-xs font-medium opacity-70">Aucune photo</span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setCameraOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-[var(--cc-primary)] text-white rounded-xl font-medium text-sm hover:opacity-90 active:scale-95 transition-all shadow-sm"
              >
                <Camera className="w-4 h-4" />
                Appareil photo
              </button>
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2.5 bg-[var(--cc-surface)] text-[var(--cc-text)] border border-[var(--cc-border)] rounded-xl font-medium text-sm hover:bg-[var(--cc-border-subtle)] active:scale-95 transition-all shadow-sm"
              >
                <ImagePlus className="w-4 h-4" />
                Galerie
              </button>
            </div>

            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={galleryInputRef}
              onChange={handleGallerySelect}
            />
          </section>

          {/* Numéros */}
          <section className="bg-[var(--cc-surface)] p-5 rounded-2xl shadow-[var(--cc-shadow-sm)] border border-[var(--cc-border)] space-y-4">

            {/* Numéro séquentiel (auto) */}
            <div>
              <label className="block text-sm font-semibold text-[var(--cc-text)] mb-1">
                Numéro séquentiel
              </label>
              <p className="text-xs text-[var(--cc-text-muted)] mb-2">Attribué automatiquement, non modifiable.</p>
              <div className="flex items-center gap-3 px-4 py-3 bg-[var(--cc-border-subtle)] rounded-xl border border-[var(--cc-border)]">
                <BikeIcon className="w-5 h-5 text-[var(--cc-text-faint)] shrink-0" />
                <span className="font-bold text-[var(--cc-text)] tracking-wider">{paddedSeq}</span>
              </div>
            </div>

            {/* Numéro du sticker */}
            <div>
              <label htmlFor="stickerNumber" className="block text-sm font-semibold text-[var(--cc-text)] mb-1">
                Numéro collé sur le tricycle
              </label>
              <p className="text-xs text-[var(--cc-text-muted)] mb-2">
                Saisissez le numéro du sticker. Laissez vide s&apos;il n&apos;y en a pas (sera remplacé par <code className="bg-[var(--cc-border-subtle)] px-1 rounded">--</code>).
              </p>
              <div className="relative">
                <Hash className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--cc-text-faint)]" />
                <input
                  id="stickerNumber"
                  type="text"
                  value={stickerNumber}
                  onChange={(e) => setStickerNumber(e.target.value)}
                  placeholder="Ex: B42, 7, A-03… (optionnel)"
                  className="w-full pl-10 pr-4 py-3 bg-[var(--cc-bg)] border border-[var(--cc-border)] rounded-xl text-[var(--cc-text)] placeholder:text-[var(--cc-text-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--cc-primary)] focus:bg-[var(--cc-surface)] transition-all"
                />
              </div>
            </div>

            {/* Aperçu du numéro complet */}
            <div className="bg-[var(--cc-primary-light)] border border-indigo-200 dark:border-indigo-900 rounded-xl p-3 flex items-center gap-3">
              <span className="text-xs font-semibold text-[var(--cc-primary-text)] uppercase tracking-wide shrink-0">ID complet :</span>
              <span className="font-bold text-[var(--cc-primary)] tracking-wider truncate">{previewId}</span>
            </div>
          </section>

          <button
            type="submit"
            className="w-full bg-[var(--cc-primary)] text-white font-semibold py-4 rounded-2xl shadow-sm hover:opacity-90 active:scale-95 transition-all"
          >
            Créer le profil du vélo
          </button>
        </form>
      </div>
    </>
  );
}
