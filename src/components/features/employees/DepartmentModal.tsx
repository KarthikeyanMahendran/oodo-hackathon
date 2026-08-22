'use client';

import { useState } from 'react';
import { Modal, Button, Input, Textarea, useToast } from '@/components/ui';
import { createDepartment } from '@/lib/supabase/org';

export function DepartmentModal({
  isOpen,
  onClose,
  onCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const showToast = useToast();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setName('');
    setCode('');
    setDescription('');
    setError('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Department name is required.');
      return;
    }
    setSaving(true);
    try {
      await createDepartment({
        name: name.trim(),
        code: code.trim() || undefined,
        description: description.trim() || undefined,
      });
      showToast(`Department "${name.trim()}" created.`, 'success');
      onCreated();
      handleClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not create the department.';
      // Postgres unique_violation surfaces as a generic message; make it readable.
      setError(message.includes('duplicate') ? 'A department with this name already exists.' : message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="New department"
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} loading={saving}>
            Create department
          </Button>
        </>
      }
    >
      <Input
        label="Name"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          setError('');
        }}
        error={error}
        placeholder="Engineering"
        required
      />
      <Input
        label="Code"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="ENG"
        hint="Optional short code."
      />
      <Textarea
        label="Description"
        rows={3}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="What this department owns."
      />
    </Modal>
  );
}
