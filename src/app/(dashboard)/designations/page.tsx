'use client';

import { useMemo, useState } from 'react';
import { BriefcaseBusiness, Plus } from 'lucide-react';
import { PageHeader, Card, CardHeader, Table, Button, Badge, Select, EmptyState, type Column } from '@/components/ui';
import { DesignationModal } from '@/components/features/employees/DesignationModal';
import { useOrgStructure } from '@/lib/hooks';
import type { Designation } from '@/lib/types/hrms';

export default function DesignationsPage() {
  const { departments, designations, departmentName, migrationPending, loading, refresh } = useOrgStructure();
  const [filterId, setFilterId] = useState('ALL');
  const [modalOpen, setModalOpen] = useState(false);

  const rows = useMemo(
    () => (filterId === 'ALL' ? designations : designations.filter((d) => d.department_id === filterId)),
    [designations, filterId]
  );

  const columns: Column<Designation>[] = [
    { header: 'Designation', render: (row) => <span className="hr-cell-primary">{row.name}</span> },
    { header: 'Department', render: (row) => <Badge tone="muted">{departmentName(row.department_id)}</Badge> },
    { header: 'Level', align: 'right', render: (row) => <span className="hr-monospace">L{row.level}</span> },
    { header: 'Status', render: (row) => <Badge tone={row.is_active ? 'success' : 'muted'}>{row.is_active ? 'Active' : 'Inactive'}</Badge> },
  ];

  return (
    <div className="hr-stack">
      <PageHeader
        title="Designations"
        subtitle="Scoped to a single department — never freestanding"
        actions={
          <Button onClick={() => setModalOpen(true)} icon={<Plus size={14} />} disabled={migrationPending}>
            Add designation
          </Button>
        }
      />

      <Card>
        <CardHeader
          title="All designations"
          subtitle={`${rows.length} of ${designations.length} shown`}
          actions={
            <Select value={filterId} onChange={(e) => setFilterId(e.target.value)} aria-label="Filter by department">
              <option value="ALL">All departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          }
        />

        {migrationPending ? (
          <EmptyState
            icon={BriefcaseBusiness}
            title="Migration required"
            description="Run db_schema/migrations/002_org_structure_and_leave.sql to enable designations."
          />
        ) : rows.length === 0 && !loading ? (
          <EmptyState icon={BriefcaseBusiness} title="No designations yet" description="Add one within a department.">
            <Button onClick={() => setModalOpen(true)} icon={<Plus size={14} />}>
              Add designation
            </Button>
          </EmptyState>
        ) : (
          <Table<Designation> columns={columns} data={rows} loading={loading} rowKey={(r) => r.id} />
        )}
      </Card>

      <DesignationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={refresh}
        departments={departments}
        defaultDepartmentId={filterId !== 'ALL' ? filterId : undefined}
      />
    </div>
  );
}
