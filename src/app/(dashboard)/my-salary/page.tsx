'use client';

import { Wallet } from 'lucide-react';
import { PageHeader, Card, CardHeader, EmptyState, StatCard, StatGrid } from '@/components/ui';
import { useHRMS } from '@/lib/context/HRMSContext';
import { formatCurrency } from '@/lib/utils/salaryCalculator';

export default function MySalaryPage() {
  const { currentUser, getSalaryBreakdown } = useHRMS();

  if (!currentUser) {
    return <EmptyState icon={Wallet} title="Not signed in" description="Sign in to view your salary." />;
  }

  const b = getSalaryBreakdown(currentUser.id);
  const earnings = [
    ['Basic salary', b.basic_salary],
    ['House rent allowance', b.hra],
    ['Standard allowance', b.standard_allowance],
    ['Performance bonus', b.performance_bonus],
    ['Leave travel allowance', b.lta],
    ['Fixed allowance', b.fixed_allowance],
  ] as const;

  return (
    <div className="hr-stack">
      <PageHeader title="My Salary" subtitle="Your monthly structure and statutory deductions" />

      <StatGrid>
        <StatCard label="Monthly Net" value={formatCurrency(b.net_salary)} change="Take home" tone="success" />
        <StatCard label="Monthly Gross" value={formatCurrency(b.gross_salary)} change="Before deductions" />
        <StatCard label="Annual CTC" value={formatCurrency(b.annual_ctc)} change="Cost to company" tone="info" />
      </StatGrid>

      <Card>
        <CardHeader title="Earnings" subtitle="Derived from your fixed wage" />
        <ul className="hr-line-items">
          {earnings.map(([label, amount]) => (
            <li key={label}>
              <span>{label}</span>
              <span className="hr-monospace">{formatCurrency(amount)}</span>
            </li>
          ))}
          <li className="is-total">
            <span>Gross</span>
            <span className="hr-monospace">{formatCurrency(b.gross_salary)}</span>
          </li>
        </ul>
      </Card>

      <Card>
        <CardHeader title="Deductions" subtitle="Withheld each month" />
        <ul className="hr-line-items">
          <li>
            <span>Provident fund (12% of basic)</span>
            <span className="hr-monospace hr-text-danger">-{formatCurrency(b.pf)}</span>
          </li>
          <li>
            <span>Professional tax</span>
            <span className="hr-monospace hr-text-danger">-{formatCurrency(b.tax)}</span>
          </li>
          <li className="is-total">
            <span>Net pay</span>
            <span className="hr-monospace">{formatCurrency(b.net_salary)}</span>
          </li>
        </ul>
      </Card>
    </div>
  );
}
