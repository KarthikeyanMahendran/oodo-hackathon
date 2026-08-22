'use client';

import { useCallback, useEffect, useState } from 'react';
import { listLeaveBalances, listLeaveTypes, MigrationPendingError } from '../supabase/org';
import type { LeaveBalanceRow, LeaveType } from '../types/hrms';

/** Leave policy and the signed-in employee's balances, both keyed by id. */
export function useLeaveCatalog(employeeId?: string, year = new Date().getFullYear()) {
  const [types, setTypes] = useState<LeaveType[]>([]);
  const [balances, setBalances] = useState<LeaveBalanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [migrationPending, setMigrationPending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await listLeaveTypes();
      setTypes(list);
      setBalances(employeeId ? await listLeaveBalances(employeeId, year) : []);
      setMigrationPending(false);
    } catch (err) {
      if (err instanceof MigrationPendingError) setMigrationPending(true);
      else console.error('[leave]', err);
      setTypes([]);
      setBalances([]);
    } finally {
      setLoading(false);
    }
  }, [employeeId, year]);

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

  const balanceFor = useCallback(
    (leaveTypeId: string) => balances.find((b) => b.leave_type_id === leaveTypeId) ?? null,
    [balances]
  );

  return { types, balances, balanceFor, loading, migrationPending, refresh: load };
}
