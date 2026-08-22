'use client';

import { useState } from 'react';
import { Modal, Button, Input, Select, useToast } from '@/components/ui';
import { createDesignation } from '@/lib/supabase/org';
import type { Department } from '@/lib/types/hrms';

export function DesignationModal({
  isOpen,
  onClose,
  onCreated,
  departments,
  defaultDepartmentId,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  departments: Department[];
  defaultDepartmentId?: string;
}) {
  const showToast = useToast();
  const [departmentId, setDepartmentId] = useState(defaultDepartmentId ?? '');
  const [name, setName] = useState('');
  const [level, setLevel] = useState('1');
  const [errors, setErrors] = useState<{ department?: string; name?: string }>({});
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setDepartmentId(defaultDepartmentId ?? '');
    setName('');
    setLevel('1');
    setErrors({});
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSave = async () => {
    const found: typeof errors = {};
    if (!departmentId) found.department = 'Select a department.';
    if (!name.trim()) found.name = 'Designation name is required.';
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    try {
      await createDesignation({
        department_id: departmentId,
        name: name.trim(),
        level: Number(level) || 1,
      });
      showToast(`Designation "${name.trim()}" created.`, 'success');
      onCreated();
      handleClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not create the designation.';
      setErrors({ name: message.includes('duplicate') ? 'This designation already exists in that department.' : message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="New designation"
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} loading={saving}>
            Create designation
          </Button>
        </>
      }
    >
      <Select
        label="Department"
        value={departmentId}
        onChange={(e) => setDepartmentId(e.target.value)}
        error={errors.department}
        required
      >
        <option value="">Select a department</option>
        {departments.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name}
          </option>
        ))}
      </Select>
      <Input
        label="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={errors.name}
        placeholder="Senior Backend Engineer"
        required
      />
      <Select label="Level" value={level} onChange={(e) => setLevel(e.target.value)} hint="1 = individual contributor, higher = more senior.">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <option key={n} value={n}>
            Level {n}
          </option>
        ))}
      </Select>
    </Modal>
  );
}
