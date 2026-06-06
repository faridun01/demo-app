import {
  ArrowRightLeft,
  ChevronDown,
  ChevronUp,
  Edit,
  History,
  Image as ImageIcon,
  Layers,
  PlusCircle,
  Scissors,
  Trash2,
} from 'lucide-react';
import { clsx } from 'clsx';
import { formatMoney, formatPercent } from '../../utils/format';
import { handleBrokenImage, resolveMediaUrl } from '../../utils/media';
import { formatProductName } from '../../utils/productName';
import {
  getProductEfficiencyMetrics,
  getStockBreakdown,
  normalizeDisplayBaseUnit,
} from '../../utils/productsViewUtils';
import ProductsEmptyState from './ProductsEmptyState';

interface ProductsDesktopTableProps {
  products: any[];
  totalItems: number;
  isLoading: boolean;
  isAdmin: boolean;
  selectedWarehouseId: string;
  currentPage: number;
  pageSize: number;
  sortConfig: { key: string; direction: 'asc' | 'desc' | null };
  onSort: (key: string) => void;
  getDuplicateHintCount: (product: any) => number;
  onOpenMergeModal: (product: any) => void;
  onEditProduct: (product: any) => void;
  onRestockProduct: (product: any) => void;
  onShowBatches: (product: any) => void;
  onShowHistory: (product: any) => void;
  onOpenWriteOffModal: (product: any) => void;
  onTransferProduct: (product: any) => void;
  onDeleteProduct: (product: any) => void;
  onAddProduct: () => void;
}

const SortIcon = ({
  sortConfig,
  sortKey,
}: {
  sortConfig: ProductsDesktopTableProps['sortConfig'];
  sortKey: string;
}) => {
  if (sortConfig.key !== sortKey) return null;
  return sortConfig.direction === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
};

export default function ProductsDesktopTable({
  products,
  totalItems,
  isLoading,
  isAdmin,
  selectedWarehouseId,
  currentPage,
  pageSize,
  sortConfig,
  onSort,
  getDuplicateHintCount,
  onOpenMergeModal,
  onEditProduct,
  onRestockProduct,
  onShowBatches,
  onShowHistory,
  onOpenWriteOffModal,
  onTransferProduct,
  onDeleteProduct,
  onAddProduct,
}: ProductsDesktopTableProps) {
  return (
    <div className="hidden overflow-x-auto border-t border-slate-200 md:block">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-slate-200 bg-[#f4f5fb] text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
            <th className="px-3 py-2.5">№</th>
            <th className="cursor-pointer px-3 py-2.5 transition-colors hover:text-indigo-600" onClick={() => onSort('name')}>
              <div className="flex items-center space-x-1.5">
                <span>Товар</span>
                <SortIcon sortConfig={sortConfig} sortKey="name" />
              </div>
            </th>
            {isAdmin && (
              <th className="cursor-pointer px-3 py-2.5 transition-colors hover:text-indigo-600" onClick={() => onSort('costPrice')}>
                <div className="flex items-center space-x-1.5">
                  <span>Закупка</span>
                  <SortIcon sortConfig={sortConfig} sortKey="costPrice" />
                </div>
              </th>
            )}
            <th className="cursor-pointer px-3 py-2.5 transition-colors hover:text-indigo-600" onClick={() => onSort('sellingPrice')}>
              <div className="flex items-center space-x-1.5">
                <span>Продажа</span>
                <SortIcon sortConfig={sortConfig} sortKey="sellingPrice" />
              </div>
            </th>
            <th className="cursor-pointer px-3 py-2.5 transition-colors hover:text-indigo-600" onClick={() => onSort('stock')}>
              <div className="flex items-center space-x-1.5">
                <span>Остаток</span>
                <SortIcon sortConfig={sortConfig} sortKey="stock" />
              </div>
            </th>
            <th className="px-3 py-2.5">Приход</th>
            {isAdmin && <th className="px-3 py-2.5">Рентабельность</th>}
            {isAdmin && <th className="px-3 py-2.5 text-right">Действия</th>}
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-200 bg-white">
          {products.map((product, index) => (
            <tr key={product.id} className="group transition-colors hover:bg-slate-50/80">
              <td className="px-3 py-2.5 text-xs font-medium text-slate-400">{(currentPage - 1) * pageSize + index + 1}</td>
              <td className="px-3 py-2.5">
                <div className="flex items-center space-x-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                    {product.photoUrl ? (
                      <img
                        src={resolveMediaUrl(product.photoUrl, product.id)}
                        alt={product.name}
                        className="h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                        onError={(event) => handleBrokenImage(event, product.id)}
                      />
                    ) : (
                      <ImageIcon className="text-slate-300" size={16} />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium leading-tight text-slate-900">{formatProductName(product.name)}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <p className="text-xs font-medium text-slate-400">{product.category?.name || 'Без категории'}</p>
                      {getDuplicateHintCount(product) > 0 && (
                        <button
                          onClick={() => onOpenMergeModal(product)}
                          className="rounded-lg bg-amber-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-700"
                        >
                          Дубликат
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </td>

              {isAdmin && (
                <td className="px-3 py-2.5">
                  {selectedWarehouseId ? (
                    <div className="flex flex-col">
                      <p className="text-xs font-semibold text-slate-900">
                        {(() => {
                          const activeBatches = (product.batches || [])
                            .filter((batch: any) => Number(batch.remainingQuantity) > 0)
                            .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                          const currentBatch = activeBatches[0];
                          return formatMoney(currentBatch ? currentBatch.costPrice : product.costPrice);
                        })()}
                      </p>
                      <p className="text-[10px] font-medium text-slate-400">Посл: {formatMoney(product.costPrice)}</p>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-300">-</span>
                  )}
                </td>
              )}

              <td className="px-3 py-2.5">
                {selectedWarehouseId ? (
                  <p className="text-sm font-semibold text-slate-900">{formatMoney(product.sellingPrice)}</p>
                ) : (
                  <span className="text-xs text-slate-300">-</span>
                )}
              </td>

              <td className="px-3 py-2.5">
                <div className="flex items-center space-x-2">
                  <div
                    className={clsx(
                      'h-1.5 w-1.5 rounded-full',
                      product.stock <= product.minStock ? 'animate-pulse bg-rose-600' : 'bg-emerald-500'
                    )}
                  />
                  <div className={clsx('min-w-0', product.stock <= product.minStock ? 'text-rose-600' : 'text-slate-900')}>
                    <p className="whitespace-pre-line text-sm font-semibold">{getStockBreakdown(product).primary}</p>
                    {getStockBreakdown(product).secondary && (
                      <p className="text-[11px] font-medium text-slate-400">{getStockBreakdown(product).secondary}</p>
                    )}
                  </div>
                </div>
              </td>

              <td className="px-3 py-2.5">
                <p className="text-xs font-medium text-slate-500">
                  {product.totalIncoming}{' '}
                  <span className="text-[10px] font-medium uppercase text-slate-400">{normalizeDisplayBaseUnit(product.unit || 'шт')}</span>
                </p>
              </td>

              {isAdmin && (
                <td className="px-3 py-2.5">
                  {selectedWarehouseId ? (
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-slate-900">
                        {formatPercent(getProductEfficiencyMetrics(product).marginPercent, 1)}
                      </p>
                      <span className={clsx('inline-flex rounded-full border px-2 py-1 text-[10px] font-bold', getProductEfficiencyMetrics(product).className)}>
                        {getProductEfficiencyMetrics(product).label}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-300">-</span>
                  )}
                </td>
              )}

              {isAdmin && (
                <td className="px-3 py-2.5 text-right">
                  {selectedWarehouseId ? (
                    <div className="flex flex-col items-end space-y-1.5">
                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => onEditProduct(product)}
                          className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-600"
                          title="Редактировать"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => onRestockProduct(product)}
                          className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600"
                          title="Пополнить"
                        >
                          <PlusCircle size={14} />
                        </button>
                        <button
                          onClick={() => onShowBatches(product)}
                          className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-600"
                          title="Партии (FIFO)"
                        >
                          <Layers size={14} />
                        </button>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => onShowHistory(product)}
                          className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 transition-colors hover:border-sky-200 hover:bg-sky-50 hover:text-sky-600"
                          title="История"
                        >
                          <History size={14} />
                        </button>
                        <button
                          onClick={() => onOpenWriteOffModal(product)}
                          disabled={Number(product.stock || 0) <= 0}
                          className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 transition-colors hover:border-amber-200 hover:bg-amber-50 hover:text-amber-600 disabled:cursor-not-allowed disabled:border-slate-100 disabled:bg-slate-50 disabled:text-slate-300"
                          title="Списать"
                        >
                          <Scissors size={14} />
                        </button>
                        <button
                          onClick={() => onTransferProduct(product)}
                          className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 transition-colors hover:border-amber-200 hover:bg-amber-50 hover:text-amber-600"
                          title="Перенос"
                        >
                          <ArrowRightLeft size={14} />
                        </button>
                        <button
                          onClick={() => onDeleteProduct(product)}
                          className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                          title="Удалить"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-300">-</span>
                  )}
                </td>
              )}
            </tr>
          ))}

          {totalItems === 0 && !isLoading && (
            <ProductsEmptyState
              variant="table"
              colSpan={isAdmin ? 7 : 5}
              onAddProduct={onAddProduct}
            />
          )}
        </tbody>
      </table>
    </div>
  );
}
