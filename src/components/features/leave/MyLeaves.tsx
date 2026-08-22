'use client';

import { useState } from 'react';
import { Plus, CalendarDays } from 'lucide-react';
import { Card, CardHeader, Table, Button, StatusBadge, Badge, EmptyState, type Column } from '@/components/ui';
import { useLeave } from '@/lib/hooks';
import { LeaveBalances } from './LeaveBalances';
import { LeaveRequestModal } from './LeaveRequestModal';
import type { TimeOffRecord } from '@/lib/types/hrms';

type Row = TimeOffRecord;

const dateFmt = new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
const fmt = (iso: string) => (iso ? dateFmt.format(new Date(iso)) : '—');

export function MyLeaves() {
  const { balance, myRequests, countByStatus } = useLeave();
  const [modalOpen, setModalOpen] = useState(false);

  const columns: Column<Row>[] = [
    { header: 'Type', render: (row) => <Badge tone="muted">{row.type}</Badge> },
    {
      header: 'Dates',
      render: (row) => (
        <div className="hr-cell-stack">
          <span>
            {fmt(row.start_date)} → {fmt(row.end_date)}
          </span>
          <span className="hr-cell-secondary">{row.days_count} day(s)</span>
        </div>
      ),
    },
    { header: 'Reason', render: (row) => <span className="hr-cell-clamp">{row.reason || '—'}</span> },
    { header: 'Applied', render: (row) => fmt(row.created_at) },
    { header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    {
      header: 'Response',
      render: (row) => <span className="hr-cell-secondary">{row.admin_comment || '—'}</span>,
    },
  ];

  return (
    <div className="hr-stack">
      <LeaveBalances balance={balance} />

      <Card>
        <CardHeader
          title="My requests"
          subtitle={`${countByStatus.PENDING} pending · ${countByStatus.APPROVED} approved · ${countByStatus.REJECTED} rejected`}
          actions={
            <Button onClick={() => setModalOpen(true)} icon={<Plus size={14} />}>
              Request time off
            </Button>
          }
        />

        {myRequests.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="No time off requested yet"
            description="When you request leave it appears here with its approval status."
          >
            <Button onClick={() => setModalOpen(true)} icon={<Plus size={14} />}>
              Request time off
            </Button>
          </EmptyState>
        ) : (
          <Table<Row> columns={columns} data={myRequests} rowKey={(r) => r.id} />
        )}
      </Card>

      <LeaveRequestModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
