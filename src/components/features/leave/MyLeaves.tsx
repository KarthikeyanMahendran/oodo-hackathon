'use client';

import { useState } from 'react';
import { Plus, CalendarDays } from 'lucide-react';
import { Card, CardHeader, Table, Button, StatusBadge, Badge, EmptyState, type Column } from '@/components/ui';
import { useHRMS } from '@/lib/context/HRMSContext';
import { useLeaveCatalog, useLeaveRequests } from '@/lib/hooks';
import { LeaveBalances } from './LeaveBalances';
import { LeaveRequestModal } from './LeaveRequestModal';
import type { LeaveRequest } from '@/lib/types/hrms';

const dateFmt = new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
const fmt = (iso: string) => (iso ? dateFmt.format(new Date(iso)) : '—');

export function MyLeaves() {
  const { currentUser } = useHRMS();
  const { types, balanceFor, migrationPending: catalogPending } = useLeaveCatalog(currentUser?.id);
  const { requests, counts, loading, migrationPending, refresh } = useLeaveRequests('mine');
  const [modalOpen, setModalOpen] = useState(false);

  const columns: Column<LeaveRequest>[] = [
    {
      header: 'Type',
      render: (row) => (
        <Badge tone="muted">
          {row.leave_type_name}
          {row.is_half_day ? ' · Half day' : ''}
        </Badge>
      ),
    },
    {
      header: 'Dates',
      render: (row) => (
        <div className="hr-cell-stack">
          <span>
            {fmt(row.from_date)} → {fmt(row.to_date)}
          </span>
          <span className="hr-cell-secondary">{row.total_days} day(s)</span>
        </div>
      ),
    },
    { header: 'Reason', render: (row) => <span className="hr-cell-clamp">{row.reason || '—'}</span> },
    { header: 'Applied', render: (row) => fmt(row.applied_on || row.created_at || '') },
    { header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    {
      header: 'Response',
      render: (row) => <span className="hr-cell-secondary">{row.rejection_reason || (row.approved_by_name ? `Approved by ${row.approved_by_name}` : '—')}</span>,
    },
  ];

  return (
    <div className="hr-stack">
      <LeaveBalances types={types} balanceFor={balanceFor} />

      <Card>
        <CardHeader
          title="My requests"
          subtitle={`${counts.PENDING} pending · ${counts.APPROVED} approved · ${counts.REJECTED} rejected`}
          actions={
            <Button onClick={() => setModalOpen(true)} icon={<Plus size={14} />} disabled={migrationPending || catalogPending}>
              Request time off
            </Button>
          }
        />

        {migrationPending ? (
          <EmptyState
            icon={CalendarDays}
            title="Migration required"
            description="Run db_schema/migrations/002_org_structure_and_leave.sql to enable leave requests."
          />
        ) : requests.length === 0 && !loading ? (
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
          <Table<LeaveRequest> columns={columns} data={requests} loading={loading} rowKey={(r) => r.id} />
        )}
      </Card>

      <LeaveRequestModal isOpen={modalOpen} onClose={() => { setModalOpen(false); void refresh(); }} />
    </div>
  );
}
