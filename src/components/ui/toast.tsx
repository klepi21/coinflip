import { useState, useCallback } from 'react';

interface Toast {
  id: number;
  title: string;
  description?: string;
  duration?: number;
  variant?: 'default' | 'destructive';
}

interface ToastOptions {
  title: string;
  description?: string;
  duration?: number;
  variant?: 'default' | 'destructive';
}

let toastId = 0;

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((options: ToastOptions) => {
    const id = toastId++;
    const newToast: Toast = {
      id,
      title: options.title,
      description: options.description,
      duration: options.duration || 5000,
      variant: options.variant || 'default',
    };

    setToasts((currentToasts) => [...currentToasts, newToast]);

    if (options.duration !== Infinity) {
      setTimeout(() => {
        setToasts((currentToasts) =>
          currentToasts.filter((toast) => toast.id !== id)
        );
      }, options.duration || 5000);
    }

    return id;
  }, []);

  const ToastContainer = () => (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            rounded-lg shadow-lg p-4 min-w-[300px] max-w-[500px]
            animate-slide-in-right
            ${
              toast.variant === 'destructive'
                ? 'bg-red-600 text-white'
                : 'bg-white text-gray-900 dark:bg-gray-800 dark:text-white'
            }
          `}
        >
          <div className="font-semibold">{toast.title}</div>
          {toast.description && (
            <div className="text-sm mt-1">{toast.description}</div>
          )}
        </div>
      ))}
    </div>
  );

  return { toast, ToastContainer };
} 