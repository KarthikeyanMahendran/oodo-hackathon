'use client';

import { useState } from 'react';
import { LayoutGrid, Play, Layers, ShieldCheck, RefreshCw } from 'lucide-react';
import { PageHeader, Tabs, IconButton, type TabItem } from '@/components/ui';
import { useToast } from '@/components/ui';
import {
  PayrollOverview,
  PayrollRegister,
  SalaryStructures,
  StatutorySettings,
} from '@/components/features/payroll';
import { usePayroll } from '@/lib/hooks';

const TABS: TabItem[] = [
  { id: 'overview', label: 'Overview', icon: <LayoutGrid size={15} /> },
  { id: 'register', label: 'Run Payroll', icon: <Play size={15} /> },
  { id: 'structures', label: 'Salary Structures', icon: <Layers size={15} /> },
  { id: 'settings', label: 'Statutory', icon: <ShieldCheck size={15} /> },
];

const HEADERS: Record<string, { title: string; subtitle: string }> = {
  overview: { title: 'Payroll Overview', subtitle: 'Cost, headcount and statutory position for the cycle' },
  register: { title: 'Run Payroll', subtitle: 'Review the register and settle the monthly disbursement' },
  structures: { title: 'Salary Structures', subtitle: 'Wages and the components derived from them' },
  settings: { title: 'Statutory Settings', subtitle: 'Component formulas and deduction rules' },
};

export default function PayrollPage() {
  const [active, setActive] = useState('overview');
  const { period, totals } = usePayroll();
  const showToast = useToast();

  const header = HEADERS[active];

  return (
    <div className="hr-stack">
      <PageHeader
        title={header.title}
        subtitle={header.subtitle}
        actions={
          <>
            <span className="hr-period-chip hr-monospace">{period}</span>
            <IconButton
              label="Refresh"
              onClick={() => showToast(`Recalculated ${totals.headcount} salary structures.`, 'info')}
            >
              <RefreshCw size={16} />
            </IconButton>
          </>
        }
      />

      <Tabs tabs={TABS} active={active} onChange={setActive}>
        {active === 'overview' && <PayrollOverview onNavigate={setActive} />}
        {active === 'register' && <PayrollRegister />}
        {active === 'structures' && <SalaryStructures />}
        {active === 'settings' && <StatutorySettings />}
      </Tabs>
    </div>
  );
}
