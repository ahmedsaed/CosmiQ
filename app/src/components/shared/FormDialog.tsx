'use client';

import { FormEvent, ReactNode } from 'react';
import { BaseModal } from './BaseModal';
import { Button } from '../ui/Button';

interface FormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  onSubmit: (e: FormEvent) => void | Promise<void>;
  loading?: boolean;
  children: ReactNode;
  submitLabel?: string;
  cancelLabel?: string;
  submitDisabled?: boolean;
}

export function FormDialog({
  isOpen,
  onClose,
  title,
  onSubmit,
  loading = false,
  children,
  submitLabel = 'Submit',
  cancelLabel = 'Cancel',
  submitDisabled = false,
}: FormDialogProps) {
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await onSubmit(e);
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {children}
        
        <div className="flex justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={loading || submitDisabled}
            isLoading={loading}
          >
            {submitLabel}
          </Button>
        </div>
      </form>
    </BaseModal>
  );
}
