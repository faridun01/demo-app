import React from 'react';
import { clsx } from 'clsx';
import { History, RotateCcw, Scissors } from 'lucide-react';
import { formatProductName } from '../../utils/productName';
import { Dialog } from '../common/Dialog';

interface ProductHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName?: string | null;
  product?: any;
  productHistory: any[];
  onReverseIncoming?: (transactionId: number) => void | Promise<void>;
  onWriteOff?: () => void | Promise<void>;
}

const getTypeLabel = (type: string) => {
  if (type === 'incoming') return 'ÐŸÑ€Ð¸Ñ…Ð¾Ð´';
  if (type === 'outgoing') return 'Ð Ð°ÑÑ…Ð¾Ð´';
  if (type === 'price_change' || type === 'adjustment') return 'Ð˜Ð·Ð¼ÐµÐ½ÐµÐ½Ð¸Ðµ';
  return 'ÐŸÐµÑ€ÐµÐ½Ð¾Ñ';
};

const getTypeClassName = (type: string) =>
  clsx(
    'rounded-lg px-2 py-1 text-[10px] font-black uppercase',
    type === 'incoming'
      ? 'bg-emerald-50 text-emerald-600'
      : type === 'outgoing'
        ? 'bg-rose-50 text-rose-600'
        : type === 'price_change' || type === 'adjustment'
          ? 'bg-sky-50 text-sky-600'
          : 'bg-amber-50 text-amber-600',
  );

const normalizePackageName = (value: string) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return 'ÑƒÐ¿Ð°ÐºÐ¾Ð²ÐºÐ°';
  if (['Ð¼ÐµÑˆÐ¾Ðº', 'Ð¼ÐµÑˆÐºÐ°', 'Ð¼ÐµÑˆÐºÐ¾Ð²', 'bag'].includes(normalized)) return 'Ð¼ÐµÑˆÐ¾Ðº';
  if (['ÐºÐ¾Ñ€Ð¾Ð±ÐºÐ°', 'ÐºÐ¾Ñ€Ð¾Ð±ÐºÐ¸', 'ÐºÐ¾Ñ€Ð¾Ð±Ð¾Ðº', 'box'].includes(normalized)) return 'ÐºÐ¾Ñ€Ð¾Ð±ÐºÐ°';
  if (['ÑƒÐ¿Ð°ÐºÐ¾Ð²ÐºÐ°', 'ÑƒÐ¿Ð°ÐºÐ¾Ð²ÐºÐ¸', 'ÑƒÐ¿Ð°ÐºÐ¾Ð²Ð¾Ðº', 'pack'].includes(normalized)) return 'ÑƒÐ¿Ð°ÐºÐ¾Ð²ÐºÐ°';
  if (['Ð¿Ð°Ñ‡ÐºÐ°', 'Ð¿Ð°Ñ‡ÐºÐ¸', 'Ð¿Ð°Ñ‡ÐµÐº'].includes(normalized)) return 'Ð¿Ð°Ñ‡ÐºÐ°';
  return normalized;
};

const pluralizeRu = (count: number, forms: [string, string, string]) => {
  const abs = Math.abs(count) % 100;
  const last = abs % 10;

  if (abs > 10 && abs < 20) return forms[2];
  if (last > 1 && last < 5) return forms[1];
  if (last === 1) return forms[0];
  return forms[2];
};

const formatCountWithUnit = (count: number, unit: string) => {
  const normalized = String(unit || '').trim().toLowerCase();
  const formsMap: Record<string, [string, string, string]> = {
    'ÑˆÑ‚': ['ÑˆÑ‚', 'ÑˆÑ‚', 'ÑˆÑ‚'],
    'ÑˆÑ‚ÑƒÐºÐ°': ['ÑˆÑ‚ÑƒÐºÐ°', 'ÑˆÑ‚ÑƒÐºÐ¸', 'ÑˆÑ‚ÑƒÐº'],
    'Ð¿Ð°Ñ‡ÐºÐ°': ['Ð¿Ð°Ñ‡ÐºÐ°', 'Ð¿Ð°Ñ‡ÐºÐ¸', 'Ð¿Ð°Ñ‡ÐµÐº'],
    'Ð¼ÐµÑˆÐ¾Ðº': ['Ð¼ÐµÑˆÐ¾Ðº', 'Ð¼ÐµÑˆÐºÐ°', 'Ð¼ÐµÑˆÐºÐ¾Ð²'],
    'ÐºÐ¾Ñ€Ð¾Ð±ÐºÐ°': ['ÐºÐ¾Ñ€Ð¾Ð±ÐºÐ°', 'ÐºÐ¾Ñ€Ð¾Ð±ÐºÐ¸', 'ÐºÐ¾Ñ€Ð¾Ð±Ð¾Ðº'],
    'ÑƒÐ¿Ð°ÐºÐ¾Ð²ÐºÐ°': ['ÑƒÐ¿Ð°ÐºÐ¾Ð²ÐºÐ°', 'ÑƒÐ¿Ð°ÐºÐ¾Ð²ÐºÐ¸', 'ÑƒÐ¿Ð°ÐºÐ¾Ð²Ð¾Ðº'],
    'Ñ„Ð»Ð°ÐºÐ¾Ð½': ['Ñ„Ð»Ð°ÐºÐ¾Ð½', 'Ñ„Ð»Ð°ÐºÐ¾Ð½Ð°', 'Ñ„Ð»Ð°ÐºÐ¾Ð½Ð¾Ð²'],
    'Ñ‘Ð¼ÐºÐ¾ÑÑ‚ÑŒ': ['Ñ‘Ð¼ÐºÐ¾ÑÑ‚ÑŒ', 'Ñ‘Ð¼ÐºÐ¾ÑÑ‚Ð¸', 'Ñ‘Ð¼ÐºÐ¾ÑÑ‚ÐµÐ¹'],
    'ÐµÐ¼ÐºÐ¾ÑÑ‚ÑŒ': ['Ñ‘Ð¼ÐºÐ¾ÑÑ‚ÑŒ', 'Ñ‘Ð¼ÐºÐ¾ÑÑ‚Ð¸', 'Ñ‘Ð¼ÐºÐ¾ÑÑ‚ÐµÐ¹'],
    'Ð±ÑƒÑ‚Ñ‹Ð»ÐºÐ°': ['Ð±ÑƒÑ‚Ñ‹Ð»ÐºÐ°', 'Ð±ÑƒÑ‚Ñ‹Ð»ÐºÐ¸', 'Ð±ÑƒÑ‚Ñ‹Ð»Ð¾Ðº'],
  };

  const forms = formsMap[normalized] || [unit, unit, unit];
  return `${count} ${pluralizeRu(count, forms)}`;
};

const getPreferredPackaging = (product: any) => {
  const packagings = Array.isArray(product?.packagings) ? product.packagings : [];
  return (
    packagings.find((packaging: any) => packaging?.isDefault && Number(packaging?.unitsPerPackage || 0) > 1) ||
    packagings.find((packaging: any) => Number(packaging?.unitsPerPackage || 0) > 1) ||
    null
  );
};

const getQuantityBreakdown = (quantityValue: unknown, product: any) => {
  const rawQuantity = Number(quantityValue || 0);
  const absoluteQuantity = Math.abs(rawQuantity);
  const sign = rawQuantity > 0 ? '+' : rawQuantity < 0 ? '-' : '';
  const preferredPackaging = getPreferredPackaging(product);
  const unitsPerPackage = Number(preferredPackaging?.unitsPerPackage || 0);
  const packageName = normalizePackageName(preferredPackaging?.packageName || preferredPackaging?.name || 'ÑƒÐ¿Ð°ÐºÐ¾Ð²ÐºÐ°');
  const baseUnitName = product?.unit || 'ÑˆÑ‚';

  if (!preferredPackaging || unitsPerPackage <= 1 || !Number.isFinite(rawQuantity)) {
    return `${sign}${formatCountWithUnit(absoluteQuantity, baseUnitName)}`;
  }

  const packageCount = Math.floor(absoluteQuantity / unitsPerPackage);
  const remainderUnits = absoluteQuantity % unitsPerPackage;

  if (remainderUnits > 0) {
    return `${sign}${formatCountWithUnit(packageCount, packageName)}\n${formatCountWithUnit(remainderUnits, baseUnitName)}`;
  }

  return `${sign}${formatCountWithUnit(packageCount, packageName)}`;
};

export default function ProductHistoryModal({
  isOpen,
  onClose,
  productName,
  product,
  productHistory,
  onReverseIncoming,
  onWriteOff,
}: ProductHistoryModalProps) {
  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      title={<>Ð˜ÑÑ‚Ð¾Ñ€Ð¸Ñ Ñ‚Ð¾Ð²Ð°Ñ€Ð°: {formatProductName(productName)}</>}
      icon={<History size={18} />}
      widthClassName="max-w-[60rem]"
      actions={
        onWriteOff ? (
          <button
            type="button"
            onClick={() => void onWriteOff()}
            className="app-button border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
          >
            <Scissors size={14} />
            <span>Ð¡Ð¿Ð¸ÑÐ°Ñ‚ÑŒ</span>
          </button>
        ) : null
      }
    >
      <div className="space-y-3 sm:hidden">
        {productHistory.map((t, i) => (
          <div key={i} className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">{new Date(t.createdAt).toLocaleString('ru-RU')}</p>
                <p className="mt-1 text-xs text-slate-500">{t.warehouseName || t.warehouse?.name || '---'}</p>
              </div>
              <span className={getTypeClassName(t.type)}>{getTypeLabel(t.type)}</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white px-3 py-3">
                <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">ÐšÐ¾Ð»-Ð²Ð¾</p>
                <p className="mt-1 whitespace-pre-line text-sm font-black text-slate-900">{getQuantityBreakdown(t.qtyChange ?? 0, product)}</p>
              </div>
              <div className="rounded-2xl bg-white px-3 py-3">
                <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">ÐŸÐ¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ñ‚ÐµÐ»ÑŒ</p>
                <p className="mt-1 break-words text-sm font-medium text-slate-900">{t.username || '---'}</p>
              </div>
            </div>
            <div className="mt-3 rounded-2xl bg-white px-3 py-3">
              <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">ÐŸÑ€Ð¸Ñ‡Ð¸Ð½Ð°</p>
              <p className="mt-1 break-words text-sm text-slate-600">{t.reason || '---'}</p>
            </div>
            {t.canReverseIncoming && onReverseIncoming && (
              <button
                type="button"
                onClick={() => onReverseIncoming(Number(t.transactionId))}
                className="mt-3 inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-black text-rose-700 transition-all hover:bg-rose-100"
              >
                <RotateCcw size={14} />
                <span>ÐžÑ‚Ð¼ÐµÐ½Ð¸Ñ‚ÑŒ Ð¿Ñ€Ð¸Ñ…Ð¾Ð´</span>
              </button>
            )}
          </div>
        ))}
      </div>

      <table className="hidden w-full table-fixed text-left sm:table">
        <thead>
          <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <th className="w-[17%] pb-4">Ð”Ð°Ñ‚Ð°</th>
            <th className="w-[10%] pb-4">Ð¢Ð¸Ð¿</th>
            <th className="w-[14%] pb-4">ÐšÐ¾Ð»-Ð²Ð¾</th>
            <th className="w-[13%] pb-4">Ð¡ÐºÐ»Ð°Ð´</th>
            <th className="w-[24%] pb-4">ÐŸÑ€Ð¸Ñ‡Ð¸Ð½Ð°</th>
            <th className="w-[12%] pb-4">ÐŸÐ¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ñ‚ÐµÐ»ÑŒ</th>
            <th className="w-[10%] pb-4 text-right">Ð”ÐµÐ¹ÑÑ‚Ð²Ð¸Ðµ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {productHistory.map((t, i) => (
            <tr key={i} className="text-[13px]">
              <td className="py-3 pr-3 align-top text-slate-500">{new Date(t.createdAt).toLocaleString('ru-RU')}</td>
              <td className="py-3 pr-3 align-top">
                <span className={getTypeClassName(t.type)}>{getTypeLabel(t.type)}</span>
              </td>
              <td className="py-3 pr-3 align-top font-black">
                <div className="whitespace-pre-line">{getQuantityBreakdown(t.qtyChange ?? 0, product)}</div>
              </td>
              <td className="py-3 pr-3 align-top break-words text-slate-600">{t.warehouseName || t.warehouse?.name || '---'}</td>
              <td className="py-3 pr-3 align-top break-words italic text-slate-500">{t.reason || '---'}</td>
              <td className="py-3 pr-3 align-top break-words text-slate-500">{t.username || '---'}</td>
              <td className="py-3 align-top text-right">
                {t.canReverseIncoming && onReverseIncoming ? (
                  <button
                    type="button"
                    onClick={() => onReverseIncoming(Number(t.transactionId))}
                    className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-black text-rose-700 transition-all hover:bg-rose-100"
                  >
                    <RotateCcw size={12} />
                    <span>ÐžÑ‚Ð¼ÐµÐ½Ð¸Ñ‚ÑŒ</span>
                  </button>
                ) : (
                  <span className="text-xs text-slate-300">-</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Dialog>
  );
}
