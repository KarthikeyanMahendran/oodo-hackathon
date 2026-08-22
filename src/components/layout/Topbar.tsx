'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, LogOut, MonitorCheck, User } from 'lucide-react';
import { useHRMS } from '@/lib/context/HRMSContext';
import { useAttendance } from '@/lib/hooks';

const TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/employees': 'Employees',
  '/departments': 'Departments',
  '/designations': 'Designations',
  '/roles': 'Roles',
  '/profile': 'My Profile',
  '/expenses': 'Expenses',
  '/assets': 'IT Assets',
  '/attendance': 'My Attendance',
  '/time-off': 'My Leave',
  '/calendar': 'Calendar',
  '/my-salary': 'My Salary',
  '/my-payslips': 'My Payslips',
  '/payroll': 'Payroll',
  '/approvals': 'Approvals',
  '/feed': 'Notice Board',
};

export function Topbar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, currentRole, logout } = useHRMS();
  const { isPunchedIn, elapsedLabel } = useAttendance();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const title =
    TITLES[pathname] ??
    (pathname.startsWith('/employees/') ? 'Employee Profile' : 'Dayflow');

  const initials = currentUser
    ? `${currentUser.first_name?.[0] ?? ''}${currentUser.last_name?.[0] ?? ''}`.toUpperCase()
    : 'SJ';

  const userDisplayName = currentUser
    ? `${currentUser.first_name} ${currentUser.last_name}`
    : 'Sarah Jenkins';

  const userRoleDisplay = currentUser
    ? currentRole === 'ADMIN'
      ? 'HR Admin'
      : currentUser.job_position || 'Employee'
    : 'HR Admin';

  const userAvatarUrl = currentUser?.avatar_url;

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

        {/* Top-Right Circular User Profile Avatar */}
        <div style={{ position: 'relative', marginLeft: '12px' }}>
          <button
            type="button"
            onClick={() => setDropdownOpen((prev) => !prev)}
            style={{
              background: 'transparent',
              border: 'none',
              padding: 0,
              margin: 0,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              outline: 'none',
            }}
            aria-label="User profile menu"
          >
            {userAvatarUrl ? (
              <img
                src={userAvatarUrl}
                alt={userDisplayName}
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid var(--border, #e4e4e7)',
                  display: 'block',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                }}
              />
            ) : (
              <span
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  backgroundColor: '#f59e0b',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                }}
              >
                {initials}
              </span>
            )}
          </button>

          {/* Clean Profile Dropdown Menu */}
          {dropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '200px',
                backgroundColor: 'var(--surface-raised, #ffffff)',
                border: '1px solid var(--border, #e4e4e7)',
                borderRadius: '12px',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
                zIndex: 9999,
                overflow: 'hidden',
              }}
              onMouseLeave={() => setDropdownOpen(false)}
            >
              <div
                style={{
                  padding: '12px 14px',
                  borderBottom: '1px solid var(--border, #f4f4f5)',
                  backgroundColor: 'var(--surface-subtle, #fafafa)',
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text, #18181b)', lineHeight: '1.3' }}>
                  {userDisplayName}
                </div>
                <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-muted, #71717a)', marginTop: '2px' }}>
                  {userRoleDisplay}
                </div>
              </div>

              <div style={{ padding: '4px' }}>
                <Link
                  href="/profile"
                  onClick={() => setDropdownOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: 'var(--text, #27272a)',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-hover, #f4f4f5)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <User size={15} style={{ color: '#71717a' }} />
                  <span>My Profile</span>
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                    router.push('/sign-in');
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#dc2626',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fef2f2')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <LogOut size={15} style={{ color: '#dc2626' }} />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
