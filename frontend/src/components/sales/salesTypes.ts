export type EditInvoiceItem = {
  key: string;
  productId: number | '';
  productSearch: string;
  quantity: string;
  sellingPrice: string;
  unit: string;
  baseUnitName: string;
  packagings: Array<{
    id: number;
    packageName: string;
    baseUnitName: string;
    unitsPerPackage: number;
    isDefault?: boolean;
  }>;
  selectedPackagingId: number | '';
  packageQuantityInput: string;
  extraUnitQuantityInput: string;
  discount: string;
  isNew?: boolean;
};

export type EditProductOption = {
  id: number;
  name: string;
  rawName?: string | null;
  sellingPrice?: number | string | null;
  baseUnitName?: string | null;
  unit?: string | null;
  packagings?: any[];
  stock?: number;
};

export type ReturnMode = 'package' | 'unit';

export type ReturnInvoiceItem = any & {
  returnQty: string;
  returnMode: ReturnMode;
};
