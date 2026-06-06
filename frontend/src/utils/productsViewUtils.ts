import { roundMoney, toFixedNumber } from './format';
import {
  calculateEffectiveCost,
  calculateUnitCostFromLineTotal,
  calculateUnitCostFromPackage,
} from './money';

export const normalizeOcrProductName = (name: string) => {
  const trimmed = String(name || '').trim();
  const bracketIndex = trimmed.indexOf('(');
  const slashIndex = trimmed.indexOf('/');
  const cutIndex =
    bracketIndex >= 0 && slashIndex >= 0
      ? Math.min(bracketIndex, slashIndex)
      : bracketIndex >= 0
        ? bracketIndex
        : slashIndex;

  return (cutIndex >= 0 ? trimmed.slice(0, cutIndex) : trimmed)
    .replace(/[«»“”„‟"]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
};

const normalizeVolumeSpacing = (value: string) =>
  value
    .replace(/(\d)\s*[.,]\s*(\d)/gu, '$1.$2')
    .replace(/(\d)\s+(\d)(?=\s*(?:гр|г|кг|л|мл)\b)/giu, '$1.$2')
    .replace(/(\d(?:\.\d+)?)\s*(гр|г|кг|л|мл|шт)\b/giu, '$1 $2');

export const normalizeCatalogName = (name: string) =>
  normalizeVolumeSpacing(String(name || ''))
    .replace(/\s*\[[^\]]*\]\s*$/u, '')
    .replace(/[«»“”„‟"']/gu, '')
    .replace(/[(),]/gu, ' ')
    .replace(/[ёЁ]/g, 'е')
    .replace(/plasticковых/gi, 'пластиковых')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

export const normalizeProductFamilyName = (name: string) =>
  normalizeCatalogName(name)
    .replace(/\bмассой\s+\d+(?:\.\d+)?\s*(?:гр|г|кг|л|мл|шт)\b/giu, ' ')
    .replace(/\b\d+(?:\.\d+)?\s*(?:гр|г|кг|л|мл|шт)\b/giu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const extractMassKey = (name: string) => {
  const match = normalizeVolumeSpacing(String(name || '').toLowerCase()).match(/(\d+(?:\.\d+)?)\s*(гр|г|кг|л|мл|шт)\b/u);
  return match ? `${match[1]} ${match[2]}` : '';
};

export const detectCategoryName = (name: string) => {
  const normalized = String(name || '').toLowerCase().replace(/[ё]/g, 'е');

  if (normalized.includes('порошок') && normalized.includes('автомат')) return 'Стиральные порошки';
  if (normalized.includes('порошок')) return 'Стиральные средства';
  if (normalized.includes('жидк') && normalized.includes('стира')) return 'Жидкие средства для стирки';
  if (normalized.includes('гель') && normalized.includes('посуд')) return 'Гели для посуды';
  if (normalized.includes('капля') && normalized.includes('посуд')) return 'Средства для мытья посуды';
  if (normalized.includes('посуд')) return 'Средства для мытья посуды';
  if (normalized.includes('чистящее средство')) return 'Чистящие средства';

  const words = String(name || '').trim().split(/\s+/).filter(Boolean);
  return words.slice(0, 2).join(' ');
};

export const normalizeOcrBaseUnit = (value: string) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return 'шт';
  if (['шт', 'штук', 'штука', 'штуки', 'pcs', 'piece', 'pieces'].includes(normalized)) return 'шт';
  if (['пачка', 'пачки', 'пачек'].includes(normalized)) return 'пачка';
  if (['флакон', 'флакона', 'флаконов'].includes(normalized)) return 'флакон';
  if (['емкость', 'ёмкость', 'емкости', 'ёмкости', 'емкостей', 'ёмкостей'].includes(normalized)) return 'ёмкость';
  if (['бутылка', 'бутылки', 'бутылок'].includes(normalized)) return 'бутылка';
  return normalized;
};

export const normalizeOcrPackageName = (value: string) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return '';
  if (['мешок', 'мешка', 'мешков', 'bag'].includes(normalized)) return 'мешок';
  if (['коробка', 'коробки', 'коробок', 'box'].includes(normalized)) return 'коробка';
  if (['упаковка', 'упаковки', 'упаковок', 'pack'].includes(normalized)) return 'упаковка';
  if (['пачка', 'пачки', 'пачек'].includes(normalized)) return 'пачка';
  return normalized;
};

export const normalizeDisplayBaseUnit = (value: string) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return 'шт';
  if (['пачка', 'пачки', 'пачек', 'шт', 'штук', 'штука', 'штуки', 'pcs', 'piece', 'pieces'].includes(normalized)) {
    return 'шт';
  }
  return normalized;
};

export const formatPriceInput = (value: unknown): string => {
  if (value === '' || value === null || value === undefined) {
    return '';
  }

  const numeric = Number(value);
  return Number.isFinite(numeric) ? String(toFixedNumber(numeric)) : '';
};

export type PackagingOption = {
  id: number;
  packageName: string;
  baseUnitName: string;
  unitsPerPackage: number;
  isDefault?: boolean;
};

export type ProductFormData = {
  name: string;
  unit: string;
  baseUnitName: string;
  packagingEnabled: boolean;
  packageName: string;
  unitsPerPackage: string;
  categoryId: string;
  warehouseId: string;
  costPrice: string;
  expensePercent: string;
  sellingPrice: string;
  minStock: string;
  initialStock: string;
  photoUrl: string;
};

export const createEmptyProductForm = (): ProductFormData => ({
  name: '',
  unit: 'шт',
  baseUnitName: 'шт',
  packagingEnabled: true,
  packageName: 'коробка',
  unitsPerPackage: '',
  categoryId: '',
  warehouseId: '',
  costPrice: '',
  expensePercent: '0',
  sellingPrice: '',
  minStock: '0',
  initialStock: '0',
  photoUrl: ''
});

export const normalizePackagings = (product: any): PackagingOption[] =>
  Array.isArray(product?.packagings)
    ? product.packagings
      .map((entry: any) => ({
        id: Number(entry.id),
        packageName: String(entry.packageName || '').trim(),
        baseUnitName: String(entry.baseUnitName || product?.unit || 'шт').trim() || 'шт',
        unitsPerPackage: Number(entry.unitsPerPackage || 0),
        isDefault: Boolean(entry.isDefault),
      }))
      .filter((entry: PackagingOption) => entry.id > 0 && entry.packageName && entry.unitsPerPackage > 0)
    : [];

export const getDefaultPackaging = (packagings: PackagingOption[]) =>
  packagings.find((entry) => entry.isDefault) || packagings[0] || null;

export const buildProductFormData = (product?: any): ProductFormData => {
  if (!product) {
    return createEmptyProductForm();
  }

  const defaultPackaging = getDefaultPackaging(normalizePackagings(product));
  const baseUnitName = normalizeOcrBaseUnit(product.baseUnitName || product.unit || 'шт');
  const unitsPerPackage = Number(defaultPackaging?.unitsPerPackage || 0);

  return {
    name: product.name || '',
    unit: baseUnitName,
    baseUnitName,
    packagingEnabled: unitsPerPackage > 0,
    packageName: normalizeOcrPackageName(defaultPackaging?.packageName || 'коробка') || 'коробка',
    unitsPerPackage: unitsPerPackage > 0 ? String(unitsPerPackage) : '',
    categoryId: product.categoryId?.toString() || '',
    warehouseId: product.warehouseId?.toString() || '',
    costPrice: formatPriceInput(product.purchaseCostPrice ?? product.costPrice),
    expensePercent: String(product.expensePercent ?? 0),
    sellingPrice: formatPriceInput(product.sellingPrice),
    minStock: product.minStock?.toString() || '0',
    initialStock: product.initialStock?.toString() || '0',
    photoUrl: product.photoUrl || ''
  };
};

export const buildProductSubmitPayload = (formData: ProductFormData, categoryId: number) => {
  const baseUnitName = normalizeOcrBaseUnit(formData.baseUnitName || formData.unit || 'шт');
  const unitsPerPackage = Number(formData.unitsPerPackage || 0);
  const packagingEnabled = formData.packagingEnabled && unitsPerPackage > 0;

  return {
    name: formData.name,
    unit: baseUnitName,
    baseUnitName,
    categoryId,
    warehouseId: Number(formData.warehouseId),
    costPrice: roundMoney(formData.costPrice),
    purchaseCostPrice: roundMoney(formData.costPrice),
    expensePercent: parseFloat(formData.expensePercent || '0'),
    sellingPrice: roundMoney(formData.sellingPrice),
    minStock: parseFloat(formData.minStock),
    initialStock: parseFloat(formData.initialStock),
    photoUrl: formData.photoUrl,
    packaging: packagingEnabled
      ? {
        packageName: normalizeOcrPackageName(formData.packageName || 'коробка'),
        baseUnitName,
        unitsPerPackage,
        isDefault: true,
      }
      : null,
  };
};

export const getPreferredPackaging = (product: any) => {
  const packagings = Array.isArray(product?.packagings) ? product.packagings : [];
  return (
    packagings.find((packaging: any) => packaging?.isDefault && Number(packaging?.unitsPerPackage || 0) > 1) ||
    packagings.find((packaging: any) => Number(packaging?.unitsPerPackage || 0) > 1) ||
    null
  );
};

const pluralizeRu = (count: number, forms: [string, string, string]) => {
  const abs = Math.abs(count) % 100;
  const last = abs % 10;

  if (abs > 10 && abs < 20) return forms[2];
  if (last > 1 && last < 5) return forms[1];
  if (last === 1) return forms[0];
  return forms[2];
};

export const formatCountWithUnit = (count: number, unit: string) => {
  const normalized = String(unit || '').trim().toLowerCase();
  const formsMap: Record<string, [string, string, string]> = {
    'шт': ['шт', 'шт', 'шт'],
    'штука': ['штука', 'штуки', 'штук'],
    'пачка': ['пачка', 'пачки', 'пачек'],
    'мешок': ['мешок', 'мешка', 'мешков'],
    'коробка': ['коробка', 'коробки', 'коробок'],
    'упаковка': ['упаковка', 'упаковки', 'упаковок'],
    'флакон': ['флакон', 'флакона', 'флаконов'],
    'ёмкость': ['ёмкость', 'ёмкости', 'ёмкостей'],
    'емкость': ['ёмкость', 'ёмкости', 'ёмкостей'],
    'бутылка': ['бутылка', 'бутылки', 'бутылок'],
  };

  const forms = formsMap[normalized] || [unit, unit, unit];
  return `${count} ${pluralizeRu(count, forms)}`;
};

export const getStockBreakdown = (product: any) => {
  const totalUnits = Number(product?.stock || 0);
  const preferredPackaging = getPreferredPackaging(product);
  const unitsPerPackage = Number(preferredPackaging?.unitsPerPackage || 0);
  const packageName = preferredPackaging?.packageName || preferredPackaging?.name || '';
  const displayBaseUnit = normalizeDisplayBaseUnit(product?.unit || 'шт');

  if (!preferredPackaging || unitsPerPackage <= 1 || totalUnits <= 0) {
    return {
      primary: formatCountWithUnit(totalUnits, displayBaseUnit),
      secondary: null,
    };
  }

  const packageCount = Math.floor(totalUnits / unitsPerPackage);
  const remainderUnits = totalUnits % unitsPerPackage;
  const piecesLabel = displayBaseUnit;
  const normalizedPackageName = normalizeOcrPackageName(packageName || 'упаковка');

  return {
    primary:
      remainderUnits > 0
        ? `${formatCountWithUnit(packageCount, normalizedPackageName)}\n${formatCountWithUnit(remainderUnits, piecesLabel)}`
        : formatCountWithUnit(packageCount, normalizedPackageName),
    secondary: `${formatCountWithUnit(totalUnits, piecesLabel)} всего`,
  };
};

const getStockSortMetrics = (product: any) => {
  const totalUnits = Number(product?.stock || 0);
  const preferredPackaging = getPreferredPackaging(product);
  const unitsPerPackage = Number(preferredPackaging?.unitsPerPackage || 0);

  if (!preferredPackaging || unitsPerPackage <= 1) {
    return {
      packageCount: totalUnits,
      remainderUnits: 0,
      totalUnits,
    };
  }

  return {
    packageCount: Math.floor(totalUnits / unitsPerPackage),
    remainderUnits: totalUnits % unitsPerPackage,
    totalUnits,
  };
};

export const getProductEfficiencyMetrics = (product: any) => {
  const costPrice = Number(product?.costPrice || 0);
  const sellingPrice = Number(product?.sellingPrice || 0);
  const profitPerUnit = sellingPrice - costPrice;
  const marginPercent = sellingPrice > 0 ? (profitPerUnit / sellingPrice) * 100 : 0;

  let label = 'Слабая';
  let className = 'bg-rose-50 text-rose-700 border-rose-100';

  if (marginPercent >= 25) {
    label = 'Высокая';
    className = 'bg-emerald-50 text-emerald-700 border-emerald-100';
  } else if (marginPercent >= 12) {
    label = 'Нормальная';
    className = 'bg-amber-50 text-amber-700 border-amber-100';
  }

  return {
    profitPerUnit,
    marginPercent,
    label,
    className,
  };
};

const compareValues = (aValue: any, bValue: any, direction: 'asc' | 'desc') => {
  if (aValue < bValue) return direction === 'asc' ? -1 : 1;
  if (aValue > bValue) return direction === 'asc' ? 1 : -1;
  return 0;
};

export const compareProductsBySort = (a: any, b: any, sortConfig: { key: string; direction: 'asc' | 'desc' | null }) => {
  if (!sortConfig.direction) return 0;
  const numericSortKeys = new Set(['costPrice', 'sellingPrice', 'stock', 'totalIncoming', 'minStock', 'initialStock']);

  if (sortConfig.key === 'stock') {
    const aStock = getStockSortMetrics(a);
    const bStock = getStockSortMetrics(b);

    return (
      compareValues(aStock.packageCount, bStock.packageCount, sortConfig.direction) ||
      compareValues(aStock.remainderUnits, bStock.remainderUnits, sortConfig.direction) ||
      compareValues(aStock.totalUnits, bStock.totalUnits, sortConfig.direction)
    );
  }

  const aValue = numericSortKeys.has(sortConfig.key) ? Number(a[sortConfig.key] || 0) : a[sortConfig.key];
  const bValue = numericSortKeys.has(sortConfig.key) ? Number(b[sortConfig.key] || 0) : b[sortConfig.key];
  return compareValues(aValue, bValue, sortConfig.direction);
};

export const getOcrResolvedQuantity = (item: any) => {
  const packageCount = Number(item?.packageCount || 0);
  const unitsPerPackage = Number(item?.unitsPerPackage || 0);
  const fallbackQuantity = Number(item?.quantity || 0);

  if (packageCount > 0 && unitsPerPackage > 0) {
    return packageCount * unitsPerPackage;
  }

  return fallbackQuantity;
};

export const buildOcrScanItems = (data: any) => {
  const rawItems = Array.isArray(data)
    ? data
    : Array.isArray(data?.items)
      ? data.items
      : [];

  return rawItems
    .map((item: any, index: number) => ({
      enabled: true,
      lineIndex: Number(item.lineIndex || index + 1),
      rawName: String(item.rawName || item.name || '').trim(),
      name: normalizeOcrProductName(item.name || item.rawName || ''),
      brand: String(item.brand || '').trim(),
      packageName: normalizeOcrPackageName(item.packageName || ''),
      baseUnitName: normalizeOcrBaseUnit(item.baseUnitName || item.unit || 'шт'),
      packageCount: Number(item.packageCount || 0),
      unitsPerPackage: Number(item.unitsPerPackage || 0),
      quantity: Number(
        item.quantity ||
        (Number(item.packageCount || 0) > 0 && Number(item.unitsPerPackage || 0) > 0
          ? Number(item.packageCount || 0) * Number(item.unitsPerPackage || 0)
          : 0),
      ),
      price: Number(item.price || 0),
      rawQuantity: item.rawQuantity || '',
      unit: normalizeOcrBaseUnit(item.baseUnitName || item.unit || 'шт'),
      lineTotal: Number(item.lineTotal || 0),
      note: item.note || '',
      sellingPrice: item.sellingPrice || '',
      expensePercent: Number(item.expensePercent || 0),
    }))
    .filter((item: any) => item.rawName || item.name)
    .sort((a: any, b: any) => a.lineIndex - b.lineIndex);
};

export const buildOcrImportRows = (ocrResults: any[], rate: number, sharedExpensePercent: number) => {
  const invalidRows: Array<{ lineIndex: number; reason: string }> = [];

  const importRows = ocrResults
    .map((item) => {
      if (item.enabled === false) {
        return null;
      }

      const lineIndex = Number(item.lineIndex || 0);
      const validationReason = getOcrProblemReason(item, rate, sharedExpensePercent);
      const normalizedName = normalizeOcrProductName(item.name || '');
      const rawName = String(item.rawName || item.name || '').trim();
      const brand = String(item.brand || '').trim();
      const packageName = normalizeOcrPackageName(item.packageName || '');
      const baseUnitName = normalizeOcrBaseUnit(item.baseUnitName || item.unit || 'шт');
      const packageCount = Number(item.packageCount || 0);
      const unitsPerPackage = Number(item.unitsPerPackage || 0);
      const normalizedQuantity = Number(item.quantity || 0);
      const quantity =
        packageCount > 0 && unitsPerPackage > 0
          ? packageCount * unitsPerPackage
          : normalizedQuantity;
      const price = Number(item.price || 0);
      const lineTotal = Number(item.lineTotal || 0);
      const sellingPrice = item.sellingPrice ? Number(item.sellingPrice) : 0;
      const expensePercent = sharedExpensePercent;
      const costPricePerPieceTJS =
        lineTotal > 0 && quantity > 0
          ? calculateUnitCostFromLineTotal(lineTotal * rate, quantity)
          : unitsPerPackage > 0
            ? calculateUnitCostFromPackage(price * rate, unitsPerPackage)
            : calculateUnitCostFromLineTotal(price * rate, quantity);
      const effectiveCostPricePerPieceTJS = calculateEffectiveCost(costPricePerPieceTJS, expensePercent);

      if (validationReason) {
        invalidRows.push({
          lineIndex,
          reason: validationReason,
        });
        return null;
      }

      return {
        lineIndex,
        name: normalizedName,
        rawName,
        brand,
        packageName,
        baseUnitName,
        packageCount,
        unitsPerPackage,
        quantity,
        price,
        lineTotal,
        expensePercent,
        costPricePerPieceTJS,
        effectiveCostPricePerPieceTJS,
        sellingPrice,
        rawQuantity: String(item.rawQuantity || '').trim(),
        note: String(item.note || '').trim(),
      };
    })
    .filter(Boolean)
    .sort((a: any, b: any) => a.lineIndex - b.lineIndex) as Array<{
      lineIndex: number;
      name: string;
      rawName: string;
      brand: string;
      packageName: string;
      baseUnitName: string;
      packageCount: number;
      unitsPerPackage: number;
      quantity: number;
      price: number;
      lineTotal: number;
      expensePercent: number;
      costPricePerPieceTJS: number;
      effectiveCostPricePerPieceTJS: number;
      sellingPrice: number;
      rawQuantity: string;
      note: string;
    }>;

  return {
    invalidRows: invalidRows.sort((a, b) => a.lineIndex - b.lineIndex),
    importRows,
  };
};

export const buildOcrImportResult = (responseData: any, importRows: Array<{ lineIndex: number }>, ocrResults: any[]) => {
  const importedCount = Number(responseData?.importedCount || 0);

  const importedLineIndexes = new Set(
    Array.isArray(responseData?.importedLineIndexes)
      ? responseData.importedLineIndexes.map((value: unknown) => Number(value)).filter((value: number) => value > 0)
      : importRows.slice(0, importedCount).map((item) => item.lineIndex),
  );

  const failedItems = Array.isArray(responseData?.failedItems) ? responseData.failedItems : [];
  const failedPairs = failedItems
    .map((entry: any): [number, string] => [Number(entry?.lineIndex || 0), String(entry?.reason || '').trim()])
    .filter((entry: [number, string]): entry is [number, string] => entry[0] > 0 && Boolean(entry[1]));
  const failedByLineIndex = new Map<number, string>(failedPairs);

  const remainingRows = ocrResults
    .filter((item) => {
      if (item.enabled === false) {
        return true;
      }

      return !importedLineIndexes.has(Number(item.lineIndex || 0));
    })
    .map((item) => ({
      ...item,
      serverError: failedByLineIndex.get(Number(item.lineIndex || 0)) || '',
    }));

  const firstFailedLineIndex = Array.from(failedByLineIndex.keys()).sort((a, b) => a - b)[0] || 0;

  return {
    importedCount,
    failedByLineIndex,
    remainingRows,
    firstFailedLineIndex,
  };
};

export const getOcrValidationReason = (item: any, rateValue: unknown, expensePercentValue: unknown) => {
  const rate = Number(rateValue || 0);
  const expensePercent = Math.max(0, Number(expensePercentValue || 0));
  const normalizedName = normalizeOcrProductName(item?.name || '');
  const quantity = getOcrResolvedQuantity(item);
  const price = Number(item?.price || 0);
  const lineTotal = Number(item?.lineTotal || 0);
  const unitsPerPackage = Number(item?.unitsPerPackage || 0);

  if (!normalizedName) {
    return 'Укажите или исправьте название товара';
  }

  if (!Number.isFinite(quantity) || quantity <= 0) {
    return 'Проверьте количество';
  }

  if (!Number.isFinite(price) || price < 0) {
    return 'Проверьте цену закупки';
  }

  const baseCostPerPiece =
    lineTotal > 0 && quantity > 0
      ? calculateUnitCostFromLineTotal(lineTotal * rate, quantity)
      : unitsPerPackage > 0
        ? calculateUnitCostFromPackage(price * rate, unitsPerPackage)
        : calculateUnitCostFromLineTotal(price * rate, quantity);

  if (!Number.isFinite(baseCostPerPiece) || baseCostPerPiece < 0) {
    return 'Не удалось посчитать закупку за 1 шт';
  }

  const effectiveCostPerPiece = calculateEffectiveCost(baseCostPerPiece, expensePercent);

  if (!Number.isFinite(effectiveCostPerPiece) || effectiveCostPerPiece < 0) {
    return 'Не удалось посчитать итоговую закупку';
  }

  return null;
};

export const getOcrProblemReason = (item: any, rateValue: unknown, expensePercentValue: unknown) => {
  const serverError = String(item?.serverError || '').trim();
  if (serverError) {
    return serverError;
  }

  return getOcrValidationReason(item, rateValue, expensePercentValue);
};
