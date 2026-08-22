'use client';

import { ReactNode } from 'react';
import { SkeletonRow } from './Skeleton';

export interface Column<T> {
  header: string;
  accessor?: Extract<keyof T, string>;
  align?: 'left' | 'right' | 'center';
  width?: string;
  render?: (row: T) => ReactNode;
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  skeletonRows?: number;
  emptyMessage?: string;
  rowKey?: (row: T, index: number) => string;
  onRowClick?: (row: T) => void;
}

export function Table<T extends object>({
  columns,
  data,
  loading = false,
  skeletonRows = 5,
  emptyMessage = 'No records found.',
  rowKey,
  onRowClick,
}: TableProps<T>) {
  return (
    <div className="hr-table-wrapper">
      <table className="hr-table">
        <thead>
          <tr>
            {columns.map((col, i) => (
              <th key={i} style={{ textAlign: col.align || 'left', width: col.width }}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: skeletonRows }, (_, i) => <SkeletonRow key={i} columns={columns.length} />)
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="hr-loading">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, ri) => (
              <tr
                key={rowKey ? rowKey(row, ri) : ((row as { id?: string }).id ?? ri)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={onRowClick ? 'is-clickable' : undefined}
              >
                {columns.map((col, ci) => (
                  <td key={ci} style={{ textAlign: col.align || 'left' }}>
                    {col.render
                      ? col.render(row)
                      : col.accessor
                        ? ((row[col.accessor] as ReactNode) ?? '—')
                        : '—'}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
