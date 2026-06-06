import React from 'react';
import { Camera, Loader2, Plus } from 'lucide-react';
import { clsx } from 'clsx';

interface ProductsPageHeaderProps {
  isAdmin: boolean;
  isScanning: boolean;
  selectedWarehouseId: string;
  onAddProduct: () => void;
  onScanInvoice: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function ProductsPageHeader({
  isAdmin,
  isScanning,
  selectedWarehouseId,
  onAddProduct,
  onScanInvoice,
}: ProductsPageHeaderProps) {
  return (
    <div className="app-surface px-4 py-4 sm:px-6 sm:py-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-medium tracking-tight text-slate-900 sm:text-4xl">Товары</h1>
          <p className="mt-1 max-w-xl text-sm font-medium text-slate-500">Управление ассортиментом, ценами и остатками.</p>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center">
          {isAdmin && (
            <label
              className={clsx(
                'flex w-full items-center justify-center space-x-2 rounded-2xl border px-4 py-3 text-sm font-medium transition-all sm:w-auto',
                selectedWarehouseId
                  ? 'cursor-pointer border-sky-100 bg-sky-50 text-slate-700 hover:bg-white'
                  : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
              )}
            >
              {isScanning ? (
                <Loader2 size={16} className="animate-spin text-sky-600" />
              ) : (
                <Camera size={16} className={selectedWarehouseId ? 'text-sky-600' : 'text-slate-400'} />
              )}
              <span>{isScanning ? 'Чтение накладной...' : 'Загрузить накладную'}</span>
              <input
                type="file"
                className="hidden"
                accept="image/*,application/pdf"
                onChange={onScanInvoice}
                disabled={isScanning || !selectedWarehouseId}
              />
            </label>
          )}

          {isAdmin && (
            <button
              onClick={onAddProduct}
              className={clsx(
                'flex w-full items-center justify-center space-x-2 rounded-2xl px-4 py-3 text-sm font-medium transition-all active:scale-95 sm:w-auto',
                selectedWarehouseId
                  ? 'bg-violet-500 text-white shadow-sm hover:bg-violet-600'
                  : 'cursor-not-allowed bg-slate-200 text-slate-400'
              )}
            >
              <Plus size={18} />
              <span>Добавить</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
