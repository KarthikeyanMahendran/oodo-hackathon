'use client';

import { Card, CardHeader, Badge } from '@/components/ui';
import { usePayroll } from '@/lib/hooks';
import { formatCurrency } from '@/lib/utils/salaryCalculator';

interface RuleRow {
  label: string;
  basis: string;
  rate: string;
  note: string;
}

const EARNING_RULES: RuleRow[] = [
  { label: 'Basic Salary', basis: 'Monthly wage', rate: '50%', note: 'Drives PF and most statutory limits' },
  { label: 'House Rent Allowance', basis: 'Basic salary', rate: '50%', note: '25% of the monthly wage' },
  { label: 'Standard Allowance', basis: 'Monthly wage', rate: '8.33%', note: 'Flat monthly allowance' },
  { label: 'Performance Bonus', basis: 'Basic salary', rate: '8.33%', note: 'Statutory bonus equivalent' },
  { label: 'Leave Travel Allowance', basis: 'Basic salary', rate: '8.333%', note: 'Exempt against actual travel' },
  { label: 'Fixed Allowance', basis: 'Residual', rate: 'Balancing', note: 'Absorbs the remainder of the wage' },
];

const DEDUCTION_RULES: RuleRow[] = [
  { label: 'Provident Fund', basis: 'Basic salary', rate: '12%', note: 'Employee contribution' },
  { label: 'Professional Tax', basis: 'Monthly wage', rate: 'Slab', note: '₹200 above ₹15,000 · ₹150 above ₹10,000' },
];

export function StatutorySettings() {
  const { totals } = usePayroll();

  return (
    <div className="hr-stack">
      <Card>
        <CardHeader
          title="Earning components"
          subtitle="How each component is derived from the employee's wage"
          actions={<Badge tone="info">Applies to all employees</Badge>}
        />
        <div className="hr-rules">
          {EARNING_RULES.map((rule) => (
            <div key={rule.label} className="hr-rule">
              <div className="hr-rule-head">
                <span className="hr-rule-label">{rule.label}</span>
                <span className="hr-rule-rate hr-monospace">{rule.rate}</span>
              </div>
              <span className="hr-cell-secondary">of {rule.basis}</span>
              <p className="hr-form-hint">{rule.note}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title="Statutory deductions" subtitle="Withheld from gross before net payout" />
        <div className="hr-rules">
          {DEDUCTION_RULES.map((rule) => (
            <div key={rule.label} className="hr-rule">
              <div className="hr-rule-head">
                <span className="hr-rule-label">{rule.label}</span>
                <span className="hr-rule-rate hr-monospace">{rule.rate}</span>
              </div>
              <span className="hr-cell-secondary">of {rule.basis}</span>
              <p className="hr-form-hint">{rule.note}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title="Current cycle liability" subtitle="Computed across the active roster" />
        <div className="hr-summary-grid">
          <div className="hr-summary-item">
            <span className="hr-summary-label">Provident Fund</span>
            <span className="hr-summary-value">{formatCurrency(totals.pf)}</span>
          </div>
          <div className="hr-summary-item">
            <span className="hr-summary-label">Professional Tax</span>
            <span className="hr-summary-value">{formatCurrency(totals.tax)}</span>
          </div>
          <div className="hr-summary-item is-total">
            <span className="hr-summary-label">Total Withheld</span>
            <span className="hr-summary-value">{formatCurrency(totals.deductions)}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
