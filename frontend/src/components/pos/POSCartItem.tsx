import { Trash2 } from 'lucide-react';
import { formatMoney } from '../../utils/format';
import { formatProductName } from '../../utils/productName';

export type PackagingOption = {
  id: number;
  packageName: string;
  baseUnitName: string;
  unitsPerPackage: number;
  isDefault?: boolean;
};

export type CartItem = {
  id: number;
  name: string;
  quantity: number;
  stock: number;
  unit: string;
  baseUnitName: string;
  sellingPrice: number;
  photoUrl?: string | null;
  packagings: PackagingOption[];
  selectedPackagingId: number | null;
  packageQuantity: number;
  packageQuantityInput?: string;
  extraUnitQuantity: number;
  extraUnitQuantityInput?: string;
  lineDiscountPercent: number;
  lineDiscountInput?: string;
  [key: string]: any;
};

type POSCartItemProps = {
  item: CartItem;
  index: number;
  isCartExpanded: boolean;
  getCartStockSummary: (item: CartItem) => { availableLabel: string; remainingLabel: string };
  getCartPackaging: (item: CartItem) => PackagingOption | null;
  isPackagingAvailableForCartItem: (item: CartItem, packaging: PackagingOption | null) => boolean;
  getLineSubtotal: (item: CartItem) => number;
  getLineDiscountAmount: (item: CartItem) => number;
  getLineTotal: (item: CartItem) => number;
  getProductUnitWeightKg: (item: CartItem) => number;
  formatWeightKg: (value: unknown) => string;
  removeFromCart: (id: number) => void;
  updateSelectedPackaging: (id: number, value: string) => void;
  updatePackageQuantityInput: (id: number, value: string) => void;
  commitPackageQuantityInput: (id: number) => void;
  updateExtraUnitQuantityInput: (id: number, value: string) => void;
  commitExtraUnitQuantityInput: (id: number) => void;
  updateLineDiscountInput: (id: number, value: string) => void;
  commitLineDiscountInput: (id: number) => void;
};

export default function POSCartItem({
  item,
  index,
  isCartExpanded,
  getCartStockSummary,
  getCartPackaging,
  isPackagingAvailableForCartItem,
  getLineSubtotal,
  getLineDiscountAmount,
  getLineTotal,
  getProductUnitWeightKg,
  formatWeightKg,
  removeFromCart,
  updateSelectedPackaging,
  updatePackageQuantityInput,
  commitPackageQuantityInput,
  updateExtraUnitQuantityInput,
  commitExtraUnitQuantityInput,
  updateLineDiscountInput,
  commitLineDiscountInput,
}: POSCartItemProps) {
  const stockSummary = getCartStockSummary(item);
  const itemLineSubtotal = getLineSubtotal(item);
  const itemLineDiscount = getLineDiscountAmount(item);
  const itemLineTotal = getLineTotal(item);
  const itemWeightKg = getProductUnitWeightKg(item) * Math.max(0, Number(item.quantity || 0));
  const isPackageSale = Boolean(item.selectedPackagingId);

  return (
    <div className="border-b border-[#d5dde6] py-2 last:border-b-0 even:bg-[#fbfcfd]">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded border border-[#c8a64a] bg-[#fff7d6] text-xs font-semibold text-[#7a5a00]">
          {index + 1}
        </div>

        <div className="min-w-0 flex-1">
          <div className="min-w-0">
            <p
              className="wrap-break-word whitespace-normal text-[13px] font-semibold leading-4 text-[#1f2933] md:text-[12px]"
              style={{ overflowWrap: 'anywhere' }}
            >
              {formatProductName(item.name)}
            </p>
            <p className="mt-1 text-[10px] leading-4 text-slate-500">
              Доступно: <span className="font-semibold text-[#48627f]">{stockSummary.availableLabel}</span>
            </p>
          </div>

          <div className="mt-2 space-y-2 md:mt-3 md:space-y-3">
            <div className="flex items-start justify-between gap-2 rounded border border-[#d5dde6] bg-[#f7f9fb] px-2 py-2">
              <div className="min-w-0">
                <p className="text-[9px] font-semibold uppercase tracking-normal text-[#48627f]">Расчет</p>
                <p className="mt-1 text-[10px] font-medium text-slate-500">
                  {formatMoney(item.sellingPrice)} x {item.quantity} {item.baseUnitName}
                </p>
                {itemWeightKg > 0 ? (
                  <p className="mt-1 text-[10px] font-semibold text-[#7a5a00]">
                    Масса/объем: {formatWeightKg(itemWeightKg)}
                  </p>
                ) : null}
              </div>
              <div className="flex items-start gap-2">
                <div className="text-right">
                  <p className="text-[13px] font-semibold text-slate-900">
                    {formatMoney(itemLineTotal)}
                  </p>
                  {itemLineDiscount > 0 ? (
                    <p className="mt-0.5 text-[10px] text-slate-400 line-through">
                      {formatMoney(itemLineSubtotal)}
                    </p>
                  ) : null}
                </div>
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-transparent text-[#7b8794] transition-colors hover:border-[#d89aa2] hover:bg-[#fff0f1] hover:text-[#8a1f2d]"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {isCartExpanded ? (
              <div className="grid gap-2 md:grid-cols-[240px_96px_96px_96px]">
                <label className="min-w-0">
                  <span className="mb-1 block text-[10px] font-semibold text-[#48627f]">Упаковка</span>
                  <select
                    value={item.selectedPackagingId || ''}
                    onChange={(e) => updateSelectedPackaging(item.id, e.target.value)}
                    title="Выберите коробку или продажу поштучно"
                    className="h-9 w-full rounded border border-[#9fb7d5] bg-white px-2 text-xs text-[#1f2933] outline-none transition-colors focus:border-[#4f7fb8]"
                  >
                    <option value="">Только {item.baseUnitName}</option>
                    {(Array.isArray(item.packagings) ? item.packagings : []).map((packaging) => {
                      const isDisabled = !isPackagingAvailableForCartItem(item, packaging);
                      return (
                        <option key={packaging.id} value={packaging.id} disabled={isDisabled}>
                          {packaging.packageName} = {packaging.unitsPerPackage} {item.baseUnitName}
                          {isDisabled ? ' (мало остатка)' : ''}
                        </option>
                      );
                    })}
                  </select>
                </label>

                <label>
                  <span className="mb-1 block text-[10px] font-semibold text-[#48627f]">Коробок</span>
                  <input
                    type="number"
                    min={0}
                    value={item.packageQuantityInput ?? String(item.packageQuantity)}
                    onChange={(e) => updatePackageQuantityInput(item.id, e.target.value)}
                    onBlur={() => commitPackageQuantityInput(item.id)}
                    disabled={!item.selectedPackagingId}
                    placeholder="Упак."
                    title="Количество выбранных упаковок"
                    className="h-9 w-full rounded border border-[#9fb7d5] bg-white px-2 text-center text-xs text-[#1f2933] outline-none transition-colors focus:border-[#4f7fb8] disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </label>

                <label>
                  <span className="mb-1 block text-[10px] font-semibold text-[#48627f]">{item.baseUnitName}</span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={item.extraUnitQuantityInput ?? String(item.extraUnitQuantity)}
                    onChange={(e) => updateExtraUnitQuantityInput(item.id, e.target.value)}
                    onBlur={() => commitExtraUnitQuantityInput(item.id)}
                    disabled={isPackageSale}
                    placeholder={`+ ${item.baseUnitName}`}
                    title="Дополнительное количество поштучно"
                    className="h-9 w-full rounded border border-[#9fb7d5] bg-white px-2 text-center text-xs text-[#1f2933] outline-none transition-colors focus:border-[#4f7fb8] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 disabled:opacity-70"
                  />
                </label>

                <label>
                  <span className="mb-1 block text-[10px] font-semibold text-[#7a5a00]">Скидка %</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={item.lineDiscountInput !== undefined ? item.lineDiscountInput : (item.lineDiscountPercent > 0 ? String(item.lineDiscountPercent) : '')}
                    onChange={(e) => updateLineDiscountInput(item.id, e.target.value)}
                    onBlur={() => commitLineDiscountInput(item.id)}
                    placeholder="%"
                    title="Процент скидки на этот товар"
                    className="h-9 w-full rounded border border-[#d6c07a] bg-white px-2 text-center text-xs text-[#1f2933] outline-none transition-colors focus:border-[#b08a28]"
                  />
                </label>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-[minmax(0,1fr)_64px_64px] gap-2 md:grid-cols-[minmax(0,1.2fr)_88px_96px]">
                  <select
                    value={item.selectedPackagingId || ''}
                    onChange={(e) => updateSelectedPackaging(item.id, e.target.value)}
                    className="min-w-0 rounded border border-[#9fb7d5] bg-white px-2 py-1.5 text-xs text-[#1f2933] outline-none"
                  >
                    <option value="">Только {item.baseUnitName}</option>
                    {(Array.isArray(item.packagings) ? item.packagings : []).map((packaging) => {
                      const isDisabled = !isPackagingAvailableForCartItem(item, packaging);
                      return (
                        <option key={packaging.id} value={packaging.id} disabled={isDisabled}>
                          {packaging.packageName} = {packaging.unitsPerPackage} {item.baseUnitName}
                          {isDisabled ? ' (мало остатка)' : ''}
                        </option>
                      );
                    })}
                  </select>

                  <input
                    type="number"
                    min={0}
                    value={item.packageQuantityInput ?? String(item.packageQuantity)}
                    onChange={(e) => updatePackageQuantityInput(item.id, e.target.value)}
                    onBlur={() => commitPackageQuantityInput(item.id)}
                    disabled={!item.selectedPackagingId}
                    placeholder="Упак."
                    className="min-w-0 rounded border border-[#9fb7d5] bg-white px-1.5 py-1.5 text-center text-xs text-[#1f2933] outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  />

                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={item.extraUnitQuantityInput ?? String(item.extraUnitQuantity)}
                    onChange={(e) => updateExtraUnitQuantityInput(item.id, e.target.value)}
                    onBlur={() => commitExtraUnitQuantityInput(item.id)}
                    disabled={isPackageSale}
                    placeholder={`+ ${item.baseUnitName}`}
                    className="min-w-0 rounded border border-[#9fb7d5] bg-white px-1.5 py-1.5 text-center text-xs text-[#1f2933] outline-none disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 disabled:opacity-70"
                  />
                </div>

                <div className="grid grid-cols-[minmax(0,1fr)_86px] gap-2 md:grid-cols-[minmax(0,1fr)_140px]">
                  <div className="flex min-h-8 items-center rounded border border-[#d6c07a] bg-[#fff8dc] px-2 py-1.5 text-[10px] text-[#7a5a00]">
                    Скидка на этот товар
                  </div>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={item.lineDiscountInput !== undefined ? item.lineDiscountInput : (item.lineDiscountPercent > 0 ? String(item.lineDiscountPercent) : '')}
                    onChange={(e) => updateLineDiscountInput(item.id, e.target.value)}
                    onBlur={() => commitLineDiscountInput(item.id)}
                    placeholder="%"
                    className="min-w-0 rounded border border-[#d6c07a] bg-white px-2 py-1.5 text-center text-xs text-[#1f2933] outline-none"
                  />
                </div>
              </>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-500">
              <span>
                {item.selectedPackagingId
                  ? `${getCartPackaging(item)?.packageName || 'Упаковка'}: ${item.packageQuantity}`
                  : `Поштучно: ${item.extraUnitQuantity}`}
              </span>
              <span>
                Итого: {item.quantity} шт
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
