import React from 'react';
import { Camera, Loader2, Package, X } from 'lucide-react';
import { motion } from 'motion/react';
import { clsx } from 'clsx';
import { handleBrokenImage, resolveMediaUrl } from '../../utils/media';
import {
  formatPriceInput,
  normalizeDisplayBaseUnit,
  normalizeOcrBaseUnit,
  normalizeOcrPackageName,
  type ProductFormData,
} from '../../utils/productsViewUtils';

interface ProductFormModalProps {
  isOpen: boolean;
  isEditMode: boolean;
  isAdmin: boolean;
  formData: ProductFormData;
  categoryInput: string;
  visibleCategories: any[];
  warehouses: any[];
  isPhotoUploading: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  setFormData: React.Dispatch<React.SetStateAction<ProductFormData>>;
  setCategoryInput: (value: string) => void;
  setIsCategoryManual: (value: boolean) => void;
  onPhotoUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function ProductFormModal({
  isOpen,
  isEditMode,
  isAdmin,
  formData,
  categoryInput,
  visibleCategories,
  warehouses,
  isPhotoUploading,
  onClose,
  onSubmit,
  setFormData,
  setCategoryInput,
  setIsCategoryManual,
  onPhotoUpload,
}: ProductFormModalProps) {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/35 p-2 sm:items-center sm:p-3"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-md border border-[#9fb7d5] bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-[#b7c2ce] bg-[linear-gradient(180deg,#ffffff_0%,#dde5ee_100%)] px-4 py-3">
          <h3 className="flex items-center space-x-3 text-xl font-semibold text-[#1f2933]">
            <div className="rounded border border-[#9fb7d5] bg-[#eaf2fb] p-2 text-[#23527c]">
              <Package size={20} />
            </div>
            <span>{isEditMode ? 'Редактировать товар' : 'Новый товар'}</span>
          </h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded border border-[#9fb7d5] bg-white text-[#23527c] transition-colors hover:bg-[#eaf2fb]"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex-1 space-y-3 overflow-y-auto bg-[#f3f5f7] p-3 sm:p-4">
          <div className="grid grid-cols-1 gap-3 rounded border border-[#c8d2df] bg-white p-3 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-semibold text-[#32465a]">Название товара</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(event) => {
                  setIsCategoryManual(false);
                  setFormData({ ...formData, name: event.target.value });
                }}
                className="w-full rounded border border-[#9fb7d5] bg-white px-3 py-2 text-sm font-medium text-[#1f2933] outline-none transition-colors focus:border-[#4f81bd]"
                placeholder="Напр: iPhone 15 Pro Max"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-[#32465a]">Базовая единица</label>
              <select
                required
                value={formData.baseUnitName}
                onChange={(event) => {
                  const nextBaseUnit = normalizeOcrBaseUnit(event.target.value);
                  setFormData({
                    ...formData,
                    baseUnitName: nextBaseUnit,
                    unit: nextBaseUnit,
                  });
                }}
                className="w-full rounded border border-[#9fb7d5] bg-white px-3 py-2 text-sm font-medium text-[#1f2933] outline-none transition-colors focus:border-[#4f81bd]"
              >
                <option value="шт">Шт</option>
                <option value="кг">Кг</option>
                <option value="литр">Литр</option>
                <option value="бутылка">Бутылка</option>
                <option value="флакон">Флакон</option>
              </select>
              <p className="mt-1 text-[11px] font-medium text-[#5f6f7f]">
                Это основная единица учёта товара на складе.
              </p>
            </div>

            <div className="rounded border border-[#d6c07a] bg-[#fff8dc] p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-[#32465a]">Упаковка</label>
                  <p className="text-xs font-medium text-[#5f6f7f]">Коробки или мешки помогают считать остаток и продажу понятнее.</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      packagingEnabled: !prev.packagingEnabled,
                      packageName: prev.packageName || 'коробка',
                      unitsPerPackage: prev.packagingEnabled ? '' : prev.unitsPerPackage,
                    }))
                  }
                  className={clsx(
                    'rounded border px-3 py-1.5 text-xs font-semibold transition-colors',
                    formData.packagingEnabled
                      ? 'border-[#8f6f18] bg-[#ffd966] text-[#1f2933]'
                      : 'border-[#9fb7d5] bg-white text-[#1f3f63] hover:bg-[#eaf2fb]'
                  )}
                >
                  {formData.packagingEnabled ? 'Коробки / мешки' : 'Только шт'}
                </button>
              </div>

              {formData.packagingEnabled && (
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-[#32465a]">Тип упаковки</label>
                    <select
                      value={formData.packageName}
                      onChange={(event) => setFormData({ ...formData, packageName: normalizeOcrPackageName(event.target.value) || 'коробка' })}
                      className="w-full rounded border border-[#9fb7d5] bg-white px-3 py-2 text-sm font-medium text-[#1f2933] outline-none transition-colors focus:border-[#4f81bd]"
                    >
                      <option value="коробка">Коробка</option>
                      <option value="мешок">Мешок</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-[#32465a]">
                      Сколько шт в {formData.packageName === 'мешок' ? 'мешке' : 'коробке'}
                    </label>
                    <input
                      type="number"
                      min="2"
                      step="1"
                      required={formData.packagingEnabled}
                      value={formData.unitsPerPackage}
                      onChange={(event) => setFormData({ ...formData, unitsPerPackage: event.target.value })}
                      className="w-full rounded border border-[#9fb7d5] bg-white px-3 py-2 text-sm font-medium text-[#1f2933] outline-none transition-colors focus:border-[#4f81bd]"
                      placeholder="Напр: 24"
                    />
                  </div>
                  <div className="rounded border border-[#d6c07a] bg-white px-3 py-2 text-sm font-semibold text-[#1f2933] sm:col-span-2">
                    1 {formData.packageName || 'коробка'} = {Number(formData.unitsPerPackage || 0) || '...'} {normalizeDisplayBaseUnit(formData.baseUnitName || 'шт')}
                  </div>
                  <div className="text-[11px] font-medium text-[#5f6f7f] sm:col-span-2">
                    При пополнении этот товар будет удобно добавляться в {formData.packageName === 'мешок' ? 'мешках' : 'коробках'}, а ниже система сама покажет итог в штуках.
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-[#32465a]">Категория</label>
              <input
                list="product-categories"
                required
                value={categoryInput}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  const matchedCategory = visibleCategories.find(
                    (category) => String(category?.name || '').trim().toLowerCase() === nextValue.trim().toLowerCase()
                  );

                  setIsCategoryManual(Boolean(nextValue.trim()));
                  setCategoryInput(nextValue);
                  setFormData({
                    ...formData,
                    categoryId: matchedCategory?.id ? String(matchedCategory.id) : '',
                  });
                }}
                className="w-full rounded border border-[#9fb7d5] bg-white px-3 py-2 text-sm font-medium text-[#1f2933] outline-none transition-colors focus:border-[#4f81bd]"
                placeholder="Выберите или введите категорию"
              />
              <datalist id="product-categories">
                {visibleCategories.map((category) => (
                  <option key={category.id} value={category.name} />
                ))}
              </datalist>
              <p className="mt-1 text-[11px] font-medium text-[#5f6f7f]">
                Можно выбрать из списка или сразу ввести новую категорию здесь же.
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-[#32465a]">Склад по умолчанию</label>
              <select
                required
                value={formData.warehouseId}
                onChange={(event) => setFormData({ ...formData, warehouseId: event.target.value })}
                className="w-full rounded border border-[#9fb7d5] bg-white px-3 py-2 text-sm font-medium text-[#1f2933] outline-none transition-colors focus:border-[#4f81bd]"
              >
                <option value="">Выберите склад</option>
                {warehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
                ))}
              </select>
            </div>

            {isAdmin && (
              <div>
                <label className="mb-1 block text-sm font-semibold text-[#32465a]">Себестоимость</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.costPrice}
                  onChange={(event) => setFormData({ ...formData, costPrice: event.target.value })}
                  onBlur={(event) => setFormData({ ...formData, costPrice: formatPriceInput(event.target.value) })}
                  className="w-full rounded border border-[#9fb7d5] bg-white px-3 py-2 text-sm font-medium text-[#1f2933] outline-none transition-colors focus:border-[#4f81bd]"
                />
                {!isEditMode && (
                  <p className="mt-1 text-[11px] font-medium text-[#5f6f7f]">
                    Введите себестоимость вручную.
                  </p>
                )}
              </div>
            )}

            {isAdmin && (
              <div>
                <label className="mb-1 block text-sm font-semibold text-[#32465a]">Расходы %</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.expensePercent}
                  onChange={(event) => setFormData({ ...formData, expensePercent: event.target.value })}
                  className="w-full rounded border border-[#9fb7d5] bg-white px-3 py-2 text-sm font-medium text-[#1f2933] outline-none transition-colors focus:border-[#4f81bd]"
                />
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm font-semibold text-[#32465a]">Цена продажи</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.sellingPrice}
                onChange={(event) => setFormData({ ...formData, sellingPrice: event.target.value })}
                onBlur={(event) => setFormData({ ...formData, sellingPrice: formatPriceInput(event.target.value) })}
                className="w-full rounded border border-[#9fb7d5] bg-white px-3 py-2 text-sm font-medium text-[#1f2933] outline-none transition-colors focus:border-[#4f81bd]"
              />
            </div>

            {!isEditMode && (
              <>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-[#32465a]">Начальный остаток</label>
                  <input
                    type="number"
                    required
                    value={formData.initialStock}
                    onChange={(event) => setFormData({ ...formData, initialStock: event.target.value })}
                    className="w-full rounded border border-[#9fb7d5] bg-white px-3 py-2 text-sm font-medium text-[#1f2933] outline-none transition-colors focus:border-[#4f81bd]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-[#32465a]">Мин. остаток</label>
                  <input
                    type="number"
                    required
                    value={formData.minStock}
                    onChange={(event) => setFormData({ ...formData, minStock: event.target.value })}
                    className="w-full rounded border border-[#9fb7d5] bg-white px-3 py-2 text-sm font-medium text-[#1f2933] outline-none transition-colors focus:border-[#4f81bd]"
                  />
                </div>
              </>
            )}

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-semibold text-[#32465a]">Фото товара</label>
              <div className="flex flex-col gap-3 rounded border border-[#c8d2df] bg-[#f7f9fb] p-3 sm:flex-row sm:items-center sm:justify-between">
                <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded border border-[#7f9db9] bg-[#eaf2fb] px-4 py-2 text-sm font-medium text-[#1f3f63] transition-colors hover:bg-[#dbe9f6]">
                  {isPhotoUploading ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
                  <span>{isPhotoUploading ? 'Загрузка...' : 'Выбрать фото'}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={onPhotoUpload}
                    disabled={isPhotoUploading}
                  />
                </label>
                {formData.photoUrl && (
                  <div className="flex items-center gap-3">
                    <div className="h-14 w-14 overflow-hidden rounded border border-[#c8d2df] bg-white">
                      <img
                        src={resolveMediaUrl(formData.photoUrl, formData.name || 'preview')}
                        alt="Фото товара"
                        className="h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                        onError={(event) => handleBrokenImage(event, formData.name || 'preview')}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, photoUrl: '' }))}
                      className="rounded border border-[#9fb7d5] bg-white px-3 py-2 text-xs font-medium text-[#1f3f63] transition-colors hover:bg-[#eaf2fb]"
                    >
                      Убрать фото
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="-mx-3 -mb-3 flex flex-col-reverse gap-2 border-t border-[#b7c2ce] bg-[#eef3f8] px-4 py-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-[#9fb7d5] bg-white px-6 py-2 text-sm font-medium text-[#1f3f63] transition-colors hover:bg-[#eaf2fb]"
            >
              Отмена
            </button>
            <button type="submit" className="rounded border border-[#8f6f18] bg-[#ffd966] px-8 py-2 text-sm font-semibold text-[#1f2933] shadow-sm transition-colors hover:bg-[#f7c948]">
              {isEditMode ? 'Сохранить' : 'Создать'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
