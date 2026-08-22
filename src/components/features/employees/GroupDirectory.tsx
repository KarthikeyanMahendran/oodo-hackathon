'use client';

import Link from 'next/link';
import { LucideIcon } from 'lucide-react';
import { Card, CardHeader, Table, Badge, EmptyState, type Column } from '@/components/ui';
import { useDirectoryGroups, type DirectoryGroup } from '@/lib/hooks/useDirectoryGroups';
import { useHRMS } from '@/lib/context/HRMSContext';

export function GroupDirectory({
  groupBy,
  title,
  subtitle,
  columnLabel,
  icon,
}: {
  groupBy: 'department' | 'job_position' | 'role';
  title: string;
  subtitle: string;
  columnLabel: string;
  icon: LucideIcon;
}) {
  const { isLoading } = useHRMS();
  const groups = useDirectoryGroups(groupBy);
  const total = groups.reduce((n, g) => n + g.headcount, 0);

  const columns: Column<DirectoryGroup>[] = [
    {
      header: columnLabel,
      render: (row) => <span className="hr-cell-primary">{row.name}</span>,
    },
    { header: 'Headcount', accessor: 'headcount', align: 'right' },
    {
      header: 'Share',
      align: 'right',
      render: (row) => `${total ? ((row.headcount / total) * 100).toFixed(0) : 0}%`,
    },
    {
      header: 'Admins',
      align: 'right',
      render: (row) => (row.admins > 0 ? <Badge tone="info">{row.admins}</Badge> : <span className="hr-cell-secondary">—</span>),
    },
    {
      header: 'People',
      render: (row) => (
        <div className="hr-member-chips">
          {row.members.slice(0, 4).map((m) => (
            <Link key={m.id} href={`/employees/${m.login_id || m.id}`} className="hr-avatar hr-avatar-sm" title={`${m.first_name} ${m.last_name}`}>
              {`${m.first_name?.[0] ?? ''}${m.last_name?.[0] ?? ''}`.toUpperCase()}
            </Link>
          ))}
          {row.members.length > 4 && <span className="hr-member-more">+{row.members.length - 4}</span>}
        </div>
      ),
    },
  ];

  return (
    <div className="hr-stack">
      <Card>
        <CardHeader title={title} subtitle={subtitle} />
        {!isLoading && groups.length === 0 ? (
          <EmptyState icon={icon} title={`No ${columnLabel.toLowerCase()}s yet`} description="Add employees to populate this view." />
        ) : (
          <Table<DirectoryGroup> columns={columns} data={groups} loading={isLoading} rowKey={(r) => r.name} />
        )}
      </Card>
    </div>
  );
}
