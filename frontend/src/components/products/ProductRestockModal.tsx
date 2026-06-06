import React from 'react';
import { PlusCircle } from 'lucide-react';
import { motion } from 'motion/react';
import {
  formatCountWithUnit,
  formatPriceInput,
  normalizeDisplayBaseUnit,
} from '../../utils/productsViewUtils';

interface ProductRestockModalProps {
  isOpen: boolean;
  isAdmin: boolean;
  selectedProduct: any;
  warehouses: any[];
  restockData: any;
  restockPackagings: any[];
  selectedRestockPackaging: any;
  totalRestockUnits: number;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  setRestockData: React.Dispatch<React.SetStateAction<any>>;
}

export default function ProductRestockModal({
  isOpen,
  isAdmin,
  selectedProduct,
  warehouses,
  restockData,
  restockPackagings,
  selectedRestockPackaging,
  totalRestockUnits,
  onClose,
  onSubmit,
  setRestockData,
}: ProductRestockModalProps) {
  if (!isOpen) return null;

  return (
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
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-4xl bg-white shadow-2xl sm:max-h-[85vh] sm:rounded-4xl"
      >
        <div className="shrink-0 border-b border-slate-100 bg-emerald-50/50 p-4 sm:p-6">
          <h3 className="flex items-center space-x-3 text-xl font-black text-slate-900">
            <div className="rounded-2xl bg-emerald-600 p-2.5 text-white">
              <PlusCircle size={20} />
            </div>
            <span>Пополнение товара</span>
          </h3>
          <p className="mt-2 text-sm font-bold text-slate-500">{selectedProduct?.name}</p>
        </div>

        <form onSubmit={onSubmit} className="flex min-h-0 flex-col overflow-y-auto p-4 sm:p-6">
          <div className="flex-1 space-y-5">
            <div>
              <label className="mb-2 block text-[11px] font-black uppercase tracking-widest text-slate-700">Склад</label>
              <select
                required
                value={restockData.warehouseId}
                onChange={(event) => setRestockData({ ...restockData, warehouseId: event.target.value })}
                className="w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 py-3.5 font-bold outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
              >
                <option value="">Выберите склад</option>
                {warehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {selectedRestockPackaging ? (
                <>
                  <div>
                    <label className="mb-2 block text-[11px] font-black uppercase tracking-widest text-slate-700">Упаковка</label>
                    <select
                      value={restockData.selectedPackagingId}
                      onChange={(event) =>
                        setRestockData((prev: any) => ({
                          ...prev,
                          selectedPackagingId: event.target.value,
                          packageQuantityInput: '',
                          quantity: '',
                        }))
                      }
                      className="w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 py-3.5 font-bold outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                    >
                      {restockPackagings.map((packaging) => (
                        <option key={packaging.id} value={packaging.id}>
                          {packaging.packageName} • {packaging.unitsPerPackage} {normalizeDisplayBaseUnit(selectedProduct?.unit || 'шт')}
                        </option>
                      ))}
                    </select>
                    <p className="mt-2 text-xs font-medium text-slate-400">
                      Пополнение идёт упаковками. Штуки считаются автоматически ниже.
                    </p>
                  </div>

                  <div>
                    <label className="mb-2 block text-[11px] font-black uppercase tracking-widest text-slate-700">
                      Сколько {selectedRestockPackaging.packageName === 'мешок' ? 'мешков' : 'коробок'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={restockData.packageQuantityInput}
                      placeholder={selectedRestockPackaging.packageName === 'мешок' ? 'Введите количество мешков' : 'Введите количество коробок'}
                      onChange={(event) =>
                        setRestockData((prev: any) => ({
                          ...prev,
                          packageQuantityInput: event.target.value,
                          quantity: String(
                            (Number(event.target.value || 0) || 0) *
                            (selectedRestockPackaging.unitsPerPackage || 0)
                          ),
                        }))
                      }
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3.5 font-bold outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                    />
                    <p className="mt-2 text-xs font-medium text-slate-400">
                      1 {formatCountWithUnit(1, selectedRestockPackaging.packageName).replace(/^1\s+/, '')} = {selectedRestockPackaging.unitsPerPackage} {normalizeDisplayBaseUnit(selectedProduct?.unit || 'шт')}
                    </p>
                    <p className="mt-1 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
                      Итого в штуках: {totalRestockUnits} {normalizeDisplayBaseUnit(selectedProduct?.unit || 'шт')}
                    </p>
                  </div>
                </>
              ) : (
                <div>
                  <label className="mb-2 block text-[11px] font-black uppercase tracking-widest text-slate-700">Количество</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={restockData.quantity}
                    onChange={(event) => setRestockData({ ...restockData, quantity: event.target.value })}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3.5 font-bold outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                  />
                </div>
              )}

              {isAdmin && (
                <div>
                  <label className="mb-2 block text-[11px] font-black uppercase tracking-widest text-slate-700">Цена закупки</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={restockData.costPrice}
                    onChange={(event) => setRestockData((prev: any) => ({ ...prev, costPrice: event.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3.5 font-bold outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                  />
                  <p className="mt-2 text-xs font-medium text-slate-400">
                    Закупка за 1 шт без расходов.
                  </p>
                </div>
              )}

              {isAdmin && (
                <div>
                  <label className="mb-2 block text-[11px] font-black uppercase tracking-widest text-slate-700">Расходы %</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={restockData.expensePercent}
                    onChange={(event) => setRestockData((prev: any) => ({ ...prev, expensePercent: event.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3.5 font-bold outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                  />
                </div>
              )}

              <div>
                <label className="mb-2 block text-[11px] font-black uppercase tracking-widest text-slate-700">Цена продажи</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={restockData.sellingPrice}
                  onChange={(event) => setRestockData({ ...restockData, sellingPrice: event.target.value })}
                  onBlur={(event) => setRestockData({ ...restockData, sellingPrice: formatPriceInput(event.target.value) })}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3.5 font-bold outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                />
                <p className="mt-2 text-xs font-medium text-slate-400">
                  Новая цена продажи для этой поставки.
                </p>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-[11px] font-black uppercase tracking-widest text-slate-700">Причина / Комментарий</label>
              <input
                type="text"
                value={restockData.reason}
                onChange={(event) => setRestockData({ ...restockData, reason: event.target.value })}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3.5 font-bold outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                placeholder="Напр: Новая поставка"
              />
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:justify-end sm:gap-0 sm:space-x-3">
            <button type="button" onClick={onClose} className="rounded-2xl px-6 py-3 text-sm font-bold text-slate-500 transition-all hover:bg-slate-50">
              Отмена
            </button>
            <button type="submit" className="rounded-2xl bg-emerald-600 px-8 py-3 text-sm font-bold text-white shadow-xl shadow-emerald-600/20 transition-all hover:bg-emerald-700 active:scale-95">
              Пополнить
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
