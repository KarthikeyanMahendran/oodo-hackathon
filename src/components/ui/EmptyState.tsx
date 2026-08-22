import { LucideIcon } from 'lucide-react';

export function EmptyState({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="hr-empty-state-wrapper">
      <div className="hr-empty-state-card">
        <div className="hr-empty-state-icon" aria-hidden>
          <Icon size={40} strokeWidth={1.5} />
        </div>
        <h3 className="hr-empty-state-title">{title}</h3>
        {description && <p className="hr-empty-state-description">{description}</p>}
        {children}
      </div>
    </div>
  );
}
