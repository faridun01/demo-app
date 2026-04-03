import { formatMoney } from '../format';

const PAYMENT_EPSILON = 0.01;

const escapeHtml = (value: unknown) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const normalizeAddressLine = (...parts: unknown[]) =>
  parts
    .flatMap((value) => String(value ?? '').split(/\r?\n/g))
    .map((part) => part.trim())
    .filter(Boolean)
    .join(', ')
    .replace(/\s*,\s*/g, ', ')
    .replace(/\s+/g, ' ')
    .trim();

const normalizeDisplayBaseUnit = (value: unknown) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return 'шт';
  if (['пачка', 'пачки', 'пачек', 'шт', 'штук', 'штука', 'штуки', 'pcs', 'piece', 'pieces'].includes(normalized)) {
    return 'шт';
  }
  return normalized;
};

const getCustomerInvoiceQuantityLines = (item: any) => {
  const packageQuantity = Math.max(0, Number(item?.packageQuantity || 0));
  const extraUnitQuantity = Math.max(0, Number(item?.extraUnitQuantity || 0));
  const unitsPerPackage = Math.max(0, Number(item?.unitsPerPackageSnapshot ?? item?.unitsPerPackage ?? 0));
  const packageName = String(item?.packageNameSnapshot || item?.packageName || '').trim();
  const baseUnitName = normalizeDisplayBaseUnit(item?.baseUnitNameSnapshot || item?.baseUnitName || item?.unit || 'шт');
  const quantity = Math.max(0, Number(item?.quantity || 0));

  if (packageQuantity > 0 && packageName) {
    const primaryLine =
      extraUnitQuantity > 0
        ? `${packageQuantity} ${packageName} + ${extraUnitQuantity} ${baseUnitName}`
        : `${packageQuantity} ${packageName}`;
    const lines = [primaryLine];

    if (unitsPerPackage > 0) {
      lines.push(`${packageQuantity * unitsPerPackage} ${baseUnitName} в ${packageName}`);
    }

    return lines;
  }

  return [`${quantity} ${baseUnitName}`];
};

export interface CustomerInvoicePrintCustomer {
  name?: string;
  phone?: string;
  country?: string;
  region?: string;
  city?: string;
  address?: string;
}

export interface CustomerInvoicePrintOptions {
  invoice: any;
  customer: CustomerInvoicePrintCustomer | null;
  statusLabel: string;
  subtotal: number;
  discountAmount: number;
  netAmount: number;
  appliedPaidAmount: number;
  changeAmount: number;
}

interface BatchCustomerInvoicePrintOptions {
  invoices: CustomerInvoicePrintOptions[];
  filterLabel: string;
  generatedAt?: Date;
}

const renderPaymentsBlock = (invoice: any) =>
  Array.isArray(invoice.paymentEvents) && invoice.paymentEvents.length > 0
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
            ${invoice.paymentEvents
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

const renderReturnsBlock = (invoice: any) =>
  Array.isArray(invoice.returnEvents) && invoice.returnEvents.length > 0
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
            ${invoice.returnEvents
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

const renderCustomerInvoiceSection = (
  {
    invoice,
    customer,
    statusLabel,
    subtotal,
    discountAmount,
    netAmount,
    appliedPaidAmount,
    changeAmount,
  }: CustomerInvoicePrintOptions,
  meta?: {
    pageNumber?: number;
    totalPages?: number;
    generatedAt?: Date;
    filterLabel?: string;
  },
) => {
  const customerAddress = normalizeAddressLine(customer?.country, customer?.region, customer?.city, customer?.address);
  const sellerRegionLine = [invoice.company_country, invoice.company_region].filter(Boolean).join(', ');
  const sellerCityLine = [invoice.company_city, invoice.company_address].filter(Boolean).join(', ');
  const invoiceDateLabel = new Date(invoice.createdAt).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const itemsRows = Array.isArray(invoice.items)
    ? invoice.items
        .map(
          (item: any, index: number) => `
            <tr>
              <td>${index + 1}</td>
              <td>${escapeHtml(item.product?.name || '---')}</td>
              <td>${getCustomerInvoiceQuantityLines(item).map((line) => `<div>${escapeHtml(line)}</div>`).join('')}</td>
              <td>${escapeHtml(formatMoney(item.sellingPrice))}</td>
              <td>${escapeHtml(formatMoney(Number(item.quantity || 0) * Number(item.sellingPrice || 0)))}</td>
            </tr>
          `,
        )
        .join('')
    : '';

  const pageMeta =
    meta?.pageNumber && meta?.totalPages
      ? `
        <div class="doc-meta">
          <div>Страница: ${escapeHtml(`${meta.pageNumber} из ${meta.totalPages}`)}</div>
          ${meta?.filterLabel ? `<div>Фильтр: ${escapeHtml(meta.filterLabel)}</div>` : ''}
          ${meta?.generatedAt ? `<div>Сформировано: ${escapeHtml(meta.generatedAt.toLocaleString('ru-RU'))}</div>` : ''}
        </div>
      `
      : '';

  return `
    <section class="sheet">
      ${pageMeta}
      <div class="header">
        <h1 class="title">Накладная №${invoice.id}</h1>
        <div class="subtitle">${escapeHtml(invoiceDateLabel)}</div>
      </div>
      <div class="parties">
        <div class="party-block">
          <p class="label">Компания</p>
          <p class="value">${escapeHtml(invoice.company_name || '---')}</p>
          ${sellerRegionLine ? `<p class="subvalue">${escapeHtml(sellerRegionLine)}</p>` : ''}
          ${sellerCityLine ? `<p class="subvalue">${escapeHtml(sellerCityLine)}</p>` : ''}
          ${invoice.company_phone ? `<p class="subvalue">${escapeHtml(invoice.company_phone)}</p>` : ''}
        </div>
        <div class="party-block">
          <p class="label">Клиент</p>
          <p class="value">${escapeHtml(customer?.name || '---')}</p>
          ${customer?.phone ? `<p class="subvalue">Телефон: ${escapeHtml(customer.phone)}</p>` : ''}
          ${customerAddress ? `<p class="subvalue">Адрес: ${escapeHtml(customerAddress)}</p>` : ''}
        </div>
        <div class="party-block party-meta">
          <p class="label">Информация</p>
          <p class="value">Статус: ${escapeHtml(statusLabel)}</p>
          <p class="subvalue">${
            changeAmount > PAYMENT_EPSILON
              ? `Сдача клиенту: ${escapeHtml(formatMoney(changeAmount))}`
              : `Остаток: ${escapeHtml(formatMoney(invoice.invoiceBalance))}`
          }</p>
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
        <div class="summary-row"><span>Скидка (${escapeHtml(invoice.discount)}%)</span><strong>-${escapeHtml(formatMoney(discountAmount))}</strong></div>
        ${Number(invoice.returnedAmount || 0) > 0 ? `<div class="summary-row"><span>Возвращено</span><strong>-${escapeHtml(formatMoney(invoice.returnedAmount))}</strong></div>` : ''}
        <div class="summary-row total"><span>ИТОГО</span><strong>${escapeHtml(formatMoney(netAmount))}</strong></div>
        <div class="summary-row"><span>Оплачено</span><strong>${escapeHtml(formatMoney(appliedPaidAmount))}</strong></div>
        <div class="summary-row"><span>Остаток</span><strong>${escapeHtml(formatMoney(invoice.invoiceBalance))}</strong></div>
      </div>
      ${renderPaymentsBlock(invoice)}
      ${renderReturnsBlock(invoice)}
    </section>
  `;
};

const buildDocumentHtml = (sectionsHtml: string, title: string, autoClose = false) => `<!doctype html>
  <html lang="ru">
    <head>
      <meta charset="utf-8" />
      <title>${escapeHtml(title)}</title>
      <style>
        * { box-sizing: border-box; }
        body { margin: 0; padding: 24px; font-family: Arial, sans-serif; color: #0f172a; background: #fff; }
        .sheet { max-width: 900px; margin: 0 auto; }
        .sheet + .sheet { page-break-before: always; margin-top: 24px; }
        .doc-meta { display: flex; justify-content: space-between; gap: 12px; margin: 0 auto 12px; max-width: 900px; color: #64748b; font-size: 11px; }
        .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 14px; }
        .title { font-size: 30px; font-weight: 800; margin: 0; }
        .subtitle { margin-top: 6px; font-size: 16px; font-weight: 700; color: #334155; }
        .parties { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; margin-bottom: 18px; }
        .party-block { padding: 0; border: none; background: transparent; }
        .party-meta { text-align: right; }
        .label { margin: 0 0 6px; color: #64748b; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 700; }
        .value { margin: 0; font-size: 16px; font-weight: 800; }
        .subvalue { margin: 4px 0 0; color: #475569; font-size: 12px; line-height: 1.35; font-weight: 700; }
        .section { margin-top: 18px; }
        .section h3 { margin: 0 0 10px; font-size: 14px; font-weight: 800; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #0f172a; padding: 9px; font-size: 12px; text-align: left; vertical-align: top; font-weight: 800; }
        th { background: #f8fafc; font-weight: 800; }
        .summary { margin-left: auto; margin-top: 18px; width: 300px; }
        .summary-row { display: flex; justify-content: space-between; gap: 16px; padding: 6px 0; border-bottom: 1px solid #0f172a; font-size: 12px; font-weight: 800; }
        .summary-row.total { font-size: 22px; font-weight: 900; border-top: 3px solid #0f172a; border-bottom: 3px solid #0f172a; margin-top: 8px; padding: 12px 0; letter-spacing: 0.08em; }
        @page { size: A4 portrait; margin: 10mm; }
      </style>
    </head>
    <body>
      ${sectionsHtml}
      ${
        autoClose
          ? `<script>
              window.onload = () => {
                window.print();
                setTimeout(() => window.close(), 300);
              };
            </script>`
          : ''
      }
    </body>
  </html>`;

export function printCustomerInvoice(options: CustomerInvoicePrintOptions) {
  if (typeof window === 'undefined' || !options.invoice || !options.customer) {
    return { ok: false, reason: 'invalid' as const };
  }

  const printWindow = window.open('', '_blank', 'width=980,height=900');
  if (!printWindow) {
    return { ok: false, reason: 'blocked' as const };
  }

  const html = buildDocumentHtml(renderCustomerInvoiceSection(options), `Накладная #${options.invoice.id}`, true);

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();

  return { ok: true as const };
}

export function printCustomerInvoicesBatch({
  invoices,
  filterLabel,
  generatedAt = new Date(),
}: BatchCustomerInvoicePrintOptions) {
  if (typeof window === 'undefined' || !Array.isArray(invoices) || invoices.length === 0) {
    return { ok: false as const, reason: 'invalid' as const };
  }

  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.opacity = '0';

  const cleanup = () => {
    window.setTimeout(() => {
      iframe.remove();
    }, 300);
  };

  document.body.appendChild(iframe);

  const iframeDocument = iframe.contentDocument || iframe.contentWindow?.document;
  const iframeWindow = iframe.contentWindow;

  if (!iframeDocument || !iframeWindow) {
    cleanup();
    return { ok: false as const, reason: 'unavailable' as const };
  }

  const sectionsHtml = invoices
    .map((invoice, index) =>
      renderCustomerInvoiceSection(invoice, {
        pageNumber: index + 1,
        totalPages: invoices.length,
        generatedAt,
        filterLabel,
      }),
    )
    .join('');

  iframeDocument.open();
  iframeDocument.write(buildDocumentHtml(sectionsHtml, `Накладные - ${filterLabel}`));
  iframeDocument.close();

  iframe.onload = () => {
    iframeWindow.focus();
    iframeWindow.print();
    cleanup();
  };

  return { ok: true as const };
}
