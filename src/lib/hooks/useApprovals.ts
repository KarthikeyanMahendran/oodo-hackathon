'use client';

import { useCallback, useMemo, useState } from 'react';
import { useHRMS } from '../context/HRMSContext';
import type { LeaveStatus, TimeOffRecord } from '../types/hrms';

export type ApprovalScope = 'ALL' | 'TEAM';

/**
 * The approvals inbox. Admins see every request; a manager sees only requests
 * raised by their direct reports.
 */
export function useApprovals(scope: ApprovalScope = 'ALL') {
  const { currentUser, currentRole, employees, timeOffRequests, handleTimeOffAction, isLoading } = useHRMS();
  const [filter, setFilter] = useState<LeaveStatus | 'ALL'>('PENDING');
  const [query, setQuery] = useState('');
  const [actingId, setActingId] = useState<string | null>(null);

  const reporteeIds = useMemo(
    () => new Set(employees.filter((e) => e.manager_id === currentUser?.id).map((e) => e.id)),
    [employees, currentUser?.id]
  );

  const visible = useMemo(() => {
    const isAdmin = currentRole === 'ADMIN';
    return timeOffRequests.filter((r: TimeOffRecord) => {
      if (scope === 'TEAM' || !isAdmin) return reporteeIds.has(r.user_id);
      return true;
    });
  }, [timeOffRequests, scope, currentRole, reporteeIds]);

  const counts = useMemo(() => {
    const base: Record<LeaveStatus | 'ALL', number> = { ALL: visible.length, PENDING: 0, APPROVED: 0, REJECTED: 0 };
    for (const r of visible) base[r.status] += 1;
    return base;
  }, [visible]);

  const requests = useMemo(() => {
    const q = query.trim().toLowerCase();
    return visible
      .filter((r) => (filter === 'ALL' ? true : r.status === filter))
      .filter((r) =>
        q
          ? (r.employee_name || '').toLowerCase().includes(q) ||
            (r.department || '').toLowerCase().includes(q) ||
            (r.reason || '').toLowerCase().includes(q)
          : true
      )
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [visible, filter, query]);

  const decide = useCallback(
    async (id: string, status: 'APPROVED' | 'REJECTED', comment?: string) => {
      setActingId(id);
      try {
        handleTimeOffAction(id, status, comment);
        return true;
      } finally {
        setActingId(null);
      }
    },
    [handleTimeOffAction]
  );

  return {
    requests,
    counts,
    filter,
    setFilter,
    query,
    setQuery,
    decide,
    actingId,
    pendingCount: counts.PENDING,
    loading: isLoading,
  };
}
