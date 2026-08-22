'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  listDepartments,
  listDesignations,
  MigrationPendingError,
} from '../supabase/org';
import type { Department, Designation } from '../types/hrms';

/**
 * Departments and the designations scoped to them.
 *
 * Selecting a department narrows the designation list to that department only,
 * so an employee can never be given a designation belonging elsewhere. Both
 * selects carry uuids; the label is only ever for display.
 */
export function useOrgStructure(selectedDepartmentId?: string) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [loading, setLoading] = useState(true);
  const [migrationPending, setMigrationPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [depts, desigs] = await Promise.all([listDepartments(), listDesignations()]);
      setDepartments(depts);
      setDesignations(desigs);
      setMigrationPending(false);
    } catch (err) {
      if (err instanceof MigrationPendingError) {
        setMigrationPending(true);
      } else {
        setError(err instanceof Error ? err.message : 'Could not load org structure.');
      }
      setDepartments([]);
      setDesignations([]);
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

  /** Only the designations belonging to the chosen department. */
  const scopedDesignations = useMemo(
    () => (selectedDepartmentId ? designations.filter((d) => d.department_id === selectedDepartmentId) : []),
    [designations, selectedDepartmentId]
  );

  const departmentName = useCallback(
    (id?: string | null) => departments.find((d) => d.id === id)?.name ?? '—',
    [departments]
  );
  const designationName = useCallback(
    (id?: string | null) => designations.find((d) => d.id === id)?.name ?? '—',
    [designations]
  );

  return {
    departments,
    designations,
    scopedDesignations,
    departmentName,
    designationName,
    loading,
    migrationPending,
    error,
    refresh: load,
  };
}
