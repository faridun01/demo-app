import { formatMoney } from '../format';
import { formatProductName } from '../productName';

const PAYMENT_EPSILON = 0.01;

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
  statusLabel,
  subtotal,
  discountAmount,
  netAmount,
  balanceAmount,
  changeAmount,
  appliedPaidAmount,
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
              <td>${escapeHtml(item.quantity)} ${escapeHtml(item.unit)}</td>
              <td>${escapeHtml(formatMoney(item.sellingPrice))}</td>
              <td>${escapeHtml(formatMoney(item.totalPrice))}</td>
            </tr>
          `,
        )
        .join('')
    : '';

  const paymentsBlock = Array.isArray(invoice.payments) && invoice.payments.length > 0
    ? `
      <div class="section">
        <h3>Оплаты</h3>
        <table>
          <thead>
            <tr>
              <th>Дата</th>
              <th>Сумма</th>
              <th>Сотрудник</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.payments
              .map(
                (payment: any) => `
                  <tr>
                    <td>${escapeHtml(new Date(payment.createdAt).toLocaleString('ru-RU'))}</td>
                    <td>${escapeHtml(formatMoney(payment.amount))}</td>
                    <td>${escapeHtml(payment.staff_name)}</td>
                  </tr>
                `,
              )
              .join('')}
          </tbody>
        </table>
      </div>
    `
    : '';

  const returnsBlock = Array.isArray(invoice.returns) && invoice.returns.length > 0
    ? `
      <div class="section">
        <h3>Возвраты</h3>
        <table>
          <thead>
            <tr>
              <th>Дата</th>
              <th>Сумма</th>
              <th>Причина</th>
              <th>Сотрудник</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.returns
              .map(
                (itemReturn: any) => `
                  <tr>
                    <td>${escapeHtml(new Date(itemReturn.createdAt).toLocaleString('ru-RU'))}</td>
                    <td>-${escapeHtml(formatMoney(itemReturn.totalValue))}</td>
                    <td>${escapeHtml(itemReturn.reason || '---')}</td>
                    <td>${escapeHtml(itemReturn.staff_name)}</td>
                  </tr>
                `,
              )
              .join('')}
          </tbody>
        </table>
      </div>
    `
    : '';

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
          .title { font-size: 30px; font-weight: 700; margin: 0 0 8px; }
          .muted { color: #475569; font-size: 14px; line-height: 1.6; }
          .grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; margin-bottom: 24px; }
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
              <div class="muted">
                <div>Дата: ${escapeHtml(new Date(invoice.createdAt).toLocaleString('ru-RU'))}</div>
                <div>Статус: ${escapeHtml(statusLabel)}</div>
                <div>Сотрудник: ${escapeHtml(invoice.staff_name || '---')}</div>
              </div>
            </div>
          </div>

          <div class="grid">
            <div class="card">
              <p class="label">Клиент</p>
              <p class="value">${escapeHtml(invoice.customer_name || 'Обычный клиент')}</p>
              <p class="subvalue">${escapeHtml(invoice.customer_phone || 'Нет телефона')}</p>
            </div>
            <div class="card">
              <p class="label">Склад</p>
              <p class="value">${escapeHtml(invoice.warehouse?.name || '---')}</p>
              <p class="subvalue">${escapeHtml(invoice.warehouse?.address || '---')}</p>
            </div>
            <div class="card">
              <p class="label">Оплата</p>
              <p class="value">${escapeHtml(formatMoney(appliedPaidAmount))}</p>
              <p class="subvalue">${changeAmount > PAYMENT_EPSILON ? `Сдача клиенту: ${escapeHtml(formatMoney(changeAmount))}` : `Остаток: ${escapeHtml(formatMoney(balanceAmount))}`}</p>
            </div>
          </div>

          <div class="section">
            <h3>Товары</h3>
            <table>
              <thead>
                <tr>
                  <th style="width: 52px;">№</th>
                  <th>Товар</th>
                  <th style="width: 120px;">Количество</th>
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
            ${changeAmount > PAYMENT_EPSILON ? `<div class="summary-row"><span>Сдача клиенту</span><strong>${escapeHtml(formatMoney(changeAmount))}</strong></div>` : ''}
          </div>

          ${paymentsBlock}
          ${returnsBlock}
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
