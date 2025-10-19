import { toast, ToastOptions } from 'react-toastify';

const defaultOptions: ToastOptions = {
  position: 'top-right',
  autoClose: 5000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
};

export const showSuccess = (message: string) => {
  toast.success(message, defaultOptions);
};

export const showError = (message: string, error?: any) => {
  const errorMessage = error?.message || error?.toString() || 'An unknown error occurred';
  toast.error(`${message}\n${errorMessage}`, {
    ...defaultOptions,
    autoClose: 7000,
  });
};

export const showInfo = (message: string) => {
  toast.info(message, defaultOptions);
};

export const showWarning = (message: string) => {
  toast.warning(message, defaultOptions);
};

export const showLoading = (message: string) => {
  return toast.loading(message, defaultOptions);
};

export const updateToast = (toastId: any, type: 'success' | 'error' | 'info', message: string) => {
  toast.update(toastId, {
    render: message,
    type: type,
    isLoading: false,
    autoClose: 5000,
  });
};