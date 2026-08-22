import { HTMLAttributes } from 'react';

export function Card({ children, className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`hr-card ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="hr-card-header">
      <div>
        <h3 className="hr-card-title">{title}</h3>
        {subtitle && <p className="hr-subtext">{subtitle}</p>}
      </div>
      {actions && <div className="hr-card-actions">{actions}</div>}
    </div>
  );
}
