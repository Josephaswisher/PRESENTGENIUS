/**
 * useConfirm Hook
 * Promise-based confirmation dialog hook
 * Usage: const { confirm } = useConfirm()
 *        const ok = await confirm({ title, message, variant })
 */
import { useCallback } from 'react';
import { useDialogStore, DialogOptions } from '../stores/dialog.store';

export const useConfirm = () => {
  const openDialog = useDialogStore((state) => state.openDialog);

  const confirm = useCallback(
    (options: DialogOptions): Promise<boolean> => {
      return openDialog(options);
    },
    [openDialog]
  );

  return { confirm };
};

export default useConfirm;
