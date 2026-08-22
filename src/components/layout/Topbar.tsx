'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Menu, LogOut, MonitorCheck } from 'lucide-react';
import { useHRMS } from '@/lib/context/HRMSContext';
import { useAttendance } from '@/lib/hooks';

const TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/employees': 'Employees',
  '/departments': 'Departments',
  '/designations': 'Designations',
  '/roles': 'Roles',
  '/profile': 'My Profile',
  '/attendance': 'My Attendance',
  '/time-off': 'My Leave',
  '/calendar': 'Calendar',
  '/my-salary': 'My Salary',
  '/my-payslips': 'My Payslips',
  '/payroll': 'Payroll',
  '/approvals': 'Approvals',
};

export function Topbar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, currentRole, logout } = useHRMS();
  const { isPunchedIn, elapsedLabel } = useAttendance();

  const title =
    TITLES[pathname] ??
    (pathname.startsWith('/employees/') ? 'Employee' : 'Dayflow');

  const initials = currentUser
    ? `${currentUser.first_name?.[0] ?? ''}${currentUser.last_name?.[0] ?? ''}`.toUpperCase()
    : '—';

  return (
    <header className="hr-topbar">
      <button className="hr-topbar-toggle" onClick={onToggleSidebar} aria-label="Toggle navigation">
        <Menu size={20} />
      </button>

      <h1 className="hr-topbar-title">{title}</h1>

      <div className="hr-topbar-right">
        <span className={`hr-punch-pill ${isPunchedIn ? 'is-live' : ''}`.trim()}>
          <MonitorCheck size={14} aria-hidden />
          <span className="hr-monospace">{isPunchedIn ? elapsedLabel : '00:00:00'}</span>
          <span className="hr-punch-pill-sep">·</span>
          <span>{isPunchedIn ? 'Checked in' : 'Checked out'}</span>
        </span>

        {currentUser && (
          <>
            <div className="hr-topbar-user">
              <span className="hr-avatar">{initials}</span>
              <span className="hr-topbar-user-meta">
                <span className="hr-topbar-user-name">
                  {currentUser.first_name} {currentUser.last_name}
                </span>
                <span className="hr-topbar-user-role">
                  {currentRole === 'ADMIN' ? 'HR Admin' : currentUser.job_position || 'Employee'}
                </span>
              </span>
            </div>
            <button className="hr-topbar-icon" onClick={() => { logout(); router.push('/sign-in'); }} aria-label="Sign out" title="Sign out">
              <LogOut size={18} />
            </button>
          </>
        )}
      </div>
    </header>
  );
}
