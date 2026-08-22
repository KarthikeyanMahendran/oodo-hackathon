'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText, Pencil, User, Landmark, Wallet } from 'lucide-react';
import {
  PageHeader,
  Card,
  CardHeader,
  Tabs,
  Button,
  Input,
  Select,
  Textarea,
  Badge,
  EmptyState,
  useToast,
  type TabItem,
} from '@/components/ui';
import { PayslipModal } from '@/components/features/payroll';
import { useHRMS } from '@/lib/context/HRMSContext';
import { usePayroll } from '@/lib/hooks';
import { formatCurrency } from '@/lib/utils/salaryCalculator';
import type { Profile } from '@/lib/types/hrms';

const TABS: TabItem[] = [
  { id: 'general', label: 'General', icon: <User size={15} /> },
  { id: 'private', label: 'Private Info', icon: <Landmark size={15} /> },
  { id: 'salary', label: 'Salary', icon: <Wallet size={15} /> },
];

export default function EmployeeProfilePage() {
  const params = useParams();
  const { employees, currentUser, currentRole, updateProfile, getSalaryBreakdown } = useHRMS();
  const { period } = usePayroll();
  const showToast = useToast();

  const employeeId = (params?.id as string) || currentUser?.id || '';
  const employee = employees.find((e) => e.id === employeeId);

  const [activeTab, setActiveTab] = useState('general');
  const [editing, setEditing] = useState(false);
  const [showPayslip, setShowPayslip] = useState(false);
  const [form, setForm] = useState<Partial<Profile>>(employee ?? {});
  const [loadedId, setLoadedId] = useState(employee?.id);

  // Re-seed the form when navigating between profiles, without an effect.
  if (employee && employee.id !== loadedId) {
    setLoadedId(employee.id);
    setForm(employee);
  }

  if (!employee) {
    return (
      <EmptyState icon={User} title="Employee not found" description="This profile may have been removed.">
        <Link href="/employees" className="hr-btn-secondary">
          Back to directory
        </Link>
      </EmptyState>
    );
  }

  const isAdmin = currentRole === 'ADMIN';
  const isSelf = currentUser?.id === employee.id;
  const canEdit = isAdmin || isSelf;
  const breakdown = getSalaryBreakdown(employee.id);
  const initials = `${employee.first_name?.[0] ?? ''}${employee.last_name?.[0] ?? ''}`.toUpperCase();

  const setField = (key: keyof Profile, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = () => {
    updateProfile({ ...form, id: employee.id });
    setEditing(false);
    showToast('Profile updated.', 'success');
  };

  const payslipRow = {
    user_id: employee.id,
    employee_name: `${employee.first_name} ${employee.last_name}`,
    department: employee.department || '—',
    login_id: employee.login_id,
    breakdown,
  };

  return (
    <div className="hr-stack">
      <PageHeader
        title={`${employee.first_name} ${employee.last_name}`}
        subtitle={`${employee.job_position || 'Employee'} · ${employee.department || '—'}`}
        actions={
          <>
            <Link href="/employees" className="hr-btn-secondary">
              <ArrowLeft size={14} /> Directory
            </Link>
            {canEdit && !editing && (
              <Button onClick={() => setEditing(true)} icon={<Pencil size={14} />}>
                Edit
              </Button>
            )}
            {editing && (
              <>
                <Button variant="secondary" onClick={() => { setForm(employee); setEditing(false); }}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>Save changes</Button>
              </>
            )}
          </>
        }
      />

      <Card>
        <div className="hr-profile-head">
          <span className="hr-avatar hr-avatar-lg">{initials}</span>
          <div className="hr-cell-stack">
            <span className="hr-profile-name">
              {employee.first_name} {employee.last_name}
            </span>
            <span className="hr-cell-secondary hr-monospace">{employee.login_id}</span>
            <div className="hr-profile-tags">
              <Badge tone={employee.role === 'ADMIN' ? 'info' : 'muted'}>{employee.role}</Badge>
              {employee.department && <Badge tone="muted">{employee.department}</Badge>}
            </div>
          </div>
        </div>
      </Card>

      <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab}>
        {activeTab === 'general' && (
          <Card>
            <CardHeader title="General information" subtitle="Contact details and bio" />
            <div className="hr-field-group">
              <Input
                label="Email"
                value={form.email || ''}
                onChange={(e) => setField('email', e.target.value)}
                disabled={!editing}
              />
              <Input
                label="Phone"
                value={form.phone || ''}
                onChange={(e) => setField('phone', e.target.value)}
                disabled={!editing}
              />
            </div>
            <div className="hr-field-group">
              <Input
                label="Job position"
                value={form.job_position || ''}
                onChange={(e) => setField('job_position', e.target.value)}
                disabled={!editing || !isAdmin}
              />
              <Input
                label="Department"
                value={form.department || ''}
                onChange={(e) => setField('department', e.target.value)}
                disabled={!editing || !isAdmin}
              />
            </div>
            <Textarea
              label="About"
              rows={4}
              value={form.about || ''}
              onChange={(e) => setField('about', e.target.value)}
              disabled={!editing}
              placeholder="A short bio."
            />
          </Card>
        )}

        {activeTab === 'private' && (
          <div className="hr-stack">
            <Card>
              <CardHeader title="Personal details" subtitle="Visible to the employee and HR only" />
              <div className="hr-field-group">
                <Input
                  label="Personal email"
                  value={form.personal_email || ''}
                  onChange={(e) => setField('personal_email', e.target.value)}
                  disabled={!editing}
                />
                <Input
                  label="Date of birth"
                  type="date"
                  value={form.date_of_birth || ''}
                  onChange={(e) => setField('date_of_birth', e.target.value)}
                  disabled={!editing}
                />
              </div>
              <div className="hr-field-group">
                <Select
                  label="Gender"
                  value={form.gender || ''}
                  onChange={(e) => setField('gender', e.target.value)}
                  disabled={!editing}
                >
                  <option value="">Not specified</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </Select>
                <Input
                  label="Nationality"
                  value={form.nationality || ''}
                  onChange={(e) => setField('nationality', e.target.value)}
                  disabled={!editing}
                />
              </div>
              <Textarea
                label="Address"
                rows={3}
                value={form.address || ''}
                onChange={(e) => setField('address', e.target.value)}
                disabled={!editing}
              />
            </Card>

            <Card>
              <CardHeader title="Banking" subtitle="Used for payroll disbursement" />
              <div className="hr-field-group">
                <Input
                  label="Bank name"
                  value={form.bank_name || ''}
                  onChange={(e) => setField('bank_name', e.target.value)}
                  disabled={!editing}
                />
                <Input
                  label="Account number"
                  value={form.bank_account_number || ''}
                  onChange={(e) => setField('bank_account_number', e.target.value)}
                  disabled={!editing}
                />
                <Input
                  label="IFSC"
                  value={form.bank_ifsc || ''}
                  onChange={(e) => setField('bank_ifsc', e.target.value.toUpperCase())}
                  disabled={!editing}
                />
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'salary' &&
          (isAdmin || isSelf ? (
            <Card>
              <CardHeader
                title="Salary breakdown"
                subtitle={`Monthly structure · annual CTC ${formatCurrency(breakdown.annual_ctc)}`}
                actions={
                  <Button variant="secondary" onClick={() => setShowPayslip(true)} icon={<FileText size={14} />}>
                    View payslip
                  </Button>
                }
              />
              <ul className="hr-line-items">
                <li>
                  <span>Basic salary</span>
                  <span className="hr-monospace">{formatCurrency(breakdown.basic_salary)}</span>
                </li>
                <li>
                  <span>House rent allowance</span>
                  <span className="hr-monospace">{formatCurrency(breakdown.hra)}</span>
                </li>
                <li>
                  <span>Standard allowance</span>
                  <span className="hr-monospace">{formatCurrency(breakdown.standard_allowance)}</span>
                </li>
                <li>
                  <span>Performance bonus</span>
                  <span className="hr-monospace">{formatCurrency(breakdown.performance_bonus)}</span>
                </li>
                <li>
                  <span>Leave travel allowance</span>
                  <span className="hr-monospace">{formatCurrency(breakdown.lta)}</span>
                </li>
                <li>
                  <span>Fixed allowance</span>
                  <span className="hr-monospace">{formatCurrency(breakdown.fixed_allowance)}</span>
                </li>
                <li className="is-total">
                  <span>Gross</span>
                  <span className="hr-monospace">{formatCurrency(breakdown.gross_salary)}</span>
                </li>
                <li>
                  <span>Provident fund</span>
                  <span className="hr-monospace hr-text-danger">-{formatCurrency(breakdown.pf)}</span>
                </li>
                <li>
                  <span>Professional tax</span>
                  <span className="hr-monospace hr-text-danger">-{formatCurrency(breakdown.tax)}</span>
                </li>
                <li className="is-total">
                  <span>Net pay</span>
                  <span className="hr-monospace">{formatCurrency(breakdown.net_salary)}</span>
                </li>
              </ul>
            </Card>
          ) : (
            <EmptyState
              icon={Wallet}
              title="Salary is private"
              description="Only the employee and HR administrators can view this breakdown."
            />
          ))}
      </Tabs>

      {showPayslip && <PayslipModal row={payslipRow} period={period} onClose={() => setShowPayslip(false)} />}
    </div>
  );
}
