import React, { startTransition, useDeferredValue, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  Maximize2,
  Minimize2,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  User,
  Warehouse,
  X,
} from 'lucide-react';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';
import { getProducts } from '../api/products.api';
import { createInvoice } from '../api/invoices.api';
import { getCustomers } from '../api/customers.api';
import { getWarehouses } from '../api/warehouses.api';
import { createCustomerOrder } from '../api/customer-orders.api';
import ConfirmationModal from '../components/common/ConfirmationModal';
import { filterWarehousesForUser, getCurrentUser, getUserCustomerId, getUserWarehouseId, isAdminUser, isCustomerUser } from '../utils/userAccess';
import { formatMoney, roundMoney, ceilMoney, toFixedNumber } from '../utils/format';
import { formatProductName } from '../utils/productName';
import { getDefaultWarehouseId } from '../utils/warehouse';

type PaymentMethod = 'cash' | 'card' | 'transfer';
type PackagingOption = {
  id: number;
  packageName: string;
  baseUnitName: string;
  unitsPerPackage: number;
  isDefault?: boolean;
};

function tone(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(' ');
}

function getStoredWarehouseId() {
  if (typeof window === 'undefined') {
    return '';
  }

  return sessionStorage.getItem('pos_warehouse_session') || localStorage.getItem('pos_warehouse_session') || '';
}

const posTheme = {
  products: {
    soft: 'bg-[#eef3f8]',
    icon: 'bg-[#dbe7f3] text-[#23527c]',
    accent: 'border border-[#7f9db9] bg-[#eaf2fb] text-[#1f3f63] hover:bg-[#dbeafd]',
    tab: 'border border-[#9fb7d5] bg-[#dbeafd] text-[#143a5a]',
    pill: 'bg-[#eaf2fb] text-[#23527c]',
  },
  cart: {
    soft: 'bg-[#fff7d6]',
    icon: 'bg-[#fff0b3] text-[#7a5a00]',
    accent: 'border border-[#c8a64a] bg-[#ffe184] text-[#2f2f2f] hover:bg-[#ffd45f]',
    tab: 'border border-[#c8a64a] bg-[#ffe184] text-[#2f2f2f]',
    pill: 'bg-[#fff0b3] text-[#7a5a00]',
  },
  payment: {
    active: 'border-[#b08a28] bg-[#ffd966] text-[#2f2f2f]',
    idle: 'border-[#c8d2df] bg-[#f5f7fa] text-[#32465a]',
    summary: 'bg-[#fff8dc]',
  },
};

type CartItem = {
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

const normalizePackagings = (product: any): PackagingOption[] =>
  Array.isArray(product?.packagings)
    ? product.packagings
        .map((entry: any) => ({
          id: Number(entry.id),
          packageName: String(entry.packageName || '').trim(),
          baseUnitName: normalizeDisplayBaseUnit(String(entry.baseUnitName || product?.baseUnitName || product?.unit || '\u0448\u0442')),
          unitsPerPackage: Number(entry.unitsPerPackage || 0),
          isDefault: Boolean(entry.isDefault),
        }))
        .filter((entry: PackagingOption) => entry.id > 0 && entry.packageName && entry.unitsPerPackage > 0)
    : [];

const getDefaultPackaging = (packagings: PackagingOption[]) =>
  packagings.find((entry) => entry.isDefault) || packagings[0] || null;

const clampDiscountPercent = (value: unknown) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 0;
  }

  return Math.min(100, Math.max(0, numeric));
};

const normalizeMoneyValue = (value: number) => {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Object.is(value, -0) ? 0 : value;
};

const normalizeDisplayBaseUnit = (value: string) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return '\u0448\u0442';
  if (['\u043f\u0430\u0447\u043a\u0430', '\u043f\u0430\u0447\u043a\u0438', '\u043f\u0430\u0447\u0435\u043a', '\u0448\u0442', '\u0448\u0442\u0443\u043a', '\u0448\u0442\u0443\u043a\u0430', '\u0448\u0442\u0443\u043a\u0438', 'pcs', 'piece', 'pieces'].includes(normalized)) {
    return '\u0448\u0442';
  }
  return normalized;
};

const formatStockAmount = (stock: number, packaging: PackagingOption | null, baseUnitName: string) => {
  const normalizedStock = Math.max(0, Number(stock) || 0);
  const normalizedBaseUnit = normalizeDisplayBaseUnit(baseUnitName || '\u0448\u0442');

  if (!packaging || Number(packaging.unitsPerPackage || 0) <= 1) {
    return `${normalizedStock} ${normalizedBaseUnit}`;
  }

  const unitsPerPackage = Number(packaging.unitsPerPackage || 0);
  const packageQuantity = Math.floor(normalizedStock / unitsPerPackage);
  const extraUnits = normalizedStock % unitsPerPackage;

  if (packageQuantity > 0 && extraUnits > 0) {
    return `${packageQuantity} ${packaging.packageName} + ${extraUnits} ${normalizedBaseUnit}`;
  }

  if (packageQuantity > 0) {
    return `${packageQuantity} ${packaging.packageName}`;
  }

  return `${extraUnits} ${normalizedBaseUnit}`;
};

const WEIGHT_TOKEN_REGEX = /(^|[\s()[\]{}.,;:+\-_/\\*xх×])(\d+(?:[.,]\d+)?)\s*(кг\.?|килограмм(?:а|ов)?|kgs?|гр\.?|г\.?|grams?|g|л\.?|литр(?:а|ов)?|l|мл\.?|ml|milliliters?)(?=$|[\s()[\]{}.,;:+\-_/\\*xх×])/giu;

const getProductUnitWeightKg = (product: any) => {
  const explicitWeight = Number(String(product?.weightKg ?? product?.unitWeightKg ?? product?.weight_kg ?? product?.unit_weight_kg ?? '').replace(',', '.'));
  if (Number.isFinite(explicitWeight) && explicitWeight > 0) {
    return explicitWeight;
  }

  const text = String(product?.rawName || product?.name || '');
  let match: RegExpExecArray | null;
  let maxWeightKg = 0;
  WEIGHT_TOKEN_REGEX.lastIndex = 0;

  while ((match = WEIGHT_TOKEN_REGEX.exec(text)) !== null) {
    const numericValue = Number(String(match[2] || '').replace(',', '.'));
    if (!Number.isFinite(numericValue) || numericValue <= 0) {
      continue;
    }

    const unit = String(match[3] || '').toLowerCase();
    const weightKg =
      unit.startsWith('кг') || unit.startsWith('kg') || unit.startsWith('килограмм') || unit === 'л' || unit.startsWith('литр') || unit === 'l'
        ? numericValue
        : numericValue / 1000;

    maxWeightKg = Math.max(maxWeightKg, weightKg);
  }

  return maxWeightKg;
};

const formatWeightKg = (value: unknown) => {
  const numeric = Number(value || 0);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return '0 кг';
  }

  return `${new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  }).format(numeric)} кг`;
};

const getProductStockLabel = (product: any, fallbackBaseUnitName?: string) => {
  const packagings = normalizePackagings(product);
  const defaultPackaging = getDefaultPackaging(packagings);
  const baseUnitName = normalizeDisplayBaseUnit(
    String(product?.baseUnitName || product?.unit || fallbackBaseUnitName || defaultPackaging?.baseUnitName || '\u0448\u0442'),
  );

  return formatStockAmount(Number(product?.stock || 0), defaultPackaging, baseUnitName);
};

const getProductStockParts = (product: any, fallbackBaseUnitName?: string) => {
  const packagings = normalizePackagings(product);
  const defaultPackaging = getDefaultPackaging(packagings);
  const baseUnitName = normalizeDisplayBaseUnit(
    String(product?.baseUnitName || product?.unit || fallbackBaseUnitName || defaultPackaging?.baseUnitName || '\u0448\u0442'),
  );
  const stock = Math.max(0, Number(product?.stock || 0));

  if (!defaultPackaging || Number(defaultPackaging.unitsPerPackage || 0) <= 1) {
    return {
      primary: `${stock} ${baseUnitName}`,
      secondary: '',
    };
  }

  const unitsPerPackage = Number(defaultPackaging.unitsPerPackage || 0);
  const packageQuantity = Math.floor(stock / unitsPerPackage);
  const extraUnits = stock % unitsPerPackage;

  if (packageQuantity > 0 && extraUnits > 0) {
    return {
      primary: `${packageQuantity} ${defaultPackaging.packageName}`,
      secondary: `+ ${extraUnits} ${baseUnitName}`,
    };
  }

  if (packageQuantity > 0) {
    return {
      primary: `${packageQuantity} ${defaultPackaging.packageName}`,
      secondary: '',
    };
  }

  return {
    primary: `${extraUnits} ${baseUnitName}`,
    secondary: '',
  };
};

export default function POSView() {
  const cartStorageKey = 'pos_cart_session';
  const pendingCartStorageKey = 'pending_cart';
  const warehouseStorageKey = 'pos_warehouse_session';
  const navigate = useNavigate();
  const hasLoadedReferenceDataRef = useRef(false);
  const user = React.useMemo(() => getCurrentUser(), []);
  const isAdmin = isAdminUser(user);
  const isCustomerPortal = isCustomerUser(user);
  const userWarehouseId = getUserWarehouseId(user);
  const userCustomerId = getUserCustomerId(user);
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [warehouseId, setWarehouseId] = useState(() => {
    return getStoredWarehouseId() || (userWarehouseId ? String(userWarehouseId) : '');
  });
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [discount, setDiscount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'products' | 'cart'>('products');
  const [isCartExpanded, setIsCartExpanded] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [highlightedProductId, setHighlightedProductId] = useState<number | null>(null);
  const [isStorageHydrated, setIsStorageHydrated] = useState(false);
  const [pendingWarehouseId, setPendingWarehouseId] = useState<string | null>(null);
  const productListRef = useRef<HTMLDivElement | null>(null);
  const lastProductScrollRef = useRef(0);
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const deferredProductSearch = useDeferredValue(productSearch);
  const deferredCustomerSearch = useDeferredValue(customerSearch);

  const highlightProductRow = (productId: number | null) => {
    if (highlightTimeoutRef.current) {
      clearTimeout(highlightTimeoutRef.current);
      highlightTimeoutRef.current = null;
    }

    setHighlightedProductId(productId);
    if (productId !== null) {
      highlightTimeoutRef.current = setTimeout(() => {
        setHighlightedProductId((current) => (current === productId ? null : current));
      }, 1000);
    }
  };

  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, []);

  const getCartPackaging = (item: CartItem) =>
    (Array.isArray(item.packagings) ? item.packagings : []).find((entry) => entry.id === item.selectedPackagingId) || null;

  const getAvailableStockForCartItem = (item: CartItem) => {
    const currentProduct = products.find((product) => product.id === item.id);
    return Math.max(0, Number(currentProduct?.stock ?? item.stock ?? 0) || 0);
  };

  const warnStockOverflow = (item: CartItem, availableStock: number) => {
    const currentProduct = products.find((product) => product.id === item.id);
    toast.error(
      `Нельзя продать больше остатка. Доступно: ${getProductStockLabel(currentProduct || item, item.baseUnitName || item.unit)}`,
      { id: `stock-overflow-${item.id}` },
    );
  };

  const getCartOverflowMessage = (item: CartItem) => {
    const currentProduct = products.find((product) => product.id === item.id);
    const sourceProduct = currentProduct || item;
    return `Нельзя продать больше остатка. Доступно: ${getProductStockLabel(sourceProduct, item.baseUnitName || item.unit)}`;
  };

  const getCartStockSummary = (item: CartItem) => {
    const currentProduct = products.find((product) => product.id === item.id);
    const sourceProduct = currentProduct || item;
    const availableStock = getAvailableStockForCartItem(item);
    const remainingStock = Math.max(0, availableStock - Math.max(0, Number(item.quantity || 0)));

    return {
      availableLabel: getProductStockLabel(sourceProduct, item.baseUnitName || item.unit),
      remainingLabel: getProductStockLabel({ ...sourceProduct, stock: remainingStock }, item.baseUnitName || item.unit),
    };
  };

  const normalizeCartItem = (item: CartItem, overrides: Partial<CartItem> = {}) => {
    const merged = { ...item, ...overrides };
    const packaging = merged.packagings.find((entry) => entry.id === merged.selectedPackagingId) || null;
    const unitsPerPackage = packaging?.unitsPerPackage || 0;
    const availableStock = getAvailableStockForCartItem(merged as CartItem);
    let packageQuantity = Math.max(0, Math.floor(Number(merged.packageQuantity || 0)));
    let extraUnitQuantity = Math.max(0, Number(merged.extraUnitQuantity || 0));

    if (!packaging) {
      packageQuantity = 0;
    }

    let totalBaseUnits = packageQuantity * unitsPerPackage + extraUnitQuantity;

    if (totalBaseUnits > availableStock) {
      if (packaging && unitsPerPackage > 0) {
        packageQuantity = Math.floor(availableStock / unitsPerPackage);
        extraUnitQuantity = Math.max(0, availableStock - packageQuantity * unitsPerPackage);
      } else {
        packageQuantity = 0;
        extraUnitQuantity = availableStock;
      }

      totalBaseUnits = packageQuantity * unitsPerPackage + extraUnitQuantity;
    }

    if (totalBaseUnits <= 0) {
      if (packaging && unitsPerPackage > 0 && availableStock >= unitsPerPackage) {
        packageQuantity = 1;
        extraUnitQuantity = 0;
        totalBaseUnits = unitsPerPackage;
      } else {
        packageQuantity = 0;
        extraUnitQuantity = Math.min(Math.max(1, extraUnitQuantity), Math.max(availableStock, 1));
        totalBaseUnits = extraUnitQuantity;
      }
    }

    const normalizedLineDiscount = clampDiscountPercent(merged.lineDiscountPercent || 0);

    return {
      ...merged,
      stock: availableStock,
      selectedPackagingId: packaging?.id ?? null,
      packageQuantity,
      extraUnitQuantity,
      quantity: totalBaseUnits,
      packageQuantityInput: overrides.packageQuantityInput !== undefined ? overrides.packageQuantityInput : String(packageQuantity),
      extraUnitQuantityInput: overrides.extraUnitQuantityInput !== undefined ? overrides.extraUnitQuantityInput : String(extraUnitQuantity),
      lineDiscountPercent: normalizedLineDiscount,
      lineDiscountInput:
        overrides.lineDiscountInput !== undefined
          ? overrides.lineDiscountInput
          : (merged.lineDiscountInput ?? (normalizedLineDiscount > 0 ? String(normalizedLineDiscount) : '')),
    };
  };

  const createCartItemFromProduct = (product: any): CartItem => {
    const packagings = normalizePackagings(product);
    const defaultPackaging = getDefaultPackaging(packagings);
    const baseUnitName = normalizeDisplayBaseUnit(String(product.baseUnitName || product.unit || defaultPackaging?.baseUnitName || '\u0448\u0442'));
    const initialItem: CartItem = {
      ...product,
      quantity: defaultPackaging && Number(product.stock || 0) >= defaultPackaging.unitsPerPackage ? defaultPackaging.unitsPerPackage : 1,
      stock: Number(product.stock || 0),
      unit: baseUnitName,
      baseUnitName,
      packagings,
      selectedPackagingId: defaultPackaging && Number(product.stock || 0) >= defaultPackaging.unitsPerPackage ? defaultPackaging.id : null,
      packageQuantity: defaultPackaging && Number(product.stock || 0) >= defaultPackaging.unitsPerPackage ? 1 : 0,
      packageQuantityInput: defaultPackaging && Number(product.stock || 0) >= defaultPackaging.unitsPerPackage ? '1' : '0',
      extraUnitQuantity: defaultPackaging && Number(product.stock || 0) >= defaultPackaging.unitsPerPackage ? 0 : 1,
      extraUnitQuantityInput: defaultPackaging && Number(product.stock || 0) >= defaultPackaging.unitsPerPackage ? '0' : '1',
      lineDiscountPercent: 0,
      lineDiscountInput: '',
    };

    return normalizeCartItem(initialItem);
  };

  useEffect(() => {
    const savedCart =
      sessionStorage.getItem(cartStorageKey) ||
      localStorage.getItem(cartStorageKey);
    const pendingCart =
      sessionStorage.getItem(pendingCartStorageKey) ||
      localStorage.getItem(pendingCartStorageKey);

    if (savedCart) {
      const parsedSavedCart = JSON.parse(savedCart);
      setCart(
        Array.isArray(parsedSavedCart)
          ? parsedSavedCart.map((item) => ({
              ...item,
              lineDiscountPercent: clampDiscountPercent(item?.lineDiscountPercent || 0),
              lineDiscountInput:
                item?.lineDiscountInput !== undefined
                  ? item.lineDiscountInput
                  : (clampDiscountPercent(item?.lineDiscountPercent || 0) > 0
                    ? String(clampDiscountPercent(item?.lineDiscountPercent || 0))
                    : ''),
            }))
          : [],
      );
    }

    if (pendingCart) {
      const parsedPendingCart = JSON.parse(pendingCart);
      const normalizedPendingCart = Array.isArray(parsedPendingCart)
        ? parsedPendingCart.map((item) => ({
            ...item,
            lineDiscountPercent: clampDiscountPercent(item?.lineDiscountPercent || 0),
            lineDiscountInput:
              item?.lineDiscountInput !== undefined
                ? item.lineDiscountInput
                : (clampDiscountPercent(item?.lineDiscountPercent || 0) > 0
                  ? String(clampDiscountPercent(item?.lineDiscountPercent || 0))
                  : ''),
          }))
        : [];
      setCart(normalizedPendingCart);
      sessionStorage.setItem(cartStorageKey, JSON.stringify(normalizedPendingCart));
      localStorage.setItem(cartStorageKey, JSON.stringify(normalizedPendingCart));
      sessionStorage.removeItem(pendingCartStorageKey);
      localStorage.removeItem(pendingCartStorageKey);
    }

    setIsStorageHydrated(true);
  }, []);

  useEffect(() => {
    const effectiveWarehouseId = warehouseId || (userWarehouseId ? String(userWarehouseId) : '');

    if (!effectiveWarehouseId) {
      setProducts([]);
      return;
    }

    getProducts(effectiveWarehouseId ? Number(effectiveWarehouseId) : undefined)
      .then((data) => {
        const normalizedProducts = Array.isArray(data) ? data : [];
        setProducts(
          normalizedProducts.filter((product) => Number(product?.warehouseId) === Number(effectiveWarehouseId)),
        );
      })
      .catch(console.error);
  }, [warehouseId, userWarehouseId]);

  useEffect(() => {
    if (!products.length) {
      return;
    }

    setCart((currentCart) =>
      currentCart.map((item) => {
        const product = products.find((entry) => entry.id === item.id);
        if (!product) {
          return item;
        }

        const packagings = normalizePackagings(product);
        const fallbackPackaging = getDefaultPackaging(packagings);
        const baseUnitName = normalizeDisplayBaseUnit(String(product.baseUnitName || product.unit || item.baseUnitName || fallbackPackaging?.baseUnitName || '\u0448\u0442'));

        return normalizeCartItem({
          ...item,
          ...product,
          stock: Number(product.stock || 0),
          unit: baseUnitName,
          baseUnitName,
          packagings,
          selectedPackagingId:
            item.selectedPackagingId && packagings.some((entry) => entry.id === item.selectedPackagingId)
              ? item.selectedPackagingId
              : fallbackPackaging?.id || null,
          packageQuantity: Number(item.packageQuantity || 0),
          packageQuantityInput: item.packageQuantityInput ?? String(Number(item.packageQuantity || 0)),
          extraUnitQuantity:
            item.extraUnitQuantity !== undefined && item.extraUnitQuantity !== null
              ? Number(item.extraUnitQuantity)
              : Number(item.quantity || 1),
          extraUnitQuantityInput:
            item.extraUnitQuantityInput
            ?? String(
              item.extraUnitQuantity !== undefined && item.extraUnitQuantity !== null
                ? Number(item.extraUnitQuantity)
                : Number(item.quantity || 1),
            ),
        } as CartItem);
      }),
    );
  }, [products]);

  useEffect(() => {
    if (hasLoadedReferenceDataRef.current) {
      return;
    }

    hasLoadedReferenceDataRef.current = true;
    if (isCustomerPortal) {
      setCustomers(userCustomerId ? [{ id: userCustomerId, name: user.customer?.name || user.username, phone: user.customer?.phone }] : []);
    } else {
      getCustomers()
        .then((data) => setCustomers(Array.isArray(data) ? data : []))
        .catch(console.error);
    }
    getWarehouses()
      .then((data) => {
        const filteredWarehouses = filterWarehousesForUser(Array.isArray(data) ? data : [], user);
        setWarehouses(filteredWarehouses);
        const defaultWarehouseId = getDefaultWarehouseId(filteredWarehouses);
        if (isAdmin && !warehouseId && defaultWarehouseId) {
          setWarehouseId(String(defaultWarehouseId));
        } else if (!isAdmin && filteredWarehouses[0]) {
          setWarehouseId(String(filteredWarehouses[0].id));
        }
      })
      .catch((error) => {
        hasLoadedReferenceDataRef.current = false;
        console.error(error);
      });
  }, [isAdmin, isCustomerPortal, user, userCustomerId]);

  useEffect(() => {
    if (!isStorageHydrated) {
      return;
    }

    sessionStorage.setItem(cartStorageKey, JSON.stringify(cart));
    localStorage.setItem(cartStorageKey, JSON.stringify(cart));
  }, [cart, isStorageHydrated]);

  useEffect(() => {
    if (!customerId) {
      setCustomerSearch('');
      return;
    }

    const selectedCustomer = customers.find((customer) => customer.id === customerId);
    if (selectedCustomer) {
      setCustomerSearch(selectedCustomer.name || '');
    }
  }, [customerId, customers]);

  useEffect(() => {
    if (!isCustomerPortal || !userCustomerId) {
      return;
    }

    setCustomerId(userCustomerId);
    setCustomerSearch(user.customer?.name || user.username || '');
  }, [isCustomerPortal, userCustomerId, user.customer?.name, user.username]);

  useEffect(() => {
    if (warehouseId) {
      sessionStorage.setItem(warehouseStorageKey, warehouseId);
      localStorage.setItem(warehouseStorageKey, warehouseId);
      return;
    }

    sessionStorage.removeItem(warehouseStorageKey);
    localStorage.removeItem(warehouseStorageKey);
  }, [warehouseId]);

  const resetSaleDraft = (showToast = false) => {
    setCart([]);
    setCustomerId(null);
    setCustomerSearch('');
    setPaidAmount('');
    setDiscount(0);
    setPaymentMethod('cash');
    sessionStorage.removeItem(cartStorageKey);
    localStorage.removeItem(cartStorageKey);
    sessionStorage.removeItem(pendingCartStorageKey);
    localStorage.removeItem(pendingCartStorageKey);

    if (showToast) {
      toast('Склад изменён. Черновик продажи сброшен автоматически.', {
        icon: '↺',
      });
    }
  };

  const hasSaleDraft =
    cart.length > 0 || customerId !== null || Number(paidAmount || 0) > 0 || discount > 0;

  const handleWarehouseChange = (nextWarehouseId: string) => {
    if (nextWarehouseId === warehouseId) {
      return;
    }

    if (hasSaleDraft) {
      setPendingWarehouseId(nextWarehouseId);
      return;
    }

    setWarehouseId(nextWarehouseId);
    resetSaleDraft(false);
  };

  const closeWarehouseConfirm = () => {
    setPendingWarehouseId(null);
  };

  const confirmWarehouseChange = async () => {
    if (!pendingWarehouseId) {
      return;
    }

    const nextWarehouseId = pendingWarehouseId;
    setPendingWarehouseId(null);
    setWarehouseId(nextWarehouseId);
    resetSaleDraft(true);
  };

  const showCartOnMobile = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setActiveTab('cart');
    }
  };

  const addToCart = (product: any) => {
    if (productListRef.current) {
      lastProductScrollRef.current = productListRef.current.scrollTop;
    }

    if (isAdmin && !warehouseId) {
      toast.error('Сначала выберите склад');
      return;
    }

    const existing = cart.find((item) => item.id === product.id);

    if (false) {
      toast.error(`Недостаточно товара. Доступно: ${product.stock} ${product.unit}`);
      return;
    }

    if (existing) {
      const packaging = getCartPackaging(existing);
      const attemptedQuantity = packaging
        ? (existing.packageQuantity + 1) * Number(packaging.unitsPerPackage || 0) + Math.max(0, Number(existing.extraUnitQuantity || 0))
        : Math.max(0, Number(existing.extraUnitQuantity || 0)) + 1;
      const availableStock = Math.max(0, Number(product.stock || 0));
      const nextItem = normalizeCartItem(
        existing,
        packaging
          ? {
              packageQuantity: existing.packageQuantity + 1,
              packageQuantityInput: String(existing.packageQuantity + 1),
            }
          : {
              extraUnitQuantity: existing.extraUnitQuantity + 1,
              extraUnitQuantityInput: String(existing.extraUnitQuantity + 1),
            },
      );

      if (attemptedQuantity > availableStock) {
        toast.error(`Недостаточно товара. Доступно: ${getProductStockLabel(product, existing.baseUnitName || product.unit)}`);
        const cappedItem = normalizeCartItem(nextItem);
        setCart(cart.map((item) => (item.id === product.id ? cappedItem : item)));
        showCartOnMobile();
        return;
      }

      setCart(cart.map((item) => (item.id === product.id ? nextItem : item)));
      showCartOnMobile();
    } else {
      const nextItem = createCartItemFromProduct(product);
      if (nextItem.quantity > Number(product.stock || 0)) {
        toast.error(`Недостаточно товара. Доступно: ${getProductStockLabel(product, nextItem.baseUnitName || product.unit)}`);
        return;
      }

      setCart([...cart, nextItem]);
      showCartOnMobile();
    }
  };

  const removeFromCart = (id: number) => {
    if (productListRef.current) {
      lastProductScrollRef.current = productListRef.current.scrollTop;
    }

    setCart(cart.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: number, quantity: number) => {
    if (productListRef.current) {
      lastProductScrollRef.current = productListRef.current.scrollTop;
    }

    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }

    const product = products.find((item) => item.id === id);
    if (product && quantity > product.stock) {
      toast.error(`Недостаточно товара. Доступно: ${getProductStockLabel(product, product.unit)}`);
      setCart(
        cart.map((item) =>
          item.id === id
            ? normalizeCartItem(item, {
                selectedPackagingId: null,
                packageQuantity: 0,
                packageQuantityInput: '0',
                extraUnitQuantity: Math.max(0, Math.floor(Number(product.stock || 0))),
                extraUnitQuantityInput: String(Math.max(0, Math.floor(Number(product.stock || 0)))),
              })
            : item,
        ),
      );
      return;
    }

    setCart(cart.map((item) => (item.id === id ? { ...item, quantity } : item)));
  };

  const updateQuantityInput = (id: number, value: string) => {
    if (productListRef.current) {
      lastProductScrollRef.current = productListRef.current.scrollTop;
    }

    setCart((currentCart) =>
      currentCart.map((item) => {
        if (item.id !== id) {
          return item;
        }

        if (value === '') {
          return { ...item, quantityInput: '' };
        }

        const parsedQuantity = Number(value);
        if (Number.isNaN(parsedQuantity)) {
          return item;
        }

        const product = products.find((productItem) => productItem.id === id);
        const maxStock = product?.stock ?? item.stock;
        if (parsedQuantity > maxStock) {
          warnStockOverflow(item, maxStock);
        }
        const nextQuantity = Math.max(1, Math.min(parsedQuantity, maxStock));
        return {
          ...item,
          quantity: nextQuantity,
          quantityInput: String(nextQuantity),
        };
      }),
    );
  };

  const commitQuantityInput = (id: number) => {
    setCart((currentCart) =>
      currentCart.map((item) => {
        if (item.id !== id) {
          return item;
        }

        const product = products.find((productItem) => productItem.id === id);
        const maxStock = product?.stock ?? item.stock;
        if (item.quantity > maxStock) {
          warnStockOverflow(item, maxStock);
        }
        const normalizedQuantity = Math.max(1, Math.min(item.quantity, maxStock));
        return {
          ...item,
          quantity: normalizedQuantity,
          quantityInput: undefined,
        };
      }),
    );
  };

  const updateSelectedPackaging = (id: number, value: string) => {
    setCart((currentCart) =>
      currentCart.map((item) => {
        if (item.id !== id) {
          return item;
        }

        const selectedPackagingId = value ? Number(value) : null;
        return normalizeCartItem(item, {
          selectedPackagingId,
          packageQuantity: selectedPackagingId ? Math.max(1, item.packageQuantity || 0) : 0,
          packageQuantityInput: selectedPackagingId ? String(Math.max(1, item.packageQuantity || 0)) : '0',
        });
      }),
    );
  };

  const updatePackageQuantityInput = (id: number, value: string) => {
    setCart((currentCart) =>
      currentCart.map((item) => {
        if (item.id !== id) {
          return item;
        }

        if (value === '') {
          return { ...item, packageQuantityInput: '' };
        }

        const packaging = getCartPackaging(item);
        const unitsPerPackage = Number(packaging?.unitsPerPackage || 0);
        const parsedPackageQuantity = Math.max(0, Math.floor(Number(value) || 0));
        const maxByStock = unitsPerPackage > 0
          ? Math.max(0, (getAvailableStockForCartItem(item) - Math.max(0, Number(item.extraUnitQuantity || 0))) / unitsPerPackage)
          : 0;
        const nextPackageQuantity = Math.min(parsedPackageQuantity, Math.floor(Math.max(0, maxByStock)));
        const attemptedTotal = parsedPackageQuantity * unitsPerPackage + Math.max(0, Number(item.extraUnitQuantity || 0));
        const availableStock = getAvailableStockForCartItem(item);
        if (attemptedTotal > availableStock) {
          warnStockOverflow(item, availableStock);
        }

        return normalizeCartItem(item, {
          packageQuantity: nextPackageQuantity,
          packageQuantityInput: String(nextPackageQuantity),
        });
      }),
    );
  };

  const commitPackageQuantityInput = (id: number) => {
    setCart((currentCart) =>
      currentCart
        .map((item) => {
          if (item.id !== id) {
            return item;
          }

          const nextValue = Math.max(0, Math.floor(Number(item.packageQuantityInput || item.packageQuantity || 0) || 0));
          const packaging = getCartPackaging(item);
          const unitsPerPackage = Number(packaging?.unitsPerPackage || 0);
          const attemptedTotal = nextValue * unitsPerPackage + Math.max(0, Number(item.extraUnitQuantity || 0));
          const availableStock = getAvailableStockForCartItem(item);
          if (attemptedTotal > availableStock) {
            warnStockOverflow(item, availableStock);
          }
          return normalizeCartItem(item, {
            packageQuantity: nextValue,
            packageQuantityInput: String(nextValue),
          });
        })
        .filter((item) => item.quantity > 0),
    );
  };

  const updateExtraUnitQuantityInput = (id: number, value: string) => {
    setCart((currentCart) =>
      currentCart.map((item) => {
        if (item.id !== id) {
          return item;
        }

        if (value === '') {
          return { ...item, extraUnitQuantityInput: '' };
        }

        const packaging = getCartPackaging(item);
        const unitsPerPackage = Number(packaging?.unitsPerPackage || 0);
        const parsedExtraUnitQuantity = Math.max(0, Math.floor(Number(value) || 0));
        const maxByStock = packaging
          ? Math.max(0, getAvailableStockForCartItem(item) - Math.max(0, Number(item.packageQuantity || 0)) * unitsPerPackage)
          : getAvailableStockForCartItem(item);
        const nextExtraUnitQuantity = Math.min(parsedExtraUnitQuantity, Math.max(0, maxByStock));
        const attemptedTotal = packaging
          ? Math.max(0, Number(item.packageQuantity || 0)) * unitsPerPackage + parsedExtraUnitQuantity
          : parsedExtraUnitQuantity;
        const availableStock = getAvailableStockForCartItem(item);
        if (attemptedTotal > availableStock) {
          warnStockOverflow(item, availableStock);
        }

        return normalizeCartItem(item, {
          extraUnitQuantity: nextExtraUnitQuantity,
          extraUnitQuantityInput: String(nextExtraUnitQuantity),
        });
      }),
    );
  };

  const commitExtraUnitQuantityInput = (id: number) => {
    setCart((currentCart) =>
      currentCart
        .map((item) => {
          if (item.id !== id) {
            return item;
          }

          const nextValue = Math.max(0, Math.floor(Number(item.extraUnitQuantityInput || item.extraUnitQuantity || 0) || 0));
          const packaging = getCartPackaging(item);
          const unitsPerPackage = Number(packaging?.unitsPerPackage || 0);
          const attemptedTotal = packaging
            ? Math.max(0, Number(item.packageQuantity || 0)) * unitsPerPackage + nextValue
            : nextValue;
          const availableStock = getAvailableStockForCartItem(item);
          if (attemptedTotal > availableStock) {
            warnStockOverflow(item, availableStock);
          }
          return normalizeCartItem(item, {
            extraUnitQuantity: nextValue,
            extraUnitQuantityInput: String(nextValue),
          });
        })
        .filter((item) => item.quantity > 0),
    );
  };

  const updateLineDiscountInput = (id: number, value: string) => {
    setCart((currentCart) =>
      currentCart.map((item) => {
        if (item.id !== id) {
          return item;
        }

        if (value === '') {
          return {
            ...item,
            lineDiscountPercent: 0,
            lineDiscountInput: '',
          };
        }

        const nextValue = clampDiscountPercent(value);
        return {
          ...item,
          lineDiscountPercent: nextValue,
          lineDiscountInput: value,
        };
      }),
    );
  };

  const commitLineDiscountInput = (id: number) => {
    setCart((currentCart) =>
      currentCart.map((item) => {
        if (item.id !== id) {
          return item;
        }

        const normalizedLineDiscount = clampDiscountPercent(item.lineDiscountInput ?? item.lineDiscountPercent ?? 0);
        return {
          ...item,
          lineDiscountPercent: normalizedLineDiscount,
          lineDiscountInput: normalizedLineDiscount > 0 ? String(normalizedLineDiscount) : '',
        };
      }),
    );
  };

  useLayoutEffect(() => {
    if (productListRef.current) {
      productListRef.current.scrollTop = lastProductScrollRef.current;
    }
  }, [cart]);

  const cartOverflowMessage = React.useMemo(() => {
    const overflowCartItem = cart.find((item) => {
      const currentProduct = products.find((product) => product.id === item.id);
      return !currentProduct || Number(item.quantity || 0) > Number(currentProduct.stock || 0);
    });

    return overflowCartItem ? getCartOverflowMessage(overflowCartItem) : null;
  }, [cart, products]);

  const getDiscountedUnitPrice = (item: CartItem) => {
    const sellingPrice = Number(item.sellingPrice || 0);
    const itemDiscount = clampDiscountPercent(item.lineDiscountPercent || 0);
    const unitPriceAfterDiscount = sellingPrice * (1 - itemDiscount / 100);
    return ceilMoney(unitPriceAfterDiscount);
  };
  const getLineTotal = (item: CartItem) => roundMoney(Number(item.quantity || 0) * getDiscountedUnitPrice(item));
  const getLineSubtotal = (item: CartItem) => roundMoney(Number(item.sellingPrice || 0) * Number(item.quantity || 0));
  const getLineDiscountAmount = (item: CartItem) => roundMoney(getLineSubtotal(item) - getLineTotal(item));

  const subtotal = normalizeMoneyValue(roundMoney(cart.reduce((sum, item) => sum + getLineSubtotal(item), 0)));
  const lineDiscountAmount = normalizeMoneyValue(
    Math.max(0, roundMoney(cart.reduce((sum, item) => sum + getLineDiscountAmount(item), 0))),
  );
  const subtotalAfterLineDiscount = normalizeMoneyValue(Math.max(0, roundMoney(subtotal - lineDiscountAmount)));
  const normalizedDiscount = Math.max(0, discount);
  const invoiceDiscountAmount = normalizeMoneyValue(
    Math.max(0, roundMoney(subtotalAfterLineDiscount * (normalizedDiscount / 100))),
  );
  const total = normalizeMoneyValue(Math.max(0, roundMoney(subtotalAfterLineDiscount - invoiceDiscountAmount)));
  const paid = parseFloat(paidAmount) || 0;
  const balance = paid - total;
  const cartWeightSummary = React.useMemo(
    () =>
      cart.reduce(
        (summary, item) => {
          const unitWeightKg = getProductUnitWeightKg(item);

          if (unitWeightKg <= 0) {
            return {
              ...summary,
              missingWeightItems: summary.missingWeightItems + 1,
            };
          }

          return {
            ...summary,
            totalWeightKg: summary.totalWeightKg + unitWeightKg * Math.max(0, Number(item.quantity || 0)),
          };
        },
        { totalWeightKg: 0, missingWeightItems: 0 },
      ),
    [cart],
  );

  const handleCheckout = async () => {
    if (paid > total + 0.01) {
      toast.error(`Сумма оплаты не может превышать сумму накладной (${toFixedNumber(total)})`);
      return;
    }

    if (!customerId) {
      toast.error('Сначала выберите клиента');
      return;
    }
    if (!warehouseId) {
      toast.error('Выберите склад');
      return;
    }

    const selectedWarehouseId = Number(warehouseId);
    const invalidCartItem = cart.find((item) => {
      const currentProduct = products.find((product) => product.id === item.id);
      return !currentProduct || Number(currentProduct.warehouseId) !== selectedWarehouseId;
    });

    if (invalidCartItem) {
      toast.error('В корзине есть товар не из выбранного склада. Очистите корзину или выберите правильный склад.');
      return;
    }

    const overflowCartItem = cart.find((item) => {
      const currentProduct = products.find((product) => product.id === item.id);
      return !currentProduct || Number(item.quantity || 0) > Number(currentProduct.stock || 0);
    });

    if (overflowCartItem) {
      toast.error(getCartOverflowMessage(overflowCartItem));
      return;
    }

    setIsSubmitting(true);
    try {


      const checkoutPayload = {
        customerId,
        warehouseId: Number(warehouseId),
        items: cart.map((item) => ({
          productId: item.id,
          quantity: Number(item.quantity),
          totalBaseUnits: Number(item.quantity),
          packageQuantity: item.selectedPackagingId ? Number(item.packageQuantity) : 0,
          extraUnitQuantity: Number(item.extraUnitQuantity || 0),
          packagingId: item.selectedPackagingId || null,
          packageName: getCartPackaging(item)?.packageName || null,
          baseUnitName: item.baseUnitName,
          unitsPerPackage: getCartPackaging(item)?.unitsPerPackage || null,
          sellingPrice: Number(item.sellingPrice || 0),
          discount: Number(item.lineDiscountPercent || 0),
        })),
        discount: Number(normalizedDiscount),
        paidAmount: paid,
      };

      if (isCustomerPortal) {
        await createCustomerOrder(checkoutPayload);
      } else {
        await createInvoice({
          ...checkoutPayload,
          paidAmount: paid,
          paymentMethod,
        });
      }

      toast.success(isCustomerPortal ? 'Заказ отправлен на проверку' : 'Продажа оформлена');
      setCart([]);
      sessionStorage.removeItem(cartStorageKey);
      sessionStorage.removeItem(pendingCartStorageKey);
      setPaidAmount('');
      setCustomerId(isCustomerPortal ? userCustomerId : null);
      setDiscount(0);
      if (!isCustomerPortal) {
        navigate('/sales', { state: { warehouseId: String(warehouseId) } });
      }
    } catch (err: any) {
      const message = err.response?.data?.error || err.message || 'Ошибка при создании продажи';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProducts = products.filter((product) => {
    if (warehouseId && Number(product.warehouseId) !== Number(warehouseId)) {
      return false;
    }

    if (Math.max(0, Number(product.stock || 0)) <= 0) {
      return false;
    }

    if (cart.some((item) => Number(item.id) === Number(product.id))) {
      return false;
    }

    const query = deferredProductSearch.trim().toLowerCase();
    if (!query) return true;

    return [product.name, String(product.id)]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query));
  });

  const canAddProductFromList = (product: any) =>
    !(Number(product.stock || 0) <= 0 || (isAdmin && !warehouseId));

  const handleAddFromList = (product: any) => {
    if (!canAddProductFromList(product)) {
      return;
    }

    const currentIndex = filteredProducts.findIndex((entry) => Number(entry.id) === Number(product.id));
    const nextProduct =
      currentIndex >= 0
        ? filteredProducts[currentIndex + 1] || filteredProducts[currentIndex - 1] || null
        : null;

    addToCart(product);
    highlightProductRow(nextProduct ? Number(nextProduct.id) : null);
  };

  const filteredCustomers = [...customers]
    .map((customer) => {
      const query = deferredCustomerSearch.trim().toLowerCase();
      const name = String(customer.name || '').toLowerCase();
      const startsWith = query ? name.startsWith(query) : false;
      const includes = query ? name.includes(query) : true;
      const index = query ? name.indexOf(query) : 0;

      return {
        customer,
        visible: query ? includes : true,
        score: startsWith ? 0 : index >= 0 ? index + 1 : Number.MAX_SAFE_INTEGER,
      };
    })
    .filter((entry) => entry.visible)
    .sort((a, b) => a.score - b.score || String(a.customer.name || '').localeCompare(String(b.customer.name || ''), 'ru'))
    .map((entry) => entry.customer);

  return (
    <div className="h-screen w-full overflow-hidden bg-[#e9edf2] text-[#1f2933]">
        <ConfirmationModal
          isOpen={Boolean(pendingWarehouseId)}
          onClose={closeWarehouseConfirm}
          onConfirm={confirmWarehouseChange}
          title="Сменить склад?"
          message="При смене склада корзина, клиент и черновик продажи будут очищены. Подтвердите смену, если хотите начать продажу с другого склада."
          confirmText="Сменить склад"
          cancelText="Остаться здесь"
          type="warning"
        />

      <div className="flex h-full min-h-0 flex-col overflow-hidden border border-[#b7c2ce] bg-[#f3f5f7] shadow-sm lg:border-0">
        <div className="flex min-h-0 flex-1 flex-col gap-3 px-3 py-3 md:px-4 md:py-4">
          <div className="-mx-3 -mt-3 border-b border-[#b7c2ce] bg-[linear-gradient(180deg,#ffffff_0%,#dde5ee_100%)] px-4 py-3 md:-mx-4 md:-mt-4">
            <h1 className="text-xl font-semibold tracking-normal text-[#1f2933] sm:text-2xl">POS Терминал</h1>
            <p className="mt-0.5 text-xs text-[#5f6f7f]">Оформление продаж, выбор клиента и создание накладной.</p>
          </div>

          <div className="flex gap-2 rounded-md border border-[#b7c2ce] bg-[#eef3f8] px-2 py-2 lg:hidden">
            <button
              onClick={() => setActiveTab('products')}
              className={clsx(
                'flex-1 rounded px-3 py-2 text-xs font-semibold uppercase tracking-normal transition-colors',
                activeTab === 'products' ? posTheme.products.tab : 'border border-[#c8d2df] bg-white text-[#32465a]'
              )}
            >
              Товары
            </button>
            <button
              onClick={() => setActiveTab('cart')}
              className={clsx(
                'flex-1 rounded px-3 py-2 text-xs font-semibold uppercase tracking-normal transition-colors',
                activeTab === 'cart' ? posTheme.cart.tab : 'border border-[#c8d2df] bg-white text-[#32465a]'
              )}
            >
              Корзина {cart.length ? `(${cart.length})` : ''}
            </button>
          </div>

          <div
            className={clsx(
              'grid h-full min-h-0 flex-1 items-stretch gap-3 overflow-hidden',
              isCartExpanded ? 'lg:grid-cols-[minmax(0,1fr)]' : 'lg:grid-cols-[1.55fr_0.95fr]',
            )}
          >
            <section className={clsx(activeTab === 'products' ? 'block min-h-0 overflow-hidden lg:h-full' : 'hidden min-h-0 overflow-hidden lg:block lg:h-full', isCartExpanded && 'lg:hidden')}>
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
                        onClick={() => navigate('/sales')}
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
                    )})}
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
            </section>

            <aside className={clsx(activeTab === 'cart' ? 'block min-h-0 overflow-y-auto overscroll-contain lg:h-full lg:overflow-hidden' : 'hidden min-h-0 overflow-hidden lg:block lg:h-full')}>
              <div
                className={clsx(
                  'min-h-0 rounded-md border border-[#b7c2ce] bg-white shadow-sm lg:h-full',
                  isCartExpanded
                    ? 'flex flex-col overflow-hidden lg:grid lg:h-full lg:grid-cols-[minmax(0,1fr)_360px] lg:grid-rows-[auto_auto_minmax(0,1fr)] lg:border-b-0'
                    : 'flex flex-col overflow-visible lg:overflow-hidden',
                )}
              >
                <div className={clsx('flex items-center justify-between border-b border-[#b7c2ce] bg-[#fff7d6] px-4 py-2.5', isCartExpanded && 'lg:col-start-1 lg:row-start-1')}>
                  <div className={clsx(isCartExpanded && 'lg:hidden')}>
                    <h2 className="text-lg font-semibold text-[#1f2933]">Корзина</h2>
                    <p className="mt-1 text-xs text-slate-500">Выбрано позиций: {cart.length}</p>
                    <p className="mt-1 text-xs font-semibold text-emerald-700">
                      Масса/объем: {formatWeightKg(cartWeightSummary.totalWeightKg)}
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
                      <span className="text-xs font-semibold">{cart.length}</span>
                    </div>
                  </div>
                </div>

                <div className={clsx('order-2 space-y-2 border-b border-[#b7c2ce] bg-[#f7f9fb] px-3 py-2.5 md:px-4 lg:order-0', isCartExpanded && 'lg:col-start-1 lg:row-start-2')}>
                  <div className="rounded border border-[#c8a64a] bg-[#fff7d6] px-3 py-2 text-xs text-[#7a5a00] md:hidden">
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

                <div
                  className={clsx(
                    'order-1 px-3 md:px-4 lg:order-0',
                    isCartExpanded
                      ? 'min-h-0 overflow-y-visible overscroll-contain lg:col-start-1 lg:row-start-3 lg:h-full lg:max-h-full lg:overflow-y-auto'
                      : 'min-h-0 overflow-y-visible overscroll-contain lg:flex-1 lg:overflow-y-auto'
                  )}
                  style={!isCartExpanded ? { maxHeight: undefined } : undefined}
                >
                  <div className="sticky top-0 z-10 -mx-3 border-b border-[#d5dde6] bg-white px-3 py-2 text-xs font-semibold text-[#32465a] md:-mx-4 md:px-4 lg:hidden">
                    Товары в корзине: {cart.length}
                  </div>
                  {cart.map((item, index) => (
                    <div key={item.id} className="border-b border-[#d5dde6] py-2 last:border-b-0 even:bg-[#fbfcfd]">
                      {(() => {
                        const stockSummary = getCartStockSummary(item);
                        const itemLineSubtotal = getLineSubtotal(item);
                        const itemLineDiscount = getLineDiscountAmount(item);
                        const itemLineTotal = getLineTotal(item);
                        const itemWeightKg = getProductUnitWeightKg(item) * Math.max(0, Number(item.quantity || 0));

                        return (
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded border border-[#c8a64a] bg-[#fff7d6] text-xs font-semibold text-[#7a5a00]">
                          {index + 1}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p
                              className="wrap-break-word whitespace-normal text-[12px] font-semibold leading-4 text-[#1f2933]"
                              style={{ overflowWrap: 'anywhere' }}
                            >
                              {formatProductName(item.name)}
                            </p>
                            <span className="shrink-0 whitespace-nowrap text-[10px] leading-4 text-slate-400">
                              Доступно: {stockSummary.availableLabel}
                            </span>
                          </div>

                          <div className="mt-3 space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 border-t border-[#d5dde6] pt-2">
                                <p className="text-[10px] font-medium text-slate-500">
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
                                    <option value="">{'\u0422\u043e\u043b\u044c\u043a\u043e'} {item.baseUnitName}</option>
                                    {(Array.isArray(item.packagings) ? item.packagings : []).map((packaging) => (
                                      <option key={packaging.id} value={packaging.id}>
                                        {packaging.packageName} = {packaging.unitsPerPackage} {item.baseUnitName}
                                      </option>
                                    ))}
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
                                    placeholder={'\u0423\u043f\u0430\u043a.'}
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
                                    placeholder={`+ ${item.baseUnitName}`}
                                    title="Дополнительное количество поштучно"
                                    className="h-9 w-full rounded border border-[#9fb7d5] bg-white px-2 text-center text-xs text-[#1f2933] outline-none transition-colors focus:border-[#4f7fb8]"
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
                                <div className="grid gap-2 md:grid-cols-[minmax(0,1.2fr)_88px_96px]">
                                  <select
                                    value={item.selectedPackagingId || ''}
                                    onChange={(e) => updateSelectedPackaging(item.id, e.target.value)}
                                    className="rounded border border-[#9fb7d5] bg-white px-2 py-1.5 text-xs text-[#1f2933] outline-none"
                                  >
                                    <option value="">{'\u0422\u043e\u043b\u044c\u043a\u043e'} {item.baseUnitName}</option>
                                    {(Array.isArray(item.packagings) ? item.packagings : []).map((packaging) => (
                                      <option key={packaging.id} value={packaging.id}>
                                        {packaging.packageName} x {packaging.unitsPerPackage}
                                      </option>
                                    ))}
                                  </select>

                                  <input
                                    type="number"
                                    min={0}
                                    value={item.packageQuantityInput ?? String(item.packageQuantity)}
                                    onChange={(e) => updatePackageQuantityInput(item.id, e.target.value)}
                                    onBlur={() => commitPackageQuantityInput(item.id)}
                                    disabled={!item.selectedPackagingId}
                                    placeholder={'\u0423\u043f\u0430\u043a.'}
                                    className="rounded border border-[#9fb7d5] bg-white px-2 py-1.5 text-center text-xs text-[#1f2933] outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                  />

                                  <input
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    value={item.extraUnitQuantityInput ?? String(item.extraUnitQuantity)}
                                    onChange={(e) => updateExtraUnitQuantityInput(item.id, e.target.value)}
                                    onBlur={() => commitExtraUnitQuantityInput(item.id)}
                                    placeholder={`+ ${item.baseUnitName}`}
                                    className="rounded border border-[#9fb7d5] bg-white px-2 py-1.5 text-center text-xs text-[#1f2933] outline-none"
                                  />
                                </div>

                                <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_140px]">
                                  <div className="rounded border border-[#d6c07a] bg-[#fff8dc] px-2 py-1.5 text-[10px] text-[#7a5a00]">
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
                                    className="rounded border border-[#d6c07a] bg-white px-2 py-1.5 text-center text-xs text-[#1f2933] outline-none"
                                  />
                                </div>
                              </>
                            )}

                            <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-500">
                              <span>
                                {item.selectedPackagingId
                                  ? `${getCartPackaging(item)?.packageName || '\u0423\u043f\u0430\u043a\u043e\u0432\u043a\u0430'}: ${item.packageQuantity}`
                                  : `\u041f\u043e\u0448\u0442\u0443\u0447\u043d\u043e: ${item.extraUnitQuantity}`}
                              </span>
                              <span>
                                {'\u0418\u0442\u043e\u0433\u043e'}: {item.quantity} {'\u0448\u0442'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                        );
                      })()}
                    </div>
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
                          <p className="mt-1 text-xs text-slate-500">Выбрано позиций: {cart.length}</p>
                        </div>
                        <div className="flex items-center gap-2 rounded border border-[#c8a64a] bg-[#fff0b3] px-2.5 py-1.5 text-[#7a5a00]">
                          <ShoppingCart size={18} />
                          <span className="text-xs font-semibold">{cart.length}</span>
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
                    disabled={isSubmitting || cart.length === 0 || !customerId}
                    className="flex w-full items-center justify-center rounded border border-[#8f6f18] bg-[#ffd966] px-4 py-2.5 text-sm font-semibold text-[#2f2f2f] shadow-sm transition-colors hover:bg-[#ffc83d] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSubmitting ? 'Обработка...' : 'Оформить'}
                    {!isSubmitting && <ChevronRight className="ml-2" size={18} />}
                  </button>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}







