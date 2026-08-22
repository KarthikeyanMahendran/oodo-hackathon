'use client';

import { useCallback, useEffect, useState } from 'react';
import { Building2, Plus, Users, ShieldCheck, Tags } from 'lucide-react';
import { PageHeader, Card, CardHeader, Table, Button, Badge, EmptyState, type Column } from '@/components/ui';
import { DepartmentModal } from '@/components/features/employees/DepartmentModal';
import { listDepartmentSummary, MigrationPendingError } from '@/lib/supabase/org';
import type { DepartmentSummary } from '@/lib/types/hrms';

export default function DepartmentsPage() {
  const [rows, setRows] = useState<DepartmentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [migrationPending, setMigrationPending] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await listDepartmentSummary());
      setMigrationPending(false);
    } catch (err) {
      if (err instanceof MigrationPendingError) setMigrationPending(true);
      else console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await Promise.resolve();
      if (!cancelled) await load();
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  const columns: Column<DepartmentSummary>[] = [
    {
      header: 'Department',
      render: (row) => (
        <div className="hr-cell-stack">
          <span className="hr-cell-primary">{row.name}</span>
          {row.code && <span className="hr-cell-secondary hr-monospace">{row.code}</span>}
        </div>
      ),
    },
    { header: 'Head', render: (row) => row.head_name || <span className="hr-cell-secondary">Unassigned</span> },
    {
      header: 'Headcount',
      align: 'right',
      render: (row) => (
        <span className="hr-inline-stat">
          <Users size={13} /> {row.headcount}
        </span>
      ),
    },
    {
      header: 'Admins',
      align: 'right',
      render: (row) =>
        row.admin_count > 0 ? (
          <Badge tone="info">
            <ShieldCheck size={11} /> {row.admin_count}
          </Badge>
        ) : (
          <span className="hr-cell-secondary">—</span>
        ),
    },
    {
      header: 'Designations',
      align: 'right',
      render: (row) => (
        <span className="hr-inline-stat">
          <Tags size={13} /> {row.designation_count}
        </span>
      ),
    },
    { header: 'Status', render: (row) => <Badge tone={row.is_active ? 'success' : 'muted'}>{row.is_active ? 'Active' : 'Inactive'}</Badge> },
  ];

  return (
    <div className="hr-stack">
      <PageHeader
        title="Departments"
        subtitle="Every designation belongs to exactly one department"
        actions={
          <Button onClick={() => setModalOpen(true)} icon={<Plus size={14} />} disabled={migrationPending}>
            Add department
          </Button>
        }
      />

      <Card>
        <CardHeader title="All departments" subtitle={`${rows.length} department${rows.length === 1 ? '' : 's'}`} />

        {migrationPending ? (
          <EmptyState
            icon={Building2}
            title="Migration required"
            description="Run db_schema/migrations/002_org_structure_and_leave.sql to enable departments."
          />
        ) : rows.length === 0 && !loading ? (
          <EmptyState icon={Building2} title="No departments yet" description="Create the first one to start scoping designations.">
            <Button onClick={() => setModalOpen(true)} icon={<Plus size={14} />}>
              Add department
            </Button>
          </EmptyState>
        ) : (
          <Table<DepartmentSummary> columns={columns} data={rows} loading={loading} rowKey={(r) => r.id} />
        )}
      </Card>

      <DepartmentModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onCreated={load} />
    </div>
  );
}
