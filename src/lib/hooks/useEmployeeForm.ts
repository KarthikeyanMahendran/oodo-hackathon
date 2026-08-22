'use client';

import { useCallback, useState } from 'react';
import { useHRMS } from '../context/HRMSContext';

export interface EmployeeDraft {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  /** uuid from `departments` — the label is never the identifier. */
  department_id: string;
  /** uuid from `designations`, always scoped to department_id. */
  designation_id: string;
  wage: string;
}

export interface CreatedCredential {
  name: string;
  login_id: string;
  tempPass: string;
}

const EMPTY: EmployeeDraft = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  department_id: '',
  designation_id: '',
  wage: '75000',
};

/** Strips characters that can never be valid for the field as the user types. */
const SANITISERS: Partial<Record<keyof EmployeeDraft, (v: string) => string>> = {
  first_name: (v) => v.replace(/[^a-zA-Z\s'-]/g, ''),
  last_name: (v) => v.replace(/[^a-zA-Z\s'-]/g, ''),
  phone: (v) => v.replace(/[^+\d\s()-]/g, ''),
};

export function validateEmployee(draft: EmployeeDraft): Partial<Record<keyof EmployeeDraft, string>> {
  const errors: Partial<Record<keyof EmployeeDraft, string>> = {};

  if (draft.first_name.trim().length < 2) {
    errors.first_name = 'First name needs at least 2 letters.';
  }
  if (draft.last_name.trim().length < 1) {
    errors.last_name = 'Last name is required.';
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())) {
    errors.email = 'Enter a valid email, e.g. name@company.com.';
  }
  if (draft.phone.trim() && !/^[+\d\s()-]{7,20}$/.test(draft.phone.trim())) {
    errors.phone = 'Digits and + ( ) - only, 7–20 characters.';
  }
  if (!draft.department_id) errors.department_id = 'Select a department.';
  if (!draft.designation_id) errors.designation_id = 'Select a designation.';

  const wage = Number(draft.wage);
  if (Number.isNaN(wage) || wage <= 0) {
    errors.wage = 'Monthly wage must be greater than zero.';
  }
  return errors;
}

export function useEmployeeForm() {
  const { addEmployee } = useHRMS();
  const [draft, setDraft] = useState<EmployeeDraft>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof EmployeeDraft, string>>>({});
  const [credential, setCredential] = useState<CreatedCredential | null>(null);
  const [saving, setSaving] = useState(false);

  const setField = useCallback(<K extends keyof EmployeeDraft>(key: K, value: string) => {
    const clean = SANITISERS[key]?.(value) ?? value;
    setDraft((prev) => ({
      ...prev,
      [key]: clean,
      // Changing department invalidates any designation from the old one.
      ...(key === 'department_id' ? { designation_id: '' } : {}),
    }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setDraft(EMPTY);
    setErrors({});
    setCredential(null);
  }, []);

  const submit = useCallback((labels?: { department?: string; designation?: string }): boolean => {
    const departmentLabel = labels?.department ?? '';
    const designationLabel = labels?.designation ?? '';
    const found = validateEmployee(draft);
    setErrors(found);
    if (Object.keys(found).length > 0) return false;

    setSaving(true);
    try {
      const { profile, tempPass } = addEmployee({
        role: 'EMPLOYEE',
        first_name: draft.first_name.trim(),
        last_name: draft.last_name.trim(),
        email: draft.email.trim(),
        phone: draft.phone.trim(),
        department_id: draft.department_id,
        designation_id: draft.designation_id,
        department: departmentLabel,
        job_position: designationLabel,
        initialSalary: Number(draft.wage) || 75000,
      });

      setCredential({
        name: `${profile.first_name} ${profile.last_name}`,
        login_id: profile.login_id,
        tempPass,
      });
      setDraft((prev) => ({ ...EMPTY, department_id: prev.department_id }));
      return true;
    } finally {
      setSaving(false);
    }
  }, [draft, addEmployee]);

  return { draft, setField, errors, credential, setCredential, saving, submit, reset };
}
