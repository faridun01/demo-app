import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type PriceListRow = {
  index: number;
  name: string;
  pricePerUnit: string;
  unitsPerPackage: string;
  pricePerPackage: string;
};

type PriceListOptions = {
  warehouseName: string;
  generatedAt?: Date;
  rows: PriceListRow[];
};

const PDF_TEXT = {
  title: 'ПРАЙС-ЛИСТ ТОВАРОВ',
  number: '№',
  item: 'Наименование товара',
  pricePerUnit: 'Цена за шт',
  unitsPerPackage: 'Упаковка',
  pricePerPackage: 'Цена за упак.',
  warehouse: 'Склад',
  generatedAt: 'Дата',
  positions: 'Позиций',
  shortTitle: 'Прайс-лист',
  page: 'Стр.',
} as const;

const PDF_FONT_FILE = 'arial.ttf';
const PDF_FONT_NAME = 'ArialUnicode';
const PDF_FONT_URL = '/fonts/arial.ttf';
const PDF_FONT_LOAD_ERROR = 'Не удалось загрузить PDF-шрифт';

let fontBase64Promise: Promise<string> | null = null;

const formatDateTime = (value: Date) =>
  value.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const formatDateForFile = (value: Date) => value.toISOString().slice(0, 10);

const buildSafeFilePart = (value: string) =>
  String(value || 'vse-sklady')
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_-]+/gi, '') || 'vse-sklady';

const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = '';

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
};

const loadPdfFontBase64 = async () => {
  if (!fontBase64Promise) {
    fontBase64Promise = fetch(PDF_FONT_URL).then(async (response) => {
      if (!response.ok) {
        throw new Error(PDF_FONT_LOAD_ERROR);
      }

      return arrayBufferToBase64(await response.arrayBuffer());
    });
  }

  return fontBase64Promise;
};

const ensurePdfFont = async (doc: jsPDF) => {
  const fonts = doc.getFontList();
  if (fonts[PDF_FONT_NAME]) {
    return;
  }

  const base64Font = await loadPdfFontBase64();
  doc.addFileToVFS(PDF_FONT_FILE, base64Font);
  doc.addFont(PDF_FONT_FILE, PDF_FONT_NAME, 'normal');
  doc.addFont(PDF_FONT_FILE, PDF_FONT_NAME, 'bold');
};

export async function downloadPriceListPdf({
  warehouseName,
  generatedAt = new Date(),
  rows,
}: PriceListOptions) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  await ensurePdfFont(doc);

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  const fileDate = formatDateForFile(generatedAt);
  const safeWarehouse = buildSafeFilePart(warehouseName);
  const generatedAtLabel = formatDateTime(generatedAt);

  doc.setTextColor(0, 0, 0);
  doc.setFont(PDF_FONT_NAME, 'bold');
  doc.setFontSize(13);
  doc.text(PDF_TEXT.title, pageWidth / 2, 14, { align: 'center' });

  doc.setFont(PDF_FONT_NAME, 'normal');
  doc.setFontSize(7.4);
  doc.text(`${PDF_TEXT.warehouse}: ${warehouseName}`, margin, 21);
  doc.text(`${PDF_TEXT.generatedAt}: ${generatedAtLabel}`, margin, 25.2);
  doc.text(`${PDF_TEXT.positions}: ${rows.length}`, pageWidth - margin, 25.2, { align: 'right' });

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.18);
  doc.line(margin, 29, pageWidth - margin, 29);

  autoTable(doc, {
    startY: 33,
    margin: { left: margin, right: margin, bottom: 10 },
    head: [[PDF_TEXT.number, PDF_TEXT.item, PDF_TEXT.pricePerUnit, PDF_TEXT.unitsPerPackage, PDF_TEXT.pricePerPackage]],
    body: rows.map((row) => [
      String(row.index),
      row.name,
      row.pricePerUnit,
      row.unitsPerPackage,
      row.pricePerPackage
    ]),
    theme: 'grid',
    styles: {
      font: PDF_FONT_NAME,
      fontSize: 6.8,
      lineColor: [0, 0, 0],
      lineWidth: 0.08,
      cellPadding: { top: 1, right: 1.2, bottom: 1, left: 1.2 },
      textColor: [0, 0, 0],
      valign: 'middle',
      overflow: 'linebreak',
    },
    headStyles: {
      font: PDF_FONT_NAME,
      fillColor: [230, 230, 230],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      fontSize: 6.9,
      halign: 'center',
      cellPadding: { top: 1.1, right: 1.2, bottom: 1.1, left: 1.2 },
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 96 },
      2: { cellWidth: 28, halign: 'right' },
      3: { cellWidth: 26, halign: 'center' },
      4: { cellWidth: 30, halign: 'right' },
    },
    didDrawPage: () => {
      const pageNumber = doc.getNumberOfPages();

      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.08);
      doc.line(margin, pageHeight - 8, pageWidth - margin, pageHeight - 8);
      doc.setTextColor(0, 0, 0);
      doc.setFont(PDF_FONT_NAME, 'normal');
      doc.setFontSize(6);
      doc.text(`${PDF_TEXT.shortTitle} - ${warehouseName}`, margin, pageHeight - 4);
      doc.text(`${PDF_TEXT.page} ${pageNumber}`, pageWidth - margin, pageHeight - 4, { align: 'right' });
    },
    rowPageBreak: 'avoid',
  });

  doc.save(`price_list_${safeWarehouse}_${fileDate}.pdf`);
}
