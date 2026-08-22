'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutGrid,
  Users,
  Building2,
  BriefcaseBusiness,
  ShieldCheck,
  UserRoundPen,
  CalendarCheck,
  CalendarDays,
  CalendarRange,
  Wallet,
  ReceiptText,
  CheckSquare,
  Activity,
} from 'lucide-react';
import { useHRMS } from '@/lib/context/HRMSContext';
import { useLeaveRequests } from '@/lib/hooks';

interface NavItem {
  href: string;
  label: string;
  icon: typeof Users;
  adminOnly?: boolean;
  badge?: number;
}

interface NavSection {
  label?: string;
  items: NavItem[];
}

export function Sidebar({ open, onNavigate }: { open: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const { currentRole } = useHRMS();
  const { pendingCount } = useLeaveRequests('all');
  const isAdmin = currentRole === 'ADMIN';

  const sections: NavSection[] = [
    { items: [{ href: '/dashboard', label: 'Dashboard', icon: LayoutGrid }] },
    {
      label: 'People',
      items: [
        { href: '/employees', label: 'Employees', icon: Users },
        { href: '/departments', label: 'Departments', icon: Building2 },
        { href: '/designations', label: 'Designations', icon: BriefcaseBusiness },
        { href: '/roles', label: 'Roles', icon: ShieldCheck },
      ],
    },
    {
      label: 'HR',
      items: [
        { href: '/profile', label: 'My Profile', icon: UserRoundPen },
        { href: '/attendance', label: 'My Attendance', icon: CalendarCheck },
        { href: '/time-off', label: 'My Leave', icon: CalendarDays },
        { href: '/calendar', label: 'Calendar', icon: CalendarRange },
        { href: '/my-salary', label: 'My Salary', icon: Wallet },
        { href: '/my-payslips', label: 'My Payslips', icon: ReceiptText },
      ],
    },
    {
      label: 'Payroll',
      items: [
        { href: '/payroll', label: 'Payroll', icon: Wallet, adminOnly: true },
        { href: '/approvals', label: 'Approvals', icon: CheckSquare, adminOnly: true, badge: pendingCount },
      ],
    },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <aside className={`hr-sidebar ${open ? 'is-open' : ''}`.trim()}>
      <Link href="/dashboard" className="hr-brand" onClick={onNavigate}>
        <span className="hr-brand-mark" aria-hidden>
          <Activity size={20} strokeWidth={2.5} />
        </span>
        <span className="hr-brand-text">
          <span className="hr-brand-name">Dayflow</span>
          <span className="hr-brand-sub">People</span>
        </span>
      </Link>

      <nav className="hr-sidenav" aria-label="Main">
        {sections.map((section, i) => {
          const items = section.items.filter((item) => !item.adminOnly || isAdmin);
          if (items.length === 0) return null;
          return (
            <div key={section.label ?? i} className="hr-sidenav-section">
              {section.label && <span className="hr-sidenav-label">{section.label}</span>}
              {items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`hr-sidenav-item ${active ? 'active' : ''}`.trim()}
                    aria-current={active ? 'page' : undefined}
                    onClick={onNavigate}
                  >
                    <Icon size={18} strokeWidth={1.9} aria-hidden />
                    <span>{item.label}</span>
                    {item.badge ? <span className="hr-sidenav-badge">{item.badge}</span> : null}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
