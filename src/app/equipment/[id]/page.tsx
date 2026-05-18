'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Trash2, MapPin, Calendar, Tag } from 'lucide-react';
import { getEquipmentItem, updateEquipment, deleteEquipment } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import type { Equipment, EquipmentStatus, Loan } from '@/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const STATUS_LABELS: Record<EquipmentStatus, string> = {
  available: 'Disponible',
  borrowed: 'Emprunté',
  broken: 'En panne',
  maintenance: 'En maintenance',
};
const STATUS_BADGE: Record<EquipmentStatus, string> = {
  available: 'badge badge-available',
  borrowed: 'badge badge-borrowed',
  broken: 'badge badge-broken',
  maintenance: 'badge badge-maintenance',
};
const CONDITION_LABELS = { good: 'Bon état', fair: 'Correct', poor: 'Mauvais état' };
const CONDITION_BADGE = { good: 'badge badge-good', fair: 'badge badge-fair', poor: 'badge badge-poor' };
const RETURN_LABELS = { good: 'Bon état', broken: 'En panne', damaged: 'Endommagé' };

interface LoanHistoryRow {
  loan_id: string;
  employee_name: string;
  department_name?: string;
  checkout_date: string;
  return_date?: string;
  status: string;
  return_condition?: string;
}

export default function EquipmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [history, setHistory] = useState<LoanHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [changingStatus, setChangingStatus] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [newStatus, setNewStatus] = useState<EquipmentStatus>('available');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const eq = await getEquipmentItem(id);
        setEquipment(eq);
        setNewStatus(eq.status);

        // Loan history
        const { data } = await supabase
          .from('loan_items')
          .select('loan_id, return_condition, loan:loans(status, checkout_date, return_date, employee:employees(name, department:departments(name)))')
          .eq('equipment_id', id)
          .order('loan_id', { ascending: false });

        if (data) {
          const rows: LoanHistoryRow[] = data.map((item: unknown) => {
            const d = item as {
              loan_id: string;
              return_condition?: string;
              loan: {
                status: string;
                checkout_date: string;
                return_date?: string;
                employee: { name: string; department?: { name: string } };
              };
            };
            return {
              loan_id: d.loan_id,
              employee_name: d.loan?.employee?.name ?? '—',
              department_name: d.loan?.employee?.department?.name,
              checkout_date: d.loan?.checkout_date,
              return_date: d.loan?.return_date,
              status: d.loan?.status,
              return_condition: d.return_condition,
            };
          });
          setHistory(rows);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleStatusChange = async () => {
    if (!equipment || newStatus === equipment.status) return;
    setChangingStatus(true);
    try {
      const updated = await updateEquipment(id, { status: newStatus });
      setEquipment(updated);
    } catch (e) {
      alert('Erreur : ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setChangingStatus(false);
    }
  };

  const handleDelete = async () => {
    if (!equipment) return;
    if (!confirm(`Supprimer l'équipement ${equipment.category?.code}-${equipment.display_number} ? Cette action est irréversible.`)) return;
    setDeleting(true);
    try {
      await deleteEquipment(id);
      router.push(`/categories/${equipment.category_id}`);
    } catch (e) {
      alert('Erreur : ' + (e instanceof Error ? e.message : String(e)));
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '60vh' }}>
        <div className="spinner" style={{ width: '2rem', height: '2rem' }} />
      </div>
    );
  }

  if (!equipment) return null;

  const cat = equipment.category;
  const displayNum = `${cat?.code ?? '???'}-${equipment.display_number}`;

  return (
    <div className="fade-in">
      <div className="page-header flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="btn btn-ghost btn-icon">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="page-title">{displayNum}</h1>
              <span className={STATUS_BADGE[equipment.status]}>{STATUS_LABELS[equipment.status]}</span>
              <span className={CONDITION_BADGE[equipment.condition]}>{CONDITION_LABELS[equipment.condition]}</span>
            </div>
            {cat && (
              <p className="page-subtitle">{cat.icon} {cat.name}</p>
            )}
          </div>
        </div>
        <button onClick={handleDelete} disabled={deleting} className="btn btn-danger btn-sm">
          {deleting ? <div className="spinner" style={{ width: '0.875rem', height: '0.875rem', borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} /> : <Trash2 className="w-3.5 h-3.5" />}
          Supprimer
        </button>
      </div>

      <div className="px-4 md:px-7 pb-8 space-y-5">
        <div className="grid md:grid-cols-2 gap-5">
          {/* Info card */}
          <div className="card p-5 space-y-4">
            <p className="section-label">Informations</p>
            <div className="space-y-3">
              {[
                { icon: Tag, label: 'Numéro', value: <span className="eq-number">{displayNum}</span> },
                { icon: Tag, label: 'N° de série', value: equipment.serial_number ? <span style={{ fontFamily: 'monospace' }}>{equipment.serial_number}</span> : <span style={{ color: 'var(--et-text-muted)' }}>Non renseigné</span> },
                { icon: MapPin, label: 'Localisation', value: equipment.location || <span style={{ color: 'var(--et-text-muted)' }}>Non renseignée</span> },
                { icon: Calendar, label: 'Date d\'acquisition', value: equipment.acquisition_date ? format(new Date(equipment.acquisition_date), 'dd MMMM yyyy', { locale: fr }) : <span style={{ color: 'var(--et-text-muted)' }}>Non renseignée</span> },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3">
                  <Icon className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'var(--et-text-muted)' }} />
                  <div>
                    <p className="text-xs" style={{ color: 'var(--et-text-muted)' }}>{label}</p>
                    <div className="text-sm font-medium mt-0.5" style={{ color: 'var(--et-text)' }}>{value}</div>
                  </div>
                </div>
              ))}

              {equipment.description && (
                <div className="p-3 rounded-lg" style={{ background: 'var(--et-surface-2)' }}>
                  <p className="text-xs mb-1" style={{ color: 'var(--et-text-muted)' }}>Description</p>
                  <p className="text-sm" style={{ color: 'var(--et-text)' }}>{equipment.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Change status card */}
          <div className="card p-5 space-y-4">
            <p className="section-label">Changer le statut</p>
            <div className="space-y-3">
              {(['available', 'borrowed', 'broken', 'maintenance'] as EquipmentStatus[]).map(s => (
                <label
                  key={s}
                  className="flex items-center gap-3 p-3 rounded-xl cursor-pointer"
                  style={{
                    background: newStatus === s ? 'var(--et-primary-light)' : 'var(--et-surface-2)',
                    border: `1.5px solid ${newStatus === s ? 'var(--et-primary-muted)' : 'transparent'}`,
                  }}
                >
                  <input
                    type="radio"
                    name="status"
                    value={s}
                    checked={newStatus === s}
                    onChange={() => setNewStatus(s)}
                    style={{ accentColor: 'var(--et-primary)' }}
                  />
                  <span className={STATUS_BADGE[s]}>{STATUS_LABELS[s]}</span>
                  {s === equipment.status && (
                    <span className="text-xs ml-auto" style={{ color: 'var(--et-text-muted)' }}>actuel</span>
                  )}
                </label>
              ))}
              <button
                onClick={handleStatusChange}
                disabled={changingStatus || newStatus === equipment.status}
                className="btn btn-primary w-full justify-center"
              >
                {changingStatus ? (
                  <div className="spinner" style={{ width: '1rem', height: '1rem', borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
                ) : null}
                {changingStatus ? 'Mise à jour…' : 'Appliquer le statut'}
              </button>
            </div>
          </div>
        </div>

        {/* Loan history */}
        <div className="card">
          <div className="p-4" style={{ borderBottom: '1px solid var(--et-border)' }}>
            <p className="section-label mb-0">Historique des emprunts ({history.length})</p>
          </div>
          {history.length === 0 ? (
            <div className="empty-state">
              <p className="empty-state-title">Aucun emprunt enregistré</p>
              <p className="empty-state-desc">Cet équipement n'a pas encore été emprunté.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="et-table">
                <thead>
                  <tr>
                    <th>Employé</th>
                    <th>Service</th>
                    <th>Date d'emprunt</th>
                    <th>Date de retour</th>
                    <th>État retour</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map(row => (
                    <tr key={row.loan_id} style={{ cursor: 'pointer' }} onClick={() => router.push(`/loans/${row.loan_id}`)}>
                      <td className="font-medium">{row.employee_name}</td>
                      <td style={{ color: 'var(--et-text-muted)' }}>{row.department_name || '—'}</td>
                      <td style={{ color: 'var(--et-text-secondary)' }}>
                        {row.checkout_date ? format(new Date(row.checkout_date), 'dd/MM/yyyy', { locale: fr }) : '—'}
                      </td>
                      <td style={{ color: 'var(--et-text-secondary)' }}>
                        {row.return_date ? format(new Date(row.return_date), 'dd/MM/yyyy', { locale: fr }) : <span style={{ color: 'var(--et-text-muted)' }}>—</span>}
                      </td>
                      <td>
                        {row.return_condition ? (
                          <span className={
                            row.return_condition === 'good' ? 'badge badge-good' :
                            row.return_condition === 'broken' ? 'badge badge-broken' : 'badge badge-fair'
                          }>
                            {RETURN_LABELS[row.return_condition as keyof typeof RETURN_LABELS] ?? row.return_condition}
                          </span>
                        ) : <span style={{ color: 'var(--et-text-muted)' }}>—</span>}
                      </td>
                      <td>
                        <span className={row.status === 'active' ? 'badge badge-active' : 'badge badge-returned'}>
                          {row.status === 'active' ? 'Actif' : 'Retourné'}
                        </span>
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
