'use client';

import { Modal, Button, Select, Input, Textarea, FieldRow } from '@/components/ui';
import { useToast } from '@/components/ui';
import { useLeave } from '@/lib/hooks';
import type { LeaveType } from '@/lib/types/hrms';

export function LeaveRequestModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { draft, setField, errors, days, saving, submit, reset, balance } = useLeave();
  const showToast = useToast();

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    const ok = await submit();
    if (ok) {
      showToast('Leave request submitted for approval.', 'success');
      onClose();
    }
  };

  const remaining =
    draft.type === 'PAID'
      ? balance.paid_days - balance.paid_used
      : draft.type === 'SICK'
        ? balance.sick_days - balance.sick_used
        : null;

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
          <Button onClick={handleSubmit} loading={saving}>
            Submit request
          </Button>
        </>
      }
    >
      <Select
        label="Leave type"
        value={draft.type}
        onChange={(e) => setField('type', e.target.value as LeaveType)}
        error={errors.type}
        hint={remaining !== null ? `${remaining} day(s) remaining` : 'Unpaid leave does not draw from a balance'}
        required
      >
        <option value="PAID">Paid leave</option>
        <option value="SICK">Sick leave</option>
        <option value="UNPAID">Unpaid leave</option>
      </Select>

      <FieldRow>
        <Input
          label="From"
          type="date"
          value={draft.start_date}
          onChange={(e) => setField('start_date', e.target.value)}
          error={errors.start_date}
          required
        />
        <Input
          label="To"
          type="date"
          min={draft.start_date || undefined}
          value={draft.end_date}
          onChange={(e) => setField('end_date', e.target.value)}
          error={errors.end_date}
          required
        />
      </FieldRow>

      {days > 0 && (
        <div className="hr-alert hr-alert-info">
          This request covers <strong>{days} day(s)</strong>.
        </div>
      )}

      <Textarea
        label="Reason"
        rows={3}
        value={draft.reason}
        onChange={(e) => setField('reason', e.target.value)}
        error={errors.reason}
        placeholder="Give your manager the context they need to approve quickly."
        required
      />
    </Modal>
  );
}
