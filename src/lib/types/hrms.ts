export type UserRole = 'ADMIN' | 'EMPLOYEE';
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LEAVE';
/** Legacy enum on the flat time_off table. Superseded by LeaveType rows. */
export type LeaveTypeCode = 'PAID' | 'SICK' | 'UNPAID';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type WagePeriod = 'MONTHLY' | 'YEARLY';

export interface Profile {
  id: string;
  login_id: string; // OIFILASTYYYYSEQ (e.g. OISAJE20260001)
  role: UserRole;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  department: string;
  job_position?: string;
  date_of_joining?: string;
  manager_id?: string | null;
  manager_name?: string;
  /** uuid references from migration 002 — authoritative over the text columns. */
  department_id?: string | null;
  designation_id?: string | null;
  avatar_url?: string | null;
  
  // Tab 1: Resume / Bio
  about?: string;
  what_i_love_about_job?: string;
  hobbies?: string[];
  skills?: string[];
  certifications?: string[];
  
  // Tab 2: Private Info & Statutory ID
  address?: string;
  personal_email?: string;
  nationality?: string;
  gender?: string;
  date_of_birth?: string;
  marital_status?: string;
  pan_number?: string;
  uan_number?: string;

  // Banking
  bank_name?: string;
  bank_account_number?: string;
  bank_ifsc?: string;
  
  created_at?: string;
  updated_at?: string;
}

export interface Salary {
  id?: string;
  user_id: string;
  wage_period?: WagePeriod;
  fixed_wage: number; // Monthly wage
  basic_salary: number;
  hra: number;
  standard_allowance: number;
  performance_bonus: number;
  lta: number;
  fixed_allowance: number;
  pf: number;
  tax: number;
  net_salary?: number;
  updated_at?: string;
}

export interface AttendanceRecord {
  id: string;
  user_id: string;
  employee_name?: string;
  department?: string;
  date: string; // YYYY-MM-DD
  check_in: string; // ISO string
  check_out?: string | null; // ISO string
  status: AttendanceStatus;
  notes?: string;
  work_hours?: number;
  break_time_mins?: number;
}

export interface TimeOffRecord {
  id: string;
  user_id: string;
  employee_name?: string;
  department?: string;
  type: LeaveTypeCode;
  start_date: string;
  end_date: string;
  days_count: number;
  reason?: string;
  document_url?: string | null;
  status: LeaveStatus;
  admin_comment?: string | null;
  created_at: string;
}

export interface LeaveBalance {
  paid_days: number; // 24 days per Excalidraw / Dayflow
  paid_used: number;
  sick_days: number; // 7 days per Excalidraw / Dayflow
  sick_used: number;
  unpaid_used: number;
}

// ---------------------------------------------------------------------------
// Organisation structure (migration 002)
// ---------------------------------------------------------------------------

export interface Department {
  id: string;
  name: string;
  code?: string | null;
  description?: string | null;
  head_id?: string | null;
  is_active: boolean;
  created_at?: string;
}

export interface Designation {
  id: string;
  department_id: string;
  name: string;
  code?: string | null;
  level: number;
  description?: string | null;
  is_active: boolean;
  created_at?: string;
}

export interface DepartmentSummary {
  id: string;
  name: string;
  code?: string | null;
  is_active: boolean;
  head_id?: string | null;
  head_name?: string | null;
  headcount: number;
  admin_count: number;
  designation_count: number;
}

// ---------------------------------------------------------------------------
// Leave (migration 002)
// ---------------------------------------------------------------------------

export interface LeaveType {
  id: string;
  name: string;
  code: string;
  days_allowed_per_year: number;
  is_paid: boolean;
  requires_document: boolean;
  min_notice_days: number;
  max_consecutive_days: number;
  can_carry_forward: boolean;
  max_carry_forward: number;
  color_hex: string;
  is_active: boolean;
  display_order: number;
}

export interface LeaveBalanceRow {
  id: string;
  employee_id: string;
  leave_type_id: string;
  year: number;
  allocated_days: number;
  taken_days: number;
  carried_forward: number;
  adjusted_days: number;
  balance: number;
}

export interface LeaveRequest {
  id: string;
  employee_id: string;
  employee_name?: string;
  department_name?: string | null;
  leave_type_id: string;
  leave_type_name?: string;
  leave_type_code?: string;
  leave_type_color?: string;
  is_paid?: boolean;
  from_date: string;
  to_date: string;
  is_half_day: boolean;
  total_days: number;
  reason: string;
  status: LeaveStatus;
  document_url?: string | null;
  applied_on?: string;
  approved_by?: string | null;
  approved_by_name?: string | null;
  approved_on?: string | null;
  rejection_reason?: string | null;
  created_at?: string;
}

/** Payload for creating a leave request — every reference is an id. */
export interface LeaveRequestInput {
  employee_id: string;
  leave_type_id: string;
  from_date: string;
  to_date: string;
  is_half_day: boolean;
  total_days: number;
  reason: string;
  document_url?: string | null;
}
