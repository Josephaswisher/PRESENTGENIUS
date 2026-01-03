/**
 * useToast Hook
 * Convenient hook for triggering toast notifications
 */
import { useCallback } from 'react';
import { useToastStore, ToastType } from '../stores/toast.store';

export const useToast = () => {
  const addToast = useToastStore((state) => state.addToast);

  const toast = useCallback(
    (message: string, type: ToastType = 'info', duration?: number) => {
      addToast({ message, type, duration });
    },
    [addToast]
  );

  const success = useCallback(
    (message: string, duration?: number) => {
      toast(message, 'success', duration);
    },
    [toast]
  );

  const error = useCallback(
    (message: string, duration?: number) => {
      toast(message, 'error', duration);
    },
    [toast]
  );

  const info = useCallback(
    (message: string, duration?: number) => {
      toast(message, 'info', duration);
    },
    [toast]
  );

  return {
    toast,
    success,
    error,
    info,
  };
};
