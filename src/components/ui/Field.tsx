'use client';

import { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

interface FieldShell {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
}

function Shell({ label, error, hint, required, className = '', children }: FieldShell & { children: React.ReactNode }) {
  return (
    <div className={`hr-form-group ${className}`.trim()}>
      {label && (
        <label className="hr-form-label">
          {label}
          {required && <span className="hr-required"> *</span>}
        </label>
      )}
      {children}
      {error ? <span className="hr-error-text">{error}</span> : hint ? <span className="hr-form-hint">{hint}</span> : null}
    </div>
  );
}

export function Input({
  label,
  error,
  hint,
  required,
  className,
  ...props
}: FieldShell & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Shell label={label} error={error} hint={hint} required={required} className={className}>
      <input className={`hr-input ${error ? 'hr-input-error' : ''}`.trim()} aria-invalid={!!error} {...props} />
    </Shell>
  );
}

export function Select({
  label,
  error,
  hint,
  required,
  className,
  children,
  ...props
}: FieldShell & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <Shell label={label} error={error} hint={hint} required={required} className={className}>
      <select className={`hr-select ${error ? 'hr-input-error' : ''}`.trim()} aria-invalid={!!error} {...props}>
        {children}
      </select>
    </Shell>
  );
}

export function Textarea({
  label,
  error,
  hint,
  required,
  className,
  ...props
}: FieldShell & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <Shell label={label} error={error} hint={hint} required={required} className={className}>
      <textarea className={`hr-textarea ${error ? 'hr-input-error' : ''}`.trim()} aria-invalid={!!error} {...props} />
    </Shell>
  );
}

export function FieldRow({ children }: { children: React.ReactNode }) {
  return <div className="hr-field-group">{children}</div>;
}
