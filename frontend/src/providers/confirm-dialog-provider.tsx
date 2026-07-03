'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { LucideIcon } from 'lucide-react';
import { ConfirmDialog, type ConfirmDialogVariant } from '@/components/ui/confirm-dialog';

export interface ConfirmOptions {
  title?: string;
  description?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  icon?: LucideIcon | ReactNode;
  variant?: ConfirmDialogVariant;
  loading?: boolean;
}

interface ConfirmDialogContextValue {
  confirm: (options?: ConfirmOptions) => Promise<boolean>;
}

const ConfirmDialogContext = createContext<ConfirmDialogContextValue | null>(null);

interface ActiveConfirmState extends ConfirmOptions {
  open: boolean;
}

const defaultState: ActiveConfirmState = {
  open: false,
};

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ActiveConfirmState>(defaultState);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const closeDialog = useCallback((result: boolean) => {
    resolveRef.current?.(result);
    resolveRef.current = null;
    setState(defaultState);
  }, []);

  const confirm = useCallback((options: ConfirmOptions = {}) => {
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
      setState({
        open: true,
        ...options,
      });
    });
  }, []);

  const value = useMemo(() => ({ confirm }), [confirm]);

  return (
    <ConfirmDialogContext.Provider value={value}>
      {children}
      <ConfirmDialog
        open={state.open}
        onOpenChange={(open) => {
          if (!open) closeDialog(false);
        }}
        title={state.title}
        description={state.description}
        confirmText={state.confirmText}
        cancelText={state.cancelText}
        icon={state.icon}
        variant={state.variant}
        loading={state.loading}
        onCancel={() => closeDialog(false)}
        onConfirm={() => closeDialog(true)}
      />
    </ConfirmDialogContext.Provider>
  );
}

export function useConfirmDialogContext() {
  const context = useContext(ConfirmDialogContext);
  if (!context) {
    throw new Error('useConfirm must be used within ConfirmDialogProvider');
  }
  return context;
}
