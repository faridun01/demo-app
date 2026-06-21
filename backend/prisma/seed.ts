import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import prisma from '../src/db/prisma.js';

dotenv.config();

type SeedProduct = {
  name: string;
  category: string;
  brand?: string;
  unit: string;
  boxUnits?: number;
};

const OLD_SEED_REASON = 'Initial 3Click catalog seed';

const normalizeNameKey = (value: string) =>
  String(value || '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/ё/gu, 'е')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/gu, '');

const catalog: SeedProduct[] = [
  { name: 'Прокладки Laila дневной', category: 'Гигиена', brand: 'Laila', unit: 'шт', boxUnits: 24 },
  { name: 'Прокладки Laila ночной', category: 'Гигиена', brand: 'Laila', unit: 'шт', boxUnits: 24 },
  { name: 'Стиральный порошок SKIF Автомат массой 1400гр', category: 'Стиральные порошки', brand: 'SKIF', unit: 'шт', boxUnits: 8 },
  { name: 'Стиральный порошок SKIF Автомат массой 2800гр', category: 'Стиральные порошки', brand: 'SKIF', unit: 'шт', boxUnits: 4 },
  { name: 'Стиральный порошок SKIF Автомат массой 800гр', category: 'Стиральные порошки', brand: 'SKIF', unit: 'шт', boxUnits: 12 },
  { name: 'Стиральный порошок автомат жидкий SKIF в пластиковых ёмкостях, массой 1.5л', category: 'Стиральные порошки', brand: 'SKIF', unit: 'ёмкость', boxUnits: 6 },
  { name: 'Стиральный порошок автомат жидкий SKIF в пластиковых ёмкостях, массой 1л', category: 'Стиральные порошки', brand: 'SKIF', unit: 'ёмкость', boxUnits: 6 },
  { name: 'Стиральный порошок автомат жидкий SKIF в пластиковых ёмкостях, массой 3 литра', category: 'Стиральные порошки', brand: 'SKIF', unit: 'ёмкость', boxUnits: 4 },
  { name: 'Стиральный порошок автомат жидкий Мэй Фу в пластиковых ёмкостях, массой 1.5л', category: 'Стиральные порошки', brand: 'Мэй Фу', unit: 'ёмкость', boxUnits: 6 },
  { name: 'Стиральный порошок автомат жидкий Мэй Фу в пластиковых ёмкостях, массой 1л', category: 'Стиральные порошки', brand: 'Мэй Фу', unit: 'ёмкость', boxUnits: 6 },
  { name: 'Стиральный порошок автомат жидкий Мэй Фу в пластиковых ёмкостях, массой 3л', category: 'Стиральные порошки', brand: 'Мэй Фу', unit: 'ёмкость', boxUnits: 4 },
  { name: 'Стиральный порошок высшего сорта Мэй Фу автомат, массой 1500гр', category: 'Стиральные порошки', brand: 'Мэй Фу', unit: 'шт', boxUnits: 6 },
  { name: 'Стиральный порошок высшего сорта Мэй Фу автомат, массой 3000гр', category: 'Стиральные порошки', brand: 'Мэй Фу', unit: 'шт', boxUnits: 4 },
  { name: 'Стиральный порошок высшего сорта Мэй Фу автомат, массой 900гр', category: 'Стиральные порошки', brand: 'Мэй Фу', unit: 'шт', boxUnits: 10 },
  { name: 'Стиральный порошок для машин активаторного типа и ручной стирки SKIF массой 1800гр', category: 'Стиральные порошки', brand: 'SKIF', unit: 'шт', boxUnits: 6 },
  { name: 'Стиральный порошок для машин активаторного типа и ручной стирки SKIF массой 250 гр', category: 'Стиральные порошки', brand: 'SKIF', unit: 'шт', boxUnits: 24 },
  { name: 'Стиральный порошок для машин активаторного типа и ручной стирки SKIF, массой 900гр', category: 'Стиральные порошки', brand: 'SKIF', unit: 'шт', boxUnits: 10 },
  { name: 'Стиральный порошок для ручной стирки высшего сорта Мэй Фу, массой 1800гр', category: 'Стиральные порошки', brand: 'Мэй Фу', unit: 'шт', boxUnits: 6 },
  { name: 'Стиральный порошок для ручной стирки высшего сорта Мэй Фу, массой 250гр', category: 'Стиральные порошки', brand: 'Мэй Фу', unit: 'шт', boxUnits: 24 },
  { name: 'Стиральный порошок для ручной стирки высшего сорта Мэй Фу, массой 3000гр', category: 'Стиральные порошки', brand: 'Мэй Фу', unit: 'шт', boxUnits: 4 },
  { name: 'Стиральный порошок для ручной стирки высшего сорта Мэй Фу, массой 300гр', category: 'Стиральные порошки', brand: 'Мэй Фу', unit: 'шт', boxUnits: 20 },
  { name: 'Стиральный порошок для ручной стирки высшего сорта Мэй Фу, массой 900гр', category: 'Стиральные порошки', brand: 'Мэй Фу', unit: 'шт', boxUnits: 10 },
  { name: 'Чистящее средство гель для мытья посуды SKIF в пластиковых ёмкостях, массой 180гр', category: 'Средства для мытья посуды', brand: 'SKIF', unit: 'ёмкость', boxUnits: 36 },
  { name: 'Чистящее средство гель для мытья посуды SKIF в пластиковых ёмкостях, массой 280гр', category: 'Средства для мытья посуды', brand: 'SKIF', unit: 'ёмкость', boxUnits: 36 },
  { name: 'Чистящее средство гель для мытья посуды SKIF в пластиковых ёмкостях, массой 450гр', category: 'Средства для мытья посуды', brand: 'SKIF', unit: 'ёмкость', boxUnits: 18 },
  { name: 'Чистящее средство гель для мытья посуды SKIF в пластиковых ёмкостях, массой 900гр', category: 'Средства для мытья посуды', brand: 'SKIF', unit: 'ёмкость', boxUnits: 12 },
  { name: 'Чистящее средство гель для мытья посуды Мэй Фу в пластиковых ёмкостях массой 1000гр', category: 'Средства для мытья посуды', brand: 'Мэй Фу', unit: 'ёмкость', boxUnits: 12 },
  { name: 'Чистящее средство гель для мытья посуды Мэй Фу в пластиковых ёмкостях массой 260гр', category: 'Средства для мытья посуды', brand: 'Мэй Фу', unit: 'ёмкость', boxUnits: 36 },
  { name: 'Чистящее средство гель для мытья посуды Мэй Фу в пластиковых ёмкостях массой 450гр', category: 'Средства для мытья посуды', brand: 'Мэй Фу', unit: 'ёмкость', boxUnits: 18 },
  { name: 'Чистящее средство гель для мытья посуды Мэй Фу в пластиковых ёмкостях массой 800гр', category: 'Средства для мытья посуды', brand: 'Мэй Фу', unit: 'ёмкость', boxUnits: 12 },
  { name: 'Чистящее средство гель для мытья посуды Мэй Фу в пластиковых ёмкостях массой 900гр', category: 'Средства для мытья посуды', brand: 'Мэй Фу', unit: 'ёмкость', boxUnits: 12 },
  { name: 'Чистящее средство гель для мытья посуды Мэй Фу в пластиковых ёмкостях, массой 180гр', category: 'Средства для мытья посуды', brand: 'Мэй Фу', unit: 'ёмкость', boxUnits: 36 },
  { name: 'Чистящее средство капля для мытья посуды SKIF в пластиковых флаконах, массой 1л', category: 'Средства для мытья посуды', brand: 'SKIF', unit: 'флакон', boxUnits: 12 },
  { name: 'Чистящее средство капля для мытья посуды Мэй Фу в пластиковых флаконах, массой 0.5л', category: 'Средства для мытья посуды', brand: 'Мэй Фу', unit: 'флакон', boxUnits: 15 },
  { name: 'Чистящие средство капля для мытья посуды SKIF в пластиковых флаконах, массой 0.5л', category: 'Средства для мытья посуды', brand: 'SKIF', unit: 'флакон', boxUnits: 15 },
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

async function clearOldSeedStock(productId: number) {
  const oldSeedTransactions = await prisma.inventoryTransaction.findMany({
    where: {
      productId,
      reason: OLD_SEED_REASON,
    },
    select: { id: true },
  });

  if (oldSeedTransactions.length === 0) {
    return;
  }

  const emptySeedBatches = await prisma.productBatch.findMany({
    where: {
      productId,
      saleAllocations: { none: {} },
    },
    select: { id: true },
  });

  if (emptySeedBatches.length > 0) {
    await prisma.productBatch.deleteMany({
      where: { id: { in: emptySeedBatches.map((batch) => batch.id) } },
    });
  }

  await prisma.inventoryTransaction.deleteMany({
    where: { id: { in: oldSeedTransactions.map((transaction) => transaction.id) } },
  });

  await prisma.product.update({
    where: { id: productId },
    data: {
      initialStock: 0,
      totalIncoming: 0,
      stock: 0,
    },
  });
}

async function clearManualFields(productId: number) {
  const invoiceItems = await prisma.invoiceItem.count({ where: { productId } });

  if (invoiceItems === 0) {
    await prisma.priceHistory.deleteMany({ where: { productId } });
  }
}

async function seedProduct(item: SeedProduct, warehouseId: number) {
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
    sellingPrice: 0,
    minStock: 0,
    active: true,
    warehouseId,
    initialStock: 0,
    totalIncoming: 0,
    stock: 0,
  };

  const product = existing
    ? await prisma.product.update({
        where: { id: existing.id },
        data: productData,
      })
    : await prisma.product.create({ data: productData });

  await clearOldSeedStock(product.id);
  await clearManualFields(product.id);

  await prisma.productPackaging.deleteMany({ where: { productId: product.id } });

  if (item.boxUnits && item.boxUnits > 0) {
    await prisma.productPackaging.create({
      data: {
        productId: product.id,
        warehouseId,
        packageName: 'коробка',
        baseUnitName: item.unit,
        unitsPerPackage: item.boxUnits,
        packageSellingPrice: null,
        isDefault: true,
        sortOrder: 0,
      },
    });
  }
}

async function main() {
  const [warehouse, admin] = await Promise.all([ensureWarehouse(), ensureAdmin()]);

  for (const item of catalog) {
    await seedProduct(item, warehouse.id);
  }

  console.log(`Seeded ${catalog.length} product names and box sizes into warehouse "${warehouse.name}".`);
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
