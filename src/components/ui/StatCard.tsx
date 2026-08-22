export interface StatCardProps {
  label: string;
  value: React.ReactNode;
  change?: string;
  tone?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  icon?: React.ReactNode;
}

const TONE_VAR: Record<NonNullable<StatCardProps['tone']>, string> = {
  default: 'var(--text-muted)',
  success: 'var(--success)',
  warning: 'var(--warning)',
  danger: 'var(--danger)',
  info: 'var(--info)',
};

export function StatCard({ label, value, change, tone = 'default', icon }: StatCardProps) {
  const color = TONE_VAR[tone];
  return (
    <div className="hr-stat-card">
      {icon && (
        <div className="hr-stat-icon" style={{ color }} aria-hidden>
          {icon}
        </div>
      )}
      <div className="hr-stat-label">{label}</div>
      <div className="hr-stat-value">{value}</div>
      {change && (
        <div className="hr-stat-change" style={{ color }}>
          {change}
        </div>
      )}
    </div>
  );
}

export function StatGrid({ children }: { children: React.ReactNode }) {
  return <div className="hr-stat-grid">{children}</div>;
}
