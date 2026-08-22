export type Tone = 'success' | 'warning' | 'danger' | 'info' | 'muted';

const TONE_CLASS: Record<Tone, string> = {
  success: 'is-success',
  warning: 'is-warning',
  danger: 'is-danger',
  info: 'is-info',
  muted: 'is-muted',
};

export function Badge({ tone = 'muted', children }: { tone?: Tone; children: React.ReactNode }) {
  return <span className={`hr-badge is-glass ${TONE_CLASS[tone]}`}>{children}</span>;
}

/** Maps a workflow status onto a tone so every screen colours status identically. */
export function statusTone(status?: string): Tone {
  switch ((status || '').toUpperCase()) {
    case 'APPROVED':
    case 'PAID':
    case 'PRESENT':
    case 'COMPLETED':
      return 'success';
    case 'PENDING':
    case 'DRAFT':
    case 'PROCESSING':
      return 'warning';
    case 'REJECTED':
    case 'ABSENT':
    case 'FAILED':
      return 'danger';
    case 'LEAVE':
    case 'ON_LEAVE':
      return 'info';
    default:
      return 'muted';
  }
}

export function StatusBadge({ status }: { status?: string }) {
  const label = (status || '—').replace(/_/g, ' ');
  return <Badge tone={statusTone(status)}>{label.charAt(0) + label.slice(1).toLowerCase()}</Badge>;
}
