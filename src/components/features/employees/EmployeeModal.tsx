'use client';

import { useState } from 'react';
import { Copy, Check, KeyRound } from 'lucide-react';
import { Modal, Button, Input, Select, FieldRow, useToast } from '@/components/ui';
import { useEmployeeForm, useOrgStructure } from '@/lib/hooks';

export function EmployeeModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { draft, setField, errors, credential, saving, submit, reset } = useEmployeeForm();
  const { departments, scopedDesignations, migrationPending, loading: orgLoading } = useOrgStructure(
    draft.department_id
  );
  const showToast = useToast();
  const [copied, setCopied] = useState(false);

  const handleClose = () => {
    reset();
    setCopied(false);
    onClose();
  };

  const handleSubmit = () => {
    const ok = submit({
      department: departments.find((d) => d.id === draft.department_id)?.name,
      designation: scopedDesignations.find((d) => d.id === draft.designation_id)?.name,
    });
    if (ok) showToast('Employee created. Share the credentials below.', 'success');
  };

  const copyCredentials = async () => {
    if (!credential) return;
    const text = `Name: ${credential.name}\nLogin ID: ${credential.login_id}\nInitial password: ${credential.tempPass}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('Could not copy — select the text manually.', 'warning');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={credential ? 'Employee created' : 'Add employee'}
      subtitle={credential ? 'Share these credentials with the new joiner' : 'A login ID and password are generated automatically'}
      size="lg"
      footer={
        credential ? (
          <Button onClick={handleClose}>Done</Button>
        ) : (
          <>
            <Button variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} loading={saving}>
              Create employee
            </Button>
          </>
        )
      }
    >
      {credential ? (
        <div className="hr-credential">
          <div className="hr-credential-icon" aria-hidden>
            <KeyRound size={22} />
          </div>
          <p className="hr-cell-primary">{credential.name}</p>
          <ul className="hr-line-items">
            <li>
              <span>Login ID</span>
              <span className="hr-monospace">{credential.login_id}</span>
            </li>
            <li>
              <span>Initial password</span>
              <span className="hr-monospace">{credential.tempPass}</span>
            </li>
          </ul>
          <Button
            variant="secondary"
            onClick={copyCredentials}
            icon={copied ? <Check size={14} /> : <Copy size={14} />}
          >
            {copied ? 'Copied' : 'Copy credentials'}
          </Button>
          <p className="hr-form-hint">Shown once — copy them before closing this dialog.</p>
        </div>
      ) : (
        <>
          <FieldRow>
            <Input
              label="First name"
              value={draft.first_name}
              onChange={(e) => setField('first_name', e.target.value)}
              error={errors.first_name}
              placeholder="Alex"
              required
            />
            <Input
              label="Last name"
              value={draft.last_name}
              onChange={(e) => setField('last_name', e.target.value)}
              error={errors.last_name}
              placeholder="Rivera"
              required
            />
          </FieldRow>

          <FieldRow>
            <Input
              label="Work email"
              type="email"
              value={draft.email}
              onChange={(e) => setField('email', e.target.value)}
              error={errors.email}
              placeholder="alex@company.com"
              required
            />
            <Input
              label="Phone"
              value={draft.phone}
              onChange={(e) => setField('phone', e.target.value)}
              error={errors.phone}
              placeholder="+91 98765 43210"
            />
          </FieldRow>

          {migrationPending && (
            <div className="hr-alert hr-alert-warning">
              Departments and designations are unavailable until
              <strong> db_schema/migrations/002_org_structure_and_leave.sql </strong>
              has been run.
            </div>
          )}

          <FieldRow>
            <Select
              label="Department"
              value={draft.department_id}
              onChange={(e) => setField('department_id', e.target.value)}
              error={errors.department_id}
              disabled={orgLoading || migrationPending}
              required
            >
              <option value="">
                {orgLoading ? 'Loading…' : 'Select a department'}
              </option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>

            <Select
              label="Designation"
              value={draft.designation_id}
              onChange={(e) => setField('designation_id', e.target.value)}
              error={errors.designation_id}
              disabled={!draft.department_id || migrationPending}
              hint={
                !draft.department_id
                  ? 'Choose a department first'
                  : scopedDesignations.length === 0
                    ? 'No designations defined for this department'
                    : undefined
              }
              required
            >
              <option value="">
                {draft.department_id ? 'Select a designation' : '—'}
              </option>
              {scopedDesignations.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </FieldRow>

          <Input
            label="Monthly fixed wage"
            type="number"
            min={0}
            value={draft.wage}
            onChange={(e) => setField('wage', e.target.value)}
            error={errors.wage}
            hint="Salary components are derived from this wage automatically."
            required
          />
        </>
      )}
    </Modal>
  );
}
