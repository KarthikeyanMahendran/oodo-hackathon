'use client';

import { Printer } from 'lucide-react';
import { Modal, Button } from '@/components/ui';
import type { PayslipRow } from '@/lib/hooks';
import { formatCurrency } from '@/lib/utils/salaryCalculator';

interface LineItem {
  label: string;
  amount: number;
}

export function PayslipModal({
  row,
  period,
  onClose,
}: {
  row: PayslipRow | null;
  period: string;
  onClose: () => void;
}) {
  if (!row) return null;
  const b = row.breakdown;

  const earnings: LineItem[] = [
    { label: 'Basic Salary', amount: b.basic_salary },
    { label: 'House Rent Allowance', amount: b.hra },
    { label: 'Standard Allowance', amount: b.standard_allowance },
    { label: 'Performance Bonus', amount: b.performance_bonus },
    { label: 'Leave Travel Allowance', amount: b.lta },
    { label: 'Fixed Allowance', amount: b.fixed_allowance },
  ];

  const deductions: LineItem[] = [
    { label: 'Provident Fund', amount: b.pf },
    { label: 'Professional Tax', amount: b.tax },
  ];

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={`Payslip — ${row.employee_name}`}
      subtitle={`${period} · ${row.department}`}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button onClick={() => window.print()} icon={<Printer size={14} />}>
            Print
          </Button>
        </>
      }
    >
      <div className="hr-payslip">
        <div className="hr-payslip-meta">
          <div>
            <span className="hr-summary-label">Employee code</span>
            <span className="hr-monospace">{row.login_id}</span>
          </div>
          <div>
            <span className="hr-summary-label">Pay period</span>
            <span>{period}</span>
          </div>
          <div>
            <span className="hr-summary-label">Annual CTC</span>
            <span className="hr-monospace">{formatCurrency(b.annual_ctc)}</span>
          </div>
        </div>

        <div className="hr-payslip-columns">
          <section>
            <h4 className="hr-section-title">Earnings</h4>
            <ul className="hr-line-items">
              {earnings.map((item) => (
                <li key={item.label}>
                  <span>{item.label}</span>
                  <span className="hr-monospace">{formatCurrency(item.amount)}</span>
                </li>
              ))}
              <li className="is-total">
                <span>Gross Salary</span>
                <span className="hr-monospace">{formatCurrency(b.gross_salary)}</span>
              </li>
            </ul>
          </section>

          <section>
            <h4 className="hr-section-title">Deductions</h4>
            <ul className="hr-line-items">
              {deductions.map((item) => (
                <li key={item.label}>
                  <span>{item.label}</span>
                  <span className="hr-monospace">{formatCurrency(item.amount)}</span>
                </li>
              ))}
              <li className="is-total">
                <span>Total Deductions</span>
                <span className="hr-monospace">{formatCurrency(b.total_deductions)}</span>
              </li>
            </ul>
          </section>
        </div>

        <div className="hr-payslip-net">
          <span>Net Pay</span>
          <strong className="hr-monospace">{formatCurrency(b.net_salary)}</strong>
        </div>
      </div>
    </Modal>
  );
}
