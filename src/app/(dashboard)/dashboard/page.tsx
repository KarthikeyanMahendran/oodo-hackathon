'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Users, CalendarOff, Building2, ShieldCheck, Clock, Plus, ArrowRight } from 'lucide-react';
import { Card, Button, Table, StatusBadge, type Column } from '@/components/ui';
import { EmployeeModal } from '@/components/features/employees/EmployeeModal';
import { useHRMS } from '@/lib/context/HRMSContext';
import { useAttendance, useEmployees, useOrgStructure } from '@/lib/hooks';
import type { Profile } from '@/lib/types/hrms';

const dateFmt = new Intl.DateTimeFormat('en-IN', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
const timeFmt = new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

interface TileProps {
  icon: React.ReactNode;
  tone: 'blue' | 'green' | 'indigo' | 'amber';
  value: React.ReactNode;
  label: string;
  sub: string;
}

function StatTile({ icon, tone, value, label, sub }: TileProps) {
  return (
    <Card className="hr-tile">
      <span className={`hr-tile-icon is-${tone}`} aria-hidden>
        {icon}
      </span>
      <span className="hr-tile-value">{value}</span>
      <span className="hr-tile-label">{label}</span>
      <span className="hr-tile-sub">{sub}</span>
    </Card>
  );
}

export default function DashboardPage() {
  const { currentUser, currentRole, employees } = useHRMS();
  const { allEmployees } = useEmployees();
  const { departments } = useOrgStructure();
  const { summary, teamToday } = useAttendance();
  const [modalOpen, setModalOpen] = useState(false);

  const isAdmin = currentRole === 'ADMIN';
  const adminCount = employees.filter((e) => e.role === 'ADMIN').length;
  const onLeaveToday = teamToday.filter((r) => r.status === 'LEAVE').length;

  const punches = useMemo(() => {
    const withIn = teamToday.filter((r) => r.check_in);
    if (withIn.length === 0) return { first: null as string | null, last: null as string | null };
    const ins = withIn.map((r) => new Date(r.check_in as string).getTime());
    const outs = teamToday.filter((r) => r.check_out).map((r) => new Date(r.check_out as string).getTime());
    return {
      first: timeFmt.format(new Date(Math.min(...ins))),
      last: outs.length ? timeFmt.format(new Date(Math.max(...outs))) : null,
    };
  }, [teamToday]);

  const newJoiners = useMemo(
    () =>
      [...allEmployees]
        .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
        .slice(0, 5),
    [allEmployees]
  );

  const byDepartment = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of allEmployees) map.set(e.department || 'Unassigned', (map.get(e.department || 'Unassigned') ?? 0) + 1);
    return [...map.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [allEmployees]);

  const joinerColumns: Column<Profile>[] = [
    {
      header: 'Employee',
      render: (row) => (
        <Link href={`/employees/${row.id}`} className="hr-cell-link">
          <span className="hr-avatar hr-avatar-sm">
            {`${row.first_name?.[0] ?? ''}${row.last_name?.[0] ?? ''}`.toUpperCase()}
          </span>
          <span className="hr-cell-stack">
            <span className="hr-cell-primary">
              {row.first_name} {row.last_name}
            </span>
            <span className="hr-cell-secondary">{row.job_position || '—'}</span>
          </span>
        </Link>
      ),
    },
    { header: 'Department', accessor: 'department' },
    { header: 'Today', render: (row) => <StatusBadge status={row.role === 'ADMIN' ? 'APPROVED' : 'PENDING'} /> },
  ];

  return (
    <div className="hr-stack">
      <div className="hr-greeting">
        <div>
          <h2 className="hr-greeting-title">
            {greeting()}, {currentUser?.first_name ?? 'there'}
          </h2>
          <p className="hr-subtext">
            Here&rsquo;s a snapshot of your workforce today · {dateFmt.format(new Date())}
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setModalOpen(true)} icon={<Plus size={15} />}>
            Add employee
          </Button>
        )}
      </div>

      <div className="hr-tile-grid">
        <StatTile
          icon={<Users size={20} />}
          tone="blue"
          value={allEmployees.length}
          label="Total employees"
          sub={`${allEmployees.length} active`}
        />
        <StatTile
          icon={<CalendarOff size={20} />}
          tone="green"
          value={onLeaveToday}
          label="On leave today"
          sub="Approved time off"
        />
        <StatTile
          icon={<Building2 size={20} />}
          tone="indigo"
          value={departments.length}
          label="Departments"
          sub="Across the org"
        />
        <StatTile
          icon={<ShieldCheck size={20} />}
          tone="amber"
          value={adminCount}
          label="Admins"
          sub="With elevated access"
        />
      </div>

      <div className="hr-split">
        <Card>
          <div className="hr-panel-head">
            <div>
              <h3 className="hr-card-title">Today&rsquo;s attendance</h3>
              <p className="hr-subtext">Across the workforce · {dateFmt.format(new Date())}</p>
            </div>
            <Link href="/attendance" className="hr-panel-link">
              Attendance <ArrowRight size={14} />
            </Link>
          </div>
          <div className="hr-count-row">
            {[
              { label: 'Present', value: summary.PRESENT },
              { label: 'On leave', value: summary.LEAVE },
              { label: 'Half-day', value: summary.HALF_DAY },
              { label: 'Absent', value: summary.ABSENT },
            ].map((c) => (
              <div key={c.label} className="hr-count-tile">
                <span className="hr-count-value">{c.value}</span>
                <span className="hr-count-label">{c.label}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="hr-panel-head">
            <h3 className="hr-panel-eyebrow">
              <Clock size={14} aria-hidden /> Today&rsquo;s attendance
            </h3>
          </div>
          <div className="hr-punch-summary">
            <div>
              <span className="hr-summary-label">First in</span>
              <span className="hr-punch-time">{punches.first ?? '—'}</span>
            </div>
            <div>
              <span className="hr-summary-label">Last out</span>
              <span className="hr-punch-time">{punches.last ?? '—'}</span>
            </div>
          </div>
          <p className="hr-form-hint">
            {punches.first
              ? 'Punches are recorded as employees check in and out.'
              : 'No punches yet today. Attendance is recorded when an employee checks in.'}
          </p>
        </Card>
      </div>

      <div className="hr-split">
        <Card>
          <div className="hr-panel-head">
            <div>
              <h3 className="hr-card-title">New joiners</h3>
              <p className="hr-subtext">Most recently added to the directory</p>
            </div>
            <Link href="/employees" className="hr-panel-link">
              Employees <ArrowRight size={14} />
            </Link>
          </div>
          <Table<Profile>
            columns={joinerColumns}
            data={newJoiners}
            rowKey={(r) => r.id}
            emptyMessage="No employees yet."
          />
        </Card>

        <Card>
          <div className="hr-panel-head">
            <div>
              <h3 className="hr-card-title">Staff by department</h3>
              <p className="hr-subtext">Active headcount</p>
            </div>
          </div>
          <div className="hr-bars">
            {byDepartment.map((d) => (
              <div key={d.name} className="hr-bar-row">
                <span className="hr-bar-label">{d.name}</span>
                <span className="hr-bar-track">
                  <span
                    className="hr-bar-fill"
                    style={{ width: `${(d.count / allEmployees.length) * 100}%` }}
                  />
                </span>
                <span className="hr-bar-value">{d.count}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <EmployeeModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
