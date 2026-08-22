import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { HRMSProvider } from '@/lib/context/HRMSContext';
import { Navbar } from '@/components/layout/Navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Dayflow HRMS - Every workday, aligned.',
  description: 'Human Resource Management System for Employees, Attendance Punching, Profiles, Statutory Salary Calculations, and Leave Management.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-black text-zinc-100 min-h-screen flex flex-col antialiased selection:bg-zinc-800 selection:text-white`}>
        <HRMSProvider>
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
          <footer className="border-t border-zinc-900 bg-black py-6 text-center text-xs text-zinc-500 font-mono">
            <p>© 2026 Dayflow HRMS • Every workday, perfectly aligned.</p>
          </footer>
        </HRMSProvider>
      </body>
    </html>
  );
}
