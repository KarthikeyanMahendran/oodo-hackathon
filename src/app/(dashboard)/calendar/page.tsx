'use client';

import { useState } from 'react';
import { User, Users } from 'lucide-react';
import { PageHeader, Tabs, type TabItem } from '@/components/ui';
import { TeamCalendar } from '@/components/features/calendar/TeamCalendar';
import { useHRMS } from '@/lib/context/HRMSContext';

export default function CalendarPage() {
  const { currentRole } = useHRMS();
  const [active, setActive] = useState('me');

  const tabs: TabItem[] = [
    { id: 'me', label: 'My Calendar', icon: <User size={15} /> },
    ...(currentRole === 'ADMIN' ? [{ id: 'team', label: 'Team Calendar', icon: <Users size={15} /> }] : []),
  ];

  return (
    <div className="hr-stack">
      <PageHeader title="Calendar" subtitle="Time off across the month" />
      <Tabs tabs={tabs} active={active} onChange={setActive}>
        <TeamCalendar scope={active === 'team' ? 'team' : 'me'} />
      </Tabs>
    </div>
  );
}
