'use client';

import { useState } from 'react';
import { Modal, Button, Input, Select, FieldRow } from '@/components/ui';
import { usePayroll, type PayslipRow } from '@/lib/hooks';
import { formatCurrency } from '@/lib/utils/salaryCalculator';
import type { WagePeriod } from '@/lib/types/hrms';

interface SalaryModalProps {
  row: PayslipRow | null;
  onClose: () => void;
  onSaved: (employeeName: string) => void;
}

/** Keyed on the employee so each row opens with its own wage already loaded. */
export function SalaryModal({ row, onClose, onSaved }: SalaryModalProps) {
  if (!row) return null;
  return <SalaryModalForm key={row.user_id} row={row} onClose={onClose} onSaved={onSaved} />;
}

function SalaryModalForm({
  row,
  onClose,
  onSaved,
}: SalaryModalProps & { row: PayslipRow }) {
  const { updateSalary, previewWage } = usePayroll();
  const [wage, setWage] = useState(String(row.breakdown.monthly_wage));
  const [period, setPeriod] = useState<WagePeriod>('MONTHLY');
  const [error, setError] = useState('');

  const amount = Number(wage);
  const valid = wage !== '' && !Number.isNaN(amount) && amount > 0;
  const preview = previewWage(valid ? amount : 0, period);

  const handleSave = () => {
    if (!valid) {
      setError('Enter a wage greater than zero.');
      return;
    }
    updateSalary(row.user_id, amount, period);
    onSaved(row.employee_name);
    onClose();
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={`Salary structure — ${row.employee_name}`}
      subtitle={row.department}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save structure</Button>
        </>
      }
    >
      <FieldRow>
        <Input
          label="Wage amount"
          type="number"
          min={0}
          value={wage}
          onChange={(e) => {
            setWage(e.target.value);
            setError('');
          }}
          error={error}
          required
        />
        <Select label="Wage period" value={period} onChange={(e) => setPeriod(e.target.value as WagePeriod)}>
          <option value="MONTHLY">Monthly</option>
          <option value="YEARLY">Yearly (CTC)</option>
        </Select>
      </FieldRow>

      <h4 className="hr-section-title">Computed breakdown</h4>
      <ul className="hr-line-items">
        <li>
          <span>Monthly wage</span>
          <span className="hr-monospace">{formatCurrency(preview.monthly_wage)}</span>
        </li>
        <li>
          <span>Basic salary (50% of wage)</span>
          <span className="hr-monospace">{formatCurrency(preview.basic_salary)}</span>
        </li>
        <li>
          <span>HRA (50% of basic)</span>
          <span className="hr-monospace">{formatCurrency(preview.hra)}</span>
        </li>
        <li>
          <span>Standard allowance</span>
          <span className="hr-monospace">{formatCurrency(preview.standard_allowance)}</span>
        </li>
        <li>
          <span>Performance bonus</span>
          <span className="hr-monospace">{formatCurrency(preview.performance_bonus)}</span>
        </li>
        <li>
          <span>Leave travel allowance</span>
          <span className="hr-monospace">{formatCurrency(preview.lta)}</span>
        </li>
        <li>
          <span>Fixed allowance (balancing)</span>
          <span className="hr-monospace">{formatCurrency(preview.fixed_allowance)}</span>
        </li>
        <li className="is-total">
          <span>Gross</span>
          <span className="hr-monospace">{formatCurrency(preview.gross_salary)}</span>
        </li>
        <li>
          <span>Provident fund (12% of basic)</span>
          <span className="hr-monospace hr-text-danger">-{formatCurrency(preview.pf)}</span>
        </li>
        <li>
          <span>Professional tax</span>
          <span className="hr-monospace hr-text-danger">-{formatCurrency(preview.tax)}</span>
        </li>
        <li className="is-total">
          <span>Net pay</span>
          <span className="hr-monospace">{formatCurrency(preview.net_salary)}</span>
        </li>
      </ul>
    </Modal>
  );
}
