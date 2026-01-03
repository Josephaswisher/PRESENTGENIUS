/**
 * Input Dialog Store
 * Zustand store for managing input dialogs (text, number, URL)
 */
import { create } from 'zustand';

export type InputType = 'text' | 'number' | 'url' | 'email';

export interface InputDialogOptions {
  title: string;
  message?: string;
  type?: InputType;
  defaultValue?: string;
  placeholder?: string;
  validator?: (value: string) => string | null; // Returns error message or null if valid
  confirmText?: string;
  cancelText?: string;
}

interface InputDialogState extends InputDialogOptions {
  isOpen: boolean;
  value: string;
  error: string | null;
  resolve: ((value: string | null) => void) | null;
}

interface InputDialogStore {
  dialog: InputDialogState;
  openInputDialog: (options: InputDialogOptions) => Promise<string | null>;
  closeInputDialog: (result: string | null) => void;
  setValue: (value: string) => void;
  setError: (error: string | null) => void;
}

const initialInputDialogState: InputDialogState = {
  isOpen: false,
  title: '',
  message: '',
  type: 'text',
  value: '',
  defaultValue: '',
  placeholder: '',
  error: null,
  validator: undefined,
  confirmText: 'OK',
  cancelText: 'Cancel',
  resolve: null,
};

export const useInputDialogStore = create<InputDialogStore>((set, get) => ({
  dialog: initialInputDialogState,

  openInputDialog: (options: InputDialogOptions) => {
    return new Promise<string | null>((resolve) => {
      set({
        dialog: {
          isOpen: true,
          title: options.title,
          message: options.message || '',
          type: options.type || 'text',
          value: options.defaultValue || '',
          defaultValue: options.defaultValue || '',
          placeholder: options.placeholder || '',
          error: null,
          validator: options.validator,
          confirmText: options.confirmText || 'OK',
          cancelText: options.cancelText || 'Cancel',
          resolve,
        },
      });
    });
  },

  closeInputDialog: (result: string | null) => {
    const { dialog } = get();
    if (dialog.resolve) {
      dialog.resolve(result);
    }
    set({ dialog: initialInputDialogState });
  },

  setValue: (value: string) => {
    set((state) => ({
      dialog: {
        ...state.dialog,
        value,
        error: null, // Clear error when value changes
      },
    }));
  },

  setError: (error: string | null) => {
    set((state) => ({
      dialog: {
        ...state.dialog,
        error,
      },
    }));
  },
}));
