'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useHRMS } from '../context/HRMSContext';
import { decideLeaveRequest, listLeaveRequests, MigrationPendingError } from '../supabase/org';
import type { LeaveRequest, LeaveStatus } from '../types/hrms';

/**
 * Reads `leave_request_details` — the view that resolves employee and leave
 * type in one round trip. This is the single source of truth for time off;
 * the legacy `time_off` table is no longer read by the UI once migration 002
 * has run (see db_schema/migrations/002_org_structure_and_leave.sql).
 */
export function useLeaveRequests(scope: 'mine' | 'team' | 'all' = 'mine') {
  const { currentUser, currentRole, employees } = useHRMS();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [migrationPending, setMigrationPending] = useState(false);
  const [filter, setFilter] = useState<LeaveStatus | 'ALL'>(scope === 'mine' ? 'ALL' : 'PENDING');
  const [query, setQuery] = useState('');
  const [actingId, setActingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await listLeaveRequests(
        scope === 'mine' && currentUser ? { employeeId: currentUser.id } : {}
      );
      setRequests(rows);
      setMigrationPending(false);
    } catch (err) {
      if (err instanceof MigrationPendingError) setMigrationPending(true);
      else console.error('[leave_requests]', err);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [scope, currentUser]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await Promise.resolve();
      if (!cancelled) await load();
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  const reporteeIds = useMemo(
    () => new Set(employees.filter((e) => e.manager_id === currentUser?.id).map((e) => e.id)),
    [employees, currentUser?.id]
  );

  const visible = useMemo(() => {
    if (scope === 'mine') return requests;
    if (scope === 'team' || currentRole !== 'ADMIN') {
      return requests.filter((r) => reporteeIds.has(r.employee_id));
    }
    return requests; // scope === 'all' and caller is ADMIN
  }, [requests, scope, currentRole, reporteeIds]);

  const counts = useMemo(() => {
    const base: Record<LeaveStatus | 'ALL', number> = { ALL: visible.length, PENDING: 0, APPROVED: 0, REJECTED: 0 };
    for (const r of visible) base[r.status] += 1;
    return base;
  }, [visible]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return visible
      .filter((r) => (filter === 'ALL' ? true : r.status === filter))
      .filter((r) =>
        q
          ? (r.employee_name || '').toLowerCase().includes(q) ||
            (r.department_name || '').toLowerCase().includes(q) ||
            (r.reason || '').toLowerCase().includes(q)
          : true
      );
  }, [visible, filter, query]);

  const decide = useCallback(
    async (id: string, status: 'APPROVED' | 'REJECTED', rejectionReason?: string) => {
      if (!currentUser) return false;
      setActingId(id);
      try {
        await decideLeaveRequest(id, status, currentUser.id, rejectionReason);
        await load();
        return true;
      } catch (err) {
        console.error('[leave_requests] decide failed:', err);
        return false;
      } finally {
        setActingId(null);
      }
    },
    [currentUser, load]
  );

  return {
    requests: filtered,
    all: visible,
    counts,
    pendingCount: counts.PENDING,
    filter,
    setFilter,
    query,
    setQuery,
    decide,
    actingId,
    loading,
    migrationPending,
    refresh: load,
  };
}
