'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  FileText,
  Pencil,
  User,
  Landmark,
  Wallet,
  Mail,
  Phone,
  Building2,
  BriefcaseBusiness,
  CalendarClock,
  UserCog,
  UserX,
  UserCheck,
} from 'lucide-react';
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
  Modal,
  Skeleton,
  SkeletonCircle,
  useToast,
  type TabItem,
} from '@/components/ui';
import { PayslipModal } from '@/components/features/payroll';
import { useHRMS } from '@/lib/context/HRMSContext';
import { usePayroll, useOrgStructure } from '@/lib/hooks';
import { formatCurrency } from '@/lib/utils/salaryCalculator';
import type { Profile } from '@/lib/types/hrms';

const TABS: TabItem[] = [
  { id: 'general', label: 'General', icon: <User size={15} /> },
  { id: 'private', label: 'Private Info', icon: <Landmark size={15} /> },
  { id: 'salary', label: 'Salary', icon: <Wallet size={15} /> },
];

const dateFmt = new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

function ProfileSkeleton() {
  return (
    <div className="hr-profile-layout">
      <Card className="hr-profile-panel">
        <div className="hr-profile-panel-top">
          <Skeleton width={90} height={13} />
          <SkeletonCircle size={30} />
        </div>
        <div className="hr-profile-identity">
          <SkeletonCircle size={52} />
          <Skeleton width={120} height={16} />
          <Skeleton width={80} height={12} />
        </div>
        <div className="hr-panel-divider" />
        <div className="hr-panel-section">
          <Skeleton width={70} height={13} />
        </div>
      </Card>
      <div className="hr-profile-content">
        <Card>
          <Skeleton width="100%" height={120} />
        </Card>
      </div>
    </div>
  );
}

export default function EmployeeProfilePage() {
  const params = useParams();
  const { employees, currentUser, currentRole, updateProfile, setEmployeeActive, getSalaryBreakdown, isLoading } = useHRMS();
  const { period } = usePayroll();
  const { departments, scopedDesignations, departmentName, designationName } = useOrgStructure();
  const showToast = useToast();

  const employeeId = (params?.id as string) || currentUser?.id || '';
  const employee = employees.find((e) => e.id === employeeId);

  const [activeTab, setActiveTab] = useState('general');
  const [editing, setEditing] = useState(false);
  const [showPayslip, setShowPayslip] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [togglingActive, setTogglingActive] = useState(false);
  const [form, setForm] = useState<Partial<Profile>>(employee ?? {});
  const [loadedId, setLoadedId] = useState(employee?.id);

  // Re-seed the form when navigating between profiles, without an effect.
  if (employee && employee.id !== loadedId) {
    setLoadedId(employee.id);
    setForm(employee);
  }

  // Data is still in flight — show a skeleton, not a false "not found".
  if (!employee) {
    if (isLoading) return <ProfileSkeleton />;
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
  const isInactive = employee.is_active === false;
  const breakdown = getSalaryBreakdown(employee.id);
  const initials = `${employee.first_name?.[0] ?? ''}${employee.last_name?.[0] ?? ''}`.toUpperCase();

  const deptLabel = departmentName(employee.department_id) !== '—' ? departmentName(employee.department_id) : employee.department || '—';
  const desigLabel = designationName(employee.designation_id) !== '—' ? designationName(employee.designation_id) : employee.job_position || '—';
  const formDesignations = form.department_id ? scopedDesignations.filter((d) => d.department_id === form.department_id) : [];

  const setField = <K extends keyof Profile>(key: K, value: Profile[K]) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = () => {
    const deptName = departments.find((d) => d.id === form.department_id)?.name;
    const desigName = scopedDesignations.find((d) => d.id === form.designation_id)?.name;
    updateProfile({
      ...form,
      id: employee.id,
      department: deptName ?? form.department,
      job_position: desigName ?? form.job_position,
    });
    setEditing(false);
    showToast('Profile updated.', 'success');
  };

  const handleActivate = async () => {
    setTogglingActive(true);
    const ok = await setEmployeeActive(employee.id, true);
    showToast(ok ? `${employee.first_name} has been reactivated.` : 'Could not reactivate — please retry.', ok ? 'success' : 'error');
    setTogglingActive(false);
  };

  const handleDeactivate = async () => {
    setTogglingActive(true);
    const ok = await setEmployeeActive(employee.id, false);
    showToast(
      ok ? `${employee.first_name} has been deactivated and can no longer sign in.` : 'Could not deactivate — please retry.',
      ok ? 'success' : 'error'
    );
    setTogglingActive(false);
    setConfirmDeactivate(false);
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
        subtitle={`${desigLabel} · ${deptLabel}`}
        actions={
          editing ? (
            <>
              <Button variant="secondary" onClick={() => { setForm(employee); setEditing(false); }}>
                Cancel
              </Button>
              <Button onClick={handleSave}>Save changes</Button>
            </>
          ) : (
            <>
              {isAdmin && !isSelf && (
                <Button
                  variant={isInactive ? 'secondary' : 'danger'}
                  loading={togglingActive}
                  onClick={() => (isInactive ? handleActivate() : setConfirmDeactivate(true))}
                  icon={isInactive ? <UserCheck size={14} /> : <UserX size={14} />}
                >
                  {isInactive ? 'Activate' : 'Deactivate'}
                </Button>
              )}
              {canEdit && (
                <Button onClick={() => setEditing(true)} icon={<Pencil size={14} />}>
                  Edit profile
                </Button>
              )}
            </>
          )
        }
      />

      <div className="hr-profile-layout">
        {/* Left — compact identity panel */}
        <Card className="hr-profile-panel">
          <div className="hr-profile-panel-top">
            <Link href="/employees" className="hr-back-link">
              <ArrowLeft size={13} /> Back to directory
            </Link>
          </div>

          <div className="hr-profile-identity">
            <span className="hr-avatar">{initials}</span>
            <span className="hr-profile-identity-name">
              {employee.first_name} {employee.last_name}
            </span>
            <span className="hr-profile-identity-role">{desigLabel}</span>
            <div className="hr-profile-badges">
              <Badge tone={isInactive ? 'muted' : 'success'}>{isInactive ? 'Inactive' : 'Active'}</Badge>
              <Badge tone={employee.role === 'ADMIN' ? 'info' : 'muted'}>{employee.role}</Badge>
            </div>
            <span className="hr-monospace">{employee.login_id}</span>
          </div>

          <div className="hr-panel-divider" />

          <div className="hr-panel-section">
            <h3 className="hr-panel-section-title">Contact info</h3>
            <div className="hr-panel-row">
              <Mail size={14} aria-hidden />
              <div className="hr-panel-row-body">
                <span className="hr-panel-row-label">Email</span>
                <span className="hr-panel-row-value">{employee.email || '—'}</span>
              </div>
            </div>
            <div className="hr-panel-row">
              <Phone size={14} aria-hidden />
              <div className="hr-panel-row-body">
                <span className="hr-panel-row-label">Phone</span>
                <span className="hr-panel-row-value">{employee.phone || '—'}</span>
              </div>
            </div>
          </div>

          <div className="hr-panel-divider" />

          <div className="hr-panel-section">
            <h3 className="hr-panel-section-title">Employment info</h3>
            <div className="hr-panel-row">
              <Building2 size={14} aria-hidden />
              <div className="hr-panel-row-body">
                <span className="hr-panel-row-label">Department</span>
                <span className="hr-panel-row-value">{deptLabel}</span>
              </div>
            </div>
            <div className="hr-panel-row">
              <BriefcaseBusiness size={14} aria-hidden />
              <div className="hr-panel-row-body">
                <span className="hr-panel-row-label">Designation</span>
                <span className="hr-panel-row-value">{desigLabel}</span>
              </div>
            </div>
            {employee.date_of_joining && (
              <div className="hr-panel-row">
                <CalendarClock size={14} aria-hidden />
                <div className="hr-panel-row-body">
                  <span className="hr-panel-row-label">Joined</span>
                  <span className="hr-panel-row-value">{dateFmt.format(new Date(employee.date_of_joining))}</span>
                </div>
              </div>
            )}
            {employee.manager_name && (
              <div className="hr-panel-row">
                <UserCog size={14} aria-hidden />
                <div className="hr-panel-row-body">
                  <span className="hr-panel-row-label">Manager</span>
                  <span className="hr-panel-row-value">{employee.manager_name}</span>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Right — tabs + detail */}
        <div className="hr-profile-content">
          <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab}>
            {activeTab === 'general' && (
              <Card>
                <CardHeader title="General information" subtitle="Contact details and role" />
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
                  <Select
                    label="Department"
                    value={form.department_id || ''}
                    onChange={(e) => setForm((prev) => ({ ...prev, department_id: e.target.value, designation_id: '' }))}
                    disabled={!editing || !isAdmin}
                  >
                    <option value="">Select a department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </Select>
                  <Select
                    label="Designation"
                    value={form.designation_id || ''}
                    onChange={(e) => setField('designation_id', e.target.value)}
                    disabled={!editing || !isAdmin || !form.department_id}
                    hint={!form.department_id ? 'Choose a department first' : undefined}
                  >
                    <option value="">Select a designation</option>
                    {formDesignations.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </Select>
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
                    <Select
                      label="Marital status"
                      value={form.marital_status || ''}
                      onChange={(e) => setField('marital_status', e.target.value)}
                      disabled={!editing}
                    >
                      <option value="">Not specified</option>
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Other">Other</option>
                    </Select>
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
                  <CardHeader title="Statutory &amp; banking" subtitle="Used for payroll disbursement" />
                  <div className="hr-field-group">
                    <Input
                      label="PAN"
                      value={form.pan_number || ''}
                      onChange={(e) => setField('pan_number', e.target.value.toUpperCase())}
                      disabled={!editing}
                      placeholder="ABCDE1234F"
                    />
                    <Input
                      label="UAN"
                      value={form.uan_number || ''}
                      onChange={(e) => setField('uan_number', e.target.value)}
                      disabled={!editing}
                      placeholder="100000000000"
                    />
                  </div>
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
        </div>
      </div>

      {showPayslip && <PayslipModal row={payslipRow} period={period} onClose={() => setShowPayslip(false)} />}

      <Modal
        isOpen={confirmDeactivate}
        onClose={() => setConfirmDeactivate(false)}
        title="Deactivate employee"
        subtitle={`${employee.first_name} ${employee.last_name}`}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmDeactivate(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeactivate} loading={togglingActive}>
              Deactivate
            </Button>
          </>
        }
      >
        <p className="hr-form-hint" style={{ margin: 0 }}>
          {employee.first_name} will no longer be able to sign in. Their records, payslips and history are kept, and
          you can reactivate the account at any time.
        </p>
      </Modal>
    </div>
  );
}
