'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

const BARE_ROUTES = ['/sign-in', '/sign-up'];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Auth screens render without the shell.
  if (BARE_ROUTES.includes(pathname)) {
    return <>{children}</>;
  }

  return (
    <div className="hr-shell">
      <Sidebar open={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />
      {sidebarOpen && <div className="hr-scrim" onClick={() => setSidebarOpen(false)} aria-hidden />}
      <div className="hr-shell-main">
        <Topbar onToggleSidebar={() => setSidebarOpen((v) => !v)} />
        <main className="hr-content">{children}</main>
      </div>
    </div>
  );
}
