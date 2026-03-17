'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Camera, ImagePlus, Bike as BikeIcon, X } from 'lucide-react';
import { useStore } from '@/store/useStore';
import Image from 'next/image';
import CameraCapture from '@/components/ui/CameraCapture';

export default function NewBikePage() {
  const router = useRouter();
  const { bikes, addBike } = useStore();

  const [bikeId, setBikeId]     = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | undefined>();
  const [error, setError]       = useState('');
  const [cameraOpen, setCameraOpen] = useState(false);

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
    const cleanId = bikeId.trim();
    if (!cleanId) { setError('Veuillez saisir un numéro de vélo.'); return; }
    if (bikes.some(b => b.id.toLowerCase() === cleanId.toLowerCase())) {
      setError('Ce numéro de vélo existe déjà dans la flotte.');
      return;
    }
    addBike(cleanId, photoUrl);
    router.push(`/bikes/${cleanId}`);
  };

  return (
    <>
      {cameraOpen && (
        <CameraCapture
          onCapture={(dataUrl) => setPhotoUrl(dataUrl)}
          onClose={() => setCameraOpen(false)}
        />
      )}

      <div className="min-h-screen bg-[var(--cc-bg)]">
        <header className="flex items-center gap-4 p-4 bg-[var(--cc-surface)] border-b border-[var(--cc-border)] sticky top-0 z-10">
          <Link href="/bikes" className="p-2 -ml-2 hover:bg-[var(--cc-border-subtle)] rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-[var(--cc-text-muted)]" />
          </Link>
          <h1 className="text-xl font-semibold text-[var(--cc-text)]">Ajouter un vélo</h1>
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

          {/* Identifiant */}
          <section className="bg-[var(--cc-surface)] p-5 rounded-2xl shadow-[var(--cc-shadow-sm)] border border-[var(--cc-border)]">
            <label htmlFor="bikeId" className="block text-sm font-semibold text-[var(--cc-text)] mb-2">
              Numéro d&apos;identification *
            </label>
            <div className="relative">
              <BikeIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--cc-text-faint)]" />
              <input
                id="bikeId"
                type="text"
                value={bikeId}
                onChange={(e) => { setBikeId(e.target.value); setError(''); }}
                placeholder="Ex: VELO-42, BTWIN-01..."
                className={`w-full pl-10 pr-4 py-3 bg-[var(--cc-bg)] border rounded-xl text-[var(--cc-text)] placeholder:text-[var(--cc-text-faint)] focus:outline-none focus:ring-2 focus:bg-[var(--cc-surface)] transition-all ${
                  error
                    ? 'border-[var(--cc-danger)] focus:ring-[var(--cc-danger)]'
                    : 'border-[var(--cc-border)] focus:ring-[var(--cc-primary)]'
                }`}
              />
            </div>
            {error && <p className="text-[var(--cc-danger)] text-sm mt-2 font-medium">{error}</p>}
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
