'use client';

import { useState } from 'react';
import { User, Users } from 'lucide-react';
import { PageHeader, Tabs, type TabItem } from '@/components/ui';
import { MyLeaves } from '@/components/features/leave';
import { ApprovalsInbox } from '@/components/features/approvals/ApprovalsInbox';
import { useHRMS } from '@/lib/context/HRMSContext';
import { useApprovals } from '@/lib/hooks';

export default function TimeOffPage() {
  const { currentRole } = useHRMS();
  const { pendingCount } = useApprovals();
  const [active, setActive] = useState('mine');

  const tabs: TabItem[] = [
    { id: 'mine', label: 'My Leave', icon: <User size={15} /> },
    ...(currentRole === 'ADMIN'
      ? [{ id: 'team', label: 'Team Requests', icon: <Users size={15} />, count: pendingCount }]
      : []),
  ];

  return (
    <div className="hr-stack">
      <PageHeader title="Time Off" subtitle="Balances, requests and approvals in one place" />
      <Tabs tabs={tabs} active={active} onChange={setActive}>
        {active === 'mine' ? <MyLeaves /> : <ApprovalsInbox />}
      </Tabs>
    </div>
  );
}
