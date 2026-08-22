'use client';

import { useState } from 'react';
import { Modal, Button, Select, Input, Textarea, FieldRow, useToast } from '@/components/ui';
import { useHRMS } from '@/lib/context/HRMSContext';
import { useLeaveCatalog } from '@/lib/hooks';
import { createLeaveRequest } from '@/lib/supabase/org';
import { countDays } from '@/lib/hooks/useLeave';

export function LeaveRequestModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { currentUser, refresh } = useHRMS();
  const { types, balanceFor, migrationPending, loading } = useLeaveCatalog(currentUser?.id);
  const showToast = useToast();

  const [leaveTypeId, setLeaveTypeId] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const selectedType = types.find((t) => t.id === leaveTypeId);
  const balance = leaveTypeId ? balanceFor(leaveTypeId) : null;
  const rawDays = countDays(fromDate, toDate);
  const totalDays = isHalfDay && rawDays === 1 ? 0.5 : rawDays;

  const reset = () => {
    setLeaveTypeId('');
    setFromDate('');
    setToDate('');
    setIsHalfDay(false);
    setReason('');
    setErrors({});
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  /** Validates against the policy stored on the leave type, not hardcoded rules. */
  const validate = (): Record<string, string> => {
    const found: Record<string, string> = {};
    if (!leaveTypeId) found.leaveTypeId = 'Select a leave type.';
    if (!fromDate) found.fromDate = 'Select a start date.';
    if (!toDate) found.toDate = 'Select an end date.';
    if (fromDate && toDate && rawDays === 0) found.toDate = 'End date must be on or after the start date.';
    if (!reason.trim()) found.reason = 'A reason is required.';

    if (selectedType && totalDays > 0) {
      if (balance && totalDays > Number(balance.balance)) {
        found.leaveTypeId = `Only ${balance.balance} day(s) remaining for ${selectedType.name}.`;
      }
      if (selectedType.max_consecutive_days > 0 && totalDays > selectedType.max_consecutive_days) {
        found.toDate = `${selectedType.name} allows at most ${selectedType.max_consecutive_days} consecutive day(s).`;
      }
      if (selectedType.min_notice_days > 0 && fromDate) {
        const notice = Math.floor((new Date(fromDate).getTime() - Date.now()) / 86400000);
        if (notice < selectedType.min_notice_days) {
          found.fromDate = `${selectedType.name} needs ${selectedType.min_notice_days} day(s) notice.`;
        }
      }
      if (selectedType.requires_document) {
        found.document = `${selectedType.name} normally requires supporting documentation.`;
      }
    }
    return found;
  };

  const handleSubmit = async () => {
    if (!currentUser) return;
    const found = validate();
    // A document reminder is advisory, not blocking.
    const blocking = Object.entries(found).filter(([k]) => k !== 'document');
    setErrors(found);
    if (blocking.length > 0) return;

    setSaving(true);
    try {
      await createLeaveRequest({
        employee_id: currentUser.id,
        leave_type_id: leaveTypeId,
        from_date: fromDate,
        to_date: toDate,
        is_half_day: isHalfDay,
        total_days: totalDays,
        reason: reason.trim(),
      });
      showToast('Leave request submitted for approval.', 'success');
      await refresh();
      handleClose();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not submit the request.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Request time off"
      subtitle="Your manager is notified as soon as you submit"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={saving} disabled={migrationPending}>
            Submit request
          </Button>
        </>
      }
    >
      {migrationPending && (
        <div className="hr-alert hr-alert-warning">
          Leave types are unavailable until
          <strong> db_schema/migrations/002_org_structure_and_leave.sql </strong>
          has been run.
        </div>
      )}

      <Select
        label="Leave type"
        value={leaveTypeId}
        onChange={(e) => {
          setLeaveTypeId(e.target.value);
          setErrors({});
        }}
        error={errors.leaveTypeId}
        disabled={loading || migrationPending}
        hint={
          balance
            ? `${balance.balance} of ${balance.allocated_days} day(s) remaining`
            : selectedType && !selectedType.is_paid
              ? 'Unpaid leave does not draw from a balance'
              : undefined
        }
        required
      >
        <option value="">{loading ? 'Loading…' : 'Select a leave type'}</option>
        {types.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
            {t.is_paid ? '' : ' (unpaid)'}
          </option>
        ))}
      </Select>

      <FieldRow>
        <Input
          label="From"
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          error={errors.fromDate}
          required
        />
        <Input
          label="To"
          type="date"
          min={fromDate || undefined}
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          error={errors.toDate}
          required
        />
      </FieldRow>

      {rawDays === 1 && (
        <label className="hr-checkbox">
          <input type="checkbox" checked={isHalfDay} onChange={(e) => setIsHalfDay(e.target.checked)} />
          <span>Half day</span>
        </label>
      )}

      {totalDays > 0 && (
        <div className="hr-alert hr-alert-info">
          This request covers <strong>{totalDays} day(s)</strong>.
        </div>
      )}

      {errors.document && <div className="hr-alert hr-alert-warning">{errors.document}</div>}

      <Textarea
        label="Reason"
        rows={3}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        error={errors.reason}
        placeholder="Give your manager the context they need to approve quickly."
        required
      />
    </Modal>
  );
}
