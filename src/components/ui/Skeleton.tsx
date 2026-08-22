export function Skeleton({
  width,
  height = '1em',
  radius = 'var(--radius-sm)',
  className = '',
}: {
  width?: string | number;
  height?: string | number;
  radius?: string;
  className?: string;
}) {
  return (
    <span
      className={`hr-skeleton ${className}`.trim()}
      style={{ width, height, borderRadius: radius }}
      aria-hidden
    />
  );
}

export function SkeletonCircle({ size = 32 }: { size?: number }) {
  return <Skeleton width={size} height={size} radius="50%" />;
}

/** Row of skeleton cells shaped like a real table row, for loading tables. */
export function SkeletonRow({ columns }: { columns: number }) {
  return (
    <tr className="hr-skeleton-row" aria-hidden>
      {Array.from({ length: columns }, (_, i) => (
        <td key={i}>
          <Skeleton width={i === 0 ? '70%' : '45%'} />
        </td>
      ))}
    </tr>
  );
}

/** A stat-card-shaped placeholder, for grids that fetch asynchronously. */
export function SkeletonStatCard() {
  return (
    <div className="hr-stat-card hr-skeleton-card" aria-hidden>
      <Skeleton width={60} height={11} />
      <Skeleton width="70%" height={21} />
      <Skeleton width={80} height={11} />
    </div>
  );
}
