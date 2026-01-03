/**
 * Dialog Store
 * Zustand store for managing confirmation dialogs
 */
import { create } from 'zustand';

export type DialogVariant = 'success' | 'danger' | 'info';

export interface DialogOptions {
  title: string;
  message: string;
  variant?: DialogVariant;
  confirmText?: string;
  cancelText?: string;
}

interface DialogState extends DialogOptions {
  isOpen: boolean;
  resolve: ((value: boolean) => void) | null;
}

interface DialogStore {
  dialog: DialogState;
  openDialog: (options: DialogOptions) => Promise<boolean>;
  closeDialog: (result: boolean) => void;
}

const initialDialogState: DialogState = {
  isOpen: false,
  title: '',
  message: '',
  variant: 'info',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  resolve: null,
};

export const useDialogStore = create<DialogStore>((set, get) => ({
  dialog: initialDialogState,

  openDialog: (options: DialogOptions) => {
    return new Promise<boolean>((resolve) => {
      set({
        dialog: {
          isOpen: true,
          title: options.title,
          message: options.message,
          variant: options.variant || 'info',
          confirmText: options.confirmText || 'Confirm',
          cancelText: options.cancelText || 'Cancel',
          resolve,
        },
      });
    });
  },

  closeDialog: (result: boolean) => {
    const { dialog } = get();
    if (dialog.resolve) {
      dialog.resolve(result);
    }
    set({ dialog: initialDialogState });
  },
}));
