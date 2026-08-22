'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { Card, Badge, IconButton, Button, EmptyState } from '@/components/ui';
import { useLeaveRequests } from '@/lib/hooks';
import type { LeaveRequest } from '@/lib/types/hrms';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_FMT = new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' });
const DAY_FMT = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' });

interface DayCell {
  date: Date;
  iso: string;
  inMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  leave: LeaveRequest[];
}

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Falls back to a neutral tone for any leave type beyond the seeded three.
const TONE: Record<string, 'success' | 'info' | 'warning'> = {
  PAID: 'success',
  SICK: 'info',
  UNPAID: 'warning',
};

export function TeamCalendar({ scope }: { scope: 'me' | 'team' }) {
  const { all: leaveRequests } = useLeaveRequests(scope === 'team' ? 'all' : 'mine');
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selected, setSelected] = useState<string | null>(null);

  const relevant = useMemo(
    () => leaveRequests.filter((r) => r.status !== 'REJECTED'),
    [leaveRequests]
  );

  const cells = useMemo<DayCell[]>(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const offset = (new Date(year, month, 1).getDay() + 6) % 7; // Monday-first grid
    const start = new Date(year, month, 1 - offset);
    const todayIso = iso(new Date());

    return Array.from({ length: 42 }, (_, i) => {
      const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      const key = iso(date);
      const day = date.getDay();
      return {
        date,
        iso: key,
        inMonth: date.getMonth() === month,
        isToday: key === todayIso,
        isWeekend: day === 0 || day === 6,
        leave: relevant.filter((r) => r.from_date <= key && r.to_date >= key),
      };
    });
  }, [cursor, relevant]);

  const monthLeave = cells.filter((c) => c.inMonth).flatMap((c) => c.leave);
  const uniqueInMonth = new Set(monthLeave.map((r) => r.id)).size;
  const selectedCell = cells.find((c) => c.iso === selected);

  const shift = (delta: number) =>
    setCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));

  return (
    <div className="hr-stack">
      <Card>
        <div className="hr-cal-head">
          <div className="hr-cal-nav">
            <IconButton label="Previous month" onClick={() => shift(-1)}>
              <ChevronLeft size={16} />
            </IconButton>
            <h3 className="hr-cal-month">{MONTH_FMT.format(cursor)}</h3>
            <IconButton label="Next month" onClick={() => shift(1)}>
              <ChevronRight size={16} />
            </IconButton>
          </div>
          <div className="hr-cal-actions">
            <span className="hr-cell-secondary">
              {uniqueInMonth} {uniqueInMonth === 1 ? 'request' : 'requests'} this month
            </span>
            <Button
              variant="secondary"
              onClick={() => {
                const d = new Date();
                setCursor(new Date(d.getFullYear(), d.getMonth(), 1));
                setSelected(null);
              }}
            >
              Today
            </Button>
          </div>
        </div>

        <div className="hr-cal-legend">
          <span><i className="hr-dot is-success" /> Paid</span>
          <span><i className="hr-dot is-info" /> Sick</span>
          <span><i className="hr-dot is-warning" /> Unpaid</span>
        </div>

        <div className="hr-cal-grid" role="grid">
          {WEEKDAYS.map((d) => (
            <div key={d} className="hr-cal-weekday">{d}</div>
          ))}
          {cells.map((cell) => (
            <button
              key={cell.iso}
              type="button"
              onClick={() => setSelected(cell.leave.length ? cell.iso : null)}
              className={[
                'hr-cal-cell',
                cell.inMonth ? '' : 'is-muted',
                cell.isToday ? 'is-today' : '',
                cell.isWeekend ? 'is-weekend' : '',
                cell.iso === selected ? 'is-selected' : '',
              ].filter(Boolean).join(' ')}
              aria-label={`${DAY_FMT.format(cell.date)}${cell.leave.length ? `, ${cell.leave.length} on leave` : ''}`}
            >
              <span className="hr-cal-date">{cell.date.getDate()}</span>
              <span className="hr-cal-marks">
                {cell.leave.slice(0, 3).map((r) => (
                  <i key={r.id} className={`hr-dot is-${TONE[r.leave_type_code ?? ''] ?? 'muted'}`} />
                ))}
                {cell.leave.length > 3 && <span className="hr-cal-more">+{cell.leave.length - 3}</span>}
              </span>
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="hr-card-title">
          {selectedCell ? DAY_FMT.format(selectedCell.date) : 'Time off this month'}
        </h3>
        {selectedCell ? (
          <ul className="hr-cal-list">
            {selectedCell.leave.map((r) => (
              <li key={r.id}>
                <span className="hr-cell-stack">
                  <span className="hr-cell-primary">{r.employee_name}</span>
                  <span className="hr-cell-secondary">{r.department_name}</span>
                </span>
                <Badge tone={TONE[r.leave_type_code ?? ''] ?? 'muted'}>{r.leave_type_name}</Badge>
                <Badge tone={r.status === 'APPROVED' ? 'success' : 'warning'}>{r.status}</Badge>
              </li>
            ))}
          </ul>
        ) : monthLeave.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="Nothing scheduled"
            description="Approved and pending leave will appear on this calendar."
          />
        ) : (
          <p className="hr-form-hint">Select a highlighted day to see who is away.</p>
        )}
      </Card>
    </div>
  );
}
