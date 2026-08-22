'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabase/client';
import { safeWrite } from '../supabase/write';
import { calculateSalaryBreakdown, type SalaryBreakdown } from '../utils/salaryCalculator';
import type { AttendanceRecord, Profile, Salary, UserRole, WagePeriod } from '../types/hrms';

const SESSION_KEY = 'hrms_active_user';

const FALLBACK_PROFILES: Profile[] = [
  {
    id: 'a1111111-1111-1111-1111-111111111111',
    login_id: 'OISAJE20260001',
    role: 'ADMIN',
    first_name: 'Sarah',
    last_name: 'Jenkins',
    email: 'sarah.jenkins@acme.com',
    phone: '+1 (555) 019-2834',
    department: 'Human Resources',
    job_position: 'VP of Human Resources',
    date_of_joining: '2022-03-15',
    is_active: true,
  },
  {
    id: 'e2222222-2222-2222-2222-222222222222',
    login_id: 'OIMACH20260003',
    role: 'EMPLOYEE',
    first_name: 'Marcus',
    last_name: 'Chen',
    email: 'marcus.chen@acme.com',
    phone: '+1 (555) 782-9301',
    department: 'Engineering',
    job_position: 'Senior Backend Engineer',
    date_of_joining: '2023-06-01',
    is_active: true,
  },
  {
    id: 'e3333333-3333-3333-3333-333333333333',
    login_id: 'OIALRI20260002',
    role: 'EMPLOYEE',
    first_name: 'Alex',
    last_name: 'Rivera',
    email: 'alex.rivera@acme.com',
    phone: '+1 (555) 392-1049',
    department: 'Product & Design',
    job_position: 'Lead UX/UI Designer',
    date_of_joining: '2023-01-10',
    is_active: true,
  },
];

/** Generated outside render so it never runs during a render pass. */
function generateTempPassword(): string {
  return `Welcome@${Math.floor(1000 + Math.random() * 9000)}`;
}

/** Six digits, generated fresh per request — never a fixed demo value. */
function generateOTP(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function generateLoginId(firstName: string, lastName: string, year = '2026', seq = 1): string {
  const f = (firstName || 'XX').slice(0, 2).toUpperCase();
  const l = (lastName || 'XX').slice(0, 2).toUpperCase();
  return `OI${f}${l}${year}${String(seq).padStart(4, '0')}`;
}

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

interface HRMSContextType {
  currentUser: Profile | null;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  switchUser: (userId: string) => void;
  logout: () => void;
  login: (loginIdOrEmail: string, pass: string) => Promise<boolean>;
  /**
   * Sends a one-time code for password reset. The live schema stores no
   * password hash and there is no email service wired up, so this cannot
   * actually deliver mail — it returns the code for the caller to display,
   * the same way a "magic code shown on screen" demo works with no backend.
   */
  sendPasswordResetOTP: (loginIdOrEmail: string) => { success: boolean; otp?: string; message: string };
  /** Verifies the code the caller already checked and clears must_change_password. */
  resetPasswordWithOTP: (loginIdOrEmail: string) => Promise<{ success: boolean; message: string }>;

  employees: Profile[];
  salaries: Record<string, Salary>;
  attendanceLogs: AttendanceRecord[];

  isPunchedIn: boolean;
  punchInTime: Date | null;
  elapsedSeconds: number;
  handlePunchToggle: (notes?: string) => void;

  addEmployee: (
    emp: Omit<Profile, 'id' | 'created_at' | 'login_id'> & { initialSalary?: number }
  ) => { profile: Profile; tempPass: string };
  updateProfile: (profile: Partial<Profile> & { id: string }) => void;
  setEmployeeActive: (userId: string, isActive: boolean) => Promise<boolean>;

  updateSalary: (userId: string, fixedWage: number, period?: WagePeriod) => void;
  getSalaryBreakdown: (userId: string) => SalaryBreakdown;

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
  // Employee ids with an approved leave_requests row covering today.
  const [onLeaveToday, setOnLeaveToday] = useState<Set<string>>(new Set());
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
      const today = todayISO();
      const [profileRes, salaryRes, attendanceRes, leaveRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('salaries').select('*'),
        supabase.from('attendance').select('*').order('date', { ascending: false }),
        // leave_requests supersedes time_off (see migration 002). A missing
        // relation just means that migration has not run yet — degrade quietly.
        supabase
          .from('leave_requests')
          .select('employee_id')
          .eq('status', 'APPROVED')
          .lte('from_date', today)
          .gte('to_date', today),
      ]);

      const firstError = profileRes.error || salaryRes.error || attendanceRes.error;
      if (firstError) throw firstError;

      const people = (profileRes.data ?? []) as Profile[];
      setEmployees((prev) => {
        const merged = [...people];
        for (const emp of prev) {
          if (!merged.some((p) => p.id === emp.id || (p.email && p.email.toLowerCase() === emp.email.toLowerCase()))) {
            merged.push(emp);
          }
        }
        return merged;
      });

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

      setOnLeaveToday(
        leaveRes.error ? new Set() : new Set((leaveRes.data ?? []).map((r) => r.employee_id as string))
      );

      // Restore the signed-in profile across reloads. Also re-runs after every
      // write, so a session for a user deactivated mid-session is dropped here.
      const savedId = typeof window !== 'undefined' ? window.localStorage.getItem(SESSION_KEY) : null;
      if (savedId) {
        const match = people.find((p) => p.id === savedId);
        if (match && match.is_active !== false) {
          setCurrentUser(match);
        } else if (match) {
          setCurrentUser(null);
          window.localStorage.removeItem(SESSION_KEY);
        }
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

  const findByLoginOrEmail = useCallback(
    (loginIdOrEmail: string): Profile | undefined => {
      const needle = loginIdOrEmail.trim().toLowerCase();
      if (!needle) return undefined;
      return employees.find(
        (e) => e.login_id.toLowerCase() === needle || (e.email && e.email.toLowerCase() === needle)
      );
    },
    [employees]
  );

  /**
   * Authenticates against the `profiles` table.
   *
   * The live schema stores no password hash and the project has no auth.users
   * rows linked to profiles, so a credential cannot be verified here. Wiring
   * Supabase Auth (and linking profiles.id to auth.users.id) is the next step
   * before this is exposed outside development.
   */
  const login = useCallback(async (loginIdOrEmail: string, _password: string): Promise<boolean> => {
    void _password;
    const needle = loginIdOrEmail.trim();
    if (!needle) return false;
    const lower = needle.toLowerCase();

    // 1. Try finding in loaded employees array
    let profile = findByLoginOrEmail(lower);

    // 2. Try Supabase query case-insensitively
    if (!profile) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .or(`login_id.ilike.${lower},email.ilike.${lower}`)
          .limit(1);

        if (!error && data && data.length > 0) {
          profile = data[0] as Profile;
        }
      } catch (err) {
        console.error('[supabase] login lookup failed:', err);
      }
    }

    // 3. Fallback match against seed profiles
    if (!profile) {
      profile = FALLBACK_PROFILES.find(
        (p) =>
          p.login_id.toLowerCase() === lower ||
          p.email.toLowerCase() === lower ||
          `${p.first_name}.${p.last_name}`.toLowerCase() === lower
      );
    }

    if (!profile) return false;
    if (profile.is_active === false) return false;

    setCurrentUser(profile);
    window.localStorage.setItem(SESSION_KEY, profile.id);
    document.cookie = `hrms_session=${profile.id}; path=/; max-age=86400`;
    document.cookie = `hrms_user_role=${profile.role}; path=/; max-age=86400`;
    return true;
  }, [findByLoginOrEmail]);

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

  /**
   * Demo password-reset flow. There is nowhere to send real mail and no
   * password hash to check, so this only ever gates on possession of a valid
   * login ID or email — it is not a security boundary, only a UX flow that
   * clears must_change_password on a genuine account.
   */
  const sendPasswordResetOTP = useCallback(
    (loginIdOrEmail: string) => {
      const found = findByLoginOrEmail(loginIdOrEmail);
      if (!found) {
        return { success: false, message: 'No employee account found with that login ID or email.' };
      }
      const otp = generateOTP();
      return {
        success: true,
        otp,
        message: `No email service is configured, so the code is shown here instead of being sent: ${otp}`,
      };
    },
    [findByLoginOrEmail]
  );

  const resetPasswordWithOTP = useCallback(
    async (loginIdOrEmail: string): Promise<{ success: boolean; message: string }> => {
      const found = findByLoginOrEmail(loginIdOrEmail);
      if (!found) {
        return { success: false, message: 'No account found matching those credentials.' };
      }
      if (found.is_active === false) {
        return { success: false, message: 'This account has been deactivated.' };
      }

      const result = await safeWrite(
        'profiles',
        'update',
        { must_change_password: false },
        { column: 'id', value: found.id }
      );
      if (!result.ok) {
        return { success: false, message: 'Could not update the account — please try again.' };
      }

      setEmployees((prev) => prev.map((e) => (e.id === found.id ? { ...e, must_change_password: false } : e)));
      setCurrentUser({ ...found, must_change_password: false });
      window.localStorage.setItem(SESSION_KEY, found.id);
      document.cookie = `hrms_session=${found.id}; path=/; max-age=86400`;
      document.cookie = `hrms_user_role=${found.role}; path=/; max-age=86400`;

      return { success: true, message: 'Verified — you are now signed in.' };
    },
    [findByLoginOrEmail]
  );

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
        must_change_password: true,
        created_at: new Date().toISOString(),
      };

      setEmployees((prev) => [profile, ...prev]);
      updateSalary(newId, empData.initialSalary || 75000);

      void fetch('/api/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newId,
          login_id: loginId,
          role: profile.role,
          first_name: profile.first_name,
          last_name: profile.last_name,
          email: profile.email,
          phone: profile.phone,
          department: profile.department,
          job_position: profile.job_position,
          department_id: profile.department_id,
          designation_id: profile.designation_id,
          avatar_url: profile.avatar_url,
          initialSalary: empData.initialSalary || 75000,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data?.success && data?.profile) {
            setEmployees((prev) =>
              prev.map((e) =>
                e.id === newId || (e.email && e.email.toLowerCase() === profile.email.toLowerCase())
                  ? { ...e, ...data.profile }
                  : e
              )
            );
          }
        })
        .catch((err) => {
          console.error('[admin] /api/users/create failed:', err);
        });

      return { profile, tempPass };
    },
    [employees.length, updateSalary]
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

  /**
   * Toggles an employee between active and inactive. A deactivated employee
   * can no longer sign in (see login() above). Returns false — and reverts
   * the optimistic update — if migration 003 has not added the is_active
   * column yet, so the UI never shows a status that did not actually persist.
   */
  const setEmployeeActive = useCallback(
    async (userId: string, isActive: boolean): Promise<boolean> => {
      const previous = employees.find((e) => e.id === userId)?.is_active;
      setEmployees((prev) => prev.map((e) => (e.id === userId ? { ...e, is_active: isActive } : e)));

      const result = await safeWrite('profiles', 'update', { is_active: isActive }, { column: 'id', value: userId });
      const persisted = result.ok && !result.droppedColumns.includes('is_active');

      if (!persisted) {
        setEmployees((prev) => prev.map((e) => (e.id === userId ? { ...e, is_active: previous } : e)));
        return false;
      }
      await refresh();
      return true;
    },
    [employees, refresh]
  );

  const getSalaryBreakdown = useCallback(
    (userId: string): SalaryBreakdown =>
      calculateSalaryBreakdown(salaries[userId]?.fixed_wage ?? 0, 'MONTHLY'),
    [salaries]
  );

  const getUserLiveStatus = useCallback(
    (userId: string): 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LEAVE' => {
      if (onLeaveToday.has(userId)) return 'LEAVE';

      const today = todayISO();
      const row = attendanceLogs.find((a) => a.user_id === userId && a.date === today);
      if (row) return row.status === 'LEAVE' ? 'LEAVE' : row.status === 'HALF_DAY' ? 'HALF_DAY' : 'PRESENT';
      return 'ABSENT';
    },
    [onLeaveToday, attendanceLogs]
  );

  const value = useMemo<HRMSContextType>(
    () => ({
      currentUser,
      currentRole,
      setCurrentRole,
      switchUser,
      logout,
      login,
      sendPasswordResetOTP,
      resetPasswordWithOTP,
      employees,
      salaries,
      attendanceLogs,
      isPunchedIn,
      punchInTime,
      elapsedSeconds,
      handlePunchToggle,
      addEmployee,
      updateProfile,
      setEmployeeActive,
      updateSalary,
      getSalaryBreakdown,
      getUserLiveStatus,
      isLoading,
      loadError,
      refresh,
    }),
    [
      currentUser, currentRole, setCurrentRole, switchUser, logout, login, sendPasswordResetOTP, resetPasswordWithOTP,
      employees, salaries, attendanceLogs, isPunchedIn, punchInTime, elapsedSeconds, handlePunchToggle,
      addEmployee, updateProfile, setEmployeeActive, updateSalary, getSalaryBreakdown, getUserLiveStatus, isLoading, loadError, refresh,
    ]
  );

  return <HRMSContext.Provider value={value}>{children}</HRMSContext.Provider>;
};

export const useHRMS = () => {
  const context = useContext(HRMSContext);
  if (!context) throw new Error('useHRMS must be used within an HRMSProvider');
  return context;
};
