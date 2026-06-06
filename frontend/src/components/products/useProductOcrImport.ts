import toast from 'react-hot-toast';
import client from '../../api/client';
import { roundMoney } from '../../utils/format';
import { buildOcrImportResult, buildOcrImportRows } from '../../utils/productsViewUtils';

interface UseProductOcrImportParams {
  ocrResults: any[] | null;
  selectedWarehouseId: string;
  usdRate: string;
  scanExpensePercent: string;
  ocrImportedCount: number;
  ocrOriginalCount: number;
  setIsLoading: (value: boolean) => void;
  setOcrImportedCount: React.Dispatch<React.SetStateAction<number>>;
  setOcrResults: React.Dispatch<React.SetStateAction<any[] | null>>;
  setShowOnlyProblematicOcrRows: React.Dispatch<React.SetStateAction<boolean>>;
  setHighlightedOcrLine: React.Dispatch<React.SetStateAction<number | null>>;
  jumpToOcrLine: (lineIndex: number) => void;
  closeOcrResultsModal: () => void;
  fetchInitialData: () => Promise<void>;
}

export default function useProductOcrImport({
  ocrResults,
  selectedWarehouseId,
  usdRate,
  scanExpensePercent,
  ocrImportedCount,
  ocrOriginalCount,
  setIsLoading,
  setOcrImportedCount,
  setOcrResults,
  setShowOnlyProblematicOcrRows,
  setHighlightedOcrLine,
  jumpToOcrLine,
  closeOcrResultsModal,
  fetchInitialData,
}: UseProductOcrImportParams) {
  const handleAddOcrToStock = async () => {
    if (!ocrResults || !selectedWarehouseId) return;
    const rate = parseFloat(usdRate) || 1;
    const sharedExpensePercent = Math.max(0, Number(scanExpensePercent || 0));

    try {
      setIsLoading(true);
      const { invalidRows, importRows } = buildOcrImportRows(ocrResults, rate, sharedExpensePercent);

      if (invalidRows.length > 0) {
        const invalidRowsText = invalidRows
          .slice(0, 6)
          .map((row) => `#${row.lineIndex}: ${row.reason}`)
          .join(', ');

        setShowOnlyProblematicOcrRows(true);
        if (invalidRows[0]?.lineIndex) {
          jumpToOcrLine(invalidRows[0].lineIndex);
        }
        toast.error(
          `Не все товары готовы к добавлению. Проверьте ${invalidRows.length} строк: ${invalidRowsText}${invalidRows.length > 6 ? '...' : ''}`,
        );
        return;
      }

      if (!importRows.length) {
        toast.error('После сканирования не осталось корректных товаров для добавления');
        return;
      }

      const response = await client.post(
        '/ocr/import-items',
        {
          warehouseId: Number(selectedWarehouseId),
          items: importRows.map((item) => ({
            lineIndex: item.lineIndex,
            name: item.name,
            rawName: item.name || item.rawName,
            brand: item.brand,
            packageName: item.packageName,
            baseUnitName: item.baseUnitName,
            unitsPerPackage: item.unitsPerPackage,
            quantity: Number(item.quantity),
            purchaseCostPrice: roundMoney(item.costPricePerPieceTJS),
            effectiveCostPricePerPieceTJS: roundMoney(item.effectiveCostPricePerPieceTJS),
            expensePercent: Number(item.expensePercent || 0),
            sellingPrice: roundMoney(item.sellingPrice || 0),
          })),
        },
        { timeout: 300000 },
      );

      const {
        importedCount,
        failedByLineIndex,
        remainingRows,
        firstFailedLineIndex,
      } = buildOcrImportResult(response.data, importRows, ocrResults);

      setOcrImportedCount((prev) => prev + importedCount);

      if (failedByLineIndex.size > 0) {
        setOcrResults(remainingRows);
        setShowOnlyProblematicOcrRows(true);
        if (firstFailedLineIndex) {
          jumpToOcrLine(firstFailedLineIndex);
        }
        toast.error(
          `Добавлено ${ocrImportedCount + importedCount} из ${ocrOriginalCount}. Осталось проверить ${failedByLineIndex.size} строк.`,
        );
      } else if (remainingRows.length > 0) {
        setOcrResults(remainingRows);
        setShowOnlyProblematicOcrRows(false);
        setHighlightedOcrLine(null);
        toast.success(`Добавлено ${ocrImportedCount + importedCount} из ${ocrOriginalCount}. Осталось ${remainingRows.length} строк.`);
      } else {
        toast.success(`Все товары успешно добавлены на склад: ${ocrImportedCount + importedCount} из ${ocrOriginalCount} строк`);
        closeOcrResultsModal();
      }

      await fetchInitialData();
    } catch (err: any) {
      toast.error('Ошибка при добавлении товаров: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsLoading(false);
    }
  };

  return {
    handleAddOcrToStock,
  };
}
