import { formatMoney } from '../format';
import { formatProductName } from '../productName';

const escapeHtml = (value: unknown) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

interface SalesInvoicePrintOptions {
  invoice: any;
  statusLabel: string;
  subtotal: number;
  discountAmount: number;
  netAmount: number;
  balanceAmount: number;
  changeAmount: number;
  appliedPaidAmount: number;
}

export function printSalesInvoice({
  invoice,
  subtotal,
  discountAmount,
  netAmount,
}: SalesInvoicePrintOptions) {
  if (typeof window === 'undefined' || !invoice) {
    return { ok: false, reason: 'invalid' as const };
  }

  const printWindow = window.open('', '_blank', 'width=980,height=900');
  if (!printWindow) {
    return { ok: false, reason: 'blocked' as const };
  }

  const itemsRows = Array.isArray(invoice.items)
    ? invoice.items
        .map(
          (item: any, index: number) => `
            <tr>
              <td>${index + 1}</td>
              <td>${escapeHtml(formatProductName(item.product_name))}</td>
              <td>${escapeHtml(item.quantityLabel || `${item.quantity} ${item.unit || ''}`)}</td>
              <td>${escapeHtml(formatMoney(item.sellingPrice))}</td>
              <td>${escapeHtml(formatMoney(item.totalPrice))}</td>
            </tr>
          `,
        )
        .join('')
    : '';

  const companyLocation = [invoice.company_country, invoice.company_region, invoice.company_city]
    .filter(Boolean)
    .join(', ');

  const customerDetails = [invoice.customer_phone, invoice.customer_address].filter(Boolean).join('<br/>');

  const html = `
    <!doctype html>
    <html lang="ru">
      <head>
        <meta charset="utf-8" />
        <title>Накладная #${invoice.id}</title>
        <style>
          * { box-sizing: border-box; }
          body { margin: 0; padding: 32px; font-family: Arial, sans-serif; color: #0f172a; background: #ffffff; }
          .sheet { max-width: 900px; margin: 0 auto; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 24px; }
          .title { font-size: 28px; font-weight: 700; margin: 0 0 8px; }
          .muted { color: #475569; font-size: 14px; line-height: 1.6; }
          .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin-bottom: 24px; }
          .card { border: 1px solid #e2e8f0; border-radius: 16px; padding: 16px; background: #f8fafc; }
          .label { margin: 0 0 8px; color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; font-weight: 700; }
          .value { margin: 0; font-size: 18px; font-weight: 700; }
          .subvalue { margin: 8px 0 0; color: #475569; font-size: 14px; line-height: 1.5; }
          .section { margin-top: 24px; }
          .section h3 { margin: 0 0 12px; font-size: 16px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #e2e8f0; padding: 12px; font-size: 14px; text-align: left; vertical-align: top; }
          th { background: #f8fafc; font-weight: 700; }
          .summary { margin-left: auto; margin-top: 24px; width: 320px; }
          .summary-row { display: flex; justify-content: space-between; gap: 16px; padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
          .summary-row.total { font-size: 20px; font-weight: 700; border-top: 2px solid #cbd5e1; margin-top: 8px; padding-top: 12px; }
          @media print { body { padding: 0; } .sheet { max-width: none; } }
        </style>
      </head>
      <body>
        <div class="sheet">
          <div class="header">
            <div>
              <h1 class="title">Накладная #${invoice.id}</h1>
            </div>
            <div class="muted" style="max-width: 340px; text-align: right;">
              <div style="font-size: 18px; font-weight: 700; color: #0f172a;">${escapeHtml(invoice.company_name || '---')}</div>
              ${companyLocation ? `<div>${escapeHtml(companyLocation)}</div>` : ''}
              ${invoice.company_address ? `<div>${escapeHtml(invoice.company_address)}</div>` : ''}
              ${invoice.company_phone ? `<div>${escapeHtml(invoice.company_phone)}</div>` : ''}
            </div>
          </div>

          <div class="grid">
            <div class="card">
              <p class="label">Клиент</p>
              <p class="value">${escapeHtml(invoice.customer_name || 'Обычный клиент')}</p>
              <p class="subvalue">${customerDetails || 'Нет данных клиента'}</p>
            </div>
            <div class="card">
              <p class="label">Дата</p>
              <p class="value">${escapeHtml(new Date(invoice.createdAt).toLocaleDateString('ru-RU'))}</p>
              <p class="subvalue">Накладная #${escapeHtml(invoice.id)}</p>
            </div>
          </div>

          <div class="section">
            <h3>Товары</h3>
            <table>
              <thead>
                <tr>
                  <th style="width: 52px;">№</th>
                  <th>Товар</th>
                  <th style="width: 140px;">Количество</th>
                  <th style="width: 140px;">Цена</th>
                  <th style="width: 140px;">Сумма</th>
                </tr>
              </thead>
              <tbody>${itemsRows}</tbody>
            </table>
          </div>

          <div class="summary">
            <div class="summary-row"><span>Подытог</span><strong>${escapeHtml(formatMoney(subtotal))}</strong></div>
            <div class="summary-row"><span>Скидка (${escapeHtml(invoice.discount || 0)}%)</span><strong>-${escapeHtml(formatMoney(discountAmount))}</strong></div>
            ${Number(invoice.returnedAmount || 0) > 0 ? `<div class="summary-row"><span>Возвращено</span><strong>-${escapeHtml(formatMoney(invoice.returnedAmount || 0))}</strong></div>` : ''}
            <div class="summary-row total"><span>Итого</span><span>${escapeHtml(formatMoney(netAmount))}</span></div>
          </div>
        </div>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.onload = () => {
    printWindow.print();
  };

  return { ok: true as const };
}
