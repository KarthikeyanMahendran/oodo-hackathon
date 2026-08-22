'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  Users,
  Clock,
  CalendarDays,
  Wallet,
  CheckSquare,
  UserCircle,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useHRMS } from '@/lib/context/HRMSContext';
import { useApprovals } from '@/lib/hooks';

const NAV_LINKS = [
  { href: '/employees', label: 'Employees', icon: Users },
  { href: '/attendance', label: 'Attendance', icon: Clock },
  { href: '/time-off', label: 'Time Off', icon: CalendarDays },
  { href: '/payroll', label: 'Payroll', icon: Wallet, adminOnly: true },
  { href: '/approvals', label: 'Approvals', icon: CheckSquare, adminOnly: true },
];

export function Navbar() {
  const pathname = usePathname();
  const { currentUser, currentRole, logout } = useHRMS();
  const { pendingCount } = useApprovals();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = NAV_LINKS.filter((l) => !l.adminOnly || currentRole === 'ADMIN');
  const initials = currentUser
    ? `${currentUser.first_name?.[0] ?? ''}${currentUser.last_name?.[0] ?? ''}`.toUpperCase()
    : '—';

  return (
    <header className="hr-navbar">
      <div className="hr-navbar-inner">
        <Link href="/employees" className="hr-brand">
          <span className="hr-brand-mark" aria-hidden />
          <span className="hr-brand-name">Dayflow</span>
        </Link>

        <nav className="hr-nav-links" aria-label="Main">
          {links.map((link) => {
            const Icon = link.icon;
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`hr-nav-link ${active ? 'active' : ''}`.trim()}
                aria-current={active ? 'page' : undefined}
              >
                <Icon size={16} aria-hidden />
                <span>{link.label}</span>
                {link.href === '/approvals' && pendingCount > 0 && (
                  <span className="hr-nav-count">{pendingCount}</span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="hr-navbar-right">
          {currentUser ? (
            <>
              <Link href="/profile" className="hr-nav-user" title={`${currentUser.first_name} ${currentUser.last_name}`}>
                <span className="hr-avatar">{initials}</span>
                <span className="hr-nav-user-meta">
                  <span className="hr-nav-user-name">
                    {currentUser.first_name} {currentUser.last_name}
                  </span>
                  <span className="hr-nav-user-role">{currentRole}</span>
                </span>
              </Link>
              <button className="hr-btn-circle" onClick={logout} aria-label="Sign out" title="Sign out">
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <>
              <Link href="/sign-in" className="hr-btn-secondary">
                Sign in
              </Link>
              <Link href="/sign-up" className="hr-btn-primary">
                Sign up
              </Link>
            </>
          )}
          <button
            className="hr-btn-circle hr-nav-toggle"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="hr-nav-mobile" aria-label="Mobile">
          {links.map((link) => {
            const Icon = link.icon;
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`hr-nav-link ${active ? 'active' : ''}`.trim()}
                onClick={() => setMobileOpen(false)}
              >
                <Icon size={16} aria-hidden />
                <span>{link.label}</span>
              </Link>
            );
          })}
          <Link href="/profile" className="hr-nav-link" onClick={() => setMobileOpen(false)}>
            <UserCircle size={16} aria-hidden />
            <span>My Profile</span>
          </Link>
        </nav>
      )}
    </header>
  );
}
