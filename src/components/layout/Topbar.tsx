'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, LogOut, MonitorCheck, User, ChevronDown } from 'lucide-react';
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

        {/* User Profile on top right corner */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors border-none outline-none bg-transparent cursor-pointer text-left ml-2"
          >
            <div className="relative shrink-0">
              {userAvatarUrl ? (
                <img
                  src={userAvatarUrl}
                  alt={userDisplayName}
                  className="w-9 h-9 rounded-full object-cover border border-zinc-200 dark:border-zinc-700 shadow-sm"
                />
              ) : (
                <span className="w-9 h-9 text-xs font-bold bg-amber-500 text-white rounded-full flex items-center justify-center shadow-sm">
                  {initials}
                </span>
              )}
            </div>
          </button>

          {/* Profile Dropdown Menu */}
          {dropdownOpen && (
            <div
              className="absolute right-0 mt-2 w-48 py-1 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 z-50"
              onMouseLeave={() => setDropdownOpen(false)}
            >
              <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800">
                <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">{userDisplayName}</p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">{userRoleDisplay}</p>
              </div>

              <Link
                href="/profile"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <User size={14} />
                <span>My Profile</span>
              </Link>

              <button
                type="button"
                onClick={() => {
                  setDropdownOpen(false);
                  logout();
                  router.push('/sign-in');
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors border-none outline-none bg-transparent cursor-pointer text-left"
              >
                <LogOut size={14} />
                <span>Sign out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
