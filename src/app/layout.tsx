import type { Metadata } from 'next';
import './globals.css';
import { HRMSProvider } from '@/lib/context/HRMSContext';
import { ToastProvider } from '@/components/ui';
import { AppShell } from '@/components/layout/AppShell';

export const metadata: Metadata = {
  title: 'Dayflow People',
  description: 'Employees, attendance, leave, approvals and statutory payroll.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <HRMSProvider>
          <ToastProvider>
            <AppShell>{children}</AppShell>
          </ToastProvider>
        </HRMSProvider>
      </body>
    </html>
  );
}
