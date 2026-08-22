'use client';

import { Users2, Wallet, ShieldCheck, TrendingUp, Calculator } from 'lucide-react';
import { StatCard, StatGrid, Card, CardHeader, Table, Button, EmptyState, type Column } from '@/components/ui';
import { usePayroll } from '@/lib/hooks';
import { formatCurrency } from '@/lib/utils/salaryCalculator';

interface DeptRow {
  department: string;
  headcount: number;
  net: number;
}

export function PayrollOverview({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const { totals, byDepartment, period, register, loading } = usePayroll();

  const columns: Column<DeptRow>[] = [
    { header: 'Department', accessor: 'department' },
    { header: 'Headcount', accessor: 'headcount', align: 'right' },
    {
      header: 'Net Payout',
      align: 'right',
      render: (row) => <span className="hr-monospace">{formatCurrency(row.net)}</span>,
    },
    {
      header: 'Share',
      align: 'right',
      render: (row) => `${totals.net ? ((row.net / totals.net) * 100).toFixed(1) : '0.0'}%`,
    },
  ];

  if (!loading && register.length === 0) {
    return (
      <EmptyState
        icon={Calculator}
        title="No employees on the payroll yet"
        description="Add employees and assign their wages — the register, payslips and statutory summary all build from there."
      >
        <Button onClick={() => onNavigate('structures')}>Configure salary structures</Button>
      </EmptyState>
    );
  }

  return (
    <div className="hr-stack">
      <StatGrid loading={loading} count={4}>
        <StatCard
          label="Active Employees"
          value={totals.headcount}
          change="On payroll this cycle"
          tone="info"
          icon={<Users2 size={44} />}
        />
        <StatCard
          label="Net Disbursement"
          value={formatCurrency(totals.net)}
          change={period}
          tone="success"
          icon={<Wallet size={44} />}
        />
        <StatCard
          label="Statutory Liability"
          value={formatCurrency(totals.deductions)}
          change="PF and professional tax"
          tone="warning"
          icon={<ShieldCheck size={44} />}
        />
        <StatCard
          label="Annual CTC"
          value={formatCurrency(totals.annualCtc)}
          change="Committed cost to company"
          icon={<TrendingUp size={44} />}
        />
      </StatGrid>

      <Card>
        <CardHeader
          title="Cost by department"
          subtitle="Where the monthly payout is concentrated"
          actions={
            <Button variant="secondary" onClick={() => onNavigate('register')}>
              Open register
            </Button>
          }
        />
        <Table<DeptRow> columns={columns} data={byDepartment} loading={loading} skeletonRows={3} rowKey={(r) => r.department} />
      </Card>

      <Card>
        <CardHeader title="Statutory breakdown" subtitle="Employer and employee contributions for the cycle" />
        <div className="hr-summary-grid">
          <div className="hr-summary-item">
            <span className="hr-summary-label">Gross</span>
            <span className="hr-summary-value">{formatCurrency(totals.gross)}</span>
          </div>
          <div className="hr-summary-item">
            <span className="hr-summary-label">Provident Fund (12% of basic)</span>
            <span className="hr-summary-value">{formatCurrency(totals.pf)}</span>
          </div>
          <div className="hr-summary-item">
            <span className="hr-summary-label">Professional Tax</span>
            <span className="hr-summary-value">{formatCurrency(totals.tax)}</span>
          </div>
          <div className="hr-summary-item is-total">
            <span className="hr-summary-label">Net Payable</span>
            <span className="hr-summary-value">{formatCurrency(totals.net)}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
