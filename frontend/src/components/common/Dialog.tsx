import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '../../lib/cn';

type DialogProps = {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  widthClassName?: string;
  bodyClassName?: string;
  panelClassName?: string;
  headerClassName?: string;
  closeDisabled?: boolean;
  children: React.ReactNode;
};

export function Dialog({
  open,
  onClose,
  title,
  description,
  icon,
  actions,
  footer,
  widthClassName,
  bodyClassName,
  panelClassName,
  headerClassName,
  closeDisabled = false,
  children,
}: DialogProps) {
  React.useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !closeDisabled) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose, closeDisabled]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            if (!closeDisabled) {
              onClose();
            }
          }}
          className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/55 p-2 backdrop-blur-sm sm:items-center sm:p-4"
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.98, opacity: 0 }}
            onClick={(event) => event.stopPropagation()}
            className={cn('app-dialog', widthClassName, panelClassName)}
          >
            {(title || description || icon || actions) && (
              <div className={cn('app-dialog-header', headerClassName)}>
                <div className="flex min-w-0 items-center gap-3">
                  {icon ? <div className="app-dialog-icon">{icon}</div> : null}
                  <div className="min-w-0">
                    {title ? <h3 className="app-dialog-title">{title}</h3> : null}
                    {description ? <p className="app-dialog-description">{description}</p> : null}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {actions}
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={closeDisabled}
                    className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Close dialog"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            )}

            <div className={cn('app-dialog-body', bodyClassName)}>{children}</div>

            {footer ? <div className="app-dialog-footer">{footer}</div> : null}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
