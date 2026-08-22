export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="hr-page-header">
      <div>
        <h1>{title}</h1>
        {subtitle && <p className="hr-subtext">{subtitle}</p>}
      </div>
      {actions && <div className="hr-header-actions">{actions}</div>}
    </div>
  );
}
