'use client';


import Link from 'next/link';
import Image from 'next/image';
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

  MessageSquare,
  Receipt,
  Monitor,
} from 'lucide-react';
import { useHRMS } from '@/lib/context/HRMSContext';
import { useLeaveRequests } from '@/lib/hooks';

interface NavItem {
  href: string;
  label: string;
  icon: typeof Users;
  adminOnly?: boolean;
  badge?: number;
  /** Anchor for the product tour — see ProductTour.tsx. */
  tourId?: string;
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
    { items: [{ href: '/dashboard', label: 'Dashboard', icon: LayoutGrid, tourId: 'dashboard' }] },
    {
      label: 'People',
      items: [
        { href: '/employees', label: 'Employees', icon: Users, tourId: 'employees' },
        { href: '/departments', label: 'Departments', icon: Building2, tourId: 'departments' },
        { href: '/designations', label: 'Designations', icon: BriefcaseBusiness },
        { href: '/roles', label: 'Roles', icon: ShieldCheck },
      ],
    },
    {
      label: 'HR & Workspace',
      items: [
        { href: '/feed', label: 'Notice Board', icon: MessageSquare },
        { href: '/expenses', label: 'Expenses', icon: Receipt },
        { href: '/assets', label: 'IT Assets', icon: Monitor },
        { href: '/profile', label: 'My Profile', icon: UserRoundPen },
        { href: '/attendance', label: 'My Attendance', icon: CalendarCheck, tourId: 'attendance' },
        { href: '/time-off', label: 'My Leave', icon: CalendarDays, tourId: 'time-off' },
        { href: '/calendar', label: 'Calendar', icon: CalendarRange, tourId: 'calendar' },
        { href: '/my-salary', label: 'My Salary', icon: Wallet },
      ],
    },
    {
      label: 'Payroll & Approvals',
      items: [
        { href: '/payroll', label: 'Payroll', icon: Wallet, adminOnly: true, tourId: 'payroll' },
        { href: '/approvals', label: 'Approvals', icon: CheckSquare, adminOnly: true, badge: pendingCount, tourId: 'approvals' },
      ],
    },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <aside className={`hr-sidebar ${open ? 'is-open' : ''}`.trim()}>
      <Link href="/dashboard" className="hr-brand" onClick={onNavigate}>
        <Image
          src="/gemini-svg.svg"
          alt="Dayflow Logo"
          width={220}
          height={66}
          style={{ objectFit: 'contain', height: '54px', width: 'auto', maxWidth: '190px' }}
          priority
        />
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
                    data-tour={item.tourId}
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
