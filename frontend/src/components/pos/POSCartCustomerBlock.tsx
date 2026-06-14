import { startTransition } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { User } from 'lucide-react';
import { clsx } from 'clsx';
import { formatMoney } from '../../utils/format';

type CartWeightSummary = {
  totalWeightKg: number;
  missingWeightItems: number;
};

type CustomerOption = {
  id: number;
  name?: string | null;
};

type POSCartCustomerBlockProps = {
  isCartExpanded: boolean;
  total: number;
  cartWeightSummary: CartWeightSummary;
  cartOverflowMessage: string;
  customerId: number | null;
  customerSearch: string;
  isCustomerPortal: boolean;
  isCustomerDropdownOpen: boolean;
  filteredCustomers: CustomerOption[];
  formatWeightKg: (value: unknown) => string;
  setCustomerId: Dispatch<SetStateAction<number | null>>;
  setCustomerSearch: Dispatch<SetStateAction<string>>;
  setIsCustomerDropdownOpen: Dispatch<SetStateAction<boolean>>;
};

export default function POSCartCustomerBlock({
  isCartExpanded,
  total,
  cartWeightSummary,
  cartOverflowMessage,
  customerId,
  customerSearch,
  isCustomerPortal,
  isCustomerDropdownOpen,
  filteredCustomers,
  formatWeightKg,
  setCustomerId,
  setCustomerSearch,
  setIsCustomerDropdownOpen,
}: POSCartCustomerBlockProps) {
  return (
    <div className={clsx('order-2 space-y-2 border-b border-[#b7c2ce] bg-[#f7f9fb] px-3 py-2.5 md:px-4 lg:order-0', isCartExpanded && 'lg:col-start-1 lg:row-start-2')}>
      <div className="hidden rounded border border-[#c8a64a] bg-[#fff7d6] px-3 py-2 text-xs text-[#7a5a00] md:hidden">
        <div className="flex items-center justify-between gap-3">
          <span className="font-medium">Сумма корзины</span>
          <span className="text-sm font-semibold text-slate-900">{formatMoney(total)}</span>
        </div>
        <div className="mt-1 flex items-center justify-between gap-3">
          <span className="font-medium">Масса/объем</span>
          <span className="text-sm font-semibold text-slate-900">{formatWeightKg(cartWeightSummary.totalWeightKg)}</span>
        </div>
      </div>

      {cartOverflowMessage && (
        <div className="rounded border border-[#d89aa2] bg-[#fff0f1] px-3 py-2 text-xs font-medium text-[#8a1f2d]">
          {cartOverflowMessage}
        </div>
      )}

      <div className="relative">
        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7a5a00]" size={16} />
        <input
          value={customerSearch}
          onChange={(e) => {
            if (isCustomerPortal) return;
            const value = e.target.value;
            startTransition(() => {
              setCustomerSearch(value);
              setCustomerId(null);
              setIsCustomerDropdownOpen(true);
            });
          }}
          onFocus={() => !isCustomerPortal && setIsCustomerDropdownOpen(true)}
          onBlur={() => {
            window.setTimeout(() => {
              setIsCustomerDropdownOpen(false);
            }, 150);
          }}
          placeholder="Поиск клиента по имени"
          readOnly={isCustomerPortal}
          className="w-full rounded border border-[#9fb7d5] bg-white py-2 pl-9 pr-3 text-xs text-[#1f2933] outline-none transition-colors focus:border-[#4f81bd]"
        />
        {isCustomerDropdownOpen && (
          <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-20 max-h-60 overflow-y-auto rounded border border-[#9fb7d5] bg-white p-1 shadow-xl">
            {filteredCustomers.map((customer) => (
              <button
                key={customer.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setCustomerId(customer.id);
                  setCustomerSearch(customer.name || '');
                  setIsCustomerDropdownOpen(false);
                }}
                className={clsx(
                  'flex w-full rounded px-3 py-2 text-left text-xs transition-colors hover:bg-[#fff8dc]',
                  customerId === customer.id ? 'border border-[#c8d2df] bg-white text-[#32465a]' : 'text-slate-700',
                )}
              >
                {customer.name}
              </button>
            ))}
            {!filteredCustomers.length && (
              <div className="px-3 py-2 text-xs text-slate-400">Клиенты не найдены</div>
            )}
          </div>
        )}
      </div>

      {!customerId && (
        <div className="rounded border border-[#c8a64a] bg-[#fff7d6] px-3 py-2 text-xs text-[#7a5a00]">
          Выберите клиента, иначе оформить продажу нельзя.
        </div>
      )}
    </div>
  );
}
