let globalAddToast: ((message: string, type?: ToastType, duration?: number) => void) | null = null;

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export type Toast = {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
};

export const showToast = (message: string, type: ToastType = 'info', duration = 4000): void => {
  if (globalAddToast) {
    globalAddToast(message, type, duration);
  }
};

export const registerToastFunction = (fn: typeof globalAddToast): void => {
  globalAddToast = fn;
};

export const unregisterToastFunction = (): void => {
  globalAddToast = null;
};