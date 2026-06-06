import { FileText, Filter, Search, Tag } from 'lucide-react';

interface WarehouseOption {
  id: string | number;
  name: string;
}

interface ProductsCatalogToolbarProps {
  search: string;
  warehouses: WarehouseOption[];
  isAdmin: boolean;
  selectedWarehouseId: string;
  filteredProductsCount: number;
  duplicateProductsCount: number;
  isMergingDuplicates: boolean;
  onSearchChange: (value: string) => void;
  onWarehouseChange: (value: string) => void;
  onExportStockReport: () => void;
  onExportPriceList: () => void;
  onMergeExactDuplicates: () => void;
}

export default function ProductsCatalogToolbar({
  search,
  warehouses,
  isAdmin,
  selectedWarehouseId,
  filteredProductsCount,
  duplicateProductsCount,
  isMergingDuplicates,
  onSearchChange,
  onWarehouseChange,
  onExportStockReport,
  onExportPriceList,
  onMergeExactDuplicates,
}: ProductsCatalogToolbarProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-slate-200 bg-white p-3 sm:p-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex w-full flex-col gap-3 lg:max-w-4xl lg:flex-1">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-sky-500" size={16} />
          <input
            type="text"
            placeholder="Поиск по названию..."
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            className="w-full rounded-lg border border-sky-100 bg-sky-50 py-2.5 pl-10 pr-3 text-sm font-medium text-slate-700 outline-none transition-colors focus:border-sky-300 focus:bg-white"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
          <div className="relative w-full">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-violet-500" size={16} />
            <select
              value={selectedWarehouseId}
              onChange={(event) => onWarehouseChange(event.target.value)}
              disabled={!isAdmin}
              className="w-full appearance-none rounded-lg border border-violet-100 bg-violet-50 py-2.5 pl-10 pr-3 text-sm font-medium text-slate-700 outline-none transition-colors focus:border-violet-300 focus:bg-white"
            >
              <option value="">Все склады</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={onExportStockReport}
            disabled={!filteredProductsCount}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2.5 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            <FileText size={16} />
            <span>Скачать остаток</span>
          </button>

          <button
            type="button"
            onClick={onExportPriceList}
            disabled={!filteredProductsCount}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2.5 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            <Tag size={16} />
            <span>Скачать прайс</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-[11px] font-semibold text-emerald-700">
          Товаров: {filteredProductsCount}
        </div>
        {duplicateProductsCount > 0 ? (
          <>
            <div className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-700">
              Дублей: {duplicateProductsCount}
            </div>
            <button
              type="button"
              onClick={onMergeExactDuplicates}
              disabled={isMergingDuplicates}
              className="rounded-lg bg-fuchsia-600 px-3 py-2 text-[11px] font-semibold text-white transition-colors hover:bg-fuchsia-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isMergingDuplicates ? 'Объединение...' : 'Объединить дубликаты'}
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
