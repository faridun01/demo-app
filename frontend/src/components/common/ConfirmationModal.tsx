import React, { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Dialog } from './Dialog';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  closeOnConfirmStart?: boolean;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Удалить',
  cancelText = 'Отмена',
  type = 'danger',
  closeOnConfirmStart = false,
}: ConfirmationModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    if (closeOnConfirmStart) {
      setIsSubmitting(true);
      onClose();

      try {
        await Promise.resolve(onConfirm());
      } finally {
        setIsSubmitting(false);
      }

      return;
    }

    try {
      setIsSubmitting(true);
      await Promise.resolve(onConfirm());
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const iconClassName =
    type === 'danger'
      ? 'bg-rose-50 text-rose-600'
      : type === 'warning'
        ? 'bg-amber-50 text-amber-600'
        : 'bg-indigo-50 text-indigo-600';

  const confirmClassName =
    type === 'danger'
      ? 'app-button-danger'
      : type === 'warning'
        ? 'app-button bg-amber-600 text-white hover:bg-amber-700'
        : 'app-button bg-indigo-600 text-white hover:bg-indigo-700';

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      title={title}
      widthClassName="max-w-md"
      closeDisabled={isSubmitting}
      bodyClassName="px-5 py-5 text-center sm:px-6 sm:py-6"
      footer={
        <>
          <button type="button" onClick={onClose} disabled={isSubmitting} className="app-button-secondary min-w-[120px]">
            {cancelText}
          </button>
          <button type="button" onClick={handleConfirm} disabled={isSubmitting} className={confirmClassName}>
            {isSubmitting && !closeOnConfirmStart ? 'Подождите...' : confirmText}
          </button>
        </>
      }
    >
      <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${iconClassName}`}>
        <AlertTriangle size={30} />
      </div>
      <p className="mx-auto max-w-sm text-sm leading-6 text-slate-600">{message}</p>
    </Dialog>
  );
}
