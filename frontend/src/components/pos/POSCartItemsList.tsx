import { ShoppingCart } from 'lucide-react';
import { clsx } from 'clsx';
import POSCartItem, { type CartItem, type PackagingOption } from './POSCartItem';

type POSCartItemsListProps = {
  cart: CartItem[];
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

export default function POSCartItemsList({
  cart,
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
}: POSCartItemsListProps) {
  return (
    <div
      className={clsx(
        'order-1 px-3 md:px-4 lg:order-0',
        isCartExpanded
          ? 'min-h-0 overflow-y-visible overscroll-contain lg:col-start-1 lg:row-start-3 lg:h-full lg:max-h-full lg:overflow-y-auto'
          : 'min-h-0 overflow-y-visible overscroll-contain lg:flex-1 lg:overflow-y-auto',
      )}
      style={!isCartExpanded ? { maxHeight: undefined } : undefined}
    >
      <div className="hidden">
        Товары в корзине: {cart.length}
      </div>

      {cart.map((item, index) => (
        <POSCartItem
          key={item.id}
          item={item}
          index={index}
          isCartExpanded={isCartExpanded}
          getCartStockSummary={getCartStockSummary}
          getCartPackaging={getCartPackaging}
          isPackagingAvailableForCartItem={isPackagingAvailableForCartItem}
          getLineSubtotal={getLineSubtotal}
          getLineDiscountAmount={getLineDiscountAmount}
          getLineTotal={getLineTotal}
          getProductUnitWeightKg={getProductUnitWeightKg}
          formatWeightKg={formatWeightKg}
          removeFromCart={removeFromCart}
          updateSelectedPackaging={updateSelectedPackaging}
          updatePackageQuantityInput={updatePackageQuantityInput}
          commitPackageQuantityInput={commitPackageQuantityInput}
          updateExtraUnitQuantityInput={updateExtraUnitQuantityInput}
          commitExtraUnitQuantityInput={commitExtraUnitQuantityInput}
          updateLineDiscountInput={updateLineDiscountInput}
          commitLineDiscountInput={commitLineDiscountInput}
        />
      ))}

      {!cart.length && (
        <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-300">
            <ShoppingCart size={28} />
          </div>
          <p className="text-xs text-slate-500">Корзина пуста</p>
        </div>
      )}
    </div>
  );
}
