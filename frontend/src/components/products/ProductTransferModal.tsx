import React from 'react';
import { ArrowRightLeft } from 'lucide-react';
import { motion } from 'motion/react';
import {
  formatCountWithUnit,
  normalizeDisplayBaseUnit,
} from '../../utils/productsViewUtils';

interface ProductTransferModalProps {
  isOpen: boolean;
  selectedProduct: any;
  warehouses: any[];
  transferData: {
    fromWarehouseId: string;
    toWarehouseId: string;
    quantity: string;
    selectedPackagingId: string;
    packageQuantityInput: string;
  };
  selectedTransferPackaging: any;
  transferUnitsPerPackage: number;
  transferAvailableFullPackages: number;
  transferRemainderUnits: number;
  transferPackageQuantity: number;
  totalTransferUnits: number;
  availableTransferStock: number | null;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  setTransferData: React.Dispatch<React.SetStateAction<any>>;
}

export default function ProductTransferModal({
  isOpen,
  selectedProduct,
  warehouses,
  transferData,
  selectedTransferPackaging,
  transferUnitsPerPackage,
  transferAvailableFullPackages,
  transferRemainderUnits,
  transferPackageQuantity,
  totalTransferUnits,
  availableTransferStock,
  onClose,
  onSubmit,
  setTransferData,
}: ProductTransferModalProps) {
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
        className="w-full max-w-md overflow-hidden rounded-t-4xl bg-white shadow-2xl sm:rounded-[2.5rem]"
      >
        <div className="border-b border-slate-100 bg-amber-50/50 p-4 sm:p-5">
          <h3 className="flex items-center space-x-3 text-lg font-black text-slate-900">
            <div className="rounded-xl bg-amber-600 p-2 text-white">
              <ArrowRightLeft size={20} />
            </div>
            <span>Перенос товара</span>
          </h3>
          <p className="mt-1 text-sm font-bold text-slate-500">{selectedProduct?.name}</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 p-4 sm:p-5">
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-700">Из склада</label>
              <select
                required
                value={transferData.fromWarehouseId}
                onChange={(event) => setTransferData({ ...transferData, fromWarehouseId: event.target.value })}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold outline-none transition-all focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10"
              >
                <option value="">Выберите склад</option>
                {warehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-700">В склад</label>
              <select
                required
                value={transferData.toWarehouseId}
                onChange={(event) => setTransferData({ ...transferData, toWarehouseId: event.target.value })}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold outline-none transition-all focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10"
              >
                <option value="">Выберите склад</option>
                {warehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-700">Количество</label>
              {selectedTransferPackaging && transferUnitsPerPackage > 0 ? (
                <div className="space-y-3">
                  {availableTransferStock !== null && (
                    <div className="rounded-2xl border border-amber-100 bg-amber-50 px-3 py-2.5">
                      <p className="text-xs font-bold text-amber-900">
                        Доступно: {formatCountWithUnit(transferAvailableFullPackages, selectedTransferPackaging.packageName)}
                      </p>
                      {transferRemainderUnits > 0 && (
                        <p className="mt-1 text-xs font-medium text-amber-700">
                          Остаток: {formatCountWithUnit(transferRemainderUnits, normalizeDisplayBaseUnit(selectedProduct?.unit || 'шт'))}
                        </p>
                      )}
                      <p className="mt-1 text-[11px] font-medium text-amber-700">
                        По умолчанию: {formatCountWithUnit(1, selectedTransferPackaging.packageName)} = {transferUnitsPerPackage} {normalizeDisplayBaseUnit(selectedProduct?.unit || 'шт')}
                      </p>
                    </div>
                  )}

                  {transferAvailableFullPackages > 0 ? (
                    <>
                      <input
                        type="number"
                        required
                        min="1"
                        max={transferAvailableFullPackages || undefined}
                        placeholder={`Введите количество (${selectedTransferPackaging.packageName})`}
                        value={transferData.packageQuantityInput}
                        onChange={(event) =>
                          setTransferData((prev: any) => ({
                            ...prev,
                            packageQuantityInput: event.target.value,
                            quantity: String(
                              Math.max(0, Math.floor(Number(event.target.value || 0) || 0)) * transferUnitsPerPackage
                            ),
                          }))
                        }
                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold outline-none transition-all focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10"
                      />
                      <p className="text-xs font-medium text-slate-500">
                        Перенос: {formatCountWithUnit(transferPackageQuantity, selectedTransferPackaging.packageName)}
                        {transferPackageQuantity > 0 && ` = ${totalTransferUnits} ${normalizeDisplayBaseUnit(selectedProduct?.unit || 'шт')}`}
                      </p>
                    </>
                  ) : (
                    <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-medium text-slate-500">
                      Для оптового переноса нужна хотя бы одна полная {selectedTransferPackaging.packageName}.
                    </p>
                  )}
                </div>
              ) : (
                <>
                  {availableTransferStock !== null && (
                    <p className="mb-2 text-xs font-bold text-slate-500">
                      Доступно: {formatCountWithUnit(Number(availableTransferStock || 0), normalizeDisplayBaseUnit(selectedProduct?.unit || 'шт'))}
                    </p>
                  )}
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="Введите количество"
                    value={transferData.quantity}
                    onChange={(event) => setTransferData({ ...transferData, quantity: event.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold outline-none transition-all focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10"
                  />
                </>
              )}
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 pt-4 sm:flex-row sm:justify-end sm:gap-0 sm:space-x-2">
            <button type="button" onClick={onClose} className="rounded-xl px-6 py-2 text-sm font-bold text-slate-500 transition-all hover:bg-slate-50">
              Отмена
            </button>
            <button
              type="submit"
              disabled={
                (selectedTransferPackaging && transferUnitsPerPackage > 0 && transferAvailableFullPackages <= 0) ||
                totalTransferUnits <= 0
              }
              className="rounded-xl bg-amber-600 px-8 py-2 text-sm font-bold text-white shadow-xl shadow-amber-600/20 transition-all hover:bg-amber-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Перенести
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
