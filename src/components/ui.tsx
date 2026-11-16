'use client';

import Image from 'next/image';
import { useEffect, useId, useRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Icon, type IconName } from './Icon';
import styles from './ui.module.css';

export function Button({
  children,
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
}) {
  return (
    <button type="button" className={`button button-${variant} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function Brand({ compact = false }: { compact?: boolean }) {
  const logoSize = compact ? 52 : 80;

  return (
    <div className={`${styles.brand} ${compact ? styles.brandCompact : ''}`}>
      <Image
        src="/images/logo.svg"
        alt=""
        width={logoSize}
        height={logoSize}
        unoptimized
        className={styles.brandLogo}
      />
      <div>
        <span className={styles.brandName}>Marta Sátyl</span>
        <span className={styles.brandSub}>ESPAÇO EQUILÍBRIO</span>
        <span className={styles.brandDetail}>CORPO & MENTE</span>
      </div>
    </div>
  );
}

export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className={styles.heading}>
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className={styles.description}>{description}</p>
      </div>
      {action && <div className={styles.headingAction}>{action}</div>}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon = 'calendar',
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: IconName;
}) {
  return (
    <div className={styles.empty}>
      <span className={styles.emptyIcon}>
        <Icon name={icon} size={27} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}

export function Loading() {
  return (
    <div className={styles.loading} role="status">
      <span className={styles.loadingMark}>
        <Icon name="leaf" size={36} />
      </span>
      <p>Preparando seu espaço…</p>
    </div>
  );
}

export function Dialog({
  open,
  title,
  description,
  children,
  onClose,
  drawer = false,
}: {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
  drawer?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || !open) return;
    const previous = document.activeElement as HTMLElement | null;
    dialog.showModal();
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      document.body.style.overflow = oldOverflow;
      previous?.focus();
    };
  }, [open]);
  return (
    <dialog
      ref={ref}
      className={`${styles.dialog} ${drawer ? styles.drawer : ''}`}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === ref.current) {
          const rect = ref.current.getBoundingClientRect();
          if (
            event.clientX < rect.left ||
            event.clientX > rect.right ||
            event.clientY < rect.top ||
            event.clientY > rect.bottom
          )
            onClose();
        }
      }}
    >
      <header className={styles.dialogHeader}>
        <div>
          <p className="eyebrow">ESPAÇO EQUILÍBRIO</p>
          <h2 id={titleId}>{title}</h2>
          {description && <p id={descriptionId}>{description}</p>}
        </div>
        <button type="button" className="icon-button" aria-label="Fechar painel" onClick={onClose}>
          <Icon name="close" />
        </button>
      </header>
      <div className={styles.dialogBody}>{children}</div>
    </dialog>
  );
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  onClose,
  onConfirm,
  danger = false,
  children,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onClose: () => void;
  onConfirm: () => void;
  danger?: boolean;
  children?: ReactNode;
}) {
  return (
    <Dialog open={open} title={title} description={description} onClose={onClose}>
      {children}
      <div className={styles.dialogActions}>
        <Button variant="secondary" onClick={onClose}>
          Voltar
        </Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>
          <Icon name={danger ? 'close' : 'check'} size={17} />
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}

export function Field({
  id,
  label,
  error,
  optional,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={styles.field}>
      <label htmlFor={id}>
        {label}
        {optional && <span>Opcional</span>}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}
