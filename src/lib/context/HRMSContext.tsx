'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabase/client';
import { safeWrite } from '../supabase/write';
import { calculateSalaryBreakdown, type SalaryBreakdown } from '../utils/salaryCalculator';
import type { AttendanceRecord, Profile, Salary, TimeOffRecord, LeaveBalance, UserRole, WagePeriod } from '../types/hrms';

const SESSION_KEY = 'hrms_active_user';

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

interface HRMSContextType {
  currentUser: Profile | null;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  switchUser: (userId: string) => void;
  logout: () => void;
  login: (loginIdOrEmail: string, pass: string) => Promise<boolean> | boolean;
  changePassword: (userId: string, oldPass: string, newPass: string) => { success: boolean; message: string };
  sendPasswordResetOTP: (loginIdOrEmail: string) => { success: boolean; otp?: string; message: string };
  resetPasswordWithOTP: (loginIdOrEmail: string, newPass: string) => { success: boolean; message: string };

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

  applyForTimeOff: (req: Omit<TimeOffRecord, 'id' | 'created_at' | 'status' | 'employee_name' | 'department'>) => void;
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
  const [onLeaveToday, setOnLeaveToday] = useState<Set<string>>(new Set());
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [currentRoleState, setCurrentRoleState] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [pendingPunch, setPendingPunch] = useState<{ date: string; checkIn: string | null } | null>(null);

  const currentRole: UserRole = currentRoleState ?? currentUser?.role ?? 'EMPLOYEE';
  const setCurrentRole = (role: UserRole) => setCurrentRoleState(role);

  // User Passwords Map
  const [userPasswords, setUserPasswords] = useState<Record<string, string>>({
    'admin-001': 'pass123',
    'emp-001': 'pass123',
    'emp-002': 'pass123',
  });

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const today = todayISO();
      const [profileRes, salaryRes, attendanceRes, leaveRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('salaries').select('*'),
        supabase.from('attendance').select('*').order('date', { ascending: false }),
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

      setOnLeaveToday(
        leaveRes.error ? new Set() : new Set((leaveRes.data ?? []).map((r) => r.employee_id as string))
      );

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
    void (async () => {
      await Promise.resolve();
      if (!cancelled) await refresh();
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

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

  const login = useCallback(async (loginIdOrEmail: string, pass: string): Promise<boolean> => {
    const needle = loginIdOrEmail.trim().toLowerCase();
    if (!needle) return false;

    const profile = employees.find(
      (e) => e.login_id.toLowerCase() === needle || (e.email && e.email.toLowerCase() === needle)
    );

    if (profile) {
      setCurrentUser(profile);
      window.localStorage.setItem(SESSION_KEY, profile.id);
      document.cookie = `hrms_session=${profile.id}; path=/; max-age=86400`;
      document.cookie = `hrms_user_role=${profile.role}; path=/; max-age=86400`;
      return true;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .or(`login_id.eq.${needle},email.eq.${needle}`)
      .limit(1);

    if (!error && data && data[0]) {
      const p = data[0] as Profile;
      setCurrentUser(p);
      window.localStorage.setItem(SESSION_KEY, p.id);
      document.cookie = `hrms_session=${p.id}; path=/; max-age=86400`;
      document.cookie = `hrms_user_role=${p.role}; path=/; max-age=86400`;
      return true;
    }

    return false;
  }, [employees]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    window.localStorage.removeItem(SESSION_KEY);
    document.cookie = 'hrms_session=; path=/; max-age=0';
    document.cookie = 'hrms_user_role=; path=/; max-age=0';
  }, []);

  const changePassword = (userId: string, oldPass: string, newPass: string) => {
    const currentPass = userPasswords[userId] || 'pass123';
    if (oldPass !== currentPass && oldPass !== 'pass123') {
      return { success: false, message: 'Current password entered is incorrect.' };
    }
    if (!newPass || newPass.trim().length < 6) {
      return { success: false, message: 'New password must be at least 6 characters.' };
    }
    setUserPasswords((prev) => ({ ...prev, [userId]: newPass }));
    setEmployees((prev) =>
      prev.map((emp) => (emp.id === userId ? { ...emp, must_change_password: false } : emp))
    );
    if (currentUser?.id === userId) {
      setCurrentUser((prev) => (prev ? { ...prev, must_change_password: false } : null));
    }
    (async () => {
      try {
        await supabase.from('profiles').update({ must_change_password: false }).eq('id', userId);
      } catch (err) {
        console.error(err);
      }
    })();
    return { success: true, message: 'Password updated successfully!' };
  };

  const sendPasswordResetOTP = (loginIdOrEmail: string) => {
    const query = loginIdOrEmail.trim().toLowerCase();
    const found = employees.find(
      (e) => e.login_id.toLowerCase() === query || (e.email && e.email.toLowerCase() === query)
    );
    if (!found) {
      return { success: false, message: 'No employee account found with that Login ID or Email.' };
    }

    const mockOtp = '849201';
    return {
      success: true,
      otp: mockOtp,
      message: `OTP Code sent to ${found.email}. (Demo Code: ${mockOtp})`,
    };
  };

  const resetPasswordWithOTP = (loginIdOrEmail: string, newPass: string) => {
    const query = loginIdOrEmail.trim().toLowerCase();
    const found = employees.find(
      (e) => e.login_id.toLowerCase() === query || (e.email && e.email.toLowerCase() === query)
    );

    if (!found) {
      return { success: false, message: 'No account found matching credentials.' };
    }

    if (!newPass || newPass.trim().length < 6) {
      return { success: false, message: 'New password must be at least 6 characters.' };
    }

    setUserPasswords((prev) => ({ ...prev, [found.id]: newPass }));
    setEmployees((prev) =>
      prev.map((emp) => (emp.id === found.id ? { ...emp, must_change_password: false } : emp))
    );
    const updatedUser = { ...found, must_change_password: false };
    setCurrentUser(updatedUser);
    setCurrentRoleState(found.role);
    document.cookie = `hrms_session=active; path=/`;
    document.cookie = `hrms_user_role=${found.role}; path=/`;

    (async () => {
      try {
        await supabase.from('profiles').update({ must_change_password: false }).eq('id', found.id);
      } catch (err) {
        console.error(err);
      }
    })();

    return { success: true, message: 'Password reset successfully! You are now logged in.' };
  };

  const switchUser = (userId: string) => {
    const target = employees.find((e) => e.id === userId);
    if (target) {
      setCurrentUser(target);
      setCurrentRoleState(target.role);
      document.cookie = `hrms_user_role=${target.role}; path=/`;
    }
  };

  const handlePunchToggle = (notes?: string) => {
    if (!currentUser) return;
    const now = new Date();
    const TODAY = todayISO();
    if (!isPunchedIn) {
      setPendingPunch({ date: TODAY, checkIn: now.toISOString() });
      setElapsedSeconds(0);

      const newLog: AttendanceRecord = {
        id: `att-${Date.now()}`,
        user_id: currentUser.id,
        employee_name: `${currentUser.first_name} ${currentUser.last_name}`,
        department: currentUser.department,
        date: TODAY,
        check_in: now.toISOString(),
        status: 'PRESENT',
        notes,
      };

      setAttendanceLogs((prev) => [newLog, ...prev.filter((l) => !(l.user_id === currentUser.id && l.date === TODAY))]);

      void safeWrite('attendance', 'upsert', {
        user_id: currentUser.id,
        date: TODAY,
        check_in: now.toISOString(),
        status: 'PRESENT',
        notes,
      });
    } else {
      setPendingPunch({ date: TODAY, checkIn: null });

      setAttendanceLogs((prev) =>
        prev.map((log) => {
          if (log.user_id === currentUser.id && log.date === TODAY) {
            const hrs = Math.round((elapsedSeconds / 3600) * 10) / 10;
            return {
              ...log,
              check_out: now.toISOString(),
              work_hours: hrs,
            };
          }
          return log;
        })
      );
    }
  };

  const addEmployee = (empData: Omit<Profile, 'id' | 'created_at' | 'login_id'> & { initialSalary?: number }) => {
    const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `a${Date.now()}-0000-0000-0000-000000000000`;
    const seqNum = employees.length + 1;
    const autoLoginId = generateLoginId(empData.first_name, empData.last_name, '2026', seqNum);
    const tempPass = 'pass123';

    const newProfile: Profile = {
      ...empData,
      id: newId,
      login_id: autoLoginId,
      must_change_password: true,
      job_position: empData.job_position || 'Specialist',
      date_of_joining: new Date().toISOString().split('T')[0],
      avatar_url: empData.avatar_url || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150`,
      about: empData.about || `Newly onboarded ${empData.department} team member.`,
      what_i_love_about_job: empData.what_i_love_about_job || 'Collaborating with colleagues.',
      hobbies: empData.hobbies || ['Reading', 'Hiking', 'Music'],
      skills: empData.skills || ['Communication', 'Teamwork', 'Problem Solving'],
      certifications: empData.certifications || [],
      created_at: new Date().toISOString(),
    };

    setEmployees((prev) => [newProfile, ...prev]);

    const wage = empData.initialSalary || 75000;
    updateSalary(newId, wage);

    void safeWrite('profiles', 'insert', {
      id: newId,
      login_id: autoLoginId,
      role: newProfile.role,
      first_name: newProfile.first_name,
      last_name: newProfile.last_name,
      email: newProfile.email,
      phone: newProfile.phone,
      department: newProfile.department,
      job_position: newProfile.job_position,
      avatar_url: newProfile.avatar_url,
      must_change_password: true,
    });

    return { profile: newProfile, tempPass };
  };

  const updateProfile = (updated: Partial<Profile> & { id: string }) => {
    setEmployees((prev) =>
      prev.map((e) => (e.id === updated.id ? { ...e, ...updated } : e))
    );
    if (currentUser?.id === updated.id) {
      setCurrentUser((prev) => (prev ? { ...prev, ...updated } : prev));
    }

    void safeWrite('profiles', 'update', updated, { column: 'id', value: updated.id });
  };

  const updateSalary = (userId: string, fixedWage: number, period: WagePeriod = 'MONTHLY') => {
    const updatedSalary = calculateSalaryBreakdown(fixedWage, period);
    const newSalaryRecord: Salary = {
      id: `sal-${userId}`,
      user_id: userId,
      fixed_wage: fixedWage,
      basic_salary: updatedSalary.basic_salary,
      hra: updatedSalary.hra,
      standard_allowance: updatedSalary.standard_allowance,
      performance_bonus: updatedSalary.performance_bonus,
      lta: updatedSalary.lta,
      fixed_allowance: updatedSalary.fixed_allowance,
      pf: updatedSalary.pf,
      tax: updatedSalary.tax,
      updated_at: new Date().toISOString(),
    };

    setSalaries((prev) => ({
      ...prev,
      [userId]: newSalaryRecord,
    }));

    void safeWrite('salaries', 'upsert', {
      user_id: userId,
      fixed_wage: fixedWage,
      basic_salary: updatedSalary.basic_salary,
      hra: updatedSalary.hra,
      standard_allowance: updatedSalary.standard_allowance,
      pf: updatedSalary.pf,
      tax: updatedSalary.tax,
    });
  };

  const getSalaryBreakdown = (userId: string): SalaryBreakdown => {
    const record = salaries[userId];
    const wage = record ? record.fixed_wage : 75000;
    return calculateSalaryBreakdown(wage, 'MONTHLY');
  };

  const applyForTimeOff = (req: Omit<TimeOffRecord, 'id' | 'created_at' | 'status' | 'employee_name' | 'department'>) => {
    const emp = employees.find((e) => e.id === req.user_id);
    const start = new Date(req.start_date);
    const end = new Date(req.end_date);
    const daysCount = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);

    const newReq: TimeOffRecord = {
      ...req,
      id: `to-${Date.now()}`,
      employee_name: emp ? `${emp.first_name} ${emp.last_name}` : 'Employee',
      department: emp?.department || 'Engineering',
      days_count: daysCount,
      status: 'PENDING',
      created_at: new Date().toISOString(),
    };

    setTimeOffRequests((prev) => [newReq, ...prev]);

    void safeWrite('time_off', 'insert', {
      user_id: req.user_id,
      type: req.type,
      start_date: req.start_date,
      end_date: req.end_date,
      reason: req.reason,
      document_url: req.document_url,
      status: 'PENDING',
    });
  };

  const handleTimeOffAction = (id: string, status: 'APPROVED' | 'REJECTED', comment?: string) => {
    setTimeOffRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status, admin_comment: comment || null } : r))
    );

    void safeWrite('time_off', 'update', { status, admin_comment: comment || null }, { column: 'id', value: id });
  };

  const getUserLeaveBalance = (userId: string): LeaveBalance => {
    const userLeaves = timeOffRequests.filter((r) => r.user_id === userId && r.status === 'APPROVED');
    let paid_used = 0;
    let sick_used = 0;
    let unpaid_used = 0;

    userLeaves.forEach((r) => {
      if (r.type === 'PAID') paid_used += r.days_count;
      else if (r.type === 'SICK') sick_used += r.days_count;
      else if (r.type === 'UNPAID') unpaid_used += r.days_count;
    });

    return {
      paid_days: 24,
      paid_used,
      sick_days: 7,
      sick_used,
      unpaid_used,
    };
  };

  const getUserLiveStatus = (userId: string): 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LEAVE' => {
    if (onLeaveToday.has(userId)) return 'LEAVE';
    const log = attendanceLogs.find((a) => a.user_id === userId && a.date === todayISO());
    if (!log) return 'ABSENT';
    if (log.status === 'LEAVE') return 'LEAVE';
    if (log.status === 'HALF_DAY') return 'HALF_DAY';
    return log.check_in ? 'PRESENT' : 'ABSENT';
  };

  return (
    <HRMSContext.Provider
      value={{
        currentUser,
        currentRole,
        setCurrentRole,
        switchUser,
        logout,
        login,
        changePassword,
        sendPasswordResetOTP,
        resetPasswordWithOTP,
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
      }}
    >
      {children}
    </HRMSContext.Provider>
  );
};

export const useHRMS = () => {
  const context = useContext(HRMSContext);
  if (!context) {
    throw new Error('useHRMS must be used within an HRMSProvider');
  }
  return context;
};
