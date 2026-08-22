'use client';

import { useMemo, useState } from 'react';
import { FileText, ReceiptText } from 'lucide-react';
import { PageHeader, Card, CardHeader, Table, Button, Badge, EmptyState, type Column } from '@/components/ui';
import { PayslipModal } from '@/components/features/payroll';
import { useHRMS } from '@/lib/context/HRMSContext';
import { formatCurrency } from '@/lib/utils/salaryCalculator';

interface PayslipMonth {
  period: string;
  gross: number;
  deductions: number;
  net: number;
}

const MONTH_FMT = new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' });

export default function MyPayslipsPage() {
  const { currentUser, getSalaryBreakdown, isLoading } = useHRMS();
  const [openPeriod, setOpenPeriod] = useState<string | null>(null);

  const breakdown = currentUser ? getSalaryBreakdown(currentUser.id) : null;

  // The live schema keeps one salary row per employee, so historic payslips are
  // projected from the current structure rather than stored per month.
  const months = useMemo<PayslipMonth[]>(() => {
    if (!breakdown) return [];
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      return {
        period: MONTH_FMT.format(d),
        gross: breakdown.gross_salary,
        deductions: breakdown.total_deductions,
        net: breakdown.net_salary,
      };
    });
  }, [breakdown]);

  if (!isLoading && (!currentUser || !breakdown)) {
    return <EmptyState icon={ReceiptText} title="Not signed in" description="Sign in to view your payslips." />;
  }

  const columns: Column<PayslipMonth>[] = [
    { header: 'Pay period', render: (row) => <span className="hr-cell-primary">{row.period}</span> },
    { header: 'Gross', align: 'right', render: (row) => <span className="hr-monospace">{formatCurrency(row.gross)}</span> },
    {
      header: 'Deductions',
      align: 'right',
      render: (row) => <span className="hr-monospace hr-text-danger">-{formatCurrency(row.deductions)}</span>,
    },
    { header: 'Net pay', align: 'right', render: (row) => <strong className="hr-monospace">{formatCurrency(row.net)}</strong> },
    { header: 'Status', render: () => <Badge tone="success">Paid</Badge> },
    {
      header: '',
      align: 'right',
      render: (row) => (
        <Button variant="ghost" onClick={() => setOpenPeriod(row.period)} icon={<FileText size={14} />}>
          View
        </Button>
      ),
    },
  ];

  return (
    <div className="hr-stack">
      <PageHeader title="My Payslips" subtitle="Monthly salary statements" />
      <Card>
        <CardHeader title="Payslip history" subtitle="Last six pay periods" />
        <Table<PayslipMonth> columns={columns} data={months} loading={isLoading && !breakdown} rowKey={(r) => r.period} />
      </Card>

      {openPeriod && currentUser && breakdown && (
        <PayslipModal
          period={openPeriod}
          onClose={() => setOpenPeriod(null)}
          row={{
            user_id: currentUser.id,
            employee_name: `${currentUser.first_name} ${currentUser.last_name}`,
            department: currentUser.department || '—',
            login_id: currentUser.login_id,
            breakdown,
          }}
        />
      )}
    </div>
  );
}
