import { SkeletonStatCard } from './Skeleton';

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

export function StatGrid({
  children,
  loading = false,
  count = 3,
}: {
  children: React.ReactNode;
  /** Swaps children for skeleton tiles while data is in flight. */
  loading?: boolean;
  /** How many skeleton tiles to render — match the real tile count so nothing jumps. */
  count?: number;
}) {
  return (
    <div className="hr-stat-grid">
      {loading ? Array.from({ length: count }, (_, i) => <SkeletonStatCard key={i} />) : children}
    </div>
  );
}
