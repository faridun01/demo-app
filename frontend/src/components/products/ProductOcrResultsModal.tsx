import React from 'react';
import { DollarSign, Loader2, Package } from 'lucide-react';
import { motion } from 'motion/react';
import { clsx } from 'clsx';
import { formatDollar, formatMoney, toFixedNumber } from '../../utils/format';
import {
  calculateEffectiveCost,
  calculateLineTotal,
  calculateUnitCostFromLineTotal,
  calculateUnitCostFromPackage,
} from '../../utils/money';
import { formatProductName } from '../../utils/productName';
import { getOcrProblemReason, getOcrResolvedQuantity } from '../../utils/productsViewUtils';

interface ProductOcrResultsModalProps {
  isOpen: boolean;
  ocrResults: any[] | null;
  visibleOcrResults: any[];
  invalidOcrRowsCount: number;
  problematicOcrRows: Array<{ lineIndex: number; reason: string }>;
  ocrImportedCount: number;
  ocrOriginalCount: number;
  usdRate: string;
  scanExpensePercent: string;
  showOnlyProblematicOcrRows: boolean;
  highlightedOcrLine: number | null;
  isLoading: boolean;
  ocrRowRefs: React.MutableRefObject<Record<number, HTMLDivElement | null>>;
  onBackdropClose: () => void;
  onClose: () => void;
  onAddOcrToStock: () => void;
  onJumpToOcrLine: (lineIndex: number) => void;
  setOcrResults: React.Dispatch<React.SetStateAction<any[] | null>>;
  setUsdRate: React.Dispatch<React.SetStateAction<string>>;
  setScanExpensePercent: React.Dispatch<React.SetStateAction<string>>;
  setShowOnlyProblematicOcrRows: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function ProductOcrResultsModal({
  isOpen,
  ocrResults,
  visibleOcrResults,
  invalidOcrRowsCount,
  problematicOcrRows,
  ocrImportedCount,
  ocrOriginalCount,
  usdRate,
  scanExpensePercent,
  showOnlyProblematicOcrRows,
  highlightedOcrLine,
  isLoading,
  ocrRowRefs,
  onBackdropClose,
  onClose,
  onAddOcrToStock,
  onJumpToOcrLine,
  setOcrResults,
  setUsdRate,
  setScanExpensePercent,
  setShowOnlyProblematicOcrRows,
}: ProductOcrResultsModalProps) {
  if (!isOpen || !ocrResults) return null;

  const enabledRowsCount = ocrResults.filter((entry) => entry.enabled !== false).length;
  const totalRowsCount = ocrOriginalCount || ocrResults.length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onBackdropClose}
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-2 backdrop-blur-sm sm:items-center sm:p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[96vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-4xl bg-white shadow-2xl sm:max-h-[90vh] sm:rounded-[2.5rem]"
      >
        <div className="border-b border-slate-100 bg-slate-50/50 p-4 sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <h3 className="text-xl font-black text-slate-900 sm:text-2xl">Результаты сканирования</h3>
            </div>
            <div className="grid shrink-0 grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-sky-100 bg-white px-4 py-3 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Курс USD ($)</p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <input
                    type="number"
                    step="0.01"
                    value={usdRate}
                    onChange={(event) => setUsdRate(event.target.value)}
                    className="w-24 bg-transparent text-left font-black text-sky-600 outline-none"
                  />
                  <DollarSign className="text-sky-300" size={18} />
                </div>
              </div>
              <div className="rounded-2xl border border-violet-100 bg-white px-4 py-3 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Общие расходы %</p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={scanExpensePercent}
                    onChange={(event) => setScanExpensePercent(event.target.value)}
                    className="w-20 bg-transparent text-left font-black text-violet-600 outline-none"
                  />
                  <span className="text-sm font-black text-slate-300">%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-8">
          <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-sky-600">Авторасчёт по накладной</p>
                <p className="mt-2 text-sm font-medium text-slate-600">
                  Количество и закупка пересчитываются автоматически. Измените только то, что нужно перед добавлением на склад.
                </p>
                {invalidOcrRowsCount > 0 && (
                  <p className="mt-3 text-sm font-bold text-rose-600">
                    Проверьте проблемные строки: {invalidOcrRowsCount}. Они подсвечены красным и не дадут завершить импорт.
                  </p>
                )}
                {problematicOcrRows.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {problematicOcrRows.map((row) => (
                      <button
                        key={`problem-row-${row.lineIndex}`}
                        type="button"
                        onClick={() => onJumpToOcrLine(row.lineIndex)}
                        className="rounded-xl bg-rose-100 px-3 py-1.5 text-xs font-black text-rose-700 ring-1 ring-rose-200"
                        title={row.reason}
                      >
                        Строка {row.lineIndex}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2 self-start rounded-2xl border border-sky-200 bg-white px-3 py-2">
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Позиции</span>
                <span className="rounded-xl bg-sky-500 px-2.5 py-1 text-sm font-black text-white">
                  {ocrImportedCount + enabledRowsCount}/{totalRowsCount}
                </span>
                {ocrImportedCount > 0 && (
                  <span className="rounded-xl bg-emerald-500 px-2.5 py-1 text-sm font-black text-white">
                    Добавлено: {ocrImportedCount}
                  </span>
                )}
                {enabledRowsCount > 0 && (
                  <span className="rounded-xl bg-slate-500 px-2.5 py-1 text-sm font-black text-white">
                    Осталось: {enabledRowsCount}
                  </span>
                )}
                {invalidOcrRowsCount > 0 && (
                  <span className="rounded-xl bg-rose-500 px-2.5 py-1 text-sm font-black text-white">
                    Ошибки: {invalidOcrRowsCount}
                  </span>
                )}
                {invalidOcrRowsCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowOnlyProblematicOcrRows((prev) => !prev)}
                    className={clsx(
                      'rounded-xl px-3 py-1.5 text-xs font-black transition-all',
                      showOnlyProblematicOcrRows
                        ? 'bg-rose-600 text-white'
                        : 'bg-rose-50 text-rose-600 ring-1 ring-rose-200'
                    )}
                  >
                    {showOnlyProblematicOcrRows ? 'Показать все строки' : 'Только проблемные'}
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="hidden grid-cols-12 gap-4 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400 sm:grid">
            <div className="col-span-4">Товар</div>
            <div className="col-span-2 text-center">Кол-во</div>
            <div className="col-span-2 text-right">Закупка</div>
            <div className="col-span-2 text-right">Наша закупка</div>
            <div className="col-span-2 text-right">Цена продажи</div>
          </div>
          {visibleOcrResults.map((item, index) => {
            const validationReason = getOcrProblemReason(item, usdRate, scanExpensePercent);
            const sourceIndex = ocrResults.findIndex((entry) => entry === item);
            const lineIndex = Number(item.lineIndex || sourceIndex || index);

            return (
              <div
                key={`${item.lineIndex || sourceIndex || index}-${sourceIndex}`}
                ref={(node) => {
                  ocrRowRefs.current[lineIndex] = node;
                }}
                className={clsx(
                  'grid grid-cols-1 gap-4 rounded-[28px] border p-4 transition-colors sm:grid-cols-12 sm:items-center sm:p-5',
                  item.enabled === false
                    ? 'bg-slate-100 opacity-65'
                    : highlightedOcrLine === lineIndex
                      ? 'border-rose-400 bg-rose-100 shadow-lg shadow-rose-200/60 ring-2 ring-rose-300'
                      : validationReason
                        ? 'border-rose-200 bg-rose-50 hover:bg-rose-100/60'
                        : 'bg-sky-50 hover:bg-sky-100/50'
                )}
              >
                <div className="sm:col-span-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-sky-500">
                      <input
                        type="checkbox"
                        checked={item.enabled !== false}
                        onChange={(event) => {
                          const newResults = [...ocrResults];
                          if (sourceIndex >= 0) {
                            newResults[sourceIndex].enabled = event.target.checked;
                            if (event.target.checked) {
                              newResults[sourceIndex].serverError = '';
                            }
                          }
                          setOcrResults(newResults);
                        }}
                        className="h-4 w-4 rounded border-sky-300 text-sky-600 focus:ring-sky-500"
                      />
                      Добавить строку #{item.lineIndex || index + 1}
                    </label>
                    <div className="flex shrink-0 items-center gap-2">
                      {validationReason && item.enabled !== false && (
                        <span className="rounded-xl bg-rose-500 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white">
                          Проблема
                        </span>
                      )}
                      <span className="shrink-0 rounded-xl bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500 ring-1 ring-sky-100">
                        Строка {item.lineIndex || index + 1}
                      </span>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={item.name || ''}
                    onChange={(event) => {
                      const newResults = [...ocrResults];
                      if (sourceIndex >= 0) {
                        newResults[sourceIndex].name = event.target.value;
                        newResults[sourceIndex].serverError = '';
                      }
                      setOcrResults(newResults);
                    }}
                    className="w-full rounded-xl border border-sky-200 bg-white px-3 py-2 text-sm font-bold text-slate-900 outline-none focus:border-sky-500"
                  />
                  {item.rawName && item.rawName !== item.name && (
                    <p className="mt-1 text-[10px] font-bold text-slate-400">
                      OCR: {formatProductName(item.rawName)}
                    </p>
                  )}
                  {validationReason && item.enabled !== false && (
                    <p className="mt-2 rounded-xl bg-white/80 px-3 py-2 text-[11px] font-bold text-rose-600 ring-1 ring-rose-200">
                      Нужно проверить: {validationReason}
                    </p>
                  )}
                  {item.rawQuantity && (
                    <p className="mt-1 text-[10px] font-bold text-slate-400">Из накладной: {item.rawQuantity}</p>
                  )}
                  {item.lineTotal > 0 && (
                    <p className="mt-1 text-[10px] font-bold text-slate-400">
                      Сумма строки: {formatDollar(item.lineTotal)} / ≈ {formatMoney(item.lineTotal * parseFloat(usdRate || '0'))}
                    </p>
                  )}
                  {item.note && <p className="mt-1 text-[10px] text-slate-500">{item.note}</p>}
                </div>
                <div className="sm:col-span-2 sm:text-center">
                  <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400 sm:hidden">Кол-во</p>
                  <div className="flex items-center justify-center gap-1">
                    <input
                      type="number"
                      min="0"
                      value={item.packageCount || ''}
                      onChange={(event) => {
                        const newResults = [...ocrResults];
                        if (sourceIndex >= 0) {
                          newResults[sourceIndex].packageCount = Number(event.target.value || 0);
                          newResults[sourceIndex].serverError = '';
                        }
                        setOcrResults(newResults);
                      }}
                      className="w-16 rounded-lg border border-sky-200 bg-white px-2 py-1 text-center text-xs font-black text-sky-700 outline-none focus:border-sky-500"
                    />
                    <span className="text-xs font-black text-slate-400">x</span>
                    <input
                      type="number"
                      min="0"
                      value={item.unitsPerPackage || ''}
                      onChange={(event) => {
                        const newResults = [...ocrResults];
                        if (sourceIndex >= 0) {
                          newResults[sourceIndex].unitsPerPackage = Number(event.target.value || 0);
                          newResults[sourceIndex].serverError = '';
                        }
                        setOcrResults(newResults);
                      }}
                      className="w-16 rounded-lg border border-sky-200 bg-white px-2 py-1 text-center text-xs font-black text-sky-700 outline-none focus:border-sky-500"
                    />
                  </div>
                  <p className="text-[10px] font-bold text-slate-500">
                    = {getOcrResolvedQuantity(item)} шт
                  </p>
                  <p className="text-[10px] font-bold text-slate-400">итог для склада</p>
                  {item.price > 0 && item.packageCount > 0 && (
                    <p className="mt-1 text-[10px] font-bold text-slate-400">
                      {formatDollar(item.price)} x {item.packageCount} = {formatDollar(calculateLineTotal(item.packageCount, item.price))}
                    </p>
                  )}
                </div>
                <div className="sm:col-span-2 sm:text-right">
                  <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400 sm:hidden">Закупка</p>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.price || ''}
                    onChange={(event) => {
                      const newResults = [...ocrResults];
                      if (sourceIndex >= 0) {
                        newResults[sourceIndex].price = Number(event.target.value || 0);
                        newResults[sourceIndex].serverError = '';
                      }
                      setOcrResults(newResults);
                    }}
                    className="w-full rounded-xl border border-sky-200 bg-white px-3 py-2 text-right text-sm font-black text-slate-900 outline-none focus:border-sky-500"
                  />
                  <p className="mt-1 text-[10px] font-bold text-slate-400">
                    ≈ {formatMoney(item.price * parseFloat(usdRate || '0'))} / упаковка
                  </p>
                </div>
                <div className="sm:col-span-2 sm:text-right">
                  <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400 sm:hidden">Наша закупка</p>
                  {(() => {
                    const quantity = getOcrResolvedQuantity(item);
                    const baseCostPerPiece =
                      item.lineTotal > 0 && quantity > 0
                        ? calculateUnitCostFromLineTotal(item.lineTotal * parseFloat(usdRate || '0'), quantity)
                        : item.unitsPerPackage > 0
                          ? calculateUnitCostFromPackage(item.price * parseFloat(usdRate || '0'), item.unitsPerPackage)
                          : calculateUnitCostFromLineTotal(item.price * parseFloat(usdRate || '0'), quantity);
                    const expensePercent = Math.max(0, Number(scanExpensePercent || 0));
                    const effectiveCostPerPiece = calculateEffectiveCost(baseCostPerPiece, expensePercent);

                    return (
                      <>
                        <p className="font-black text-slate-900">
                          {formatMoney(effectiveCostPerPiece)}
                        </p>
                        <p className="mt-1 text-[10px] font-bold text-slate-400">
                          база: {formatMoney(baseCostPerPiece)}
                        </p>
                        <p className="mt-2 text-[10px] font-bold text-slate-400">
                          расходы: {toFixedNumber(expensePercent)}%
                        </p>
                      </>
                    );
                  })()}
                </div>
                <div className="sm:col-span-2 sm:text-right">
                  <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400 sm:hidden">Цена продажи</p>
                  <input
                    type="number"
                    placeholder="Укажите цену"
                    value={item.sellingPrice}
                    onChange={(event) => {
                      const newResults = [...ocrResults];
                      if (sourceIndex >= 0) {
                        newResults[sourceIndex].sellingPrice = event.target.value;
                        newResults[sourceIndex].serverError = '';
                      }
                      setOcrResults(newResults);
                    }}
                    className="w-full rounded-xl border border-sky-200 bg-white px-4 py-2 text-right font-black text-emerald-600 outline-none focus:border-sky-500"
                  />
                </div>
              </div>
            );
          })}
          {showOnlyProblematicOcrRows && visibleOcrResults.length === 0 && (
            <div className="rounded-[28px] border border-emerald-200 bg-emerald-50 p-6 text-center text-sm font-bold text-emerald-700">
              Проблемных строк не осталось. Можно добавить все товары на склад.
            </div>
          )}
        </div>
        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-sky-50/60 p-4 sm:flex-row sm:justify-end sm:space-x-3 sm:gap-0 sm:p-8">
          <button onClick={onClose} className="rounded-2xl px-8 py-4 font-bold text-slate-500 transition-all hover:bg-slate-200">
            Отмена
          </button>
          <button
            onClick={onAddOcrToStock}
            disabled={isLoading}
            className="flex items-center space-x-2 rounded-2xl bg-sky-500 px-10 py-4 font-bold text-white shadow-xl shadow-sky-500/20 transition-all hover:bg-sky-600 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Package size={20} />}
            <span>Добавить всё на склад</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
