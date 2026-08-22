'use client';

import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { Card, CardHeader, Table, Button, Input, useToast, type Column } from '@/components/ui';
import { usePayroll, type PayslipRow } from '@/lib/hooks';
import { formatCurrency } from '@/lib/utils/salaryCalculator';
import { SalaryModal } from './SalaryModal';

type Row = PayslipRow;

export function SalaryStructures() {
  const { register, loading } = usePayroll();
  const showToast = useToast();
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<PayslipRow | null>(null);

  const q = query.trim().toLowerCase();
  const rows = register.filter(
    (r) => !q || r.employee_name.toLowerCase().includes(q) || r.department.toLowerCase().includes(q)
  );

  const columns: Column<Row>[] = [
    {
      header: 'Employee',
      render: (row) => (
        <div className="hr-cell-stack">
          <span className="hr-cell-primary">{row.employee_name}</span>
          <span className="hr-cell-secondary">{row.department}</span>
        </div>
      ),
    },
    {
      header: 'Monthly Wage',
      align: 'right',
      render: (row) => <span className="hr-monospace">{formatCurrency(row.breakdown.monthly_wage)}</span>,
    },
    {
      header: 'Basic (50%)',
      align: 'right',
      render: (row) => <span className="hr-monospace">{formatCurrency(row.breakdown.basic_salary)}</span>,
    },
    {
      header: 'HRA (25%)',
      align: 'right',
      render: (row) => <span className="hr-monospace">{formatCurrency(row.breakdown.hra)}</span>,
    },
    {
      header: 'Annual CTC',
      align: 'right',
      render: (row) => <span className="hr-monospace">{formatCurrency(row.breakdown.annual_ctc)}</span>,
    },
    {
      header: '',
      align: 'right',
      render: (row) => (
        <Button variant="ghost" onClick={() => setEditing(row)} icon={<Pencil size={14} />}>
          Edit
        </Button>
      ),
    },
  ];

  return (
    <div className="hr-stack">
      <Card>
        <CardHeader
          title="Salary structures"
          subtitle="Wages drive every derived component — edit the wage and the breakdown recalculates"
        />
        <div className="hr-filter-bar">
          <Input
            placeholder="Search employees…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search employees"
          />
        </div>
        <Table<Row> columns={columns} data={rows} loading={loading} rowKey={(r) => r.user_id} emptyMessage="No employees found." />
      </Card>

      <SalaryModal
        row={editing}
        onClose={() => setEditing(null)}
        onSaved={(name) => showToast(`Salary structure updated for ${name}.`, 'success')}
      />
    </div>
  );
}
