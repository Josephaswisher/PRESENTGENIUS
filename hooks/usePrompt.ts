/**
 * usePrompt Hook
 * Promise-based input dialog hook
 * Usage: const { prompt } = usePrompt()
 *        const value = await prompt({ title, type, validator })
 */
import { useCallback } from 'react';
import { useInputDialogStore, InputDialogOptions } from '../stores/input-dialog.store';

export const usePrompt = () => {
  const openInputDialog = useInputDialogStore((state) => state.openInputDialog);

  const prompt = useCallback(
    (options: InputDialogOptions): Promise<string | null> => {
      return openInputDialog(options);
    },
    [openInputDialog]
  );

  return { prompt };
};

export default usePrompt;
