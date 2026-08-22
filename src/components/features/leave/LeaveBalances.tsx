'use client';

import { CalendarCheck, HeartPulse, CalendarX } from 'lucide-react';
import { StatCard, StatGrid } from '@/components/ui';
import type { LeaveBalance } from '@/lib/types/hrms';

export function LeaveBalances({ balance }: { balance: LeaveBalance }) {
  const paidLeft = balance.paid_days - balance.paid_used;
  const sickLeft = balance.sick_days - balance.sick_used;

  return (
    <StatGrid>
      <StatCard
        label="Paid Leave"
        value={`${paidLeft} / ${balance.paid_days}`}
        change={`${balance.paid_used} day(s) used`}
        tone={paidLeft > 0 ? 'success' : 'danger'}
        icon={<CalendarCheck size={44} />}
      />
      <StatCard
        label="Sick Leave"
        value={`${sickLeft} / ${balance.sick_days}`}
        change={`${balance.sick_used} day(s) used`}
        tone={sickLeft > 0 ? 'info' : 'danger'}
        icon={<HeartPulse size={44} />}
      />
      <StatCard
        label="Unpaid Leave"
        value={balance.unpaid_used}
        change="Days taken without pay"
        tone="warning"
        icon={<CalendarX size={44} />}
      />
    </StatGrid>
  );
}
