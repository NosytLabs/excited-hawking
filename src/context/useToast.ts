import { useContext } from 'react';
import { ToastContext } from './ToastContext';

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    return { toasts: [], addToast: () => {}, removeToast: () => {} };
  }
  return context;
};