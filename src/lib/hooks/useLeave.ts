'use client';

import { useCallback, useMemo, useState } from 'react';
import { useHRMS } from '../context/HRMSContext';
import type { LeaveStatus, LeaveTypeCode, TimeOffRecord } from '../types/hrms';

export interface LeaveDraft {
  type: LeaveTypeCode;
  start_date: string;
  end_date: string;
  reason: string;
}

const EMPTY_DRAFT: LeaveDraft = { type: 'PAID', start_date: '', end_date: '', reason: '' };

/** Inclusive day count between two ISO dates. */
export function countDays(start: string, end: string): number {
  if (!start || !end) return 0;
  const a = new Date(start).getTime();
  const b = new Date(end).getTime();
  if (Number.isNaN(a) || Number.isNaN(b) || b < a) return 0;
  return Math.floor((b - a) / 86400000) + 1;
}

/**
 * Validates a draft against the employee's remaining balance. Returns a map of
 * field -> message so the form can render errors inline.
 */
export function validateLeave(
  draft: LeaveDraft,
  balance: { paid_days: number; paid_used: number; sick_days: number; sick_used: number }
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!draft.start_date) errors.start_date = 'Select a start date.';
  if (!draft.end_date) errors.end_date = 'Select an end date.';

  const days = countDays(draft.start_date, draft.end_date);
  if (draft.start_date && draft.end_date && days === 0) {
    errors.end_date = 'End date must be on or after the start date.';
  }
  if (!draft.reason.trim()) errors.reason = 'A reason is required.';

  if (days > 0) {
    if (draft.type === 'PAID') {
      const remaining = balance.paid_days - balance.paid_used;
      if (days > remaining) errors.type = `Only ${remaining} paid day(s) remaining.`;
    } else if (draft.type === 'SICK') {
      const remaining = balance.sick_days - balance.sick_used;
      if (days > remaining) errors.type = `Only ${remaining} sick day(s) remaining.`;
    }
  }
  return errors;
}

export function useLeave(userId?: string) {
  const { currentUser, timeOffRequests, applyForTimeOff, getUserLeaveBalance, isLoading } = useHRMS();
  const [draft, setDraft] = useState<LeaveDraft>(EMPTY_DRAFT);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const targetId = userId ?? currentUser?.id ?? '';
  const balance = useMemo(() => getUserLeaveBalance(targetId), [targetId, getUserLeaveBalance]);

  const myRequests = useMemo(
    () =>
      timeOffRequests
        .filter((r: TimeOffRecord) => r.user_id === targetId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [timeOffRequests, targetId]
  );

  const countByStatus = useMemo(() => {
    const counts: Record<LeaveStatus, number> = { PENDING: 0, APPROVED: 0, REJECTED: 0 };
    for (const r of myRequests) counts[r.status] += 1;
    return counts;
  }, [myRequests]);

  const days = countDays(draft.start_date, draft.end_date);

  const setField = useCallback(<K extends keyof LeaveDraft>(key: K, value: LeaveDraft[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key as string]) return prev;
      const next = { ...prev };
      delete next[key as string];
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setDraft(EMPTY_DRAFT);
    setErrors({});
  }, []);

  const submit = useCallback(async (): Promise<boolean> => {
    const found = validateLeave(draft, balance);
    setErrors(found);
    if (Object.keys(found).length > 0) return false;

    setSaving(true);
    try {
      applyForTimeOff({
        user_id: targetId,
        type: draft.type,
        start_date: draft.start_date,
        end_date: draft.end_date,
        days_count: days,
        reason: draft.reason.trim(),
      });
      reset();
      return true;
    } finally {
      setSaving(false);
    }
  }, [draft, balance, applyForTimeOff, targetId, days, reset]);

  return {
    draft,
    setField,
    reset,
    errors,
    days,
    saving,
    submit,
    balance,
    myRequests,
    countByStatus,
    loading: isLoading,
  };
}
