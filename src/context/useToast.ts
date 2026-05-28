import { useContext } from 'react';
import { ToastContext } from './toast-context';

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    return { toasts: [], addToast: () => {}, removeToast: () => {} };
  }
  return context;
};