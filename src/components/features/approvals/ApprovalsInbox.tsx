'use client';

import { useState } from 'react';
import { Check, X, Inbox, Clock } from 'lucide-react';
import {
  Card,
  CardHeader,
  Table,
  Button,
  Input,
  StatusBadge,
  Badge,
  EmptyState,
  Modal,
  Textarea,
  useToast,
  type Column,
} from '@/components/ui';
import { useApprovals } from '@/lib/hooks';
import type { LeaveStatus, TimeOffRecord } from '@/lib/types/hrms';

type Row = TimeOffRecord;

const FILTERS: Array<{ id: LeaveStatus | 'ALL'; label: string }> = [
  { id: 'PENDING', label: 'Pending' },
  { id: 'APPROVED', label: 'Approved' },
  { id: 'REJECTED', label: 'Rejected' },
  { id: 'ALL', label: 'All' },
];

const dateFmt = new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
const fmt = (iso: string) => (iso ? dateFmt.format(new Date(iso)) : '—');

export function ApprovalsInbox() {
  const { requests, counts, filter, setFilter, query, setQuery, decide, actingId } = useApprovals();
  const showToast = useToast();
  const [rejecting, setRejecting] = useState<TimeOffRecord | null>(null);
  const [comment, setComment] = useState('');

  const approve = async (row: TimeOffRecord) => {
    await decide(row.id, 'APPROVED');
    showToast(`Approved ${row.days_count} day(s) for ${row.employee_name}.`, 'success');
  };

  const confirmReject = async () => {
    if (!rejecting) return;
    await decide(rejecting.id, 'REJECTED', comment.trim() || undefined);
    showToast(`Rejected the request from ${rejecting.employee_name}.`, 'info');
    setRejecting(null);
    setComment('');
  };

  const columns: Column<Row>[] = [
    {
      header: 'Employee',
      render: (row) => (
        <div className="hr-cell-stack">
          <span className="hr-cell-primary">{row.employee_name}</span>
          <span className="hr-cell-secondary">{row.department}</span>
        </div>
      ),
    },
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
    {
      header: 'Reason',
      render: (row) => <span className="hr-cell-clamp">{row.reason || '—'}</span>,
    },
    { header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    {
      header: '',
      align: 'right',
      render: (row) =>
        row.status === 'PENDING' ? (
          <div className="hr-row-actions">
            <Button
              variant="secondary"
              onClick={() => approve(row)}
              loading={actingId === row.id}
              icon={<Check size={14} />}
            >
              Approve
            </Button>
            <Button variant="danger" onClick={() => setRejecting(row)} icon={<X size={14} />}>
              Reject
            </Button>
          </div>
        ) : (
          <span className="hr-cell-secondary">{row.admin_comment || 'Closed'}</span>
        ),
    },
  ];

  return (
    <div className="hr-stack">
      <Card>
        <CardHeader
          title="Approvals inbox"
          subtitle="Leave requests awaiting a decision"
          actions={
            counts.PENDING > 0 ? (
              <Badge tone="warning">
                <Clock size={12} /> {counts.PENDING} pending
              </Badge>
            ) : (
              <Badge tone="success">All clear</Badge>
            )
          }
        />

        <div className="hr-filter-bar">
          <div className="hr-segmented" role="tablist">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                role="tab"
                aria-selected={filter === f.id}
                className={`hr-segmented-btn ${filter === f.id ? 'active' : ''}`.trim()}
                onClick={() => setFilter(f.id)}
              >
                {f.label}
                <span className="tab-count">{counts[f.id]}</span>
              </button>
            ))}
          </div>
          <Input
            placeholder="Search employee, department or reason…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search requests"
          />
        </div>

        {requests.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title={filter === 'PENDING' ? 'Nothing waiting on you' : 'No requests here'}
            description={
              filter === 'PENDING'
                ? 'Every leave request has been actioned. New submissions will land here.'
                : 'Try a different filter or clear the search.'
            }
          />
        ) : (
          <Table<Row> columns={columns} data={requests} rowKey={(r) => r.id} />
        )}
      </Card>

      <Modal
        isOpen={!!rejecting}
        onClose={() => setRejecting(null)}
        title="Reject leave request"
        subtitle={rejecting ? `${rejecting.employee_name} · ${rejecting.days_count} day(s)` : undefined}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRejecting(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmReject}>
              Reject request
            </Button>
          </>
        }
      >
        <Textarea
          label="Reason for rejection"
          hint="Shared with the employee so they know what to change."
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="e.g. Team coverage is short that week — please reschedule."
        />
      </Modal>
    </div>
  );
}
