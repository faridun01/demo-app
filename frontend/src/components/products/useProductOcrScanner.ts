import React from 'react';
import toast from 'react-hot-toast';
import client from '../../api/client';
import { buildOcrScanItems } from '../../utils/productsViewUtils';

interface UseProductOcrScannerParams {
  selectedWarehouseId: string;
  setIsScanning: React.Dispatch<React.SetStateAction<boolean>>;
  setOcrOriginalCount: React.Dispatch<React.SetStateAction<number>>;
  setOcrImportedCount: React.Dispatch<React.SetStateAction<number>>;
  setOcrResults: React.Dispatch<React.SetStateAction<any[] | null>>;
  setScanExpensePercent: React.Dispatch<React.SetStateAction<string>>;
  setShowOnlyProblematicOcrRows: React.Dispatch<React.SetStateAction<boolean>>;
  setHighlightedOcrLine: React.Dispatch<React.SetStateAction<number | null>>;
}

export default function useProductOcrScanner({
  selectedWarehouseId,
  setIsScanning,
  setOcrOriginalCount,
  setOcrImportedCount,
  setOcrResults,
  setScanExpensePercent,
  setShowOnlyProblematicOcrRows,
  setHighlightedOcrLine,
}: UseProductOcrScannerParams) {
  const handleScanInvoice = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedWarehouseId) {
      toast.error('Пожалуйста, сначала выберите склад!');
      event.target.value = '';
      return;
    }

    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Поддерживаются JPG, PNG, WEBP или PDF файлы');
      event.target.value = '';
      return;
    }

    setIsScanning(true);
    const formData = new FormData();
    formData.append('invoice', file);

    try {
      const res = await client.post('/ocr/parse-invoice', formData, {
        timeout: 300000,
      });
      const items = buildOcrScanItems(res.data);

      if (!items.length) {
        toast.error('Сканирование завершено, но товары не были распознаны');
        setOcrOriginalCount(0);
        setOcrImportedCount(0);
        setOcrResults([]);
        return;
      }

      setOcrOriginalCount(items.length);
      setOcrImportedCount(0);
      setScanExpensePercent('0');
      setShowOnlyProblematicOcrRows(false);
      setHighlightedOcrLine(null);
      setOcrResults(items);
      toast.success('Накладная успешно отсканирована!');
    } catch (err: any) {
      const isTimeout =
        err?.code === 'ECONNABORTED' ||
        String(err?.message || '').toLowerCase().includes('timeout');

      toast.error(
        isTimeout
          ? 'Сканирование заняло слишком много времени. Подождите ещё немного, повторите попытку или используйте файл поменьше.'
          : err.response?.data?.error || err.message || 'Ошибка при сканировании накладной',
      );
    } finally {
      setIsScanning(false);
      event.target.value = '';
    }
  };

  return {
    handleScanInvoice,
  };
}
