'use client';

import { BriefcaseBusiness } from 'lucide-react';
import { PageHeader } from '@/components/ui';
import { GroupDirectory } from '@/components/features/employees/GroupDirectory';

export default function DesignationsPage() {
  return (
    <div className="hr-stack">
      <PageHeader title="Designations" subtitle="Roles people hold across the org" />
      <GroupDirectory groupBy="job_position" title="Designations" subtitle="Roles people hold across the org" columnLabel="Designation" icon={BriefcaseBusiness} />
    </div>
  );
}
