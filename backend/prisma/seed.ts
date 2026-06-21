import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import prisma from '../src/db/prisma.js';

dotenv.config();

type SeedProduct = {
  name: string;
  category: string;
  brand?: string;
  unit: string;
  sellingPrice: number;
  stock: number;
  packaging?: {
    packageName: string;
    baseUnitName: string;
    unitsPerPackage: number;
    packageSellingPrice: number;
  };
};

const SEED_REASON = 'Initial 3Click catalog seed';

const normalizeNameKey = (value: string) =>
  String(value || '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/ё/gu, 'е')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/gu, '');

const catalog: SeedProduct[] = [
  {
    name: 'Прокладки Laila дневной',
    category: 'Гигиена',
    brand: 'Laila',
    unit: 'шт',
    sellingPrice: 9.8,
    stock: 0,
    packaging: { packageName: 'коробка', baseUnitName: 'шт', unitsPerPackage: 24, packageSellingPrice: 235.2 },
  },
  {
    name: 'Прокладки Laila ночной',
    category: 'Гигиена',
    brand: 'Laila',
    unit: 'шт',
    sellingPrice: 10.8,
    stock: 0,
    packaging: { packageName: 'коробка', baseUnitName: 'шт', unitsPerPackage: 24, packageSellingPrice: 259.2 },
  },
  {
    name: 'Стиральный порошок SKIF Автомат массой 1400гр',
    category: 'Стиральные порошки',
    brand: 'SKIF',
    unit: 'мешок',
    sellingPrice: 22,
    stock: 16,
  },
  {
    name: 'Стиральный порошок SKIF Автомат массой 2800гр',
    category: 'Стиральные порошки',
    brand: 'SKIF',
    unit: 'коробка',
    sellingPrice: 42,
    stock: 15,
  },
  {
    name: 'Стиральный порошок SKIF Автомат массой 800гр',
    category: 'Стиральные порошки',
    brand: 'SKIF',
    unit: 'шт',
    sellingPrice: 12,
    stock: 0,
  },
  {
    name: 'Стиральный порошок автомат жидкий SKIF в пластиковых ёмкостях, массой 1.5л',
    category: 'Стиральные порошки',
    brand: 'SKIF',
    unit: 'ёмкость',
    sellingPrice: 28.5,
    stock: 14 * 6,
    packaging: { packageName: 'коробка', baseUnitName: 'ёмкость', unitsPerPackage: 6, packageSellingPrice: 171 },
  },
  {
    name: 'Стиральный порошок автомат жидкий SKIF в пластиковых ёмкостях, массой 1л',
    category: 'Стиральные порошки',
    brand: 'SKIF',
    unit: 'ёмкость',
    sellingPrice: 21,
    stock: 8 * 6,
    packaging: { packageName: 'коробка', baseUnitName: 'ёмкость', unitsPerPackage: 6, packageSellingPrice: 126 },
  },
  {
    name: 'Стиральный порошок автомат жидкий SKIF в пластиковых ёмкостях, массой 3 литра',
    category: 'Стиральные порошки',
    brand: 'SKIF',
    unit: 'ёмкость',
    sellingPrice: 51,
    stock: 25 * 4 + 3,
    packaging: { packageName: 'коробка', baseUnitName: 'ёмкость', unitsPerPackage: 4, packageSellingPrice: 204 },
  },
  {
    name: 'Стиральный порошок автомат жидкий Мэй Фу в пластиковых ёмкостях, массой 1.5л',
    category: 'Стиральные порошки',
    brand: 'Мэй Фу',
    unit: 'ёмкость',
    sellingPrice: 28.5,
    stock: 13 * 6 + 3,
    packaging: { packageName: 'коробка', baseUnitName: 'ёмкость', unitsPerPackage: 6, packageSellingPrice: 171 },
  },
  {
    name: 'Стиральный порошок автомат жидкий Мэй Фу в пластиковых ёмкостях, массой 1л',
    category: 'Стиральные порошки',
    brand: 'Мэй Фу',
    unit: 'ёмкость',
    sellingPrice: 21,
    stock: 1 * 6,
    packaging: { packageName: 'коробка', baseUnitName: 'ёмкость', unitsPerPackage: 6, packageSellingPrice: 126 },
  },
  {
    name: 'Стиральный порошок автомат жидкий Мэй Фу в пластиковых ёмкостях, массой 3л',
    category: 'Стиральные порошки',
    brand: 'Мэй Фу',
    unit: 'ёмкость',
    sellingPrice: 51,
    stock: 11 * 4,
    packaging: { packageName: 'коробка', baseUnitName: 'ёмкость', unitsPerPackage: 4, packageSellingPrice: 204 },
  },
  {
    name: 'Стиральный порошок высшего сорта Мэй Фу автомат, массой 1500гр',
    category: 'Стиральные порошки',
    brand: 'Мэй Фу',
    unit: 'мешок',
    sellingPrice: 26,
    stock: 9,
  },
  {
    name: 'Стиральный порошок высшего сорта Мэй Фу автомат, массой 3000гр',
    category: 'Стиральные порошки',
    brand: 'Мэй Фу',
    unit: 'коробка',
    sellingPrice: 48,
    stock: 6,
  },
  {
    name: 'Стиральный порошок высшего сорта Мэй Фу автомат, массой 900гр',
    category: 'Стиральные порошки',
    brand: 'Мэй Фу',
    unit: 'мешок',
    sellingPrice: 16,
    stock: 3,
  },
  {
    name: 'Стиральный порошок для машин активаторного типа и ручной стирки SKIF массой 1800гр',
    category: 'Стиральные порошки',
    brand: 'SKIF',
    unit: 'мешок',
    sellingPrice: 22,
    stock: 108,
  },
  {
    name: 'Стиральный порошок для машин активаторного типа и ручной стирки SKIF массой 250 гр',
    category: 'Стиральные порошки',
    brand: 'SKIF',
    unit: 'шт',
    sellingPrice: 5,
    stock: 0,
  },
  {
    name: 'Стиральный порошок для машин активаторного типа и ручной стирки SKIF, массой 900гр',
    category: 'Стиральные порошки',
    brand: 'SKIF',
    unit: 'мешок',
    sellingPrice: 13,
    stock: 155,
  },
  {
    name: 'Стиральный порошок для ручной стирки высшего сорта Мэй Фу, массой 1800гр',
    category: 'Стиральные порошки',
    brand: 'Мэй Фу',
    unit: 'мешок',
    sellingPrice: 26,
    stock: 283,
  },
  {
    name: 'Стиральный порошок для ручной стирки высшего сорта Мэй Фу, массой 250гр',
    category: 'Стиральные порошки',
    brand: 'Мэй Фу',
    unit: 'мешок',
    sellingPrice: 5,
    stock: 22,
  },
  {
    name: 'Стиральный порошок для ручной стирки высшего сорта Мэй Фу, массой 3000гр',
    category: 'Стиральные порошки',
    brand: 'Мэй Фу',
    unit: 'коробка',
    sellingPrice: 46,
    stock: 95,
  },
  {
    name: 'Стиральный порошок для ручной стирки высшего сорта Мэй Фу, массой 300гр',
    category: 'Стиральные порошки',
    brand: 'Мэй Фу',
    unit: 'мешок',
    sellingPrice: 6,
    stock: 29,
  },
  {
    name: 'Стиральный порошок для ручной стирки высшего сорта Мэй Фу, массой 900гр',
    category: 'Стиральные порошки',
    brand: 'Мэй Фу',
    unit: 'мешок',
    sellingPrice: 15,
    stock: 488,
  },
  {
    name: 'Чистящее средство гель для мытья посуды SKIF в пластиковых ёмкостях, массой 180гр',
    category: 'Средства для мытья посуды',
    brand: 'SKIF',
    unit: 'ёмкость',
    sellingPrice: 5,
    stock: 41 * 36,
    packaging: { packageName: 'коробка', baseUnitName: 'ёмкость', unitsPerPackage: 36, packageSellingPrice: 180 },
  },
  {
    name: 'Чистящее средство гель для мытья посуды SKIF в пластиковых ёмкостях, массой 280гр',
    category: 'Средства для мытья посуды',
    brand: 'SKIF',
    unit: 'ёмкость',
    sellingPrice: 6,
    stock: 45 * 36,
    packaging: { packageName: 'коробка', baseUnitName: 'ёмкость', unitsPerPackage: 36, packageSellingPrice: 216 },
  },
  {
    name: 'Чистящее средство гель для мытья посуды SKIF в пластиковых ёмкостях, массой 450гр',
    category: 'Средства для мытья посуды',
    brand: 'SKIF',
    unit: 'ёмкость',
    sellingPrice: 9.8,
    stock: 27 * 18,
    packaging: { packageName: 'коробка', baseUnitName: 'ёмкость', unitsPerPackage: 18, packageSellingPrice: 176.4 },
  },
  {
    name: 'Чистящее средство гель для мытья посуды SKIF в пластиковых ёмкостях, массой 900гр',
    category: 'Средства для мытья посуды',
    brand: 'SKIF',
    unit: 'ёмкость',
    sellingPrice: 17,
    stock: 28 * 12 + 9,
    packaging: { packageName: 'коробка', baseUnitName: 'ёмкость', unitsPerPackage: 12, packageSellingPrice: 204 },
  },
  {
    name: 'Чистящее средство гель для мытья посуды Мэй Фу в пластиковых ёмкостях массой 1000гр',
    category: 'Средства для мытья посуды',
    brand: 'Мэй Фу',
    unit: 'ёмкость',
    sellingPrice: 19,
    stock: 13 * 12,
    packaging: { packageName: 'коробка', baseUnitName: 'ёмкость', unitsPerPackage: 12, packageSellingPrice: 228 },
  },
  {
    name: 'Чистящее средство гель для мытья посуды Мэй Фу в пластиковых ёмкостях массой 260гр',
    category: 'Средства для мытья посуды',
    brand: 'Мэй Фу',
    unit: 'ёмкость',
    sellingPrice: 6,
    stock: 25 * 36,
    packaging: { packageName: 'коробка', baseUnitName: 'ёмкость', unitsPerPackage: 36, packageSellingPrice: 216 },
  },
  {
    name: 'Чистящее средство гель для мытья посуды Мэй Фу в пластиковых ёмкостях массой 450гр',
    category: 'Средства для мытья посуды',
    brand: 'Мэй Фу',
    unit: 'ёмкость',
    sellingPrice: 9.8,
    stock: 16 * 18,
    packaging: { packageName: 'коробка', baseUnitName: 'ёмкость', unitsPerPackage: 18, packageSellingPrice: 176.4 },
  },
  {
    name: 'Чистящее средство гель для мытья посуды Мэй Фу в пластиковых ёмкостях массой 800гр',
    category: 'Средства для мытья посуды',
    brand: 'Мэй Фу',
    unit: 'ёмкость',
    sellingPrice: 15,
    stock: 28 * 12,
    packaging: { packageName: 'коробка', baseUnitName: 'ёмкость', unitsPerPackage: 12, packageSellingPrice: 180 },
  },
  {
    name: 'Чистящее средство гель для мытья посуды Мэй Фу в пластиковых ёмкостях массой 900гр',
    category: 'Средства для мытья посуды',
    brand: 'Мэй Фу',
    unit: 'ёмкость',
    sellingPrice: 17,
    stock: 31 * 12,
    packaging: { packageName: 'коробка', baseUnitName: 'ёмкость', unitsPerPackage: 12, packageSellingPrice: 204 },
  },
  {
    name: 'Чистящее средство гель для мытья посуды Мэй Фу в пластиковых ёмкостях, массой 180гр',
    category: 'Средства для мытья посуды',
    brand: 'Мэй Фу',
    unit: 'ёмкость',
    sellingPrice: 5,
    stock: 29 * 36,
    packaging: { packageName: 'коробка', baseUnitName: 'ёмкость', unitsPerPackage: 36, packageSellingPrice: 180 },
  },
  {
    name: 'Чистящее средство капля для мытья посуды SKIF в пластиковых флаконах, массой 1л',
    category: 'Средства для мытья посуды',
    brand: 'SKIF',
    unit: 'флакон',
    sellingPrice: 10.5,
    stock: 10 * 12,
    packaging: { packageName: 'коробка', baseUnitName: 'флакон', unitsPerPackage: 12, packageSellingPrice: 126 },
  },
  {
    name: 'Чистящее средство капля для мытья посуды Мэй Фу в пластиковых флаконах, массой 0.5л',
    category: 'Средства для мытья посуды',
    brand: 'Мэй Фу',
    unit: 'флакон',
    sellingPrice: 7,
    stock: 0,
    packaging: { packageName: 'коробка', baseUnitName: 'флакон', unitsPerPackage: 15, packageSellingPrice: 105 },
  },
  {
    name: 'Чистящие средство капля для мытья посуды SKIF в пластиковых флаконах, массой 0.5л',
    category: 'Средства для мытья посуды',
    brand: 'SKIF',
    unit: 'флакон',
    sellingPrice: 6.4,
    stock: 0,
    packaging: { packageName: 'коробка', baseUnitName: 'флакон', unitsPerPackage: 15, packageSellingPrice: 96 },
  },
];

async function ensureWarehouse() {
  const existing = await prisma.warehouse.findFirst({
    where: { name: 'Основной склад' },
    orderBy: { id: 'asc' },
  });

  if (existing) {
    return prisma.warehouse.update({
      where: { id: existing.id },
      data: { active: true, isDefault: true },
    });
  }

  return prisma.warehouse.create({
    data: {
      name: 'Основной склад',
      city: 'Душанбе',
      isDefault: true,
      active: true,
    },
  });
}

async function ensureAdmin() {
  const username = process.env.ADMIN_RESET_USERNAME || 'admin';
  const password = process.env.ADMIN_RESET_PASSWORD || 'Admin1234';
  const passwordHash = await bcrypt.hash(password, 10);

  return prisma.user.upsert({
    where: { username },
    update: {
      passwordHash,
      role: 'ADMIN',
      active: true,
      twoFactorEnabled: false,
      twoFactorSecret: null,
      twoFactorBackupCodes: [],
      canCancelInvoices: true,
      canDeleteData: true,
    },
    create: {
      username,
      passwordHash,
      role: 'ADMIN',
      active: true,
      canCancelInvoices: true,
      canDeleteData: true,
    },
  });
}

async function seedProduct(item: SeedProduct, warehouseId: number, userId: number) {
  const category = await prisma.category.upsert({
    where: { name: item.category },
    update: { active: true },
    create: { name: item.category, active: true },
  });

  const nameKey = normalizeNameKey(item.name);
  const existing = await prisma.product.findFirst({
    where: {
      warehouseId,
      nameKey,
    },
  });

  const productData = {
    categoryId: category.id,
    name: item.name,
    rawName: item.name,
    brand: item.brand || null,
    nameKey,
    unit: item.unit,
    baseUnitName: item.unit,
    purchaseCostPrice: 0,
    expensePercent: 0,
    costPrice: 0,
    sellingPrice: item.sellingPrice,
    minStock: 0,
    active: true,
    warehouseId,
  };

  const product = existing
    ? await prisma.product.update({
        where: { id: existing.id },
        data: productData,
      })
    : await prisma.product.create({
        data: {
          ...productData,
          initialStock: item.stock,
          totalIncoming: item.stock,
          stock: item.stock,
        },
      });

  await prisma.productPackaging.deleteMany({ where: { productId: product.id } });

  if (item.packaging) {
    await prisma.productPackaging.create({
      data: {
        productId: product.id,
        warehouseId,
        packageName: item.packaging.packageName,
        baseUnitName: item.packaging.baseUnitName,
        unitsPerPackage: item.packaging.unitsPerPackage,
        packageSellingPrice: item.packaging.packageSellingPrice,
        isDefault: true,
        sortOrder: 0,
      },
    });
  }

  const batchCount = await prisma.productBatch.count({ where: { productId: product.id } });
  if (batchCount === 0 && item.stock > 0) {
    await prisma.productBatch.create({
      data: {
        productId: product.id,
        warehouseId,
        quantity: item.stock,
        remainingQuantity: item.stock,
        purchaseCostPrice: 0,
        expensePercent: 0,
        costPrice: 0,
      },
    });

    await prisma.inventoryTransaction.create({
      data: {
        productId: product.id,
        warehouseId,
        userId,
        qtyChange: item.stock,
        type: 'incoming',
        reason: SEED_REASON,
        costAtTime: 0,
        sellingAtTime: item.sellingPrice,
      },
    });

    await prisma.product.update({
      where: { id: product.id },
      data: {
        initialStock: item.stock,
        totalIncoming: item.stock,
        stock: item.stock,
      },
    });
  }

  const priceHistoryCount = await prisma.priceHistory.count({ where: { productId: product.id } });
  if (priceHistoryCount === 0) {
    await prisma.priceHistory.create({
      data: {
        productId: product.id,
        costPrice: 0,
        sellingPrice: item.sellingPrice,
      },
    });
  }
}

async function main() {
  const [warehouse, admin] = await Promise.all([ensureWarehouse(), ensureAdmin()]);

  for (const item of catalog) {
    await seedProduct(item, warehouse.id, admin.id);
  }

  console.log(`Seeded ${catalog.length} products into warehouse "${warehouse.name}".`);
  console.log(`Admin login is ready: ${admin.username} / ${process.env.ADMIN_RESET_PASSWORD || 'Admin1234'}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
