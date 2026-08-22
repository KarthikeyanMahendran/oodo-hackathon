import { WagePeriod } from '../types/hrms';

export interface SalaryBreakdown {
  wage_period: WagePeriod;
  input_wage: number;
  monthly_wage: number;
  annual_ctc: number;
  
  // Components
  basic_salary: number;
  hra: number;
  standard_allowance: number;
  performance_bonus: number;
  lta: number;
  fixed_allowance: number;
  
  // Deductions & Net
  gross_salary: number;
  pf: number;
  tax: number;
  total_deductions: number;
  net_salary: number;
}

/**
 * Auto-generates custom Login ID pattern (hrms.excalidraw):
 * OI + [First 2 letters of First Name] + [First 2 letters of Last Name] + [Joining Year] + [4-digit sequence]
 * Example: Sarah Jenkins -> OISAJE20260001
 */
export function generateLoginId(
  firstName: string,
  lastName: string,
  joiningYear: string = '2026',
  sequenceNum: number = 1
): string {
  const f2 = (firstName.trim().slice(0, 2) || 'XX').toUpperCase();
  const l2 = (lastName.trim().slice(0, 2) || 'XX').toUpperCase();
  const seq = String(sequenceNum).padStart(4, '0');
  return `OI${f2}${l2}${joiningYear}${seq}`;
}

/**
 * Calculates statutory salary components according to hrms.excalidraw specs:
 * 
 * - Basic Salary = 50% of monthly wage
 * - HRA = 50% of Basic (25% of monthly wage)
 * - Standard Allowance = 8.33% of monthly wage (approx ₹4,167 on ₹50k)
 * - Performance Bonus = 8.33% of Basic Salary
 * - Leave Travel Allowance (LTA) = 8.333% of Basic Salary
 * - Fixed Allowance = wage - (basic + hra + standard + bonus + lta)
 * 
 * Statutory Deductions:
 * - PF = 12% of Basic Salary
 * - Professional Tax = ₹200 / month
 */
export function calculateSalaryBreakdown(
  wageAmount: number,
  period: WagePeriod = 'MONTHLY'
): SalaryBreakdown {
  const input = Math.max(0, wageAmount || 0);
  const monthly_wage = period === 'YEARLY' ? Math.round(input / 12) : input;
  const annual_ctc = monthly_wage * 12;

  // Components
  const basic_salary = Math.round(monthly_wage * 0.5);
  const hra = Math.round(basic_salary * 0.5);
  const standard_allowance = Math.round(monthly_wage * 0.0833);
  const performance_bonus = Math.round(basic_salary * 0.0833);
  const lta = Math.round(basic_salary * 0.08333);

  const subtotal = basic_salary + hra + standard_allowance + performance_bonus + lta;
  const fixed_allowance = Math.max(0, monthly_wage - subtotal);
  const gross_salary = basic_salary + hra + standard_allowance + performance_bonus + lta + fixed_allowance;

  // Statutory Deductions
  const pf = Math.round(basic_salary * 0.12);
  const tax = monthly_wage > 15000 ? 200 : monthly_wage > 10000 ? 150 : 0;
  const total_deductions = pf + tax;

  const net_salary = Math.max(0, gross_salary - total_deductions);

  return {
    wage_period: period,
    input_wage: input,
    monthly_wage,
    annual_ctc,
    basic_salary,
    hra,
    standard_allowance,
    performance_bonus,
    lta,
    fixed_allowance,
    gross_salary,
    pf,
    tax,
    total_deductions,
    net_salary,
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}
