'use client';

import { useMemo } from 'react';
import { useHRMS } from '../context/HRMSContext';
import type { Profile } from '../types/hrms';

export interface DirectoryGroup {
  name: string;
  headcount: number;
  members: Profile[];
  admins: number;
}

/**
 * Departments, designations and roles are not their own tables in the live
 * schema — they are columns on `profiles`. Grouping here keeps those screens
 * truthful to the database rather than inventing entities that do not exist.
 */
export function useDirectoryGroups(key: 'department' | 'job_position' | 'role') {
  const { employees } = useHRMS();

  return useMemo<DirectoryGroup[]>(() => {
    const map = new Map<string, Profile[]>();
    for (const emp of employees) {
      const raw = (emp[key] as string | undefined)?.trim();
      const name = raw || 'Unassigned';
      map.set(name, [...(map.get(name) ?? []), emp]);
    }
    return [...map.entries()]
      .map(([name, members]) => ({
        name,
        members,
        headcount: members.length,
        admins: members.filter((m) => m.role === 'ADMIN').length,
      }))
      .sort((a, b) => b.headcount - a.headcount);
  }, [employees, key]);
}
