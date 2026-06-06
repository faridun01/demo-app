import React from 'react';
import { Scissors, X } from 'lucide-react';
import { motion } from 'motion/react';
import { clsx } from 'clsx';
import { formatProductName } from '../../utils/productName';
import { getStockBreakdown } from '../../utils/productsViewUtils';

interface ProductWriteOffModalProps {
  isOpen: boolean;
  selectedProduct: any;
  warehouses: any[];
  writeOffData: any;
  selectedPackaging: any;
  reasonPresets: string[];
  normalizedReason: string;
  isCustomReason: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onSetQuantity: (value: number) => void;
  setWriteOffData: React.Dispatch<React.SetStateAction<any>>;
}

export default function ProductWriteOffModal({
  isOpen,
  selectedProduct,
  warehouses,
  writeOffData,
  selectedPackaging,
  reasonPresets,
  normalizedReason,
  isCustomReason,
  onClose,
  onSubmit,
  onSetQuantity,
  setWriteOffData,
}: ProductWriteOffModalProps) {
  if (!isOpen || !selectedProduct) return null;

  const stock = Number(selectedProduct.stock || 0);
  const packageUnits = Number(selectedPackaging?.unitsPerPackage || 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/35 p-2 sm:items-center sm:p-3"
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-md border border-[#9fb7d5] bg-white shadow-2xl"
      >
        <div className="border-b border-[#b7c2ce] bg-[linear-gradient(180deg,#ffffff_0%,#dde5ee_100%)] px-4 py-3">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded border border-[#d6c07a] bg-[#fff8dc] px-2.5 py-1 text-xs font-semibold text-[#7a5a00]">
                <Scissors size={12} />
                <span>Списание</span>
              </div>
              <h3 className="mt-2 text-xl font-semibold text-[#1f2933]">Списание товара</h3>
              <p className="mt-1 text-xs font-medium text-[#5f6f7f]">
                Быстрая складская операция по выбранному товару.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded border border-[#9fb7d5] bg-white text-[#23527c] transition-colors hover:bg-[#eaf2fb]"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <form onSubmit={onSubmit} className="flex-1 space-y-4 overflow-y-auto bg-[#f3f5f7] p-3 sm:p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded border border-[#c8d2df] bg-white px-3 py-2">
              <p className="text-[11px] font-semibold text-[#48627f]">Товар</p>
              <p className="mt-1 text-sm font-semibold leading-tight text-[#1f2933]">
                {formatProductName(selectedProduct.name)}
              </p>
            </div>
            <div className="rounded border border-[#c8d2df] bg-white px-3 py-2">
              <p className="text-[11px] font-semibold text-[#48627f]">Склад</p>
              <p className="mt-1 text-sm font-semibold text-[#1f2933]">
                {selectedProduct?.warehouse?.name || warehouses.find((warehouse) => warehouse.id === selectedProduct?.warehouseId)?.name || '---'}
              </p>
            </div>
            <div className="rounded border border-[#d6c07a] bg-[#fff8dc] px-3 py-2">
              <p className="text-[11px] font-semibold text-[#7a5a00]">Остаток</p>
              <p className="mt-1 whitespace-pre-line text-sm font-bold text-[#1f2933]">
                {getStockBreakdown(selectedProduct).primary}
              </p>
              {getStockBreakdown(selectedProduct).secondary && (
                <p className="mt-1 text-[11px] font-medium text-[#7a5a00]">
                  {getStockBreakdown(selectedProduct).secondary}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,0.94fr)_minmax(0,1.06fr)]">
            <section className="rounded border border-[#c8d2df] bg-white p-3">
              <div className="mb-3 flex items-center justify-between gap-3">
                <label className="block text-sm font-semibold text-[#32465a]">Количество</label>
                <span className="text-[11px] font-medium text-[#5f6f7f]">Введите число или выберите быстро</span>
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_112px] gap-3">
                <div className="rounded border border-[#9fb7d5] bg-[#f7f9fb] px-3 py-2">
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    value={writeOffData.quantity}
                    onChange={(event) => setWriteOffData((prev: any) => ({ ...prev, quantity: event.target.value }))}
                    className="w-full bg-transparent text-3xl font-bold tracking-normal text-[#1f2933] outline-none"
                  />
                  <p className="mt-1 text-[11px] font-medium text-[#5f6f7f]">Количество к списанию</p>
                </div>
                <div className="rounded border border-[#c8d2df] bg-white px-3 py-2 text-center">
                  <p className="text-[11px] font-semibold text-[#48627f]">Доступно</p>
                  <div className="mt-2 text-3xl font-bold leading-none text-[#1f2933]">{stock}</div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {[1, 5, 10].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => onSetQuantity(value)}
                    className={clsx(
                      'rounded border px-3 py-1.5 text-xs font-semibold transition-colors',
                      Number(writeOffData.quantity || 0) === value
                        ? 'border-[#8f6f18] bg-[#ffd966] text-[#1f2933]'
                        : 'border-[#9fb7d5] bg-white text-[#1f3f63] hover:bg-[#eaf2fb]'
                    )}
                  >
                    {value}
                  </button>
                ))}
                {selectedPackaging && packageUnits > 1 && (
                  <button
                    type="button"
                    onClick={() => onSetQuantity(packageUnits)}
                    className={clsx(
                      'rounded border px-3 py-1.5 text-xs font-semibold transition-colors',
                      Number(writeOffData.quantity || 0) === packageUnits
                        ? 'border-[#8f6f18] bg-[#ffd966] text-[#1f2933]'
                        : 'border-[#9fb7d5] bg-white text-[#1f3f63] hover:bg-[#eaf2fb]'
                    )}
                  >
                    1 {selectedPackaging.packageName}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onSetQuantity(stock)}
                  className={clsx(
                    'rounded border px-3 py-1.5 text-xs font-semibold transition-colors',
                    Number(writeOffData.quantity || 0) === stock
                      ? 'border-[#8f6f18] bg-[#ffd966] text-[#1f2933]'
                      : 'border-[#9fb7d5] bg-white text-[#1f3f63] hover:bg-[#eaf2fb]'
                  )}
                >
                  Всё
                </button>
              </div>
            </section>

            <section className="rounded border border-[#c8d2df] bg-white p-3">
              <div className="mb-3 flex items-center justify-between gap-3">
                <label className="block text-sm font-semibold text-[#32465a]">Причина списания</label>
                <span className="text-[11px] font-medium text-[#5f6f7f]">Выберите вариант или введите свой</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {reasonPresets.map((reason) => {
                  const isSelected = normalizedReason === reason.toLowerCase();
                  return (
                    <button
                      key={reason}
                      type="button"
                      onClick={() => setWriteOffData((prev: any) => ({ ...prev, reason: reason.toLowerCase() }))}
                      className={clsx(
                        'rounded border px-3 py-2 text-left text-sm font-medium transition-colors',
                        isSelected
                          ? 'border-[#8f6f18] bg-[#ffd966] text-[#1f2933]'
                          : 'border-[#9fb7d5] bg-[#f7f9fb] text-[#1f3f63] hover:bg-[#eaf2fb]'
                      )}
                    >
                      {reason}
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 rounded border border-[#9fb7d5] bg-white px-3 py-2 transition-colors focus-within:border-[#4f81bd]">
                <input
                  type="text"
                  required
                  value={writeOffData.reason}
                  onChange={(event) => setWriteOffData((prev: any) => ({ ...prev, reason: event.target.value }))}
                  className="w-full bg-transparent text-sm font-medium text-[#1f2933] outline-none"
                  placeholder="Своя причина"
                />
                {isCustomReason && (
                  <p className="mt-1 text-[11px] font-medium text-[#7a5a00]">Используется пользовательская причина</p>
                )}
              </div>
            </section>
          </div>

          <div className="-mx-3 -mb-3 flex flex-col-reverse gap-2 border-t border-[#b7c2ce] bg-[#eef3f8] px-4 py-3 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-[#9fb7d5] bg-white px-6 py-2 text-sm font-medium text-[#1f3f63] transition-colors hover:bg-[#eaf2fb]"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="rounded border border-[#8f6f18] bg-[#ffd966] px-6 py-2 text-sm font-semibold text-[#1f2933] shadow-sm transition-colors hover:bg-[#f7c948]"
            >
              Подтвердить списание
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
