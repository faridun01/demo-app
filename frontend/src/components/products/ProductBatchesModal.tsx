import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { clsx } from 'clsx';
import { Layers, Trash2, X } from 'lucide-react';
import { formatMoney } from '../../utils/format';

interface ProductBatchesModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProduct: any;
  productBatches: any[];
  canManage?: boolean;
  onDeleteBatch?: (batchId: number) => void;
}

const normalizePackageName = (value: string) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return 'ÑƒÐ¿Ð°ÐºÐ¾Ð²ÐºÐ°';
  if (['Ð¼ÐµÑˆÐ¾Ðº', 'Ð¼ÐµÑˆÐºÐ°', 'Ð¼ÐµÑˆÐºÐ¾Ð²', 'bag'].includes(normalized)) return 'Ð¼ÐµÑˆÐ¾Ðº';
  if (['ÐºÐ¾Ñ€Ð¾Ð±ÐºÐ°', 'ÐºÐ¾Ñ€Ð¾Ð±ÐºÐ¸', 'ÐºÐ¾Ñ€Ð¾Ð±Ð¾Ðº', 'box'].includes(normalized)) return 'ÐºÐ¾Ñ€Ð¾Ð±ÐºÐ°';
  if (['ÑƒÐ¿Ð°ÐºÐ¾Ð²ÐºÐ°', 'ÑƒÐ¿Ð°ÐºÐ¾Ð²ÐºÐ¸', 'ÑƒÐ¿Ð°ÐºÐ¾Ð²Ð¾Ðº', 'pack'].includes(normalized)) return 'ÑƒÐ¿Ð°ÐºÐ¾Ð²ÐºÐ°';
  if (['Ð¿Ð°Ñ‡ÐºÐ°', 'Ð¿Ð°Ñ‡ÐºÐ¸', 'Ð¿Ð°Ñ‡ÐµÐº'].includes(normalized)) return 'Ð¿Ð°Ñ‡ÐºÐ°';
  return normalized;
};

const normalizeDisplayBaseUnit = (value: string) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return '\u0448\u0442';
  if (['\u043f\u0430\u0447\u043a\u0430', '\u043f\u0430\u0447\u043a\u0438', '\u043f\u0430\u0447\u0435\u043a', '\u0448\u0442', '\u0448\u0442\u0443\u043a', '\u0448\u0442\u0443\u043a\u0430', '\u0448\u0442\u0443\u043a\u0438', 'pcs', 'piece', 'pieces'].includes(normalized)) {
    return '\u0448\u0442';
  }
  return normalized;
};

const pluralizeRu = (count: number, forms: [string, string, string]) => {
  const abs = Math.abs(count) % 100;
  const last = abs % 10;

  if (abs > 10 && abs < 20) return forms[2];
  if (last > 1 && last < 5) return forms[1];
  if (last === 1) return forms[0];
  return forms[2];
};

const formatCountWithUnit = (count: number, unit: string) => {
  const normalized = String(unit || '').trim().toLowerCase();
  const formsMap: Record<string, [string, string, string]> = {
    'ÑˆÑ‚': ['ÑˆÑ‚', 'ÑˆÑ‚', 'ÑˆÑ‚'],
    'ÑˆÑ‚ÑƒÐºÐ°': ['ÑˆÑ‚ÑƒÐºÐ°', 'ÑˆÑ‚ÑƒÐºÐ¸', 'ÑˆÑ‚ÑƒÐº'],
    'Ð¿Ð°Ñ‡ÐºÐ°': ['Ð¿Ð°Ñ‡ÐºÐ°', 'Ð¿Ð°Ñ‡ÐºÐ¸', 'Ð¿Ð°Ñ‡ÐµÐº'],
    'Ð¼ÐµÑˆÐ¾Ðº': ['Ð¼ÐµÑˆÐ¾Ðº', 'Ð¼ÐµÑˆÐºÐ°', 'Ð¼ÐµÑˆÐºÐ¾Ð²'],
    'ÐºÐ¾Ñ€Ð¾Ð±ÐºÐ°': ['ÐºÐ¾Ñ€Ð¾Ð±ÐºÐ°', 'ÐºÐ¾Ñ€Ð¾Ð±ÐºÐ¸', 'ÐºÐ¾Ñ€Ð¾Ð±Ð¾Ðº'],
    'ÑƒÐ¿Ð°ÐºÐ¾Ð²ÐºÐ°': ['ÑƒÐ¿Ð°ÐºÐ¾Ð²ÐºÐ°', 'ÑƒÐ¿Ð°ÐºÐ¾Ð²ÐºÐ¸', 'ÑƒÐ¿Ð°ÐºÐ¾Ð²Ð¾Ðº'],
    'Ñ„Ð»Ð°ÐºÐ¾Ð½': ['Ñ„Ð»Ð°ÐºÐ¾Ð½', 'Ñ„Ð»Ð°ÐºÐ¾Ð½Ð°', 'Ñ„Ð»Ð°ÐºÐ¾Ð½Ð¾Ð²'],
    'Ñ‘Ð¼ÐºÐ¾ÑÑ‚ÑŒ': ['Ñ‘Ð¼ÐºÐ¾ÑÑ‚ÑŒ', 'Ñ‘Ð¼ÐºÐ¾ÑÑ‚Ð¸', 'Ñ‘Ð¼ÐºÐ¾ÑÑ‚ÐµÐ¹'],
    'ÐµÐ¼ÐºÐ¾ÑÑ‚ÑŒ': ['Ñ‘Ð¼ÐºÐ¾ÑÑ‚ÑŒ', 'Ñ‘Ð¼ÐºÐ¾ÑÑ‚Ð¸', 'Ñ‘Ð¼ÐºÐ¾ÑÑ‚ÐµÐ¹'],
    'Ð±ÑƒÑ‚Ñ‹Ð»ÐºÐ°': ['Ð±ÑƒÑ‚Ñ‹Ð»ÐºÐ°', 'Ð±ÑƒÑ‚Ñ‹Ð»ÐºÐ¸', 'Ð±ÑƒÑ‚Ñ‹Ð»Ð¾Ðº'],
  };

  const forms = formsMap[normalized] || [unit, unit, unit];
  return `${count} ${pluralizeRu(count, forms)}`;
};

const getPreferredPackaging = (product: any) => {
  const packagings = Array.isArray(product?.packagings) ? product.packagings : [];
  return (
    packagings.find((packaging: any) => packaging?.isDefault && Number(packaging?.unitsPerPackage || 0) > 1) ||
    packagings.find((packaging: any) => Number(packaging?.unitsPerPackage || 0) > 1) ||
    null
  );
};

const getQuantityBreakdown = (quantityValue: unknown, product: any) => {
  const totalUnits = Number(quantityValue || 0);
  const preferredPackaging = getPreferredPackaging(product);
  const unitsPerPackage = Number(preferredPackaging?.unitsPerPackage || 0);
  const packageName = normalizePackageName(preferredPackaging?.packageName || preferredPackaging?.name || 'ÑƒÐ¿Ð°ÐºÐ¾Ð²ÐºÐ°');
  const baseUnitName = normalizeDisplayBaseUnit(product?.unit || '\u0448\u0442');

  if (!preferredPackaging || unitsPerPackage <= 1 || !Number.isFinite(totalUnits)) {
    return {
      primary: formatCountWithUnit(totalUnits, baseUnitName),
      secondary: null,
    };
  }

  const packageCount = Math.floor(totalUnits / unitsPerPackage);
  const remainderUnits = totalUnits % unitsPerPackage;

  return {
    primary:
      remainderUnits > 0
        ? `${formatCountWithUnit(packageCount, packageName)}\n${formatCountWithUnit(remainderUnits, baseUnitName)}`
        : formatCountWithUnit(packageCount, packageName),
    secondary: `${formatCountWithUnit(totalUnits, baseUnitName)} Ð²ÑÐµÐ³Ð¾`,
  };
};

export default function ProductBatchesModal({
  isOpen,
  onClose,
  selectedProduct,
  productBatches,
  canManage = false,
  onDeleteBatch,
}: ProductBatchesModalProps) {
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
      {isOpen && selectedProduct && (
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
            className="flex max-h-[94vh] w-full max-w-[58rem] flex-col overflow-hidden rounded-t-[2rem] bg-white shadow-2xl sm:max-h-[88vh] sm:rounded-[2rem]"
          >
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 bg-violet-50/50 p-5 sm:p-6">
              <h3 className="flex items-center space-x-3 text-xl font-black text-slate-900">
                <div className="rounded-2xl bg-violet-500 p-2.5 text-white">
                  <Layers size={20} />
                </div>
                <span>ÐŸÐ°Ñ€Ñ‚Ð¸Ð¸ Ñ‚Ð¾Ð²Ð°Ñ€Ð° (FIFO): {selectedProduct.name}</span>
              </h3>
              <button type="button" onClick={onClose} className="text-slate-400 transition-colors hover:text-slate-600">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="mb-5 rounded-2xl border border-amber-100 bg-amber-50 p-3 text-sm font-medium text-amber-800">
                Ð¡Ð¸ÑÑ‚ÐµÐ¼Ð° ÑÐ¿Ð¸ÑÑ‹Ð²Ð°ÐµÑ‚ Ñ‚Ð¾Ð²Ð°Ñ€ Ð¸Ð· ÑÐ°Ð¼Ñ‹Ñ… ÑÑ‚Ð°Ñ€Ñ‹Ñ… Ð¿Ð°Ñ€Ñ‚Ð¸Ð¹ Ð² Ð¿ÐµÑ€Ð²ÑƒÑŽ Ð¾Ñ‡ÐµÑ€ÐµÐ´ÑŒ Ð¿Ð¾ FIFO.
              </div>

              <div className="space-y-3 sm:hidden">
                {productBatches.map((b, i) => {
                  const quantityInfo = getQuantityBreakdown(b.quantity, selectedProduct);
                  const remainingInfo = getQuantityBreakdown(b.remainingQuantity, selectedProduct);

                  return (
                    <div key={b.id} className={clsx('rounded-3xl border border-slate-100 p-4', i === 0 ? 'bg-violet-50/60' : 'bg-slate-50')}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{new Date(b.createdAt).toLocaleDateString('ru-RU')}</p>
                          <p className="mt-1 text-sm text-slate-500">{b.warehouse?.name || '---'}</p>
                        </div>
                        {i === 0 && (
                          <span className="rounded-md bg-violet-500 px-2 py-1 text-[8px] uppercase text-white">Ð¡Ð»ÐµÐ´. Ð½Ð° ÑÐ¿Ð¸ÑÐ°Ð½Ð¸Ðµ</span>
                        )}
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-2xl bg-white px-3 py-3">
                          <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">ÐÐ°Ñ‡. ÐºÐ¾Ð»-Ð²Ð¾</p>
                          <p className="mt-1 whitespace-pre-line text-sm font-semibold text-slate-900">{quantityInfo.primary}</p>
                          {quantityInfo.secondary && (
                            <p className="mt-1 text-[11px] font-medium text-slate-500">{quantityInfo.secondary}</p>
                          )}
                        </div>
                        <div className="rounded-2xl bg-white px-3 py-3">
                          <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">ÐžÑÑ‚Ð°Ñ‚Ð¾Ðº</p>
                          <p className="mt-1 whitespace-pre-line text-sm font-black text-slate-900">{remainingInfo.primary}</p>
                          {remainingInfo.secondary && (
                            <p className="mt-1 text-[11px] font-medium text-slate-500">{remainingInfo.secondary}</p>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 rounded-2xl bg-white px-3 py-3">
                        <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">Ð¦ÐµÐ½Ð° Ð·Ð°ÐºÑƒÐ¿ÐºÐ¸</p>
                        <p className="mt-1 text-sm font-black text-emerald-600">{formatMoney(b.costPrice)}</p>
                      </div>

                      {canManage && (
                        <div className="mt-3 flex flex-col gap-2">
                          <button
                            type="button"
                            disabled={!b.canDelete}
                            onClick={() => onDeleteBatch?.(b.id)}
                            className="flex items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-bold text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Trash2 size={14} />
                            <span>Ð£Ð´Ð°Ð»Ð¸Ñ‚ÑŒ Ð¿Ð°Ñ€Ñ‚Ð¸ÑŽ</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}

                {productBatches.length === 0 && (
                  <div className="rounded-3xl bg-slate-50 px-4 py-10 text-center text-sm font-bold text-slate-400">ÐŸÐ°Ñ€Ñ‚Ð¸Ð¹ Ð½Ðµ Ð½Ð°Ð¹Ð´ÐµÐ½Ð¾</div>
                )}
              </div>

              <table className="hidden w-full text-left sm:table">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <th className="pb-4">Ð”Ð°Ñ‚Ð° Ð·Ð°ÐºÑƒÐ¿ÐºÐ¸</th>
                    <th className="pb-4">Ð¡ÐºÐ»Ð°Ð´</th>
                    <th className="pb-4 text-right">ÐÐ°Ñ‡Ð°Ð»ÑŒÐ½Ð¾Ðµ ÐºÐ¾Ð»-Ð²Ð¾</th>
                    <th className="pb-4 text-right">ÐžÑÑ‚Ð°Ñ‚Ð¾Ðº</th>
                    <th className="pb-4 text-right">Ð¦ÐµÐ½Ð° Ð·Ð°ÐºÑƒÐ¿ÐºÐ¸</th>
                    {canManage && <th className="pb-4 text-right">Ð”ÐµÐ¹ÑÑ‚Ð²Ð¸Ñ</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {productBatches.map((b, i) => {
                    const quantityInfo = getQuantityBreakdown(b.quantity, selectedProduct);
                    const remainingInfo = getQuantityBreakdown(b.remainingQuantity, selectedProduct);

                    return (
                      <tr key={b.id} className={clsx('text-[13px]', i === 0 && 'bg-violet-50/40')}>
                        <td className="py-3 font-bold text-slate-500">
                          {new Date(b.createdAt).toLocaleDateString('ru-RU')}
                          {i === 0 && <span className="ml-2 rounded-md bg-violet-500 px-2 py-0.5 text-[8px] uppercase text-white">Ð¡Ð»ÐµÐ´. Ð½Ð° ÑÐ¿Ð¸ÑÐ°Ð½Ð¸Ðµ</span>}
                        </td>
                        <td className="py-3 font-bold text-slate-600">{b.warehouse?.name || '---'}</td>
                        <td className="py-3 text-right font-bold text-slate-400">
                          <div className="whitespace-pre-line">{quantityInfo.primary}</div>
                          {quantityInfo.secondary && (
                            <div className="mt-1 text-[11px] font-medium text-slate-400">{quantityInfo.secondary}</div>
                          )}
                        </td>
                        <td className="py-3 text-right font-black text-slate-900">
                          <div className="whitespace-pre-line">{remainingInfo.primary}</div>
                          {remainingInfo.secondary && (
                            <div className="mt-1 text-[11px] font-medium text-slate-400">{remainingInfo.secondary}</div>
                          )}
                        </td>
                        <td className="py-3 text-right font-black text-emerald-600">{formatMoney(b.costPrice)}</td>
                        {canManage && (
                          <td className="py-3">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                disabled={!b.canDelete}
                                onClick={() => onDeleteBatch?.(b.id)}
                                className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <Trash2 size={12} />
                                <span>Ð£Ð´Ð°Ð»Ð¸Ñ‚ÑŒ</span>
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}

                  {productBatches.length === 0 && (
                    <tr>
                      <td colSpan={canManage ? 6 : 5} className="py-20 text-center font-bold text-slate-400">ÐŸÐ°Ñ€Ñ‚Ð¸Ð¹ Ð½Ðµ Ð½Ð°Ð¹Ð´ÐµÐ½Ð¾</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end border-t border-slate-100 bg-slate-50 p-4 sm:p-6">
              <button type="button" onClick={onClose} className="rounded-2xl border border-slate-200 bg-white px-8 py-3 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50">
                Ð—Ð°ÐºÑ€Ñ‹Ñ‚ÑŒ
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
