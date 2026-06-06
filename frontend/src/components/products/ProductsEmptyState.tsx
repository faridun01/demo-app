import { Package } from 'lucide-react';

interface ProductsEmptyStateProps {
  variant: 'mobile' | 'table';
  colSpan?: number;
  onAddProduct?: () => void;
}

export default function ProductsEmptyState({ variant, colSpan, onAddProduct }: ProductsEmptyStateProps) {
  if (variant === 'table') {
    return (
      <tr>
        <td colSpan={colSpan} className="px-3 py-16 text-center">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f4f5fb] text-slate-300">
              <Package size={32} />
            </div>
            <div>
              <p className="text-xl font-black text-slate-900">Товары не найдены</p>
              <p className="text-sm font-medium text-slate-500">Измените параметры поиска или выберите другой склад.</p>
            </div>
            {onAddProduct ? (
              <button
                onClick={onAddProduct}
                className="rounded-2xl bg-violet-500 px-6 py-3 text-sm font-medium text-white transition-all hover:bg-violet-600"
              >
                Добавить товар
              </button>
            ) : null}
          </div>
        </td>
      </tr>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-5 py-12 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f4f5fb] text-slate-300">
        <Package size={28} />
      </div>
      <p className="mt-4 text-lg font-black text-slate-900">Товары не найдены</p>
      <p className="mt-1 text-sm text-slate-500">Измените поиск или выберите другой склад.</p>
    </div>
  );
}
