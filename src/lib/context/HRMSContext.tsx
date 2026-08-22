'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Profile,
  Salary,
  AttendanceRecord,
  TimeOffRecord,
  LeaveBalance,
  UserRole,
  WagePeriod,
} from '../types/hrms';
import { calculateSalaryBreakdown, SalaryBreakdown } from '../utils/salaryCalculator';
import { supabase } from '../supabase/client';

export function generateLoginId(firstName: string, lastName: string, year = '2026', seq = 1): string {
  const f = (firstName || 'EM').trim().substring(0, 2).toUpperCase().padEnd(2, 'X');
  const l = (lastName || 'PY').trim().substring(0, 2).toUpperCase().padEnd(2, 'X');
  const seqStr = String(seq).padStart(4, '0');
  return `OI${f}${l}${year}${seqStr}`;
}

interface HRMSContextType {
  currentUser: Profile | null;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  switchUser: (userId: string) => void;
  logout: () => void;
  login: (loginIdOrEmail: string, pass: string) => boolean;

  employees: Profile[];
  salaries: Record<string, Salary>;
  attendanceLogs: AttendanceRecord[];
  timeOffRequests: TimeOffRecord[];

  isPunchedIn: boolean;
  punchInTime: Date | null;
  elapsedSeconds: number;
  handlePunchToggle: (notes?: string) => void;

  addEmployee: (emp: Omit<Profile, 'id' | 'created_at' | 'login_id'> & { initialSalary?: number }) => { profile: Profile; tempPass: string };
  updateProfile: (profile: Partial<Profile> & { id: string }) => void;

  updateSalary: (userId: string, fixedWage: number, period?: WagePeriod) => void;
  getSalaryBreakdown: (userId: string) => SalaryBreakdown;

  applyForTimeOff: (req: Omit<TimeOffRecord, 'id' | 'created_at' | 'status' | 'employee_name' | 'department'>) => void;
  handleTimeOffAction: (id: string, status: 'APPROVED' | 'REJECTED', comment?: string) => void;
  getUserLeaveBalance: (userId: string) => LeaveBalance;

  getUserLiveStatus: (userId: string) => 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LEAVE';

  isLoading: boolean;
}

const HRMSContext = createContext<HRMSContextType | undefined>(undefined);

// Sample Profiles based on Excalidraw & Dayflow specifications
const INITIAL_PROFILES: Profile[] = [
  {
    id: 'admin-001',
    login_id: 'OISAJE20260001',
    role: 'ADMIN',
    first_name: 'Sarah',
    last_name: 'Jenkins',
    email: 'sarah.jenkins@acme.com',
    phone: '+1 (555) 019-2834',
    department: 'Human Resources',
    job_position: 'VP of Human Resources',
    date_of_joining: '2022-03-15',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    about: 'Senior VP of Human Resources leading organizational development, talent acquisition, and employee engagement.',
    what_i_love_about_job: 'Building collaborative work cultures and empowering talented individuals to grow in their careers.',
    hobbies: ['Oil Painting', 'Long Distance Running', 'Classic Cinema', 'Mentoring Students'],
    skills: ['Talent Strategy', 'Labor Compliance', 'Payroll Management', 'Conflict Resolution', 'Executive Coaching'],
    certifications: ['SHRM-SCP Certified Senior Professional', 'PHR Professional in HR'],
    address: '742 Evergreen Terrace, Suite 400, San Francisco, CA',
    personal_email: 'sarah.j.personal@gmail.com',
    nationality: 'American',
    gender: 'Female',
    date_of_birth: '1988-04-12',
    marital_status: 'Married',
    pan_number: 'ABCDE1234F',
    uan_number: '100928374615',
    bank_name: 'Silicon Valley Bank',
    bank_account_number: '489201928374',
    bank_ifsc: 'SVBK0001928',
  },
  {
    id: 'emp-001',
    login_id: 'OIALRI20260002',
    role: 'EMPLOYEE',
    first_name: 'Alex',
    last_name: 'Rivera',
    email: 'alex.rivera@acme.com',
    phone: '+1 (555) 392-1049',
    department: 'Product & Design',
    job_position: 'Lead UX/UI Designer',
    date_of_joining: '2023-01-10',
    manager_id: 'admin-001',
    manager_name: 'Sarah Jenkins',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    about: 'Lead UX/UI Designer passionate about crafting intuitive user experiences and modern visual design systems.',
    what_i_love_about_job: 'Solving complex interaction problems and designing pixel-perfect user interfaces.',
    hobbies: ['Photography', 'UI Motion Design', 'Synthesizers', 'Bouldering'],
    skills: ['Figma', 'UI/UX Design', 'Design Systems', 'User Research', 'Prototyping'],
    certifications: ['Google UX Design Professional Certificate', 'Nielsen Norman Group UX Master'],
    address: '1280 Market Street, Apt 5B, San Francisco, CA',
    personal_email: 'alex.rivera.design@gmail.com',
    nationality: 'American',
    gender: 'Non-binary',
    date_of_birth: '1993-09-18',
    marital_status: 'Single',
    pan_number: 'FGHIJ5678K',
    uan_number: '100847392019',
    bank_name: 'Chase Bank',
    bank_account_number: '920183746152',
    bank_ifsc: 'CHAS0091827',
  },
  {
    id: 'emp-002',
    login_id: 'OIMACH20260003',
    role: 'EMPLOYEE',
    first_name: 'Marcus',
    last_name: 'Chen',
    email: 'marcus.chen@acme.com',
    phone: '+1 (555) 782-9301',
    department: 'Engineering',
    job_position: 'Senior Backend Engineer',
    date_of_joining: '2023-06-01',
    manager_id: 'admin-001',
    manager_name: 'Sarah Jenkins',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    about: 'Senior Backend Systems Architect specializing in distributed cloud services, PostgreSQL, and node.js microservices.',
    what_i_love_about_job: 'Architecting high-throughput database systems and optimizing microservice latency.',
    hobbies: ['Chess', 'Open Source Contributing', 'Espresso Brewing', 'Cycling'],
    skills: ['TypeScript', 'Node.js', 'PostgreSQL', 'Docker', 'Kubernetes', 'AWS'],
    certifications: ['AWS Certified Solutions Architect - Professional'],
    address: '450 Mission Street, Floor 12, San Francisco, CA',
    personal_email: 'marcus.chen.dev@gmail.com',
    nationality: 'Canadian',
    gender: 'Male',
    date_of_birth: '1990-11-25',
    marital_status: 'Single',
    pan_number: 'KLMNO9012P',
    uan_number: '100738291048',
    bank_name: 'Bank of America',
    bank_account_number: '109283746501',
    bank_ifsc: 'BOFA0981273',
  },
  {
    id: 'emp-003',
    login_id: 'OIELRO20260004',
    role: 'EMPLOYEE',
    first_name: 'Elena',
    last_name: 'Rostova',
    email: 'elena.rostova@acme.com',
    phone: '+1 (555) 849-2018',
    department: 'Marketing',
    job_position: 'Growth Marketing Director',
    date_of_joining: '2024-02-15',
    manager_id: 'admin-001',
    manager_name: 'Sarah Jenkins',
    avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
    about: 'Growth Marketing Director leading campaign optimization, brand positioning, and enterprise lead generation.',
    what_i_love_about_job: 'Scaling brand visibility and translating analytics into high-impact growth strategies.',
    hobbies: ['Travel Blogging', 'Modern Architecture', 'Tennis', 'Wine Tasting'],
    skills: ['Growth Hacking', 'SEO/SEM', 'Content Strategy', 'Google Analytics', 'HubSpot'],
    certifications: ['HubSpot Inbound Marketing Certified'],
    address: '890 Broadway Street, Oakland, CA',
    personal_email: 'elena.rostova@gmail.com',
    nationality: 'German',
    gender: 'Female',
    date_of_birth: '1992-06-30',
    marital_status: 'Married',
    pan_number: 'QRSTU3456V',
    uan_number: '100657483920',
    bank_name: 'Wells Fargo',
    bank_account_number: '748392019283',
    bank_ifsc: 'WFAR0817263',
  },
  {
    id: 'emp-004',
    login_id: 'OIDEVA20260005',
    role: 'EMPLOYEE',
    first_name: 'Devon',
    last_name: 'Vance',
    email: 'devon.vance@acme.com',
    phone: '+1 (555) 671-8293',
    department: 'Finance',
    job_position: 'Senior Financial Analyst',
    date_of_joining: '2024-09-01',
    manager_id: 'admin-001',
    manager_name: 'Sarah Jenkins',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    about: 'Corporate Financial Analyst handling budget forecasting, financial reporting, and statutory compliance.',
    what_i_love_about_job: 'Building financial models that guide strategic executive decision making.',
    hobbies: ['Stock Trading', 'Golf', 'Reading History', 'Trivia Nights'],
    skills: ['Financial Modeling', 'Excel / Financial Analysis', 'Auditing', 'Risk Assessment'],
    certifications: ['CPA Certified Public Accountant'],
    address: '320 University Ave, Palo Alto, CA',
    personal_email: 'devon.vance.cpa@gmail.com',
    nationality: 'American',
    gender: 'Male',
    date_of_birth: '1995-02-14',
    marital_status: 'Single',
    pan_number: 'WXYZB7890C',
    uan_number: '100548392017',
    bank_name: 'First Republic Bank',
    bank_account_number: '594039281726',
    bank_ifsc: 'FRBK0192834',
  },
];

const INITIAL_SALARIES: Record<string, Salary> = {
  'admin-001': { user_id: 'admin-001', wage_period: 'MONTHLY', fixed_wage: 150000, basic_salary: 75000, hra: 37500, standard_allowance: 12495, performance_bonus: 6248, lta: 6250, fixed_allowance: 12507, pf: 9000, tax: 200, net_salary: 140800 },
  'emp-001': { user_id: 'emp-001', wage_period: 'MONTHLY', fixed_wage: 120000, basic_salary: 60000, hra: 30000, standard_allowance: 9996, performance_bonus: 4998, lta: 5000, fixed_allowance: 10006, pf: 7200, tax: 200, net_salary: 112600 },
  'emp-002': { user_id: 'emp-002', wage_period: 'MONTHLY', fixed_wage: 135000, basic_salary: 67500, hra: 33750, standard_allowance: 11246, performance_bonus: 5623, lta: 5625, fixed_allowance: 11256, pf: 8100, tax: 200, net_salary: 126700 },
  'emp-003': { user_id: 'emp-003', wage_period: 'MONTHLY', fixed_wage: 95000, basic_salary: 47500, hra: 23750, standard_allowance: 7914, performance_bonus: 3957, lta: 3958, fixed_allowance: 7921, pf: 5700, tax: 200, net_salary: 89100 },
  'emp-004': { user_id: 'emp-004', wage_period: 'MONTHLY', fixed_wage: 85000, basic_salary: 42500, hra: 21250, standard_allowance: 7081, performance_bonus: 3540, lta: 3542, fixed_allowance: 7087, pf: 5100, tax: 200, net_salary: 79700 },
};

const TODAY = new Date().toISOString().split('T')[0];

const INITIAL_ATTENDANCE: AttendanceRecord[] = [
  { id: 'att-101', user_id: 'admin-001', employee_name: 'Sarah Jenkins', department: 'Human Resources', date: TODAY, check_in: new Date(Date.now() - 4 * 3600 * 1000).toISOString(), status: 'PRESENT', work_hours: 4, break_time_mins: 30 },
  { id: 'att-102', user_id: 'emp-001', employee_name: 'Alex Rivera', department: 'Product & Design', date: TODAY, check_in: new Date(Date.now() - 3 * 3600 * 1000).toISOString(), status: 'PRESENT', work_hours: 3, break_time_mins: 15 },
  { id: 'att-103', user_id: 'emp-002', employee_name: 'Marcus Chen', department: 'Engineering', date: TODAY, check_in: new Date(Date.now() - 5 * 3600 * 1000).toISOString(), status: 'PRESENT', work_hours: 5, break_time_mins: 45 },
  { id: 'att-104', user_id: 'emp-003', employee_name: 'Elena Rostova', department: 'Marketing', date: TODAY, check_in: new Date(Date.now() - 4 * 3600 * 1000).toISOString(), check_out: new Date(Date.now() - 3600 * 1000).toISOString(), status: 'HALF_DAY', work_hours: 3, break_time_mins: 15 },
  { id: 'att-105', user_id: 'emp-004', employee_name: 'Devon Vance', department: 'Finance', date: TODAY, check_in: new Date().toISOString(), status: 'LEAVE' },
];

const INITIAL_TIME_OFF: TimeOffRecord[] = [
  {
    id: 'to-001',
    user_id: 'emp-004',
    employee_name: 'Devon Vance',
    department: 'Finance',
    type: 'PAID',
    start_date: TODAY,
    end_date: TODAY,
    days_count: 1,
    reason: 'Personal family obligation and medical checkup.',
    status: 'APPROVED',
    admin_comment: 'Approved. Enjoy your time off!',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'to-002',
    user_id: 'emp-001',
    employee_name: 'Alex Rivera',
    department: 'Product & Design',
    type: 'SICK',
    start_date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    end_date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    days_count: 2,
    reason: 'Scheduled wisdom tooth extraction procedure.',
    document_url: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=500',
    status: 'PENDING',
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 'to-003',
    user_id: 'emp-002',
    employee_name: 'Marcus Chen',
    department: 'Engineering',
    type: 'PAID',
    start_date: new Date(Date.now() + 86400000 * 10).toISOString().split('T')[0],
    end_date: new Date(Date.now() + 86400000 * 15).toISOString().split('T')[0],
    days_count: 5,
    reason: 'Annual family summer vacation trip.',
    status: 'PENDING',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
];

export const HRMSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [employees, setEmployees] = useState<Profile[]>(INITIAL_PROFILES);
  const [currentUser, setCurrentUser] = useState<Profile | null>(INITIAL_PROFILES[0]);
  const [currentRole, setCurrentRole] = useState<UserRole>('ADMIN');
  const [salaries, setSalaries] = useState<Record<string, Salary>>(INITIAL_SALARIES);
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceRecord[]>(INITIAL_ATTENDANCE);
  const [timeOffRequests, setTimeOffRequests] = useState<TimeOffRecord[]>(INITIAL_TIME_OFF);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Live Punch-In State
  const [isPunchedIn, setIsPunchedIn] = useState<boolean>(true);
  const [punchInTime, setPunchInTime] = useState<Date | null>(new Date(Date.now() - 4 * 3600 * 1000));
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(4 * 3600);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPunchedIn && punchInTime) {
      timer = setInterval(() => {
        const diff = Math.floor((new Date().getTime() - punchInTime.getTime()) / 1000);
        setElapsedSeconds(diff > 0 ? diff : 0);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPunchedIn, punchInTime]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.cookie = `hrms_session=active; path=/`;
      document.cookie = `hrms_user_role=${currentRole}; path=/`;
    }
  }, [currentRole]);

  useEffect(() => {
    async function loadSupabaseData() {
      try {
        const { data: dbProfiles, error } = await supabase.from('profiles').select('*');
        if (!error && dbProfiles && dbProfiles.length > 0) {
          setEmployees(dbProfiles as Profile[]);
          if (!currentUser) setCurrentUser(dbProfiles[0] as Profile);
        }
      } catch (err) {
        console.log('Using local mock store fallback');
      }
    }
    loadSupabaseData();
  }, []);

  const login = (loginIdOrEmail: string, pass: string): boolean => {
    const query = loginIdOrEmail.trim().toLowerCase();
    const found = employees.find(
      (e) => e.login_id.toLowerCase() === query || e.email.toLowerCase() === query
    );
    if (found) {
      setCurrentUser(found);
      setCurrentRole(found.role);
      document.cookie = `hrms_session=active; path=/`;
      document.cookie = `hrms_user_role=${found.role}; path=/`;
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    document.cookie = `hrms_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    document.cookie = `hrms_user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  };

  const switchUser = (userId: string) => {
    const target = employees.find((e) => e.id === userId);
    if (target) {
      setCurrentUser(target);
      setCurrentRole(target.role);
      document.cookie = `hrms_user_role=${target.role}; path=/`;
    }
  };

  const handlePunchToggle = (notes?: string) => {
    if (!currentUser) return;
    const now = new Date();
    if (!isPunchedIn) {
      setIsPunchedIn(true);
      setPunchInTime(now);
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

      (async () => {
        try {
          await supabase.from('attendance').upsert({
            user_id: currentUser.id,
            date: TODAY,
            check_in: now.toISOString(),
            status: 'PRESENT',
            notes,
          });
        } catch (err) {
          console.error(err);
        }
      })();
    } else {
      setIsPunchedIn(false);

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

      (async () => {
        try {
          await supabase.from('attendance').update({
            check_out: now.toISOString(),
          }).eq('user_id', currentUser.id).eq('date', TODAY);
        } catch (err) {
          console.error(err);
        }
      })();
    }
  };

  const addEmployee = (empData: Omit<Profile, 'id' | 'created_at' | 'login_id'> & { initialSalary?: number }) => {
    const newId = `emp-${Date.now()}`;
    const seqNum = employees.length + 1;
    const autoLoginId = generateLoginId(empData.first_name, empData.last_name, '2026', seqNum);
    const tempPass = `Welcome@${Math.floor(1000 + Math.random() * 9000)}`;

    const newProfile: Profile = {
      ...empData,
      id: newId,
      login_id: autoLoginId,
      job_position: empData.job_position || 'Specialist',
      date_of_joining: new Date().toISOString().split('T')[0],
      avatar_url: empData.avatar_url || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150`,
      about: empData.about || `Newly onboarded ${empData.department} team member.`,
      what_i_love_about_job: empData.what_i_love_about_job || 'Collaborating with high-performing colleagues to deliver innovative solutions.',
      hobbies: empData.hobbies || ['Reading', 'Hiking', 'Music'],
      skills: empData.skills || ['Communication', 'Teamwork', 'Problem Solving'],
      certifications: empData.certifications || [],
      created_at: new Date().toISOString(),
    };

    setEmployees((prev) => [newProfile, ...prev]);

    const wage = empData.initialSalary || 75000;
    updateSalary(newId, wage);

    (async () => {
      try {
        await supabase.from('profiles').insert([
          {
            id: newId,
            login_id: autoLoginId,
            role: newProfile.role,
            first_name: newProfile.first_name,
            last_name: newProfile.last_name,
            email: newProfile.email,
            phone: newProfile.phone,
            department: newProfile.department,
            avatar_url: newProfile.avatar_url,
          },
        ]);
      } catch (err) {
        console.error(err);
      }
    })();

    return { profile: newProfile, tempPass };
  };

  const updateProfile = (updated: Partial<Profile> & { id: string }) => {
    setEmployees((prev) =>
      prev.map((e) => (e.id === updated.id ? { ...e, ...updated } : e))
    );
    if (currentUser?.id === updated.id) {
      setCurrentUser((prev) => (prev ? { ...prev, ...updated } : prev));
    }

    (async () => {
      try {
        await supabase.from('profiles').update(updated).eq('id', updated.id);
      } catch (err) {
        console.error(err);
      }
    })();
  };

  const updateSalary = (userId: string, fixedWage: number, period: WagePeriod = 'MONTHLY') => {
    const b = calculateSalaryBreakdown(fixedWage, period);
    const sal: Salary = {
      user_id: userId,
      wage_period: period,
      fixed_wage: b.monthly_wage,
      basic_salary: b.basic_salary,
      hra: b.hra,
      standard_allowance: b.standard_allowance,
      performance_bonus: b.performance_bonus,
      lta: b.lta,
      fixed_allowance: b.fixed_allowance,
      pf: b.pf,
      tax: b.tax,
      net_salary: b.net_salary,
      updated_at: new Date().toISOString(),
    };

    setSalaries((prev) => ({ ...prev, [userId]: sal }));

    (async () => {
      try {
        await supabase.from('salaries').upsert({
          user_id: userId,
          fixed_wage: sal.fixed_wage,
          basic_salary: sal.basic_salary,
          hra: sal.hra,
          standard_allowance: sal.standard_allowance,
          pf: sal.pf,
          tax: sal.tax,
        });
      } catch (err) {
        console.error(err);
      }
    })();
  };

  const getSalaryBreakdown = (userId: string): SalaryBreakdown => {
    const s = salaries[userId];
    const wage = s ? s.fixed_wage : 60000;
    const period = s?.wage_period || 'MONTHLY';
    return calculateSalaryBreakdown(wage, period);
  };

  const applyForTimeOff = (req: Omit<TimeOffRecord, 'id' | 'created_at' | 'status' | 'employee_name' | 'department'>) => {
    const user = employees.find((e) => e.id === req.user_id) || currentUser;
    const newReq: TimeOffRecord = {
      ...req,
      id: `to-${Date.now()}`,
      employee_name: user ? `${user.first_name} ${user.last_name}` : 'Employee',
      department: user?.department || 'General',
      status: 'PENDING',
      created_at: new Date().toISOString(),
    };

    setTimeOffRequests((prev) => [newReq, ...prev]);

    (async () => {
      try {
        await supabase.from('time_off').insert({
          user_id: req.user_id,
          type: req.type,
          start_date: req.start_date,
          end_date: req.end_date,
          reason: req.reason,
          document_url: req.document_url,
          status: 'PENDING',
        });
      } catch (err) {
        console.error(err);
      }
    })();
  };

  const handleTimeOffAction = (id: string, status: 'APPROVED' | 'REJECTED', comment?: string) => {
    setTimeOffRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status, admin_comment: comment || null } : r))
    );

    (async () => {
      try {
        await supabase.from('time_off').update({
          status,
          admin_comment: comment || null,
        }).eq('id', id);
      } catch (err) {
        console.error(err);
      }
    })();
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
      paid_days: 24, // Excalidraw spec: 24 Days Paid Time Off
      paid_used,
      sick_days: 7,   // Excalidraw spec: 7 Days Sick Leave
      sick_used,
      unpaid_used,
    };
  };

  const getUserLiveStatus = (userId: string): 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LEAVE' => {
    const leaveToday = timeOffRequests.find(
      (r) => r.user_id === userId && r.status === 'APPROVED' && r.start_date <= TODAY && r.end_date >= TODAY
    );
    if (leaveToday) return 'LEAVE';

    const attToday = attendanceLogs.find((a) => a.user_id === userId && a.date === TODAY);
    if (attToday && attToday.status === 'PRESENT') return 'PRESENT';
    if (attToday && attToday.status === 'HALF_DAY') return 'HALF_DAY';
    if (attToday && attToday.status === 'LEAVE') return 'LEAVE';

    return 'ABSENT';
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
