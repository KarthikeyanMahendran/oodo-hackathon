'use client';

import { useMemo, useState } from 'react';
import { useHRMS } from '../context/HRMSContext';
import type { Profile } from '../types/hrms';

export function useEmployees() {
  const { employees, salaries, addEmployee, updateProfile, isLoading } = useHRMS();
  const [query, setQuery] = useState('');
  const [department, setDepartment] = useState('ALL');

  const departments = useMemo(
    () => ['ALL', ...[...new Set(employees.map((e) => e.department).filter(Boolean))].sort()],
    [employees]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return employees.filter((e: Profile) => {
      const matchesDept = department === 'ALL' || e.department === department;
      if (!matchesDept) return false;
      if (!q) return true;
      return (
        `${e.first_name} ${e.last_name}`.toLowerCase().includes(q) ||
        (e.email || '').toLowerCase().includes(q) ||
        (e.login_id || '').toLowerCase().includes(q) ||
        (e.department || '').toLowerCase().includes(q)
      );
    });
  }, [employees, query, department]);

  return {
    employees: filtered,
    allEmployees: employees,
    salaries,
    departments,
    query,
    setQuery,
    department,
    setDepartment,
    addEmployee,
    updateProfile,
    loading: isLoading,
  };
}
