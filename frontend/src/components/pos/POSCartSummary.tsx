import { ChevronRight, ShoppingCart } from 'lucide-react';
import { clsx } from 'clsx';
import { formatMoney } from '../../utils/format';

type CartWeightSummary = {
  totalWeightKg: number;
  missingWeightItems: number;
};

type POSCartSummaryProps = {
  isCartExpanded: boolean;
  cartLength: number;
  customerId: number | null;
  discount: number;
  paidAmount: string;
  subtotal: number;
  total: number;
  lineDiscountAmount: number;
  invoiceDiscountAmount: number;
  balance: number;
  cartWeightSummary: CartWeightSummary;
  isSubmitting: boolean;
  formatWeightKg: (value: unknown) => string;
  setDiscount: (value: number) => void;
  setPaidAmount: (value: string) => void;
  handleCheckout: () => void;
};

export default function POSCartSummary({
  isCartExpanded,
  cartLength,
  customerId,
  discount,
  paidAmount,
  subtotal,
  total,
  lineDiscountAmount,
  invoiceDiscountAmount,
  balance,
  cartWeightSummary,
  isSubmitting,
  formatWeightKg,
  setDiscount,
  setPaidAmount,
  handleCheckout,
}: POSCartSummaryProps) {
  return (
    <div
      className={clsx(
        'order-3 space-y-2 border-t border-[#b7c2ce] bg-[#f7f9fb] px-3 py-3 md:bg-[#f7f9fb] md:px-4 md:py-3 lg:order-0',
        isCartExpanded
          ? 'lg:col-start-2 lg:row-span-3 lg:row-start-1 lg:h-full lg:self-stretch lg:overflow-hidden lg:border-l lg:border-t-0'
          : 'z-10 shrink-0',
      )}
    >
      {isCartExpanded && (
        <div className="hidden rounded border border-[#c8a64a] bg-[#fff7d6] px-3 py-3 lg:block">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-[#1f2933]">Корзина</h2>
              <p className="mt-1 text-xs text-slate-500">Выбрано позиций: {cartLength}</p>
            </div>
            <div className="flex items-center gap-2 rounded border border-[#c8a64a] bg-[#fff0b3] px-2.5 py-1.5 text-[#7a5a00]">
              <ShoppingCart size={18} />
              <span className="text-xs font-semibold">{cartLength}</span>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded border border-[#d6c07a] bg-white px-2.5 py-2">
              <p className="text-[10px] font-medium text-[#7a5a00]">Сумма</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{formatMoney(total)}</p>
            </div>
            <div className="rounded border border-[#a9d8c7] bg-white px-2.5 py-2">
              <p className="text-[10px] font-medium text-emerald-700">Масса/объем</p>
              <p className="mt-1 text-sm font-semibold text-emerald-700">{formatWeightKg(cartWeightSummary.totalWeightKg)}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <input
          type="number"
          min={0}
          value={discount === 0 ? '' : discount}
          onChange={(e) => setDiscount(Math.max(0, Number(e.target.value) || 0))}
          placeholder="Скидка %"
          className="rounded border border-[#d6c07a] bg-white px-3 py-2 text-xs text-[#1f2933] outline-none transition-colors focus:border-[#b08a28]"
        />
        <input
          type="number"
          value={paidAmount}
          min={0}
          step="0.01"
          onChange={(e) => {
            const value = e.target.value;
            setPaidAmount(value === '' ? '' : String(Math.max(0, Number(value) || 0)));
          }}
          placeholder="Оплачено"
          className="rounded border border-[#9fb7d5] bg-white px-3 py-2 text-xs text-[#1f2933] outline-none transition-colors focus:border-[#4f81bd]"
        />
      </div>

      <div className="space-y-1.5 rounded border border-[#d6c07a] bg-[#fff8dc] px-3 py-2 text-xs">
        <div className="flex items-center justify-between text-slate-500">
          <span>Подытог</span>
          <span className="text-slate-900">{formatMoney(subtotal)}</span>
        </div>
        <div className="flex items-center justify-between text-slate-500">
          <span>Масса/объем товаров</span>
          <span className="font-semibold text-emerald-700">{formatWeightKg(cartWeightSummary.totalWeightKg)}</span>
        </div>
        {cartWeightSummary.missingWeightItems > 0 ? (
          <div className="text-[10px] font-medium text-amber-700">
            У {cartWeightSummary.missingWeightItems} поз. вес не найден в названии
          </div>
        ) : null}
        <div className="flex items-center justify-between text-slate-500">
          <span>Скидка по товарам</span>
          <span className="text-slate-900">-{formatMoney(lineDiscountAmount)}</span>
        </div>
        <div className="flex items-center justify-between text-slate-500">
          <span>Скидка на чек</span>
          <span className="text-slate-900">-{formatMoney(invoiceDiscountAmount)}</span>
        </div>
        {paidAmount && (
          <div className="flex items-center justify-between text-slate-500">
            <span>{balance >= 0 ? 'Сдача' : 'Долг'}</span>
            <span className={balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
              {formatMoney(Math.abs(balance))}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-sm font-semibold text-slate-900">
          <span>Итого</span>
          <span>{formatMoney(total)}</span>
        </div>
      </div>

      <button
        onClick={handleCheckout}
        disabled={isSubmitting || cartLength === 0 || !customerId}
        className="flex w-full items-center justify-center rounded border border-[#8f6f18] bg-[#ffd966] px-4 py-2.5 text-sm font-semibold text-[#2f2f2f] shadow-sm transition-colors hover:bg-[#ffc83d] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? 'Обработка...' : 'Оформить'}
        {!isSubmitting && <ChevronRight className="ml-2" size={18} />}
      </button>
    </div>
  );
}
