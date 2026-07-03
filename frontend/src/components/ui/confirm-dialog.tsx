'use client';

import { isValidElement, type ReactNode } from 'react';
import { AlertTriangle, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

export type ConfirmDialogVariant = 'default' | 'danger';

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  icon?: LucideIcon | ReactNode;
  variant?: ConfirmDialogVariant;
  loading?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
}

function renderIcon(icon: LucideIcon | ReactNode | undefined, variant: ConfirmDialogVariant) {
  const wrapperClass = cn(
    'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
    variant === 'danger'
      ? 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400'
      : 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
  );

  if (!icon) {
    return (
      <div className={wrapperClass}>
        <AlertTriangle className="h-5 w-5" />
      </div>
    );
  }

  if (isValidElement(icon)) {
    return <div className={wrapperClass}>{icon}</div>;
  }

  const Icon = icon as LucideIcon;
  return (
    <div className={wrapperClass}>
      <Icon className="h-5 w-5" />
    </div>
  );
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title = 'Are you sure?',
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  icon,
  variant = 'default',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-start gap-3">
            {renderIcon(icon, variant)}
            <div className="space-y-2">
              <AlertDialogTitle>{title}</AlertDialogTitle>
              {description ? <AlertDialogDescription>{description}</AlertDialogDescription> : null}
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button
              type="button"
              variant="secondary"
              disabled={loading}
              onClick={onCancel}
            >
              {cancelText}
            </Button>
          </AlertDialogCancel>
          <Button
            type="button"
            variant={variant === 'danger' ? 'danger' : 'primary'}
            loading={loading}
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
