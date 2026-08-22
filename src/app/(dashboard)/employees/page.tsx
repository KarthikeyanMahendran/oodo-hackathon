'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Users } from 'lucide-react';
import {
  PageHeader,
  Card,
  CardHeader,
  Table,
  Button,
  Input,
  Select,
  StatusBadge,
  EmptyState,
  type Column,
} from '@/components/ui';
import { EmployeeModal } from '@/components/features/employees/EmployeeModal';
import { useEmployees } from '@/lib/hooks';
import { useHRMS } from '@/lib/context/HRMSContext';
import { formatCurrency } from '@/lib/utils/salaryCalculator';
import type { Profile } from '@/lib/types/hrms';

export default function EmployeeDirectoryPage() {
  const { employees, departments, query, setQuery, department, setDepartment, salaries } = useEmployees();
  const { currentRole, getUserLiveStatus } = useHRMS();
  const [modalOpen, setModalOpen] = useState(false);

  const isAdmin = currentRole === 'ADMIN';

  const columns: Column<Profile>[] = [
    {
      header: 'Employee',
      render: (row) => (
        <Link href={`/employees/${row.id}`} className="hr-cell-link">
          <span className="hr-avatar hr-avatar-sm">
            {`${row.first_name?.[0] ?? ''}${row.last_name?.[0] ?? ''}`.toUpperCase()}
          </span>
          <span className="hr-cell-stack">
            <span className="hr-cell-primary">
              {row.first_name} {row.last_name}
            </span>
            <span className="hr-cell-secondary hr-monospace">{row.login_id}</span>
          </span>
        </Link>
      ),
    },
    {
      header: 'Department',
      render: (row) => (
        <div className="hr-cell-stack">
          <span>{row.department || '—'}</span>
          <span className="hr-cell-secondary">{row.job_position || '—'}</span>
        </div>
      ),
    },
    {
      header: 'Contact',
      render: (row) => (
        <div className="hr-cell-stack">
          <span>{row.email || '—'}</span>
          <span className="hr-cell-secondary">{row.phone || '—'}</span>
        </div>
      ),
    },
    { header: 'Today', render: (row) => <StatusBadge status={getUserLiveStatus(row.id)} /> },
    ...(isAdmin
      ? [
          {
            header: 'Monthly Wage',
            align: 'right' as const,
            render: (row: Profile) => (
              <span className="hr-monospace">{formatCurrency(salaries[row.id]?.fixed_wage ?? 0)}</span>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="hr-stack">
      <PageHeader
        title="Employees"
        subtitle={`${employees.length} ${employees.length === 1 ? 'person' : 'people'} in the directory`}
        actions={
          isAdmin && (
            <Button onClick={() => setModalOpen(true)} icon={<Plus size={14} />}>
              Add employee
            </Button>
          )
        }
      />

      <Card>
        <CardHeader title="Directory" subtitle="Search and filter the roster" />

        <div className="hr-filter-bar">
          <Input
            placeholder="Search by name, code, email or department…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search employees"
          />
          <Select value={department} onChange={(e) => setDepartment(e.target.value)} aria-label="Filter by department">
            {departments.map((d) => (
              <option key={d} value={d}>
                {d === 'ALL' ? 'All departments' : d}
              </option>
            ))}
          </Select>
        </div>

        {employees.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No employees match"
            description="Adjust the search or department filter to see more people."
          />
        ) : (
          <Table<Profile> columns={columns} data={employees} rowKey={(r) => r.id} />
        )}
      </Card>

      <EmployeeModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
