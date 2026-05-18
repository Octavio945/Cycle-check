'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Clock, User, FileText } from 'lucide-react';
import { getLoan, returnLoan } from '@/lib/supabase';
import type { Loan, LoanItem, ReturnCondition } from '@/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const STATUS_LABELS = { available: 'Disponible', borrowed: 'Emprunté', broken: 'En panne', maintenance: 'En maintenance' };
const STATUS_BADGE: Record<string, string> = { available: 'badge badge-available', borrowed: 'badge badge-borrowed', broken: 'badge badge-broken', maintenance: 'badge badge-maintenance' };
const RETURN_LABELS: Record<ReturnCondition, string> = { good: 'Bon état', broken: 'En panne', damaged: 'Endommagé' };

export default function LoanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loan, setLoan] = useState<Loan | null>(null);
  const [loading, setLoading] = useState(true);
  const [returnConditions, setReturnConditions] = useState<Record<string, ReturnCondition>>({});
  const [returnNotes, setReturnNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const now = new Date();
  const returnDate = format(now, 'yyyy-MM-dd');
  const returnTime = format(now, 'HH:mm');

  const load = async () => {
    setLoading(true);
    try {
      const l = await getLoan(id);
      setLoan(l);
      if (l.status === 'active' && l.items) {
        const initial: Record<string, ReturnCondition> = {};
        for (const item of l.items) initial[item.equipment_id] = 'good';
        setReturnConditions(initial);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleReturn = async () => {
    if (!loan?.items) return;
    setSubmitting(true);
    setError('');
    try {
      const updated = await returnLoan(id, {
        return_date: returnDate,
        return_time: returnTime,
        return_notes: returnNotes.trim() || undefined,
        items: loan.items.map(item => ({
          equipment_id: item.equipment_id,
          return_condition: returnConditions[item.equipment_id] ?? 'good',
        })),
      });
      setLoan(updated);
    } catch (e: unknown) {
      setError('Erreur lors du retour : ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '60vh' }}>
        <div className="spinner" style={{ width: '2rem', height: '2rem' }} />
      </div>
    );
  }

  if (!loan) return null;

  const isActive = loan.status === 'active';

  return (
    <div className="fade-in">
      <div className="page-header flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="btn btn-ghost btn-icon">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="page-title">Emprunt #{id.slice(0, 8).toUpperCase()}</h1>
              <span className={`badge ${isActive ? 'badge-active' : 'badge-returned'}`}>
                {isActive ? 'Actif' : 'Retourné'}
              </span>
            </div>
            <p className="page-subtitle">
              {format(new Date(loan.checkout_date), 'dd MMMM yyyy', { locale: fr })} à {loan.checkout_time}
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-7 pb-8 space-y-5">
        {/* Employee info */}
        <div className="grid md:grid-cols-2 gap-5">
          <div className="card p-5">
            <p className="section-label">Employé</p>
            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-full text-base font-bold text-white shrink-0" style={{ background: 'var(--et-primary)' }}>
                {loan.employee?.name?.charAt(0).toUpperCase() ?? '?'}
              </div>
              <div>
                <Link href={`/employees/${loan.employee_id}`} className="font-semibold" style={{ color: 'var(--et-text)' }}>
                  {loan.employee?.name ?? '—'}
                </Link>
                {loan.employee?.department && (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {loan.employee.department.color && (
                      <span className="w-2 h-2 rounded-full" style={{ background: loan.employee.department.color }} />
                    )}
                    <p className="text-sm" style={{ color: 'var(--et-text-muted)' }}>{loan.employee.department.name}</p>
                  </div>
                )}
                {loan.employee?.phone && (
                  <p className="text-sm mt-0.5" style={{ color: 'var(--et-text-muted)' }}>{loan.employee.phone}</p>
                )}
              </div>
            </div>
          </div>

          <div className="card p-5 space-y-3">
            <p className="section-label">Détails de l'emprunt</p>
            <div className="space-y-2">
              {[
                { icon: Clock, label: 'Emprunt', value: `${format(new Date(loan.checkout_date), 'dd/MM/yyyy', { locale: fr })} à ${loan.checkout_time}` },
                { icon: Clock, label: 'Retour prévu', value: loan.expected_return_date ? format(new Date(loan.expected_return_date), 'dd/MM/yyyy', { locale: fr }) : '—' },
                { icon: User, label: 'Agent', value: loan.processed_by || '—' },
                { icon: FileText, label: 'Notes', value: loan.checkout_notes || '—' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-2">
                  <Icon className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'var(--et-text-muted)' }} />
                  <div>
                    <span className="text-xs" style={{ color: 'var(--et-text-muted)' }}>{label} · </span>
                    <span className="text-sm" style={{ color: 'var(--et-text)' }}>{value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Items table */}
        <div className="card">
          <div className="p-4" style={{ borderBottom: '1px solid var(--et-border)' }}>
            <p className="section-label mb-0">Équipements empruntés ({loan.items?.length ?? 0})</p>
          </div>
          <div className="overflow-x-auto">
            <table className="et-table">
              <thead>
                <tr>
                  <th>Numéro</th>
                  <th>Catégorie</th>
                  <th>N° de série</th>
                  <th>Statut actuel</th>
                  {!isActive && <th>Condition retour</th>}
                </tr>
              </thead>
              <tbody>
                {loan.items?.map((item: LoanItem) => (
                  <tr key={item.id}>
                    <td>
                      <Link href={`/equipment/${item.equipment_id}`} className="eq-number hover:opacity-70">
                        {item.equipment?.category?.code}-{item.equipment?.display_number}
                      </Link>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <span>{item.equipment?.category?.icon}</span>
                        <span style={{ color: 'var(--et-text-secondary)' }}>{item.equipment?.category?.name ?? '—'}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--et-text-muted)', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                      {item.equipment?.serial_number || '—'}
                    </td>
                    <td>
                      {item.equipment?.status && (
                        <span className={STATUS_BADGE[item.equipment.status]}>
                          {STATUS_LABELS[item.equipment.status as keyof typeof STATUS_LABELS]}
                        </span>
                      )}
                    </td>
                    {!isActive && (
                      <td>
                        {item.return_condition ? (
                          <span className={
                            item.return_condition === 'good' ? 'badge badge-good' :
                            item.return_condition === 'broken' ? 'badge badge-broken' : 'badge badge-fair'
                          }>
                            {RETURN_LABELS[item.return_condition]}
                          </span>
                        ) : '—'}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Return section */}
        {isActive && (
          <div className="card p-5 space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" style={{ color: 'var(--et-success)' }} />
              <p className="section-label mb-0" style={{ color: 'var(--et-success-text)' }}>Traiter le retour</p>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            <div className="grid sm:grid-cols-2 gap-3 p-4 rounded-xl" style={{ background: 'var(--et-surface-2)' }}>
              <div>
                <p className="et-label">Date de retour</p>
                <p className="text-sm font-medium" style={{ color: 'var(--et-text)' }}>{format(now, 'dd MMMM yyyy', { locale: fr })}</p>
              </div>
              <div>
                <p className="et-label">Heure de retour</p>
                <p className="text-sm font-medium" style={{ color: 'var(--et-text)' }}>{returnTime}</p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="et-label">État de retour par équipement</p>
              {loan.items?.map(item => (
                <div key={item.id} className="flex items-center gap-3 flex-wrap p-3 rounded-xl" style={{ background: 'var(--et-surface-2)' }}>
                  <span className="eq-number">{item.equipment?.category?.code}-{item.equipment?.display_number}</span>
                  <span className="text-sm" style={{ color: 'var(--et-text-secondary)' }}>{item.equipment?.category?.name}</span>
                  <select
                    className="et-select ml-auto"
                    style={{ width: 'auto', minWidth: '160px' }}
                    value={returnConditions[item.equipment_id] ?? 'good'}
                    onChange={e => setReturnConditions(prev => ({ ...prev, [item.equipment_id]: e.target.value as ReturnCondition }))}
                  >
                    <option value="good">Bon état</option>
                    <option value="damaged">Endommagé</option>
                    <option value="broken">En panne</option>
                  </select>
                </div>
              ))}
            </div>

            <div>
              <label className="et-label">Notes de retour <span style={{ color: 'var(--et-text-muted)', fontWeight: 400 }}>(optionnel)</span></label>
              <textarea
                className="et-textarea"
                placeholder="Observations lors du retour…"
                value={returnNotes}
                onChange={e => setReturnNotes(e.target.value)}
                rows={2}
              />
            </div>

            <button
              onClick={handleReturn}
              disabled={submitting}
              className="btn btn-primary w-full justify-center btn-lg"
            >
              {submitting ? (
                <div className="spinner" style={{ width: '1rem', height: '1rem', borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
              ) : <CheckCircle2 className="w-5 h-5" />}
              {submitting ? 'Enregistrement…' : 'Enregistrer le retour'}
            </button>
          </div>
        )}

        {/* Return info if already returned */}
        {!isActive && loan.return_date && (
          <div className="card p-5 space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" style={{ color: 'var(--et-success)' }} />
              <p className="section-label mb-0">Retour effectué</p>
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl" style={{ background: 'var(--et-success-bg)' }}>
                <p className="text-xs" style={{ color: 'var(--et-success-text)' }}>Date de retour</p>
                <p className="font-semibold text-sm mt-1" style={{ color: 'var(--et-success-text)' }}>
                  {format(new Date(loan.return_date), 'dd/MM/yyyy', { locale: fr })} à {loan.return_time}
                </p>
              </div>
              {loan.return_notes && (
                <div className="p-3 rounded-xl sm:col-span-2" style={{ background: 'var(--et-surface-2)' }}>
                  <p className="text-xs" style={{ color: 'var(--et-text-muted)' }}>Notes de retour</p>
                  <p className="text-sm mt-1" style={{ color: 'var(--et-text)' }}>{loan.return_notes}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
