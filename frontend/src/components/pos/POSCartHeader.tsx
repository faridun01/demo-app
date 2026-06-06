import { Maximize2, Minimize2, ShoppingCart } from 'lucide-react';
import { clsx } from 'clsx';

type POSCartHeaderProps = {
  isCartExpanded: boolean;
  cartLength: number;
  totalWeightKg: number;
  formatWeightKg: (value: unknown) => string;
  setIsCartExpanded: (updater: (value: boolean) => boolean) => void;
};

export default function POSCartHeader({
  isCartExpanded,
  cartLength,
  totalWeightKg,
  formatWeightKg,
  setIsCartExpanded,
}: POSCartHeaderProps) {
  return (
    <div className={clsx('flex items-center justify-between border-b border-[#b7c2ce] bg-[#fff7d6] px-4 py-2.5', isCartExpanded && 'lg:col-start-1 lg:row-start-1')}>
      <div className={clsx(isCartExpanded && 'lg:hidden')}>
        <h2 className="text-lg font-semibold text-[#1f2933]">Корзина</h2>
        <p className="mt-1 text-xs text-slate-500">Выбрано позиций: {cartLength}</p>
        <p className="mt-1 text-xs font-semibold text-emerald-700">
          Масса/объем: {formatWeightKg(totalWeightKg)}
        </p>
      </div>
      <div className={clsx('flex items-center gap-2', isCartExpanded && 'lg:ml-auto')}>
        <button
          type="button"
          onClick={() => setIsCartExpanded((value) => !value)}
          title={isCartExpanded ? 'Свернуть корзину' : 'Развернуть корзину'}
          className="flex h-8 w-8 items-center justify-center rounded border border-[#c8a64a] bg-white text-[#7a5a00] transition-colors hover:bg-[#fff0b3]"
        >
          {isCartExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
        </button>
        <div className={clsx('flex items-center gap-2 rounded border border-[#c8a64a] bg-[#fff0b3] px-2.5 py-1.5 text-[#7a5a00]', isCartExpanded && 'lg:hidden')}>
          <ShoppingCart size={18} />
          <span className="text-xs font-semibold">{cartLength}</span>
        </div>
      </div>
    </div>
  );
}
