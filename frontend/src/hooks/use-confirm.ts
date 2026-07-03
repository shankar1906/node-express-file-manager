'use client';

import { useConfirmDialogContext } from '@/providers/confirm-dialog-provider';

export function useConfirm() {
  return useConfirmDialogContext().confirm;
}
