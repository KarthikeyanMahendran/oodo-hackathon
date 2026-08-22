'use client';

import { useCallback, useMemo, useState } from 'react';
import { useHRMS } from '../context/HRMSContext';
import { calculateSalaryBreakdown, type SalaryBreakdown } from '../utils/salaryCalculator';
import type { Profile } from '../types/hrms';

export interface PayslipRow {
  user_id: string;
  employee_name: string;
  department: string;
  login_id: string;
  breakdown: SalaryBreakdown;
}

export interface PayrollTotals {
  headcount: number;
  gross: number;
  deductions: number;
  net: number;
  pf: number;
  tax: number;
  annualCtc: number;
}

const MONTH_FMT = new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' });

/**
 * Derives a full payroll register from the employee roster and their salary
 * records. Everything downstream (register, payslips, statutory summary)
 * reads from this one source so the numbers can never disagree.
 */
export function usePayroll(period?: string) {
  const { employees, getSalaryBreakdown, updateSalary, isLoading } = useHRMS();
  const [processing, setProcessing] = useState(false);
  const [processedPeriods, setProcessedPeriods] = useState<string[]>([]);

  const currentPeriod = period ?? MONTH_FMT.format(new Date());

  const register = useMemo<PayslipRow[]>(
    () =>
      employees.map((emp: Profile) => ({
        user_id: emp.id,
        employee_name: `${emp.first_name} ${emp.last_name}`.trim(),
        department: emp.department || '—',
        login_id: emp.login_id,
        breakdown: getSalaryBreakdown(emp.id),
      })),
    [employees, getSalaryBreakdown]
  );

  const totals = useMemo<PayrollTotals>(
    () =>
      register.reduce<PayrollTotals>(
        (acc, row) => ({
          headcount: acc.headcount + 1,
          gross: acc.gross + row.breakdown.gross_salary,
          deductions: acc.deductions + row.breakdown.total_deductions,
          net: acc.net + row.breakdown.net_salary,
          pf: acc.pf + row.breakdown.pf,
          tax: acc.tax + row.breakdown.tax,
          annualCtc: acc.annualCtc + row.breakdown.annual_ctc,
        }),
        { headcount: 0, gross: 0, deductions: 0, net: 0, pf: 0, tax: 0, annualCtc: 0 }
      ),
    [register]
  );

  const byDepartment = useMemo(() => {
    const map = new Map<string, { department: string; headcount: number; net: number }>();
    for (const row of register) {
      const key = row.department;
      const entry = map.get(key) ?? { department: key, headcount: 0, net: 0 };
      entry.headcount += 1;
      entry.net += row.breakdown.net_salary;
      map.set(key, entry);
    }
    return [...map.values()].sort((a, b) => b.net - a.net);
  }, [register]);

  const isProcessed = processedPeriods.includes(currentPeriod);

  const runPayroll = useCallback(async () => {
    setProcessing(true);
    try {
      // Settlement is a local commit in this build — the register above is
      // already the authoritative computation.
      await new Promise((r) => setTimeout(r, 600));
      setProcessedPeriods((prev) => (prev.includes(currentPeriod) ? prev : [...prev, currentPeriod]));
      return true;
    } finally {
      setProcessing(false);
    }
  }, [currentPeriod]);

  const previewWage = useCallback(
    (wage: number, wagePeriod: 'MONTHLY' | 'YEARLY' = 'MONTHLY') => calculateSalaryBreakdown(wage, wagePeriod),
    []
  );

  return {
    period: currentPeriod,
    register,
    totals,
    byDepartment,
    loading: isLoading,
    processing,
    isProcessed,
    runPayroll,
    updateSalary,
    previewWage,
    getSalaryBreakdown,
  };
}
