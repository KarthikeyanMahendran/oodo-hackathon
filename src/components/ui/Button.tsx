'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'link';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
  icon?: React.ReactNode;
}

const VARIANT_CLASS: Record<Variant, string> = {
  primary: 'hr-btn-primary',
  secondary: 'hr-btn-secondary',
  danger: 'hr-btn-danger',
  ghost: 'hr-btn-ghost',
  link: 'hr-btn-link',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', loading = false, icon, children, className = '', disabled, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={`${VARIANT_CLASS[variant]} ${className}`.trim()}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <span className="hr-spinner" aria-hidden /> : icon}
      {children}
    </button>
  );
});

export function IconButton({
  label,
  children,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button className={`hr-btn-circle ${className}`.trim()} aria-label={label} title={label} {...props}>
      {children}
    </button>
  );
}
