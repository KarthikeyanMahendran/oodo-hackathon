'use client';

import { useState } from 'react';
import { Play, CheckCircle2, FileText } from 'lucide-react';
import { Card, CardHeader, Table, Button, Badge, Input, type Column } from '@/components/ui';
import { useToast } from '@/components/ui';
import { usePayroll, type PayslipRow } from '@/lib/hooks';
import { formatCurrency } from '@/lib/utils/salaryCalculator';
import { PayslipModal } from './PayslipModal';

type Row = PayslipRow;

export function PayrollRegister() {
  const { register, totals, period, runPayroll, processing, isProcessed } = usePayroll();
  const showToast = useToast();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<PayslipRow | null>(null);

  const q = query.trim().toLowerCase();
  const rows = register.filter(
    (r) =>
      !q ||
      r.employee_name.toLowerCase().includes(q) ||
      r.department.toLowerCase().includes(q) ||
      r.login_id.toLowerCase().includes(q)
  );

  const columns: Column<Row>[] = [
    {
      header: 'Employee',
      render: (row) => (
        <div className="hr-cell-stack">
          <span className="hr-cell-primary">{row.employee_name}</span>
          <span className="hr-cell-secondary hr-monospace">{row.login_id}</span>
        </div>
      ),
    },
    { header: 'Department', accessor: 'department' },
    {
      header: 'Basic',
      align: 'right',
      render: (row) => <span className="hr-monospace">{formatCurrency(row.breakdown.basic_salary)}</span>,
    },
    {
      header: 'Gross',
      align: 'right',
      render: (row) => <span className="hr-monospace">{formatCurrency(row.breakdown.gross_salary)}</span>,
    },
    {
      header: 'Deductions',
      align: 'right',
      render: (row) => (
        <span className="hr-monospace hr-text-danger">-{formatCurrency(row.breakdown.total_deductions)}</span>
      ),
    },
    {
      header: 'Net Pay',
      align: 'right',
      render: (row) => (
        <strong className="hr-monospace">{formatCurrency(row.breakdown.net_salary)}</strong>
      ),
    },
    {
      header: '',
      align: 'right',
      render: (row) => (
        <Button variant="ghost" onClick={() => setSelected(row)} icon={<FileText size={14} />}>
          Payslip
        </Button>
      ),
    },
  ];

  const handleRun = async () => {
    const ok = await runPayroll();
    showToast(
      ok ? `Payroll settled for ${period} — ${formatCurrency(totals.net)} across ${totals.headcount} employees.` : 'Payroll run failed.',
      ok ? 'success' : 'error'
    );
  };

  return (
    <div className="hr-stack">
      <Card>
        <CardHeader
          title={`Payroll register — ${period}`}
          subtitle={`${totals.headcount} employees · net ${formatCurrency(totals.net)}`}
          actions={
            isProcessed ? (
              <Badge tone="success">
                <CheckCircle2 size={12} /> Settled
              </Badge>
            ) : (
              <Button onClick={handleRun} loading={processing} icon={<Play size={14} />}>
                {processing ? 'Processing…' : 'Run payroll'}
              </Button>
            )
          }
        />

        <div className="hr-filter-bar">
          <Input
            placeholder="Search by name, code or department…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search register"
          />
        </div>

        <Table<Row>
          columns={columns}
          data={rows}
          rowKey={(r) => r.user_id}
          emptyMessage="No employees match this search."
        />

        {rows.length > 0 && (
          <div className="hr-register-footer">
            <span>Totals</span>
            <span className="hr-monospace">{formatCurrency(totals.gross)}</span>
            <span className="hr-monospace hr-text-danger">-{formatCurrency(totals.deductions)}</span>
            <strong className="hr-monospace">{formatCurrency(totals.net)}</strong>
          </div>
        )}
      </Card>

      <PayslipModal row={selected} period={period} onClose={() => setSelected(null)} />
    </div>
  );
}
