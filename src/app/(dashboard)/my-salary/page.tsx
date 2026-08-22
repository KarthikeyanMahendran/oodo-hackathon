'use client';

import { useMemo, useState } from 'react';
import { Wallet, ReceiptText, FileText } from 'lucide-react';
import {
  PageHeader,
  Card,
  CardHeader,
  EmptyState,
  StatCard,
  StatGrid,
  Tabs,
  Table,
  Button,
  Badge,
  type TabItem,
  type Column,
} from '@/components/ui';
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

const TABS: TabItem[] = [
  { id: 'breakdown', label: 'Salary Structure', icon: <Wallet size={15} /> },
  { id: 'payslips', label: 'My Payslips History', icon: <ReceiptText size={15} /> },
];

export default function MySalaryPage() {
  const { currentUser, getSalaryBreakdown } = useHRMS();
  const [activeTab, setActiveTab] = useState('breakdown');
  const [openPeriod, setOpenPeriod] = useState<string | null>(null);

  const breakdown = currentUser ? getSalaryBreakdown(currentUser.id) : null;

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

  if (!currentUser || !breakdown) {
    return <EmptyState icon={Wallet} title="Not signed in" description="Sign in to view your salary and payslips." />;
  }

  const earnings = [
    ['Basic salary', breakdown.basic_salary],
    ['House rent allowance', breakdown.hra],
    ['Standard allowance', breakdown.standard_allowance],
    ['Performance bonus', breakdown.performance_bonus],
    ['Leave travel allowance', breakdown.lta],
    ['Fixed allowance', breakdown.fixed_allowance],
  ] as const;

  const payslipColumns: Column<PayslipMonth>[] = [
    { header: 'Pay Period', render: (row) => <span className="hr-cell-primary">{row.period}</span> },
    { header: 'Gross Wage', align: 'right', render: (row) => <span className="hr-monospace">{formatCurrency(row.gross)}</span> },
    {
      header: 'Deductions',
      align: 'right',
      render: (row) => <span className="hr-monospace hr-text-danger">-{formatCurrency(row.deductions)}</span>,
    },
    { header: 'Net Take-Home', align: 'right', render: (row) => <strong className="hr-monospace">{formatCurrency(row.net)}</strong> },
    { header: 'Status', render: () => <Badge tone="success">Paid</Badge> },
    {
      header: '',
      align: 'right',
      render: (row) => (
        <Button variant="ghost" onClick={() => setOpenPeriod(row.period)} icon={<FileText size={14} />}>
          View PDF
        </Button>
      ),
    },
  ];

  return (
    <div className="hr-stack">
      <PageHeader title="My Salary & Payslips" subtitle="Your monthly compensation structure and official statements" />

      <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab}>
        {activeTab === 'breakdown' ? (
          <div className="hr-stack">
            <StatGrid>
              <StatCard label="Monthly Net" value={formatCurrency(breakdown.net_salary)} change="Take home" tone="success" />
              <StatCard label="Monthly Gross" value={formatCurrency(breakdown.gross_salary)} change="Before deductions" />
              <StatCard label="Annual CTC" value={formatCurrency(breakdown.annual_ctc)} change="Cost to company" tone="info" />
            </StatGrid>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    <span>Gross Salary</span>
                    <span className="hr-monospace">{formatCurrency(breakdown.gross_salary)}</span>
                  </li>
                </ul>
              </Card>

              <Card>
                <CardHeader title="Statutory Deductions" subtitle="Withheld each month" />
                <ul className="hr-line-items">
                  <li>
                    <span>Provident Fund (12% of basic)</span>
                    <span className="hr-monospace hr-text-danger">-{formatCurrency(breakdown.pf)}</span>
                  </li>
                  <li>
                    <span>Professional Tax</span>
                    <span className="hr-monospace hr-text-danger">-{formatCurrency(breakdown.tax)}</span>
                  </li>
                  <li className="is-total">
                    <span>Net Take-Home Pay</span>
                    <span className="hr-monospace">{formatCurrency(breakdown.net_salary)}</span>
                  </li>
                </ul>
              </Card>
            </div>
          </div>
        ) : (
          <Card>
            <CardHeader title="Payslip History" subtitle="Download and view monthly PDF salary statements" />
            <Table<PayslipMonth> columns={payslipColumns} data={months} rowKey={(r) => r.period} />
          </Card>
        )}
      </Tabs>

      {openPeriod && (
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
