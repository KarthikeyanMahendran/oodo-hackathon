import { supabase } from './client';
import type {
  Department,
  DepartmentSummary,
  Designation,
  LeaveBalanceRow,
  LeaveRequest,
  LeaveRequestInput,
  LeaveType,
} from '../types/hrms';

/**
 * Relation-not-found codes. PostgREST answers PGRST205 when the table is absent
 * from its schema cache; 42P01 is the raw Postgres code. Treat both as
 * "migration 002 has not been run yet".
 */
const MISSING_RELATION = new Set(['PGRST205', '42P01']);

export class MigrationPendingError extends Error {
  constructor(relation: string) {
    super(`"${relation}" is missing. Run db_schema/migrations/002_org_structure_and_leave.sql.`);
    this.name = 'MigrationPendingError';
  }
}

function wrap<T>(relation: string, result: { data: T | null; error: { code?: string; message: string } | null }): T {
  if (result.error) {
    if (result.error.code && MISSING_RELATION.has(result.error.code)) throw new MigrationPendingError(relation);
    throw new Error(`${relation}: ${result.error.message}`);
  }
  return (result.data ?? []) as T;
}

// ---------------------------------------------------------------------------
// Departments & designations — every reference is a uuid, never a label.
// ---------------------------------------------------------------------------

export async function listDepartments(): Promise<Department[]> {
  return wrap('departments', await supabase.from('departments').select('*').order('name'));
}

export async function listDepartmentSummary(): Promise<DepartmentSummary[]> {
  return wrap(
    'department_summary',
    await supabase.from('department_summary').select('*').order('headcount', { ascending: false })
  );
}

/** Designations for one department. The scoping is the point — never fetch all. */
export async function listDesignations(departmentId?: string): Promise<Designation[]> {
  let query = supabase.from('designations').select('*').eq('is_active', true);
  if (departmentId) query = query.eq('department_id', departmentId);
  return wrap('designations', await query.order('level').order('name'));
}

export async function createDepartment(input: { name: string; code?: string; description?: string }) {
  const { data, error } = await supabase.from('departments').insert(input).select().single();
  if (error) throw new Error(`departments: ${error.message}`);
  return data as Department;
}

export async function createDesignation(input: {
  department_id: string;
  name: string;
  code?: string;
  level?: number;
}) {
  const { data, error } = await supabase.from('designations').insert(input).select().single();
  if (error) throw new Error(`designations: ${error.message}`);
  return data as Designation;
}

// ---------------------------------------------------------------------------
// Leave
// ---------------------------------------------------------------------------

export async function listLeaveTypes(): Promise<LeaveType[]> {
  return wrap(
    'leave_types',
    await supabase.from('leave_types').select('*').eq('is_active', true).order('display_order')
  );
}

export async function listLeaveBalances(employeeId: string, year = new Date().getFullYear()): Promise<LeaveBalanceRow[]> {
  return wrap(
    'leave_balances',
    await supabase.from('leave_balances').select('*').eq('employee_id', employeeId).eq('year', year)
  );
}

/** Reads the joined view so one round trip returns render-ready rows. */
export async function listLeaveRequests(opts: { employeeId?: string; status?: string } = {}): Promise<LeaveRequest[]> {
  let query = supabase.from('leave_request_details').select('*');
  if (opts.employeeId) query = query.eq('employee_id', opts.employeeId);
  if (opts.status) query = query.eq('status', opts.status);
  return wrap('leave_request_details', await query.order('created_at', { ascending: false }));
}

export async function createLeaveRequest(input: LeaveRequestInput): Promise<LeaveRequest> {
  const { data, error } = await supabase.from('leave_requests').insert(input).select().single();
  if (error) throw new Error(`leave_requests: ${error.message}`);
  return data as LeaveRequest;
}

/**
 * Approving or rejecting records the decision trail the schema constraint
 * requires, and rolls the day count into the employee's balance.
 */
export async function decideLeaveRequest(
  requestId: string,
  decision: 'APPROVED' | 'REJECTED',
  approverId: string,
  rejectionReason?: string
): Promise<void> {
  const { data, error } = await supabase
    .from('leave_requests')
    .update({
      status: decision,
      approved_by: approverId,
      approved_on: new Date().toISOString(),
      rejection_reason: decision === 'REJECTED' ? (rejectionReason ?? null) : null,
    })
    .eq('id', requestId)
    .select('employee_id, leave_type_id, from_date, total_days')
    .single();

  if (error) throw new Error(`leave_requests: ${error.message}`);
  if (decision !== 'APPROVED' || !data) return;

  const year = new Date(data.from_date as string).getFullYear();
  const { data: balance } = await supabase
    .from('leave_balances')
    .select('id, taken_days')
    .eq('employee_id', data.employee_id)
    .eq('leave_type_id', data.leave_type_id)
    .eq('year', year)
    .maybeSingle();

  if (balance) {
    await supabase
      .from('leave_balances')
      .update({
        taken_days: Number(balance.taken_days) + Number(data.total_days),
        updated_at: new Date().toISOString(),
      })
      .eq('id', balance.id);
  }
}
