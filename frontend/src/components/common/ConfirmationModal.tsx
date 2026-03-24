import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Удалить',
  cancelText = 'Отмена',
  type = 'danger'
}: ConfirmationModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/50 p-3 backdrop-blur-sm sm:items-center sm:p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-md overflow-hidden rounded-t-[2rem] bg-white shadow-2xl sm:rounded-[2rem]"
          >
            <div className="flex items-center justify-between border-b border-slate-100 p-4 sm:p-6">
              <h3 className="text-lg font-black text-slate-900 sm:text-xl">{title}</h3>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-5 text-center sm:p-8">
              <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 ${
                type === 'danger' ? 'bg-rose-50 text-rose-600' : 
                type === 'warning' ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'
              }`}>
                <AlertTriangle size={40} />
              </div>
              <p className="text-slate-600 font-medium leading-relaxed">{message}</p>
            </div>
            <div className="flex flex-col gap-3 bg-slate-50 p-4 sm:flex-row sm:p-6">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-200 transition-all"
              >
                {cancelText}
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`flex-1 px-6 py-3 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 ${
                  type === 'danger' ? 'bg-rose-600 shadow-rose-600/20 hover:bg-rose-700' : 
                  type === 'warning' ? 'bg-amber-600 shadow-amber-600/20 hover:bg-amber-700' : 'bg-indigo-600 shadow-indigo-600/20 hover:bg-indigo-700'
                }`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
