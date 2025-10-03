'use client';

import { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

const icons = {
  default: Info,
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const variants = {
  default: 'border-border',
  success: 'border-success',
  error: 'border-danger',
  warning: 'border-warning',
  info: 'border-primary',
};

interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const Icon = icons[toast.variant || 'default'];

  useEffect(() => {
    if (toast.duration !== 0) {
      const timer = setTimeout(() => {
        onRemove(toast.id);
      }, toast.duration || 3000);

      return () => clearTimeout(timer);
    }
  }, [toast, onRemove]);

  return (
    <div
      className={cn(
        'glass-card p-4 border-l-4 shadow-glow-card animate-slide-in max-w-sm w-full',
        variants[toast.variant || 'default']
      )}
    >
      <div className="flex items-start gap-3">
        <Icon
          className={cn(
            'flex-shrink-0 mt-0.5',
            toast.variant === 'success' && 'text-success',
            toast.variant === 'error' && 'text-danger',
            toast.variant === 'warning' && 'text-warning',
            toast.variant === 'info' && 'text-primary',
            !toast.variant && 'text-text-secondary'
          )}
          size={20}
        />
        <div className="flex-1 min-w-0">
          {toast.title && (
            <p className="text-sm font-medium text-text-primary">{toast.title}</p>
          )}
          {toast.description && (
            <p className="text-sm text-text-secondary mt-1">{toast.description}</p>
          )}
        </div>
        <button
          onClick={() => onRemove(toast.id)}
          className="flex-shrink-0 text-text-tertiary hover:text-text-primary transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

// Toast state management hook
let toastCount = 0;
const toastListeners: Array<(toasts: Toast[]) => void> = [];
let toasts: Toast[] = [];

export function useToast() {
  const [, setToastState] = useState<Toast[]>([]);

  useEffect(() => {
    const listener = (newToasts: Toast[]) => {
      setToastState(newToasts);
    };
    toastListeners.push(listener);
    return () => {
      const index = toastListeners.indexOf(listener);
      if (index > -1) {
        toastListeners.splice(index, 1);
      }
    };
  }, []);

  const showToast = (toast: Omit<Toast, 'id'>) => {
    const id = `toast-${++toastCount}`;
    const newToast: Toast = { id, ...toast };
    toasts = [...toasts, newToast];
    toastListeners.forEach((listener) => listener(toasts));
  };

  const removeToast = (id: string) => {
    toasts = toasts.filter((t) => t.id !== id);
    toastListeners.forEach((listener) => listener(toasts));
  };

  return {
    toasts,
    showToast,
    removeToast,
  };
}
