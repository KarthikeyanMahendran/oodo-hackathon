'use client';

import { PageHeader } from '@/components/ui';
import { ApprovalsInbox } from '@/components/features/approvals/ApprovalsInbox';
import { useLeaveRequests } from '@/lib/hooks';

export default function ApprovalsPage() {
  const { pendingCount } = useLeaveRequests('all');

  return (
    <div className="hr-stack">
      <PageHeader
        title="Approvals"
        subtitle={
          pendingCount > 0
            ? `${pendingCount} request(s) need a decision`
            : 'Everything has been actioned'
        }
      />
      <ApprovalsInbox />
    </div>
  );
}
