'use client';

import { ShieldCheck } from 'lucide-react';
import { PageHeader } from '@/components/ui';
import { GroupDirectory } from '@/components/features/employees/GroupDirectory';

export default function RolesPage() {
  return (
    <div className="hr-stack">
      <PageHeader title="Roles" subtitle="Access level assigned to each person" />
      <GroupDirectory groupBy="role" title="Roles" subtitle="Access level assigned to each person" columnLabel="Role" icon={ShieldCheck} />
    </div>
  );
}
