'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { driver, type DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useHRMS } from '@/lib/context/HRMSContext';

const TOUR_KEY = 'hrms_tour_completed';

interface StepSpec {
  selector: string;
  title: string;
  description: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
}

/**
 * Every step is optional. Nav items are role-gated (Payroll and Approvals are
 * admin-only) and the sidebar collapses under 1024px, so a step whose element
 * is absent is skipped rather than leaving driver.js highlighting nothing.
 */
const STEPS: StepSpec[] = [
  {
    selector: '.hr-topbar-title',
    title: 'Welcome to Dayflow',
    description: "This is your HR workspace. Here's a quick look at what you can do.",
    side: 'bottom',
    align: 'start',
  },
  {
    selector: '[data-tour="dashboard"]',
    title: 'Dashboard',
    description: 'Headcount, who is on leave today, new joiners and staff split by department — all at a glance.',
    side: 'right',
  },
  {
    selector: '[data-tour="employees"]',
    title: 'Employee directory',
    description: 'Search the roster, open a profile, or add a new joiner. Admins can deactivate people here too.',
    side: 'right',
  },
  {
    selector: '[data-tour="departments"]',
    title: 'Departments & designations',
    description: 'Departments hold designations, and every designation belongs to exactly one department.',
    side: 'right',
  },
  {
    selector: '[data-tour="attendance"]',
    title: 'Attendance',
    description: 'Punch in and the timer runs live in the top bar. Every shift lands in your register automatically.',
    side: 'right',
  },
  {
    selector: '[data-tour="time-off"]',
    title: 'Leave',
    description: 'Request time off against your balance. Policy rules like notice period are checked as you type.',
    side: 'right',
  },
  {
    selector: '[data-tour="calendar"]',
    title: 'Calendar',
    description: 'See who is away this month, colour-coded by leave type. Click a day for the details.',
    side: 'right',
  },
  {
    selector: '[data-tour="payroll"]',
    title: 'Payroll',
    description: 'Basic, HRA, PF and professional tax are derived from each wage. Run the register and issue payslips.',
    side: 'right',
  },
  {
    selector: '[data-tour="approvals"]',
    title: 'Approvals',
    description: 'Pending leave requests land here. Approve in one click, or reject with a reason the employee sees.',
    side: 'right',
  },
  {
    selector: '#tour-punch-pill',
    title: 'Your shift clock',
    description: 'Shows whether you are checked in, and counts up while your shift is running.',
    side: 'bottom',
    align: 'end',
  },
  {
    selector: '#tour-user-menu',
    title: 'Profile & sign out',
    description: 'Open your profile, restart this tour any time, or sign out from here.',
    side: 'bottom',
    align: 'end',
  },
];

function buildSteps(): DriveStep[] {
  return STEPS.filter((s) => document.querySelector(s.selector)).map((s) => ({
    element: s.selector,
    popover: {
      title: s.title,
      description: s.description,
      side: s.side ?? 'bottom',
      align: s.align ?? 'start',
    },
    onHighlightStarted: () => {
      document.querySelector(s.selector)?.scrollIntoView({ block: 'center', behavior: 'instant' });
    },
  }));
}

/** Starts the tour on demand — used by the "Take a tour" menu item. */
export function startProductTour() {
  const steps = buildSteps();
  if (steps.length === 0) return;

  driver({
    showProgress: true,
    allowClose: true,
    nextBtnText: 'Next',
    prevBtnText: 'Back',
    doneBtnText: 'Done',
    popoverClass: 'hr-tour-popover',
    onDestroyed: () => {
      try {
        window.localStorage.setItem(TOUR_KEY, 'true');
      } catch {
        // Private browsing or blocked storage — the tour simply runs again.
      }
    },
    steps,
  }).drive();
}

/** True when the viewer has never finished the tour. */
function shouldAutoStart(): boolean {
  try {
    return window.localStorage.getItem(TOUR_KEY) !== 'true';
  } catch {
    return false;
  }
}

/**
 * Auto-runs the tour once, on the dashboard, for a signed-in user. Mounted in
 * AppShell so it is available everywhere but only ever fires on first arrival.
 */
export default function ProductTour() {
  const pathname = usePathname();
  const { currentUser, isLoading } = useHRMS();

  useEffect(() => {
    if (isLoading || !currentUser) return;
    if (pathname !== '/dashboard') return;
    if (!shouldAutoStart()) return;

    // Wait for the shell to paint so highlight boxes land in the right place.
    const timer = setTimeout(() => startProductTour(), 600);
    return () => clearTimeout(timer);
  }, [pathname, currentUser, isLoading]);

  return null;
}
