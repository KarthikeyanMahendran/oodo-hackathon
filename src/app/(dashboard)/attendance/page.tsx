'use client';

import { useState } from 'react';
import { LogIn, LogOut, Users, Clock, CalendarCheck, UserX } from 'lucide-react';
import {
  PageHeader,
  Card,
  CardHeader,
  Table,
  Button,
  Input,
  StatusBadge,
  StatCard,
  StatGrid,
  Tabs,
  useToast,
  type Column,
  type TabItem,
} from '@/components/ui';
import { useAttendance } from '@/lib/hooks';
import { useHRMS } from '@/lib/context/HRMSContext';

const timeFmt = new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
const dateFmt = new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
const asTime = (iso?: string | null) => (iso ? timeFmt.format(new Date(iso)) : '—');

interface TeamRow {
  id: string;
  employee_name: string;
  department: string;
  status: 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LEAVE';
  check_in: string | null;
  check_out: string | null;
}

interface LogRow {
  id: string;
  date: string;
  check_in: string;
  check_out?: string | null;
  status: string;
  notes?: string;
}

export default function AttendancePage() {
  const { currentRole } = useHRMS();
  const { myLogs, teamToday, summary, query, setQuery, isPunchedIn, elapsedLabel, togglePunch, loading } = useAttendance();
  const showToast = useToast();
  const [notes, setNotes] = useState('');
  const [active, setActive] = useState('me');

  const isAdmin = currentRole === 'ADMIN';

  const handlePunch = () => {
    togglePunch(notes);
    showToast(isPunchedIn ? 'Checked out. Have a good evening.' : 'Checked in. Your shift timer is running.', 'success');
    setNotes('');
  };

  const teamColumns: Column<TeamRow>[] = [
    {
      header: 'Employee',
      render: (row) => (
        <div className="hr-cell-stack">
          <span className="hr-cell-primary">{row.employee_name}</span>
          <span className="hr-cell-secondary">{row.department}</span>
        </div>
      ),
    },
    { header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { header: 'Check in', render: (row) => <span className="hr-monospace">{asTime(row.check_in)}</span> },
    { header: 'Check out', render: (row) => <span className="hr-monospace">{asTime(row.check_out)}</span> },
  ];

  const logColumns: Column<LogRow>[] = [
    { header: 'Date', render: (row) => dateFmt.format(new Date(row.date)) },
    { header: 'Check in', render: (row) => <span className="hr-monospace">{asTime(row.check_in)}</span> },
    { header: 'Check out', render: (row) => <span className="hr-monospace">{asTime(row.check_out)}</span> },
    { header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { header: 'Notes', render: (row) => <span className="hr-cell-clamp">{row.notes || '—'}</span> },
  ];

  const tabs: TabItem[] = [
    { id: 'me', label: 'My Attendance', icon: <Clock size={15} /> },
    ...(isAdmin ? [{ id: 'team', label: 'Team Today', icon: <Users size={15} /> }] : []),
  ];

  return (
    <div className="hr-stack">
      <PageHeader title="Attendance" subtitle="Punch your shift and review the daily register" />

      <Card>
        <div className="hr-punch">
          <div className="hr-punch-status">
            <span className={`hr-punch-dot ${isPunchedIn ? 'is-live' : ''}`.trim()} aria-hidden />
            <div className="hr-cell-stack">
              <span className="hr-cell-primary">{isPunchedIn ? 'Shift active' : 'Checked out'}</span>
              <span className="hr-cell-secondary">
                {isPunchedIn ? 'Timer running since your check in' : 'Punch in to start your shift'}
              </span>
            </div>
          </div>

          <div className="hr-punch-timer hr-monospace">{isPunchedIn ? elapsedLabel : '00:00:00'}</div>

          <div className="hr-punch-action">
            {!isPunchedIn && (
              <Input
                placeholder="Add a note (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                aria-label="Shift note"
              />
            )}
            <Button
              variant={isPunchedIn ? 'danger' : 'primary'}
              onClick={handlePunch}
              icon={isPunchedIn ? <LogOut size={15} /> : <LogIn size={15} />}
            >
              {isPunchedIn ? 'Check out' : 'Check in'}
            </Button>
          </div>
        </div>
      </Card>

      {isAdmin && (
        <StatGrid loading={loading} count={4}>
          <StatCard label="Present" value={summary.PRESENT} tone="success" icon={<CalendarCheck size={44} />} />
          <StatCard label="On Leave" value={summary.LEAVE} tone="info" icon={<Clock size={44} />} />
          <StatCard label="Absent" value={summary.ABSENT} tone="danger" icon={<UserX size={44} />} />
          <StatCard label="Headcount" value={teamToday.length} icon={<Users size={44} />} />
        </StatGrid>
      )}

      <Tabs tabs={tabs} active={active} onChange={setActive}>
        {active === 'me' ? (
          <Card>
            <CardHeader title="My attendance log" subtitle="Your recent shifts" />
            <Table<LogRow>
              columns={logColumns}
              data={myLogs}
              loading={loading}
              rowKey={(r) => r.id}
              emptyMessage="No attendance recorded yet."
            />
          </Card>
        ) : (
          <Card>
            <CardHeader title="Team attendance — today" subtitle={`${teamToday.length} employees`} />
            <div className="hr-filter-bar">
              <Input
                placeholder="Search employees…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search employees"
              />
            </div>
            <Table<TeamRow> columns={teamColumns} data={teamToday} loading={loading} rowKey={(r) => r.id} />
          </Card>
        )}
      </Tabs>
    </div>
  );
}
