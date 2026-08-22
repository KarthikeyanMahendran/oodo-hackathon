'use client';

import { CalendarDays } from 'lucide-react';
import { StatCard, StatGrid } from '@/components/ui';
import type { LeaveBalanceRow, LeaveType } from '@/lib/types/hrms';

/** Renders one tile per active leave type, driven by policy data — not a fixed set. */
export function LeaveBalances({ types, balanceFor }: { types: LeaveType[]; balanceFor: (leaveTypeId: string) => LeaveBalanceRow | null }) {
  if (types.length === 0) return null;

  return (
    <StatGrid>
      {types.map((t) => {
        const bal = balanceFor(t.id);
        const remaining = bal ? Number(bal.balance) : 0;
        const total = bal ? Number(bal.allocated_days) + Number(bal.carried_forward) : t.days_allowed_per_year;
        return (
          <StatCard
            key={t.id}
            label={t.name}
            value={t.is_paid ? `${remaining} / ${total}` : (bal ? Number(bal.taken_days) : 0)}
            change={t.is_paid ? `${bal ? Number(bal.taken_days) : 0} day(s) used` : 'Days taken without pay'}
            tone={!t.is_paid ? 'warning' : remaining > 0 ? 'success' : 'danger'}
            icon={<CalendarDays size={44} />}
          />
        );
      })}
    </StatGrid>
  );
}
