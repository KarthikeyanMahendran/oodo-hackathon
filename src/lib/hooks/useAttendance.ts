'use client';

import { useMemo, useState } from 'react';
import { useHRMS } from '../context/HRMSContext';
import type { AttendanceRecord } from '../types/hrms';

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
}

export function useAttendance(userId?: string) {
  const {
    currentUser,
    attendanceLogs,
    isPunchedIn,
    punchInTime,
    elapsedSeconds,
    handlePunchToggle,
    getUserLiveStatus,
    employees,
    isLoading,
  } = useHRMS();
  const [query, setQuery] = useState('');

  const targetId = userId ?? currentUser?.id ?? '';

  const myLogs = useMemo(
    () =>
      attendanceLogs
        .filter((a: AttendanceRecord) => a.user_id === targetId)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [attendanceLogs, targetId]
  );

  const teamToday = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const q = query.trim().toLowerCase();
    return employees
      .filter((e) => (q ? `${e.first_name} ${e.last_name}`.toLowerCase().includes(q) : true))
      .map((e) => {
        const log = attendanceLogs.find((a) => a.user_id === e.id && a.date === today);
        return {
          id: e.id,
          employee_name: `${e.first_name} ${e.last_name}`.trim(),
          department: e.department || '—',
          status: getUserLiveStatus(e.id),
          check_in: log?.check_in ?? null,
          check_out: log?.check_out ?? null,
        };
      });
  }, [employees, attendanceLogs, getUserLiveStatus, query]);

  const summary = useMemo(() => {
    const counts = { PRESENT: 0, ABSENT: 0, LEAVE: 0, HALF_DAY: 0 };
    for (const row of teamToday) counts[row.status] += 1;
    return counts;
  }, [teamToday]);

  return {
    myLogs,
    teamToday,
    summary,
    query,
    setQuery,
    isPunchedIn,
    punchInTime,
    elapsedSeconds,
    elapsedLabel: formatDuration(elapsedSeconds),
    togglePunch: handlePunchToggle,
    loading: isLoading,
  };
}
