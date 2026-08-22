import type { Metadata } from 'next';
import './globals.css';
import { HRMSProvider } from '@/lib/context/HRMSContext';
import { ToastProvider } from '@/components/ui';
import { Navbar } from '@/components/layout/Navbar';

export const metadata: Metadata = {
  title: 'Dayflow HRMS',
  description:
    'Human resource management — employees, attendance, leave, approvals and statutory payroll.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <HRMSProvider>
          <ToastProvider>
            <div className="hr-app">
              <Navbar />
              <main className="hr-main">{children}</main>
              <footer className="hr-footer">
                <p>© 2026 Dayflow HRMS</p>
              </footer>
            </div>
          </ToastProvider>
        </HRMSProvider>
      </body>
    </html>
  );
}
