'use client';

import { Building2 } from 'lucide-react';
import { PageHeader } from '@/components/ui';
import { GroupDirectory } from '@/components/features/employees/GroupDirectory';

export default function DepartmentsPage() {
  return (
    <div className="hr-stack">
      <PageHeader title="Departments" subtitle="Headcount grouped by department" />
      <GroupDirectory groupBy="department" title="Departments" subtitle="Headcount grouped by department" columnLabel="Department" icon={Building2} />
    </div>
  );
}
