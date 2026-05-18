'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Package } from 'lucide-react';
import { getCategories, getNextSequentialNumber, createEquipment } from '@/lib/supabase';
import type { Category } from '@/types';

export default function NewEquipmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedCat = searchParams.get('category') ?? '';

  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({
    category_id: preselectedCat,
    quantity: 1,
    serial_number: '',
    condition: 'good' as 'good' | 'fair' | 'poor',
    location: '',
    description: '',
    acquisition_date: '',
  });
  const [nextNumber, setNextNumber] = useState<number | null>(null);
  const [nextPreview, setNextPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingCats, setLoadingCats] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getCategories()
      .then(cats => {
        setCategories(cats);
        if (!preselectedCat && cats.length > 0) {
          setForm(f => ({ ...f, category_id: cats[0].id }));
        }
      })
      .catch(console.error)
      .finally(() => setLoadingCats(false));
  }, [preselectedCat]);

  useEffect(() => {
    if (!form.category_id) { setNextNumber(null); setNextPreview(''); return; }
    const cat = categories.find(c => c.id === form.category_id);
    if (!cat) return;
    getNextSequentialNumber(form.category_id).then(n => {
      setNextNumber(n);
      setNextPreview(`${cat.code}-${String(n).padStart(3, '0')}`);
    }).catch(console.error);
  }, [form.category_id, categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.category_id) { setError('Veuillez sélectionner une catégorie.'); return; }
    setLoading(true);
    setError('');
    try {
      const cat = categories.find(c => c.id === form.category_id)!;
      const qty = Math.max(1, Math.min(50, form.quantity));
      let startNum = nextNumber ?? 1;
      for (let i = 0; i < qty; i++) {
        const seqNum = startNum + i;
        await createEquipment({
          category_id: form.category_id,
          sequential_number: seqNum,
          display_number: String(seqNum).padStart(3, '0'),
          serial_number: qty === 1 && form.serial_number.trim() ? form.serial_number.trim() : undefined,
          status: 'available',
          condition: form.condition,
          location: form.location.trim() || undefined,
          description: form.description.trim() || undefined,
          acquisition_date: form.acquisition_date || undefined,
        });
      }
      router.push(`/categories/${form.category_id}`);
    } catch (e: unknown) {
      setError('Erreur lors de la création : ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setLoading(false);
    }
  };

  if (loadingCats) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '60vh' }}>
        <div className="spinner" style={{ width: '2rem', height: '2rem' }} />
      </div>
    );
  }

  const selectedCat = categories.find(c => c.id === form.category_id);

  return (
    <div className="fade-in">
      <div className="page-header flex items-center gap-3">
        <Link href="/equipment" className="btn btn-ghost btn-icon">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="page-title">Ajouter un équipement</h1>
          <p className="page-subtitle">Enregistrez un ou plusieurs équipements</p>
        </div>
      </div>

      <div className="px-4 md:px-7 pb-8">
        <div className="max-w-2xl mx-auto">
          {error && <div className="alert alert-danger mb-4">{error}</div>}

          <form onSubmit={handleSubmit} className="card p-6 space-y-5">

            {/* Preview */}
            {selectedCat && nextPreview && (
              <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: 'var(--et-primary-light)', border: '1px solid var(--et-primary-muted)' }}>
                <div className="flex items-center justify-center w-10 h-10 rounded-xl text-xl" style={{ background: selectedCat.color + '18' }}>
                  {selectedCat.icon}
                </div>
                <div>
                  <p className="text-xs" style={{ color: 'var(--et-primary)', fontWeight: 600 }}>Prochain numéro</p>
                  <p className="eq-number text-base mt-0.5">{nextPreview}</p>
                  {form.quantity > 1 && (
                    <p className="text-xs mt-1" style={{ color: 'var(--et-text-muted)' }}>
                      Jusqu'à {selectedCat.code}-{String((nextNumber ?? 1) + form.quantity - 1).padStart(3, '0')} ({form.quantity} équipements)
                    </p>
                  )}
                </div>
              </div>
            )}

            <div>
              <label className="et-label">Catégorie <span style={{ color: 'var(--et-danger)' }}>*</span></label>
              {categories.length === 0 ? (
                <div className="alert alert-warning">
                  <Package className="w-4 h-4 shrink-0" />
                  Aucune catégorie. <Link href="/categories/new" style={{ textDecoration: 'underline' }}>Créez-en une d'abord.</Link>
                </div>
              ) : (
                <select
                  className="et-select"
                  value={form.category_id}
                  onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
                  required
                >
                  <option value="">Sélectionner une catégorie…</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name} ({c.code})</option>)}
                </select>
              )}
            </div>

            <div>
              <label className="et-label">Nombre à ajouter</label>
              <input
                type="number"
                className="et-input"
                min={1}
                max={50}
                value={form.quantity}
                onChange={e => setForm(f => ({ ...f, quantity: parseInt(e.target.value) || 1 }))}
              />
              <p className="text-xs mt-1" style={{ color: 'var(--et-text-muted)' }}>Min 1, max 50. Utilisez &gt; 1 pour créer plusieurs équipements en lot.</p>
            </div>

            {form.quantity === 1 && (
              <div>
                <label className="et-label">N° de série <span style={{ color: 'var(--et-text-muted)', fontWeight: 400 }}>(optionnel)</span></label>
                <input
                  type="text"
                  className="et-input"
                  placeholder="Ex: SN-2024-001"
                  value={form.serial_number}
                  onChange={e => setForm(f => ({ ...f, serial_number: e.target.value }))}
                  style={{ fontFamily: 'monospace' }}
                />
              </div>
            )}

            <div>
              <label className="et-label">État initial</label>
              <select
                className="et-select"
                value={form.condition}
                onChange={e => setForm(f => ({ ...f, condition: e.target.value as 'good' | 'fair' | 'poor' }))}
              >
                <option value="good">Bon état</option>
                <option value="fair">Correct</option>
                <option value="poor">Mauvais état</option>
              </select>
            </div>

            <div>
              <label className="et-label">Localisation <span style={{ color: 'var(--et-text-muted)', fontWeight: 400 }}>(optionnel)</span></label>
              <input
                type="text"
                className="et-input"
                placeholder="Ex: Entrepôt A, Bureau 3…"
                value={form.location}
                onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
              />
            </div>

            <div>
              <label className="et-label">Description <span style={{ color: 'var(--et-text-muted)', fontWeight: 400 }}>(optionnel)</span></label>
              <textarea
                className="et-textarea"
                placeholder="Notes supplémentaires…"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div>
              <label className="et-label">Date d'acquisition <span style={{ color: 'var(--et-text-muted)', fontWeight: 400 }}>(optionnel)</span></label>
              <input
                type="date"
                className="et-input"
                value={form.acquisition_date}
                onChange={e => setForm(f => ({ ...f, acquisition_date: e.target.value }))}
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Link href="/equipment" className="btn btn-secondary flex-1 justify-center">Annuler</Link>
              <button type="submit" disabled={loading || !form.category_id} className="btn btn-primary flex-1 justify-center">
                {loading ? (
                  <div className="spinner" style={{ width: '1rem', height: '1rem', borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
                ) : <Save className="w-4 h-4" />}
                {loading ? 'Ajout en cours…' : form.quantity > 1 ? `Ajouter ${form.quantity} équipements` : 'Ajouter'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
