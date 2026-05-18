'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Pencil, UserX, UserCheck, Check, X, Phone } from 'lucide-react';
import { getEmployee, updateEmployee, getDepartments, getLoans } from '@/lib/supabase';
import type { Employee, Department, Loan } from '@/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [activeLoans, setActiveLoans] = useState<Loan[]>([]);
  const [pastLoans, setPastLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', department_id: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [emp, depts, allLoans] = await Promise.all([
        getEmployee(id),
        getDepartments(),
        getLoans(),
      ]);
      setEmployee(emp);
      setDepartments(depts);
      setEditForm({ name: emp.name, department_id: emp.department_id ?? '', phone: emp.phone ?? '' });
      const empLoans = allLoans.filter(l => l.employee_id === id);
      setActiveLoans(empLoans.filter(l => l.status === 'active'));
      setPastLoans(empLoans.filter(l => l.status === 'returned'));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleSave = async () => {
    if (!employee || !editForm.name.trim()) return;
    setSaving(true);
    try {
      const updated = await updateEmployee(id, {
        name: editForm.name.trim(),
        department_id: editForm.department_id || undefined,
        phone: editForm.phone.trim() || undefined,
      });
      setEmployee(updated);
      setEditing(false);
    } catch (e) {
      alert('Erreur : ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async () => {
    if (!employee) return;
    setToggling(true);
    try {
      const updated = await updateEmployee(id, { is_active: !employee.is_active });
      setEmployee(updated);
    } catch (e) {
      alert('Erreur : ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '60vh' }}>
        <div className="spinner" style={{ width: '2rem', height: '2rem' }} />
      </div>
    );
  }

  if (!employee) return null;

  return (
    <div className="fade-in">
      <div className="page-header flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/employees" className="btn btn-ghost btn-icon">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center justify-center w-14 h-14 rounded-full text-xl font-bold text-white shrink-0" style={{ background: 'var(--et-primary)' }}>
            {employee.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="page-title">{employee.name}</h1>
              <span className={`badge ${employee.is_active ? 'badge-active' : 'badge-neutral'}`}>
                {employee.is_active ? 'Actif' : 'Inactif'}
              </span>
            </div>
            {employee.department && (
              <div className="flex items-center gap-1.5 mt-0.5">
                {employee.department.color && (
                  <span className="w-2 h-2 rounded-full" style={{ background: employee.department.color }} />
                )}
                <p className="page-subtitle">{employee.department.name}</p>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setEditing(e => !e)} className="btn btn-secondary btn-sm">
            <Pencil className="w-3.5 h-3.5" /> Modifier
          </button>
          <button
            onClick={handleToggleActive}
            disabled={toggling}
            className={`btn btn-sm ${employee.is_active ? 'btn-danger' : 'btn-secondary'}`}
          >
            {toggling ? (
              <div className="spinner" style={{ width: '0.875rem', height: '0.875rem', borderColor: 'rgba(255,255,255,0.3)', borderTopColor: employee.is_active ? '#fff' : 'var(--et-primary)' }} />
            ) : employee.is_active ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
            {employee.is_active ? 'Désactiver' : 'Activer'}
          </button>
        </div>
      </div>

      <div className="px-4 md:px-7 pb-8 space-y-5">
        {/* Edit form */}
        {editing && (
          <div className="card p-5 space-y-4">
            <p className="section-label">Modifier les informations</p>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="et-label">Nom complet *</label>
                <input type="text" className="et-input" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} autoFocus />
              </div>
              <div>
                <label className="et-label">Service</label>
                <select className="et-select" value={editForm.department_id} onChange={e => setEditForm(f => ({ ...f, department_id: e.target.value }))}>
                  <option value="">Aucun service</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="et-label">Téléphone</label>
                <input type="tel" className="et-input" value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleSave} disabled={saving} className="btn btn-primary btn-sm">
                {saving ? <div className="spinner" style={{ width: '0.875rem', height: '0.875rem', borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} /> : <Check className="w-3.5 h-3.5" />}
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
              <button onClick={() => setEditing(false)} className="btn btn-ghost btn-sm">
                <X className="w-3.5 h-3.5" /> Annuler
              </button>
            </div>
          </div>
        )}

        {/* Info */}
        {!editing && employee.phone && (
          <div className="card p-4">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4" style={{ color: 'var(--et-text-muted)' }} />
              <a href={`tel:${employee.phone}`} className="text-sm font-medium" style={{ color: 'var(--et-text)' }}>{employee.phone}</a>
            </div>
          </div>
        )}

        {/* Active loans */}
        <div className="card">
          <div className="p-4" style={{ borderBottom: '1px solid var(--et-border)' }}>
            <div className="flex items-center justify-between">
              <p className="section-label mb-0">Emprunts actifs ({activeLoans.length})</p>
              {activeLoans.length > 0 && (
                <Link href="/loans/new" className="btn btn-primary btn-sm">
                  Nouvel emprunt
                </Link>
              )}
            </div>
          </div>
          {activeLoans.length === 0 ? (
            <div className="empty-state py-6">
              <p className="empty-state-title">Aucun emprunt actif</p>
              <Link href="/loans/new" className="btn btn-primary btn-sm mt-2">Créer un emprunt</Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="et-table">
                <thead><tr><th>Date</th><th>Équipements</th><th>Retour prévu</th><th>Action</th></tr></thead>
                <tbody>
                  {activeLoans.map(loan => (
                    <tr key={loan.id} style={{ cursor: 'pointer' }} onClick={() => router.push(`/loans/${loan.id}`)}>
                      <td style={{ color: 'var(--et-text-secondary)' }}>{format(new Date(loan.checkout_date), 'dd/MM/yyyy', { locale: fr })}</td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {loan.items?.slice(0, 3).map(item => (
                            <span key={item.id} className="eq-number text-xs">{item.equipment?.category?.code}-{item.equipment?.display_number}</span>
                          ))}
                          {(loan.items?.length ?? 0) > 3 && <span className="badge badge-neutral">+{(loan.items?.length ?? 0) - 3}</span>}
                        </div>
                      </td>
                      <td style={{ color: 'var(--et-text-muted)' }}>
                        {loan.expected_return_date ? format(new Date(loan.expected_return_date), 'dd/MM/yyyy', { locale: fr }) : '—'}
                      </td>
                      <td>
                        <Link href={`/loans/${loan.id}`} onClick={e => e.stopPropagation()} className="btn btn-secondary btn-sm">
                          Traiter retour
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* History */}
        <div className="card">
          <div className="p-4" style={{ borderBottom: '1px solid var(--et-border)' }}>
            <p className="section-label mb-0">Historique des emprunts ({pastLoans.length})</p>
          </div>
          {pastLoans.length === 0 ? (
            <div className="empty-state py-6">
              <p className="empty-state-title">Aucun historique</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="et-table">
                <thead><tr><th>Date emprunt</th><th>Retour</th><th>Équipements</th></tr></thead>
                <tbody>
                  {pastLoans.map(loan => (
                    <tr key={loan.id} style={{ cursor: 'pointer' }} onClick={() => router.push(`/loans/${loan.id}`)}>
                      <td style={{ color: 'var(--et-text-secondary)' }}>{format(new Date(loan.checkout_date), 'dd/MM/yyyy', { locale: fr })}</td>
                      <td style={{ color: 'var(--et-text-secondary)' }}>{loan.return_date ? format(new Date(loan.return_date), 'dd/MM/yyyy', { locale: fr }) : '—'}</td>
                      <td>
                        <span className="badge badge-neutral">{loan.items?.length ?? 0} item{(loan.items?.length ?? 0) > 1 ? 's' : ''}</span>
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
