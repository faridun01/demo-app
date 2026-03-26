import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { clsx } from 'clsx';
import { History, RotateCcw, X } from 'lucide-react';
import { formatProductName } from '../../utils/productName';

interface ProductHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName?: string | null;
  productHistory: any[];
  onReverseIncoming?: (transactionId: number) => void | Promise<void>;
}

const getTypeLabel = (type: string) => {
  if (type === 'incoming') return 'Приход';
  if (type === 'outgoing') return 'Расход';
  if (type === 'price_change' || type === 'adjustment') return 'Изменение';
  return 'Перенос';
};

const getTypeClassName = (type: string) =>
  clsx(
    'rounded-lg px-2 py-1 text-[10px] font-black uppercase',
    type === 'incoming'
      ? 'bg-emerald-50 text-emerald-600'
      : type === 'outgoing'
        ? 'bg-rose-50 text-rose-600'
        : type === 'price_change' || type === 'adjustment'
          ? 'bg-sky-50 text-sky-600'
          : 'bg-amber-50 text-amber-600'
  );

export default function ProductHistoryModal({
  isOpen,
  onClose,
  productName,
  productHistory,
  onReverseIncoming,
}: ProductHistoryModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-3 backdrop-blur-sm sm:items-center sm:p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[94vh] w-full max-w-[60rem] flex-col overflow-hidden rounded-t-[2rem] bg-white shadow-2xl sm:max-h-[88vh] sm:rounded-[2rem]"
          >
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/50 p-5 sm:p-6">
              <h3 className="flex items-center space-x-3 text-xl font-black text-slate-900">
                <div className="rounded-2xl bg-sky-500 p-2.5 text-white">
                  <History size={20} />
                </div>
                <span>История товара: {formatProductName(productName)}</span>
              </h3>
              <button type="button" onClick={onClose} className="text-slate-400 transition-colors hover:text-slate-600">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="space-y-3 sm:hidden">
                {productHistory.map((t, i) => (
                  <div key={i} className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{new Date(t.createdAt).toLocaleString('ru-RU')}</p>
                        <p className="mt-1 text-xs text-slate-500">{t.warehouseName || t.warehouse?.name || '---'}</p>
                      </div>
                      <span className={getTypeClassName(t.type)}>
                        {getTypeLabel(t.type)}
                      </span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-white px-3 py-3">
                        <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">Кол-во</p>
                        <p className="mt-1 text-sm font-black text-slate-900">
                          {Number(t.qtyChange || 0) > 0 ? `+${t.qtyChange}` : (t.qtyChange ?? 0)}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-white px-3 py-3">
                        <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">Пользователь</p>
                        <p className="mt-1 break-words text-sm font-medium text-slate-900">{t.username || '---'}</p>
                      </div>
                    </div>
                    <div className="mt-3 rounded-2xl bg-white px-3 py-3">
                      <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">Причина</p>
                      <p className="mt-1 break-words text-sm text-slate-600">{t.reason || '---'}</p>
                    </div>
                    {t.canReverseIncoming && onReverseIncoming && (
                      <button
                        type="button"
                        onClick={() => onReverseIncoming(Number(t.transactionId))}
                        className="mt-3 inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-black text-rose-700 transition-all hover:bg-rose-100"
                      >
                        <RotateCcw size={14} />
                        <span>Отменить приход</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <table className="hidden w-full table-fixed text-left sm:table">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <th className="w-[17%] pb-4">Дата</th>
                    <th className="w-[10%] pb-4">Тип</th>
                    <th className="w-[9%] pb-4">Кол-во</th>
                    <th className="w-[13%] pb-4">Склад</th>
                    <th className="w-[29%] pb-4">Причина</th>
                    <th className="w-[12%] pb-4">Пользователь</th>
                    <th className="w-[10%] pb-4 text-right">Действие</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {productHistory.map((t, i) => (
                    <tr key={i} className="text-[13px]">
                      <td className="py-3 pr-3 align-top text-slate-500">{new Date(t.createdAt).toLocaleString('ru-RU')}</td>
                      <td className="py-3 pr-3 align-top">
                        <span className={getTypeClassName(t.type)}>
                          {getTypeLabel(t.type)}
                        </span>
                      </td>
                      <td className="py-3 pr-3 align-top font-black">
                        {Number(t.qtyChange || 0) > 0 ? `+${t.qtyChange}` : (t.qtyChange ?? 0)}
                      </td>
                      <td className="py-3 pr-3 align-top break-words text-slate-600">{t.warehouseName || t.warehouse?.name || '---'}</td>
                      <td className="py-3 pr-3 align-top break-words italic text-slate-500">{t.reason || '---'}</td>
                      <td className="py-3 pr-3 align-top break-words text-slate-500">{t.username}</td>
                      <td className="py-3 align-top text-right">
                        {t.canReverseIncoming && onReverseIncoming ? (
                          <button
                            type="button"
                            onClick={() => onReverseIncoming(Number(t.transactionId))}
                            className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-black text-rose-700 transition-all hover:bg-rose-100"
                          >
                            <RotateCcw size={12} />
                            <span>Отменить</span>
                          </button>
                        ) : (
                          <span className="text-xs text-slate-300">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
