export type UserRole = 'ADMIN' | 'EMPLOYEE';
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LEAVE';
export type LeaveType = 'PAID' | 'SICK' | 'UNPAID';
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
  marital_status?: string; // not persisted — see db_schema/migrations/001
  pan_number?: string;     // not persisted — see db_schema/migrations/001
  uan_number?: string;     // not persisted — see db_schema/migrations/001

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
  type: LeaveType;
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
