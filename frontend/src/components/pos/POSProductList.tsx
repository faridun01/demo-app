import { startTransition } from 'react';
import type { Dispatch, RefObject, SetStateAction } from 'react';
import { Plus, Search, Warehouse, X } from 'lucide-react';
import { clsx } from 'clsx';
import { formatMoney } from '../../utils/format';
import { formatProductName } from '../../utils/productName';

type ProductStockParts = {
  primary: string;
  secondary: string;
};

type POSProductListProps = {
  filteredProducts: any[];
  warehouses: any[];
  warehouseId: string;
  productSearch: string;
  highlightedProductId: number | null;
  isAdmin: boolean;
  productListRef: RefObject<HTMLDivElement>;
  setProductSearch: Dispatch<SetStateAction<string>>;
  handleWarehouseChange: (nextWarehouseId: string) => void;
  handleAddFromList: (product: any) => void;
  canAddProductFromList: (product: any) => boolean;
  getProductStockParts: (product: any, fallbackBaseUnitName?: string) => ProductStockParts;
  onClose: () => void;
};

export default function POSProductList({
  filteredProducts,
  warehouses,
  warehouseId,
  productSearch,
  highlightedProductId,
  isAdmin,
  productListRef,
  setProductSearch,
  handleWarehouseChange,
  handleAddFromList,
  canAddProductFromList,
  getProductStockParts,
  onClose,
}: POSProductListProps) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-md border border-[#b7c2ce] bg-white shadow-sm">
      <div className="border-b border-[#b7c2ce] bg-[#eef3f8] px-4 py-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#1f2933]">Товары</h2>
            <p className="mt-1 text-xs text-slate-500">{filteredProducts.length} доступных позиций</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded border border-[#9fb7d5] bg-white px-3 py-2 shadow-sm">
              <Warehouse size={16} className="text-sky-500" />
              <select
                value={warehouseId}
                onChange={(e) => handleWarehouseChange(e.target.value)}
                disabled={!isAdmin}
                className="min-w-42.5 appearance-none bg-transparent text-sm text-[#1f2933] outline-none"
              >
                <option value="">Выберите склад</option>
                {warehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded border border-[#9fb7d5] bg-white text-[#23527c] transition-colors hover:bg-[#eaf2fb]"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="mt-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={productSearch}
              onChange={(e) => {
                const value = e.target.value;
                startTransition(() => {
                  setProductSearch(value);
                });
              }}
              placeholder="Поиск товара или ID..."
              className="w-full rounded border border-[#9fb7d5] bg-white py-2.5 pl-10 pr-4 text-sm text-[#1f2933] outline-none transition-colors focus:border-[#4f81bd]"
            />
          </div>
        </div>

        {isAdmin && !warehouseId && (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            Перед добавлением товара выберите склад.
          </div>
        )}
      </div>

      <div className="hidden grid-cols-[52px_minmax(0,1fr)_150px_110px_130px] border-y border-[#b7c2ce] bg-[#dbe5f1] px-4 py-2 text-xs font-semibold text-[#32465a] md:grid">
        <div className="text-center">№</div>
        <div>Товар</div>
        <div className="text-center">Остаток</div>
        <div className="text-center">Цена</div>
        <div className="text-center">Действие</div>
      </div>

      <div ref={productListRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-white">
        <div className="space-y-3 p-3 md:hidden">
          {filteredProducts.map((product, index) => {
            const stockParts = getProductStockParts(product, product.unit);

            return (
              <div
                key={`mobile-pos-${product.id}`}
                onClick={() => handleAddFromList(product)}
                className={clsx(
                  'rounded border border-[#c8d2df] bg-white p-2 shadow-sm transition-colors',
                  highlightedProductId === Number(product.id) && 'ring-1 ring-[#4f81bd] bg-[#fff7d6]',
                  canAddProductFromList(product) ? 'cursor-pointer hover:bg-[#fff8dc]' : '',
                )}
              >
                <div className="min-w-0">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-normal text-[#23527c]">#{index + 1}</p>
                  <p className="wrap-break-word text-[12px] leading-4 text-slate-900">{formatProductName(product.name)}</p>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="rounded border border-[#d5dde6] bg-[#f7f9fb] px-2 py-1.5">
                    <p className="text-[10px] uppercase tracking-normal text-[#6b7b8d]">Остаток</p>
                    <div className="mt-1 inline-flex flex-col rounded border border-[#c8d2df] bg-white px-2 py-1.5 text-[#23527c]">
                      <span className="whitespace-nowrap text-[13px] font-semibold leading-4">{stockParts.primary}</span>
                      {stockParts.secondary ? (
                        <span className="mt-1 whitespace-nowrap text-[11px] font-medium leading-4 text-sky-600/90">{stockParts.secondary}</span>
                      ) : null}
                    </div>
                  </div>
                  <div className="rounded border border-[#d5dde6] bg-[#f7f9fb] px-2 py-1.5">
                    <p className="text-[10px] uppercase tracking-normal text-[#6b7b8d]">Цена</p>
                    <p className="mt-1 wrap-break-word text-sm text-slate-900">{formatMoney(product.sellingPrice)}</p>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddFromList(product);
                  }}
                  disabled={!canAddProductFromList(product)}
                  className="mt-2 inline-flex w-full items-center justify-center gap-1 rounded border border-[#7f9db9] bg-[#eaf2fb] px-3 py-2 text-sm text-[#1f3f63] transition-colors hover:bg-[#dbeafd] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Plus size={15} />
                  <span>Добавить</span>
                </button>
              </div>
            );
          })}
        </div>

        <div className="hidden flex-col md:flex">
          {filteredProducts.map((product, index) => {
            const stockParts = getProductStockParts(product, product.unit);

            return (
              <div
                key={product.id}
                onClick={() => handleAddFromList(product)}
                className={clsx(
                  'grid grid-cols-[52px_minmax(0,1fr)_150px_110px_130px] items-center border-b border-[#d5dde6] px-4 py-2 last:border-b-0 transition-colors even:bg-[#fbfcfd]',
                  highlightedProductId === Number(product.id) && 'bg-[#fff7d6]',
                  canAddProductFromList(product) ? 'cursor-pointer hover:bg-[#fff8dc]' : '',
                )}
              >
                <div className="text-center text-sm font-semibold text-[#23527c]">{index + 1}</div>

                <div className="min-w-0">
                  <p className="wrap-break-word text-[12px] leading-4 text-slate-900">{formatProductName(product.name)}</p>
                </div>

                <div className="flex justify-center">
                  <div className="inline-flex min-w-27 flex-col items-center rounded border border-[#c8d2df] bg-[#f7f9fb] px-2 py-1 text-center text-[#23527c]">
                    <span className="whitespace-nowrap text-[13px] font-semibold leading-4">{stockParts.primary}</span>
                    {stockParts.secondary ? (
                      <span className="mt-1 whitespace-nowrap text-[11px] font-medium leading-4 text-sky-600/90">{stockParts.secondary}</span>
                    ) : null}
                  </div>
                </div>

                <div className="text-center text-xs text-slate-900">{formatMoney(product.sellingPrice)}</div>

                <div className="text-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddFromList(product);
                    }}
                    disabled={!canAddProductFromList(product)}
                    className="inline-flex items-center gap-1 rounded border border-[#7f9db9] bg-[#eaf2fb] px-2.5 py-1.5 text-xs text-[#1f3f63] transition-colors hover:bg-[#dbeafd] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Plus size={15} />
                    <span>Добавить</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {!filteredProducts.length && (
          <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-300">
              <Search size={28} />
            </div>
            <p className="mt-0.5 text-xs text-[#5f6f7f]">Товары не найдены</p>
          </div>
        )}
      </div>
    </div>
  );
}
