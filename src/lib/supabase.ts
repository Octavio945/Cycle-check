import { createClient } from '@supabase/supabase-js'
import type { Category, Department, Employee, Equipment, Loan, LoanItem } from '@/types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ─── Categories ───────────────────────────────────────────────
export const getCategories = async (): Promise<Category[]> => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name')
  if (error) throw error
  return data ?? []
}

export const createCategory = async (cat: Omit<Category, 'id' | 'created_at'>): Promise<Category> => {
  const { data, error } = await supabase
    .from('categories')
    .insert(cat)
    .select()
    .single()
  if (error) throw error
  return data
}

export const updateCategory = async (id: string, updates: Partial<Category>): Promise<Category> => {
  const { data, error } = await supabase
    .from('categories')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export const deleteCategory = async (id: string): Promise<void> => {
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) throw error
}

// ─── Departments ──────────────────────────────────────────────
export const getDepartments = async (): Promise<Department[]> => {
  const { data, error } = await supabase
    .from('departments')
    .select('*')
    .order('name')
  if (error) throw error
  return data ?? []
}

export const createDepartment = async (dep: Omit<Department, 'id' | 'created_at'>): Promise<Department> => {
  const { data, error } = await supabase
    .from('departments')
    .insert(dep)
    .select()
    .single()
  if (error) throw error
  return data
}

export const updateDepartment = async (id: string, updates: Partial<Department>): Promise<Department> => {
  const { data, error } = await supabase
    .from('departments')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export const deleteDepartment = async (id: string): Promise<void> => {
  const { error } = await supabase.from('departments').delete().eq('id', id)
  if (error) throw error
}

// ─── Employees ────────────────────────────────────────────────
export const getEmployees = async (): Promise<Employee[]> => {
  const { data, error } = await supabase
    .from('employees')
    .select('*, department:departments(*)')
    .order('name')
  if (error) throw error
  return data ?? []
}

export const getEmployee = async (id: string): Promise<Employee> => {
  const { data, error } = await supabase
    .from('employees')
    .select('*, department:departments(*)')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export const createEmployee = async (emp: Omit<Employee, 'id' | 'created_at' | 'department'>): Promise<Employee> => {
  const { data, error } = await supabase
    .from('employees')
    .insert(emp)
    .select('*, department:departments(*)')
    .single()
  if (error) throw error
  return data
}

export const updateEmployee = async (id: string, updates: Partial<Employee>): Promise<Employee> => {
  const { data, error } = await supabase
    .from('employees')
    .update(updates)
    .eq('id', id)
    .select('*, department:departments(*)')
    .single()
  if (error) throw error
  return data
}

export const deleteEmployee = async (id: string): Promise<void> => {
  const { error } = await supabase.from('employees').delete().eq('id', id)
  if (error) throw error
}

// ─── Equipment ────────────────────────────────────────────────
export const getEquipment = async (filters?: {
  category_id?: string
  status?: string
}): Promise<Equipment[]> => {
  let query = supabase
    .from('equipment')
    .select('*, category:categories(*)')
    .order('category_id')
    .order('sequential_number')
  if (filters?.category_id) query = query.eq('category_id', filters.category_id)
  if (filters?.status) query = query.eq('status', filters.status)
  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export const getEquipmentItem = async (id: string): Promise<Equipment> => {
  const { data, error } = await supabase
    .from('equipment')
    .select('*, category:categories(*)')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export const getNextSequentialNumber = async (category_id: string): Promise<number> => {
  const { data, error } = await supabase
    .from('equipment')
    .select('sequential_number')
    .eq('category_id', category_id)
    .order('sequential_number', { ascending: false })
    .limit(1)
  if (error) throw error
  if (!data || data.length === 0) return 1
  return data[0].sequential_number + 1
}

export const createEquipment = async (
  item: Omit<Equipment, 'id' | 'created_at' | 'updated_at' | 'category'>
): Promise<Equipment> => {
  const { data, error } = await supabase
    .from('equipment')
    .insert(item)
    .select('*, category:categories(*)')
    .single()
  if (error) throw error
  return data
}

export const updateEquipment = async (id: string, updates: Partial<Equipment>): Promise<Equipment> => {
  const { data, error } = await supabase
    .from('equipment')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*, category:categories(*)')
    .single()
  if (error) throw error
  return data
}

export const deleteEquipment = async (id: string): Promise<void> => {
  const { error } = await supabase.from('equipment').delete().eq('id', id)
  if (error) throw error
}

// ─── Loans ────────────────────────────────────────────────────
export const getLoans = async (status?: LoanStatus): Promise<Loan[]> => {
  let query = supabase
    .from('loans')
    .select('*, employee:employees(*, department:departments(*)), items:loan_items(*, equipment:equipment(*, category:categories(*)))')
    .order('created_at', { ascending: false })
  if (status) query = query.eq('status', status)
  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export const getLoan = async (id: string): Promise<Loan> => {
  const { data, error } = await supabase
    .from('loans')
    .select('*, employee:employees(*, department:departments(*)), items:loan_items(*, equipment:equipment(*, category:categories(*)))')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export const createLoan = async (
  loan: Omit<Loan, 'id' | 'created_at' | 'employee' | 'items'>,
  equipmentIds: string[]
): Promise<Loan> => {
  const { data: loanData, error: loanError } = await supabase
    .from('loans')
    .insert(loan)
    .select()
    .single()
  if (loanError) throw loanError

  const loanItems: Omit<LoanItem, 'id' | 'equipment'>[] = equipmentIds.map(eq_id => ({
    loan_id: loanData.id,
    equipment_id: eq_id,
  }))

  const { error: itemsError } = await supabase.from('loan_items').insert(loanItems)
  if (itemsError) throw itemsError

  const { error: statusError } = await supabase
    .from('equipment')
    .update({ status: 'borrowed', updated_at: new Date().toISOString() })
    .in('id', equipmentIds)
  if (statusError) throw statusError

  return getLoan(loanData.id)
}

export const returnLoan = async (
  loanId: string,
  returnData: {
    return_date: string
    return_time: string
    return_notes?: string
    items: Array<{ equipment_id: string; return_condition: ReturnCondition; return_notes?: string }>
  }
): Promise<Loan> => {
  const { error: loanError } = await supabase
    .from('loans')
    .update({
      status: 'returned',
      return_date: returnData.return_date,
      return_time: returnData.return_time,
      return_notes: returnData.return_notes,
    })
    .eq('id', loanId)
  if (loanError) throw loanError

  for (const item of returnData.items) {
    const { error: itemError } = await supabase
      .from('loan_items')
      .update({
        return_condition: item.return_condition,
        return_notes: item.return_notes,
      })
      .eq('loan_id', loanId)
      .eq('equipment_id', item.equipment_id)
    if (itemError) throw itemError

    const newStatus = item.return_condition === 'broken' ? 'broken' : 'available'
    const { error: eqError } = await supabase
      .from('equipment')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', item.equipment_id)
    if (eqError) throw eqError
  }

  return getLoan(loanId)
}

// ─── Dashboard Stats ──────────────────────────────────────────
export const getDashboardStats = async () => {
  const [equipmentRes, loansRes] = await Promise.all([
    supabase.from('equipment').select('status, category_id'),
    supabase.from('loans').select('id').eq('status', 'active'),
  ])
  if (equipmentRes.error) throw equipmentRes.error
  if (loansRes.error) throw loansRes.error

  const equipment = equipmentRes.data ?? []
  return {
    total: equipment.length,
    available: equipment.filter(e => e.status === 'available').length,
    borrowed: equipment.filter(e => e.status === 'borrowed').length,
    broken: equipment.filter(e => e.status === 'broken').length,
    maintenance: equipment.filter(e => e.status === 'maintenance').length,
    active_loans: loansRes.data?.length ?? 0,
  }
}

type LoanStatus = 'active' | 'returned'
type ReturnCondition = 'good' | 'broken' | 'damaged'
