'use client';

import { PageHeader } from '@/components/ui';
import { ApprovalsInbox } from '@/components/features/approvals/ApprovalsInbox';
import { useApprovals } from '@/lib/hooks';

export default function ApprovalsPage() {
  const { pendingCount } = useApprovals();

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
