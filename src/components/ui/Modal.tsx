'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  size?: 'sm' | 'md' | 'lg' | 'xlg';
  footer?: React.ReactNode;
  children: React.ReactNode;
}

const SIZE_CLASS = {
  sm: 'hr-modal-sm',
  md: 'hr-modal-md',
  lg: 'hr-modal-lg',
  xlg: 'hr-modal-xlg',
} as const;

export function Modal({ isOpen, onClose, title, subtitle, size = 'md', footer, children }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    // Stop the page behind the overlay from scrolling
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="hr-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`hr-modal ${SIZE_CLASS[size]}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="hr-modal-header">
          <div>
            <h3>{title}</h3>
            {subtitle && <p className="hr-subtext">{subtitle}</p>}
          </div>
          <button className="hr-modal-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="hr-modal-body">{children}</div>
        {footer && <div className="hr-modal-footer">{footer}</div>}
      </div>
    </div>
  );
}
