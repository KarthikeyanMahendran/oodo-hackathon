'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabase/client';
import { safeWrite } from '../supabase/write';
import { calculateSalaryBreakdown, type SalaryBreakdown } from '../utils/salaryCalculator';
import type {
  AttendanceRecord,
  LeaveBalance,
  Profile,
  Salary,
  TimeOffRecord,
  UserRole,
  WagePeriod,
} from '../types/hrms';

const SESSION_KEY = 'hrms_active_user';
const PAID_ENTITLEMENT = 24;
const SICK_ENTITLEMENT = 7;

/** Generated outside render so it never runs during a render pass. */
function generateTempPassword(): string {
  return `Welcome@${Math.floor(1000 + Math.random() * 9000)}`;
}

export function generateLoginId(firstName: string, lastName: string, year = '2026', seq = 1): string {
  const f = (firstName || 'XX').slice(0, 2).toUpperCase();
  const l = (lastName || 'XX').slice(0, 2).toUpperCase();
  return `OI${f}${l}${year}${String(seq).padStart(4, '0')}`;
}

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

function inclusiveDays(start: string, end: string): number {
  const a = new Date(start).getTime();
  const b = new Date(end).getTime();
  if (Number.isNaN(a) || Number.isNaN(b) || b < a) return 0;
  return Math.floor((b - a) / 86400000) + 1;
}

/** Rows come back without the joined display fields the UI needs. */
function decorateTimeOff(row: TimeOffRecord, people: Profile[]): TimeOffRecord {
  const p = people.find((e) => e.id === row.user_id);
  return {
    ...row,
    employee_name: p ? `${p.first_name} ${p.last_name}`.trim() : 'Unknown',
    department: p?.department ?? '—',
    days_count: row.days_count ?? inclusiveDays(row.start_date, row.end_date),
  };
}

interface HRMSContextType {
  currentUser: Profile | null;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  switchUser: (userId: string) => void;
  logout: () => void;
  login: (loginIdOrEmail: string, pass: string) => Promise<boolean>;

  employees: Profile[];
  salaries: Record<string, Salary>;
  attendanceLogs: AttendanceRecord[];
  timeOffRequests: TimeOffRecord[];

  isPunchedIn: boolean;
  punchInTime: Date | null;
  elapsedSeconds: number;
  handlePunchToggle: (notes?: string) => void;

  addEmployee: (
    emp: Omit<Profile, 'id' | 'created_at' | 'login_id'> & { initialSalary?: number }
  ) => { profile: Profile; tempPass: string };
  updateProfile: (profile: Partial<Profile> & { id: string }) => void;

  updateSalary: (userId: string, fixedWage: number, period?: WagePeriod) => void;
  getSalaryBreakdown: (userId: string) => SalaryBreakdown;

  applyForTimeOff: (
    req: Omit<TimeOffRecord, 'id' | 'created_at' | 'status' | 'employee_name' | 'department'>
  ) => void;
  handleTimeOffAction: (id: string, status: 'APPROVED' | 'REJECTED', comment?: string) => void;
  getUserLeaveBalance: (userId: string) => LeaveBalance;

  getUserLiveStatus: (userId: string) => 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LEAVE';

  isLoading: boolean;
  loadError: string | null;
  refresh: () => Promise<void>;
}

const HRMSContext = createContext<HRMSContextType | undefined>(undefined);

export const HRMSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [salaries, setSalaries] = useState<Record<string, Salary>>({});
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceRecord[]>([]);
  const [timeOffRequests, setTimeOffRequests] = useState<TimeOffRecord[]>([]);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  // Optimistic override so a punch feels instant before the refetch lands.
  const [pendingPunch, setPendingPunch] = useState<{ date: string; checkIn: string | null } | null>(null);

  const currentRole: UserRole = currentUser?.role ?? 'EMPLOYEE';

  /** Loads every table the app reads. Supabase is the only source of truth. */
  const refresh = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [profileRes, salaryRes, attendanceRes, timeOffRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('salaries').select('*'),
        supabase.from('attendance').select('*').order('date', { ascending: false }),
        supabase.from('time_off').select('*').order('created_at', { ascending: false }),
      ]);

      const firstError =
        profileRes.error || salaryRes.error || attendanceRes.error || timeOffRes.error;
      if (firstError) throw firstError;

      const people = (profileRes.data ?? []) as Profile[];
      setEmployees(people);

      const salaryMap: Record<string, Salary> = {};
      for (const row of (salaryRes.data ?? []) as Salary[]) salaryMap[row.user_id] = row;
      setSalaries(salaryMap);

      setAttendanceLogs(
        ((attendanceRes.data ?? []) as AttendanceRecord[]).map((a) => {
          const p = people.find((e) => e.id === a.user_id);
          return {
            ...a,
            employee_name: p ? `${p.first_name} ${p.last_name}`.trim() : 'Unknown',
            department: p?.department ?? '—',
          };
        })
      );

      setTimeOffRequests(
        ((timeOffRes.data ?? []) as TimeOffRecord[]).map((r) => decorateTimeOff(r, people))
      );

      // Restore the signed-in profile across reloads.
      const savedId = typeof window !== 'undefined' ? window.localStorage.getItem(SESSION_KEY) : null;
      if (savedId) {
        const match = people.find((p) => p.id === savedId);
        if (match) setCurrentUser(match);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not reach Supabase.';
      console.error('[supabase] initial load failed:', message);
      setLoadError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    // Deferred so the first setState lands after the effect body, not during it.
    void (async () => {
      await Promise.resolve();
      if (!cancelled) await refresh();
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  // Punch state is derived from today's attendance row, not stored separately.
  const punchInTime = useMemo<Date | null>(() => {
    const date = todayISO();
    if (pendingPunch?.date === date) {
      return pendingPunch.checkIn ? new Date(pendingPunch.checkIn) : null;
    }
    if (!currentUser) return null;
    const row = attendanceLogs.find((a) => a.user_id === currentUser.id && a.date === date);
    return row?.check_in && !row.check_out ? new Date(row.check_in) : null;
  }, [currentUser, attendanceLogs, pendingPunch]);

  const isPunchedIn = punchInTime !== null;

  useEffect(() => {
    if (!isPunchedIn || !punchInTime) return;
    const tick = () => {
      const diff = Math.floor((Date.now() - punchInTime.getTime()) / 1000);
      setElapsedSeconds(diff > 0 ? diff : 0);
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [isPunchedIn, punchInTime]);

  /**
   * Authenticates against the `profiles` table.
   *
   * The live schema stores no password hash and the project has no auth.users
   * rows, so a credential cannot be verified here. Wiring Supabase Auth (and
   * linking profiles.id to auth.users.id) is the next step before this is
   * exposed outside development.
   */
  const login = useCallback(async (loginIdOrEmail: string, _password: string): Promise<boolean> => {
    void _password;
    const needle = loginIdOrEmail.trim();
    if (!needle) return false;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .or(`login_id.eq.${needle},email.eq.${needle}`)
      .limit(1);

    if (error) {
      console.error('[supabase] login lookup failed:', error.message);
      return false;
    }
    const profile = (data?.[0] as Profile | undefined) ?? undefined;
    if (!profile) return false;

    setCurrentUser(profile);
    window.localStorage.setItem(SESSION_KEY, profile.id);
    document.cookie = `hrms_session=${profile.id}; path=/; max-age=86400`;
    document.cookie = `hrms_user_role=${profile.role}; path=/; max-age=86400`;
    return true;
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    window.localStorage.removeItem(SESSION_KEY);
    document.cookie = 'hrms_session=; path=/; max-age=0';
    document.cookie = 'hrms_user_role=; path=/; max-age=0';
  }, []);

  const switchUser = useCallback(
    (userId: string) => {
      const match = employees.find((e) => e.id === userId);
      if (!match) return;
      setCurrentUser(match);
      window.localStorage.setItem(SESSION_KEY, match.id);
    },
    [employees]
  );

  const setCurrentRole = useCallback((role: UserRole) => {
    setCurrentUser((prev) => (prev ? { ...prev, role } : prev));
  }, []);

  const handlePunchToggle = useCallback(
    (notes?: string) => {
      if (!currentUser) return;
      const now = new Date();
      const date = todayISO();

      if (!isPunchedIn) {
        setPendingPunch({ date, checkIn: now.toISOString() });
        setAttendanceLogs((prev) => [
          {
            id: `local-${date}-${currentUser.id}`,
            user_id: currentUser.id,
            employee_name: `${currentUser.first_name} ${currentUser.last_name}`.trim(),
            department: currentUser.department,
            date,
            check_in: now.toISOString(),
            check_out: null,
            status: 'PRESENT',
            notes,
          },
          ...prev.filter((l) => !(l.user_id === currentUser.id && l.date === date)),
        ]);

        void safeWrite('attendance', 'upsert', {
          user_id: currentUser.id,
          date,
          check_in: now.toISOString(),
          status: 'PRESENT',
          notes,
        }).then(() => refresh());
      } else {
        setPendingPunch({ date, checkIn: null });
        setElapsedSeconds(0);
        setAttendanceLogs((prev) =>
          prev.map((log) =>
            log.user_id === currentUser.id && log.date === date
              ? { ...log, check_out: now.toISOString(), work_hours: Math.round((elapsedSeconds / 3600) * 10) / 10 }
              : log
          )
        );

        void (async () => {
          const { error } = await supabase
            .from('attendance')
            .update({ check_out: now.toISOString() })
            .eq('user_id', currentUser.id)
            .eq('date', date);
          if (error) console.error('[supabase] check-out failed:', error.message);
          await refresh();
        })();
      }
    },
    [currentUser, isPunchedIn, elapsedSeconds, refresh]
  );

  const updateSalary = useCallback(
    (userId: string, fixedWage: number, period: WagePeriod = 'MONTHLY') => {
      const b = calculateSalaryBreakdown(fixedWage, period);
      const row: Salary = {
        user_id: userId,
        fixed_wage: b.monthly_wage,
        basic_salary: b.basic_salary,
        hra: b.hra,
        standard_allowance: b.standard_allowance,
        performance_bonus: b.performance_bonus,
        lta: b.lta,
        fixed_allowance: b.fixed_allowance,
        pf: b.pf,
        tax: b.tax,
      };
      setSalaries((prev) => ({ ...prev, [userId]: row }));

      // Only the columns the live schema actually stores.
      void safeWrite('salaries', 'upsert', {
        user_id: userId,
        fixed_wage: row.fixed_wage,
        basic_salary: row.basic_salary,
        hra: row.hra,
        standard_allowance: row.standard_allowance,
        pf: row.pf,
        tax: row.tax,
      });
    },
    []
  );

  const addEmployee = useCallback(
    (empData: Omit<Profile, 'id' | 'created_at' | 'login_id'> & { initialSalary?: number }) => {
      const newId = crypto.randomUUID();
      const seq = employees.length + 1;
      const loginId = generateLoginId(empData.first_name, empData.last_name, '2026', seq);
      const tempPass = generateTempPassword();

      const profile: Profile = {
        ...empData,
        id: newId,
        login_id: loginId,
        created_at: new Date().toISOString(),
      };

      setEmployees((prev) => [profile, ...prev]);
      updateSalary(newId, empData.initialSalary || 75000);

      void safeWrite('profiles', 'insert', {
        id: newId,
        login_id: loginId,
        role: profile.role,
        first_name: profile.first_name,
        last_name: profile.last_name,
        email: profile.email,
        phone: profile.phone,
        department: profile.department,
        job_position: profile.job_position,
        avatar_url: profile.avatar_url,
      }).then(() => refresh());

      return { profile, tempPass };
    },
    [employees.length, updateSalary, refresh]
  );

  const updateProfile = useCallback(
    (updated: Partial<Profile> & { id: string }) => {
      setEmployees((prev) => prev.map((e) => (e.id === updated.id ? { ...e, ...updated } : e)));
      if (currentUser?.id === updated.id) {
        setCurrentUser((prev) => (prev ? { ...prev, ...updated } : prev));
      }
      const { id, ...changes } = updated;
      void safeWrite('profiles', 'update', changes, { column: 'id', value: id });
    },
    [currentUser?.id]
  );

  const getSalaryBreakdown = useCallback(
    (userId: string): SalaryBreakdown =>
      calculateSalaryBreakdown(salaries[userId]?.fixed_wage ?? 0, 'MONTHLY'),
    [salaries]
  );

  const applyForTimeOff = useCallback(
    (req: Omit<TimeOffRecord, 'id' | 'created_at' | 'status' | 'employee_name' | 'department'>) => {
      const optimistic: TimeOffRecord = {
        ...req,
        id: `local-${Date.now()}`,
        status: 'PENDING',
        created_at: new Date().toISOString(),
      };
      setTimeOffRequests((prev) => [decorateTimeOff(optimistic, employees), ...prev]);

      void safeWrite('time_off', 'insert', {
        user_id: req.user_id,
        type: req.type,
        start_date: req.start_date,
        end_date: req.end_date,
        reason: req.reason,
        document_url: req.document_url,
        status: 'PENDING',
      }).then(() => refresh());
    },
    [employees, refresh]
  );

  const handleTimeOffAction = useCallback(
    (id: string, status: 'APPROVED' | 'REJECTED', comment?: string) => {
      setTimeOffRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status, admin_comment: comment || null } : r))
      );
      void safeWrite('time_off', 'update', { status, admin_comment: comment || null }, { column: 'id', value: id })
        .then(() => refresh());
    },
    [refresh]
  );

  const getUserLeaveBalance = useCallback(
    (userId: string): LeaveBalance => {
      const approved = timeOffRequests.filter((r) => r.user_id === userId && r.status === 'APPROVED');
      const used = (type: string) =>
        approved
          .filter((r) => r.type === type)
          .reduce((n, r) => n + (r.days_count || inclusiveDays(r.start_date, r.end_date)), 0);

      return {
        paid_days: PAID_ENTITLEMENT,
        paid_used: used('PAID'),
        sick_days: SICK_ENTITLEMENT,
        sick_used: used('SICK'),
        unpaid_used: used('UNPAID'),
      };
    },
    [timeOffRequests]
  );

  const getUserLiveStatus = useCallback(
    (userId: string): 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LEAVE' => {
      const today = todayISO();
      const onLeave = timeOffRequests.some(
        (r) => r.user_id === userId && r.status === 'APPROVED' && r.start_date <= today && r.end_date >= today
      );
      if (onLeave) return 'LEAVE';

      const row = attendanceLogs.find((a) => a.user_id === userId && a.date === today);
      if (row) return row.status === 'LEAVE' ? 'LEAVE' : row.status === 'HALF_DAY' ? 'HALF_DAY' : 'PRESENT';
      return 'ABSENT';
    },
    [timeOffRequests, attendanceLogs]
  );

  const value = useMemo<HRMSContextType>(
    () => ({
      currentUser,
      currentRole,
      setCurrentRole,
      switchUser,
      logout,
      login,
      employees,
      salaries,
      attendanceLogs,
      timeOffRequests,
      isPunchedIn,
      punchInTime,
      elapsedSeconds,
      handlePunchToggle,
      addEmployee,
      updateProfile,
      updateSalary,
      getSalaryBreakdown,
      applyForTimeOff,
      handleTimeOffAction,
      getUserLeaveBalance,
      getUserLiveStatus,
      isLoading,
      loadError,
      refresh,
    }),
    [
      currentUser, currentRole, setCurrentRole, switchUser, logout, login, employees, salaries,
      attendanceLogs, timeOffRequests, isPunchedIn, punchInTime, elapsedSeconds, handlePunchToggle,
      addEmployee, updateProfile, updateSalary, getSalaryBreakdown, applyForTimeOff,
      handleTimeOffAction, getUserLeaveBalance, getUserLiveStatus, isLoading, loadError, refresh,
    ]
  );

  return <HRMSContext.Provider value={value}>{children}</HRMSContext.Provider>;
};

export const useHRMS = () => {
  const context = useContext(HRMSContext);
  if (!context) throw new Error('useHRMS must be used within an HRMSProvider');
  return context;
};
