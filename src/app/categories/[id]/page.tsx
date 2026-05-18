'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Package } from 'lucide-react';
import { getCategories, getEquipment } from '@/lib/supabase';
import type { Category, Equipment, EquipmentStatus } from '@/types';

const STATUS_LABELS: Record<EquipmentStatus, string> = {
  available: 'Disponible',
  borrowed: 'Emprunté',
  broken: 'En panne',
  maintenance: 'En maintenance',
};

const CONDITION_LABELS = {
  good: 'Bon état',
  fair: 'Correct',
  poor: 'Mauvais état',
};

const STATUS_BADGE: Record<EquipmentStatus, string> = {
  available: 'badge badge-available',
  borrowed: 'badge badge-borrowed',
  broken: 'badge badge-broken',
  maintenance: 'badge badge-maintenance',
};

const CONDITION_BADGE = {
  good: 'badge badge-good',
  fair: 'badge badge-fair',
  poor: 'badge badge-poor',
};

export default function CategoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [category, setCategory] = useState<Category | null>(null);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [filtered, setFiltered] = useState<Equipment[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [cats, equip] = await Promise.all([
          getCategories(),
          getEquipment({ category_id: id }),
        ]);
        const cat = cats.find(c => c.id === id);
        if (!cat) { router.push('/categories'); return; }
        setCategory(cat);
        setEquipment(equip);
        setFiltered(equip);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, router]);

  useEffect(() => {
    if (statusFilter === 'all') {
      setFiltered(equipment);
    } else {
      setFiltered(equipment.filter(e => e.status === statusFilter));
    }
  }, [statusFilter, equipment]);

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '60vh' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="spinner" style={{ width: '2rem', height: '2rem' }} />
          <p style={{ color: 'var(--et-text-muted)', fontSize: '0.875rem' }}>Chargement…</p>
        </div>
      </div>
    );
  }

  if (!category) return null;

  const stats = {
    total: equipment.length,
    available: equipment.filter(e => e.status === 'available').length,
    borrowed: equipment.filter(e => e.status === 'borrowed').length,
    broken: equipment.filter(e => e.status === 'broken').length,
    maintenance: equipment.filter(e => e.status === 'maintenance').length,
  };

  return (
    <div className="fade-in">
      <div className="page-header flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/categories" className="btn btn-ghost btn-icon">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div
            className="flex items-center justify-center w-12 h-12 rounded-xl text-2xl shrink-0"
            style={{ background: category.color + '18', border: `1.5px solid ${category.color}30` }}
          >
            {category.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="page-title">{category.name}</h1>
              <span className="eq-number">{category.code}</span>
            </div>
            {category.description && (
              <p className="page-subtitle">{category.description}</p>
            )}
          </div>
        </div>
        <Link href={`/equipment/new?category=${id}`} className="btn btn-primary">
          <Plus className="w-4 h-4" /> Ajouter un équipement
        </Link>
      </div>

      <div className="px-4 md:px-7 pb-8 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Total', value: stats.total, color: 'var(--et-text-secondary)' },
            { label: 'Disponibles', value: stats.available, color: 'var(--et-success)' },
            { label: 'Empruntés', value: stats.borrowed, color: 'var(--et-primary)' },
            { label: 'En panne', value: stats.broken, color: 'var(--et-danger)' },
            { label: 'Maintenance', value: stats.maintenance, color: 'var(--et-warning)' },
          ].map(({ label, value, color }) => (
            <div key={label} className="card p-4 text-center">
              <p className="text-2xl font-bold" style={{ color }}>{value}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--et-text-muted)' }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Filter + Table */}
        <div className="card">
          <div className="flex items-center justify-between gap-3 p-4" style={{ borderBottom: '1px solid var(--et-border)' }}>
            <p className="section-label mb-0">Équipements ({filtered.length})</p>
            <select
              className="et-select"
              style={{ width: 'auto', minWidth: '180px' }}
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="all">Tous les statuts</option>
              <option value="available">Disponible</option>
              <option value="borrowed">Emprunté</option>
              <option value="broken">En panne</option>
              <option value="maintenance">En maintenance</option>
            </select>
          </div>

          {filtered.length === 0 ? (
            <div className="empty-state">
              <Package className="empty-state-icon" />
              <p className="empty-state-title">Aucun équipement{statusFilter !== 'all' ? ' pour ce filtre' : ''}</p>
              <p className="empty-state-desc">
                {statusFilter !== 'all' ? 'Essayez un autre filtre.' : 'Ajoutez votre premier équipement dans cette catégorie.'}
              </p>
              {statusFilter === 'all' && (
                <Link href={`/equipment/new?category=${id}`} className="btn btn-primary btn-sm mt-2">
                  <Plus className="w-3.5 h-3.5" /> Ajouter un équipement
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="et-table">
                <thead>
                  <tr>
                    <th>Numéro</th>
                    <th>N° de série</th>
                    <th>Statut</th>
                    <th>État</th>
                    <th>Localisation</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(eq => (
                    <tr
                      key={eq.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => router.push(`/equipment/${eq.id}`)}
                    >
                      <td>
                        <span className="eq-number">{category.code}-{eq.display_number}</span>
                      </td>
                      <td style={{ color: 'var(--et-text-muted)', fontSize: '0.8rem', fontFamily: 'monospace' }}>
                        {eq.serial_number || <span style={{ opacity: 0.4 }}>—</span>}
                      </td>
                      <td>
                        <span className={STATUS_BADGE[eq.status]}>
                          {STATUS_LABELS[eq.status]}
                        </span>
                      </td>
                      <td>
                        <span className={CONDITION_BADGE[eq.condition]}>
                          {CONDITION_LABELS[eq.condition]}
                        </span>
                      </td>
                      <td style={{ color: 'var(--et-text-muted)' }}>
                        {eq.location || <span style={{ opacity: 0.4 }}>—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
