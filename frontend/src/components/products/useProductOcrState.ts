import React from 'react';
import { getOcrProblemReason } from '../../utils/productsViewUtils';

export default function useProductOcrState() {
  const [ocrResults, setOcrResults] = React.useState<any[] | null>(null);
  const [ocrOriginalCount, setOcrOriginalCount] = React.useState(0);
  const [ocrImportedCount, setOcrImportedCount] = React.useState(0);
  const [usdRate, setUsdRate] = React.useState<string>('10.95');
  const [scanExpensePercent, setScanExpensePercent] = React.useState<string>('0');
  const [showOnlyProblematicOcrRows, setShowOnlyProblematicOcrRows] = React.useState(false);
  const [highlightedOcrLine, setHighlightedOcrLine] = React.useState<number | null>(null);
  const ocrRowRefs = React.useRef<Record<number, HTMLDivElement | null>>({});

  const closeOcrResultsModal = () => {
    setOcrResults(null);
    setOcrOriginalCount(0);
    setOcrImportedCount(0);
    setShowOnlyProblematicOcrRows(false);
    setHighlightedOcrLine(null);
  };

  const invalidOcrRowsCount = Array.isArray(ocrResults)
    ? ocrResults.filter((item) => item.enabled !== false && getOcrProblemReason(item, usdRate, scanExpensePercent)).length
    : 0;

  const visibleOcrResults = Array.isArray(ocrResults)
    ? ocrResults.filter((item) =>
      showOnlyProblematicOcrRows
        ? item.enabled !== false && Boolean(getOcrProblemReason(item, usdRate, scanExpensePercent))
        : true
    )
    : [];

  const problematicOcrRows = Array.isArray(ocrResults)
    ? ocrResults
      .filter((item) => item.enabled !== false)
      .map((item) => ({
        lineIndex: Number(item.lineIndex || 0),
        reason: getOcrProblemReason(item, usdRate, scanExpensePercent),
      }))
      .filter((item): item is { lineIndex: number; reason: string } => Boolean(item.reason))
      .sort((a, b) => a.lineIndex - b.lineIndex)
    : [];

  const jumpToOcrLine = (lineIndex: number) => {
    setShowOnlyProblematicOcrRows(true);
    setHighlightedOcrLine(lineIndex);

    window.setTimeout(() => {
      const target = ocrRowRefs.current[lineIndex];
      target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);

    window.setTimeout(() => {
      setHighlightedOcrLine((current) => (current === lineIndex ? null : current));
    }, 2200);
  };

  return {
    ocrResults,
    setOcrResults,
    ocrOriginalCount,
    setOcrOriginalCount,
    ocrImportedCount,
    setOcrImportedCount,
    usdRate,
    setUsdRate,
    scanExpensePercent,
    setScanExpensePercent,
    showOnlyProblematicOcrRows,
    setShowOnlyProblematicOcrRows,
    highlightedOcrLine,
    setHighlightedOcrLine,
    ocrRowRefs,
    closeOcrResultsModal,
    invalidOcrRowsCount,
    visibleOcrResults,
    problematicOcrRows,
    jumpToOcrLine,
  };
}
