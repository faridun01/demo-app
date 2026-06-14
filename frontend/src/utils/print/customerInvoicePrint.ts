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

const normalizeStatusLabel = (value: unknown) => {
  const normalized = String(value || '').trim().toLowerCase();

  if (normalized.includes('част')) {
    return 'Частично оплачено';
  }

  if (normalized.includes('не')) {
    return 'Не оплачено';
  }

  if (normalized.includes('смеш')) {
    return 'Смешанные статусы';
  }

  return 'Оплачено';
};

const formatRuDate = (value: unknown, withTime = false) => {
  const date = new Date(String(value || ''));
  if (Number.isNaN(date.getTime())) {
    return '---';
  }

  return withTime ? date.toLocaleString('ru-RU') : date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
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

export interface CustomerInvoicesBatchCustomer {
  id: number;
  name: string;
  phone?: string;
  purchasedTotal: number;
  paidTotal: number;
  debtTotal: number;
  statusLabel: string;
  invoices: CustomerInvoicePrintOptions[];
}

export interface CustomerReconciliationBatchCustomer {
  id: number;
  name: string;
  phone?: string;
  purchasedTotal: number;
  paidTotal: number;
  debtTotal: number;
  statusLabel: string;
  invoices: any[];
}

interface BatchCustomerInvoicePrintOptions {
  customers: CustomerInvoicesBatchCustomer[];
  filterLabel: string;
  generatedAt?: Date;
}

interface ReconciliationBatchPrintOptions {
  customers: CustomerReconciliationBatchCustomer[];
  filterLabel: string;
  sortLabel: string;
  generatedAt?: Date;
  includeCustomerDetails?: boolean;
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
                    <td>${escapeHtml(formatRuDate(payment.createdAt, true))}</td>
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
                    <td>${escapeHtml(formatRuDate(itemReturn.createdAt, true))}</td>
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
  const invoiceDateLabel = formatRuDate(invoice.createdAt);
  const normalizedInvoiceStatusLabel = normalizeStatusLabel(statusLabel);
  const invoiceBalance = Math.max(0, Number(invoice?.invoiceBalance || 0));
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
          <p class="value">Статус: ${escapeHtml(normalizedInvoiceStatusLabel)}</p>
          <p class="subvalue">${
            changeAmount > PAYMENT_EPSILON
              ? `Сдача клиенту: ${escapeHtml(formatMoney(changeAmount))}`
              : `Остаток: ${escapeHtml(formatMoney(invoiceBalance))}`
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
        <div class="summary-row"><span>Остаток</span><strong>${escapeHtml(formatMoney(invoiceBalance))}</strong></div>
      </div>
      ${renderPaymentsBlock(invoice)}
      ${renderReturnsBlock(invoice)}
    </section>
  `;
};

const renderBatchOverviewSection = (
  customers: CustomerInvoicesBatchCustomer[],
  filterLabel: string,
  generatedAt: Date,
) => `
  <section class="sheet">
    <div class="header">
      <h1 class="title">Клиенты и долги</h1>
      <div class="subtitle">Фильтр: ${escapeHtml(filterLabel)} | ${escapeHtml(generatedAt.toLocaleString('ru-RU'))}</div>
    </div>
    <div class="section section-no-gap">
      <h3>Список клиентов</h3>
      <table>
        <thead>
          <tr>
            <th>Клиент</th>
            <th>Телефон</th>
            <th>Купил всего</th>
            <th>Оплатил всего</th>
            <th>Долг</th>
            <th>Статус оплаты</th>
          </tr>
        </thead>
        <tbody>
          ${customers
            .map(
              (customer) => `
                <tr>
                  <td>${escapeHtml(customer.name)}</td>
                  <td>${escapeHtml(customer.phone || 'Нет телефона')}</td>
                  <td>${escapeHtml(formatMoney(customer.purchasedTotal))}</td>
                  <td>${escapeHtml(formatMoney(customer.paidTotal))}</td>
                  <td>${escapeHtml(formatMoney(customer.debtTotal))}</td>
                  <td>${escapeHtml(normalizeStatusLabel(customer.statusLabel))}</td>
                </tr>
              `,
            )
            .join('')}
        </tbody>
      </table>
    </div>
  </section>
`;

const renderCustomerGroupHeader = (customer: CustomerInvoicesBatchCustomer) => `
  <section class="sheet customer-group-sheet">
    <div class="customer-group-card">
      <div>
        <p class="label">Клиент</p>
        <p class="value">${escapeHtml(customer.name)}</p>
        <p class="subvalue">${escapeHtml(customer.phone || 'Нет телефона')}</p>
        <p class="subvalue">Накладные: ${escapeHtml(customer.invoices.map((entry) => `#${entry.invoice?.id}`).join(', '))}</p>
      </div>
      <div class="customer-group-grid">
        <div class="customer-group-stat">
          <span class="customer-group-stat-label">Номера накладных</span>
          <strong>${escapeHtml(customer.invoices.map((entry) => `#${entry.invoice?.id}`).join(', '))}</strong>
        </div>
        <div class="customer-group-stat">
          <span class="customer-group-stat-label">Купил всего</span>
          <strong>${escapeHtml(formatMoney(customer.purchasedTotal))}</strong>
        </div>
        <div class="customer-group-stat">
          <span class="customer-group-stat-label">Оплатил всего</span>
          <strong>${escapeHtml(formatMoney(customer.paidTotal))}</strong>
        </div>
        <div class="customer-group-stat">
          <span class="customer-group-stat-label">Долг</span>
          <strong>${escapeHtml(formatMoney(customer.debtTotal))}</strong>
        </div>
        <div class="customer-group-stat">
          <span class="customer-group-stat-label">Статус оплаты</span>
          <strong>${escapeHtml(normalizeStatusLabel(customer.statusLabel))}</strong>
        </div>
      </div>
    </div>
  </section>
`;

const getInvoiceStatementEntries = (invoice: any) => {
  const invoiceDate = invoice?.createdAt || new Date().toISOString();
  const invoiceNumber = invoice?.id ? `Накладная №${invoice.id}` : 'Накладная';
  const invoiceDebit = Math.max(0, Number(invoice?.netAmount || 0));
  const entries = [
    {
      date: invoiceDate,
      document: invoiceNumber,
      description: 'Реализация товара',
      debit: invoiceDebit,
      credit: 0,
    },
  ];

  if (Array.isArray(invoice?.paymentEvents)) {
    invoice.paymentEvents.forEach((payment: any) => {
      entries.push({
        date: payment?.createdAt || invoiceDate,
        document: `Оплата по ${invoiceNumber}`,
        description: payment?.method ? `Оплата (${payment.method})` : 'Оплата',
        debit: 0,
        credit: Math.max(0, Number(payment?.amount || 0)),
      });
    });
  }

  if (Array.isArray(invoice?.returnEvents)) {
    invoice.returnEvents.forEach((itemReturn: any) => {
      entries.push({
        date: itemReturn?.createdAt || invoiceDate,
        document: `Возврат по ${invoiceNumber}`,
        description: itemReturn?.reason || 'Возврат товара',
        debit: 0,
        credit: Math.max(0, Number(itemReturn?.totalValue || 0)),
      });
    });
  }

  return entries;
};

const renderReconciliationOverviewSection = (customers: CustomerReconciliationBatchCustomer[]) => {
  const totals = customers.reduce(
    (acc, customer) => {
      acc.debit += Number(customer.purchasedTotal || 0);
      acc.credit += Number(customer.paidTotal || 0);
      acc.balance += Number(customer.debtTotal || 0);
      return acc;
    },
    { debit: 0, credit: 0, balance: 0 },
  );

  return `
    <section class="sheet reconciliation-sheet">
      <div class="header reconciliation-header">
        <h1 class="title">Акт сверки взаиморасчетов</h1>
      </div>
      <div class="section section-no-gap">
        <h3>Сводная таблица</h3>
        <table class="reconciliation-table reconciliation-overview-table">
          <thead>
            <tr>
              <th style="width: 34px;">№</th>
              <th>Клиент</th>
              <th style="width: 92px;">Телефон</th>
              <th style="width: 88px;">Продано</th>
              <th style="width: 88px;">Оплачено</th>
              <th style="width: 92px;">Долг клиента</th>
              <th style="width: 72px;">Дата</th>
              <th style="width: 104px;">Подпись</th>
            </tr>
          </thead>
          <tbody>
            ${customers
              .map(
                (customer, index) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td class="customer-name-cell">${escapeHtml(customer.name)}</td>
                    <td>${escapeHtml(customer.phone || 'Нет телефона')}</td>
                    <td>${escapeHtml(formatMoney(customer.purchasedTotal))}</td>
                    <td>${escapeHtml(formatMoney(customer.paidTotal))}</td>
                    <td>${escapeHtml(formatMoney(customer.debtTotal))}</td>
                    <td class="manual-cell"></td>
                    <td class="manual-cell"></td>
                  </tr>
                `,
              )
              .join('')}
            <tr>
              <td colspan="3"><strong>Итого</strong></td>
              <td><strong>${escapeHtml(formatMoney(totals.debit))}</strong></td>
              <td><strong>${escapeHtml(formatMoney(totals.credit))}</strong></td>
              <td><strong>${escapeHtml(formatMoney(totals.balance))}</strong></td>
              <td></td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  `;
};

const renderCustomerReconciliationSection = (
  customer: CustomerReconciliationBatchCustomer,
) => {
  const invoiceRows = [...customer.invoices]
    .sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime())
    .map((invoice: any, entryIndex: number) => {
      const invoiceTotal = Math.max(0, Number(invoice?.netAmount || invoice?.totalAmount || 0));
      const paidByEvents = Array.isArray(invoice?.paymentEvents)
        ? invoice.paymentEvents.reduce((sum: number, payment: any) => sum + Math.max(0, Number(payment?.amount || 0)), 0)
        : 0;
      const paidAmount = Math.max(0, Math.max(Number(invoice?.paidAmount || 0), paidByEvents));
      const returnedByEvents = Array.isArray(invoice?.returnEvents)
        ? invoice.returnEvents.reduce((sum: number, itemReturn: any) => sum + Math.max(0, Number(itemReturn?.totalValue || 0)), 0)
        : 0;
      const returnedAmount = Math.max(0, Math.max(Number(invoice?.returnedAmount || 0), returnedByEvents));
      const invoiceBalance = Math.max(0, Number(invoice?.invoiceBalance ?? invoiceTotal - paidAmount));

      return `
        <tr>
          <td>${entryIndex + 1}</td>
          <td>${escapeHtml(formatRuDate(invoice.createdAt))}</td>
          <td>${escapeHtml(`Накладная №${invoice.id}`)}</td>
          <td>${escapeHtml(invoice.warehouse?.name || '---')}</td>
          <td>${escapeHtml(formatMoney(invoiceTotal))}</td>
          <td>${escapeHtml(formatMoney(paidAmount))}</td>
          <td>${escapeHtml(formatMoney(returnedAmount))}</td>
          <td>${escapeHtml(formatMoney(invoiceBalance))}</td>
        </tr>
      `;
    })
    .join('');

  const invoiceTotals = customer.invoices.reduce(
    (acc, invoice: any) => {
      const invoiceTotal = Math.max(0, Number(invoice?.netAmount || invoice?.totalAmount || 0));
      const paidByEvents = Array.isArray(invoice?.paymentEvents)
        ? invoice.paymentEvents.reduce((sum: number, payment: any) => sum + Math.max(0, Number(payment?.amount || 0)), 0)
        : 0;
      const paidAmount = Math.max(0, Math.max(Number(invoice?.paidAmount || 0), paidByEvents));
      const returnedByEvents = Array.isArray(invoice?.returnEvents)
        ? invoice.returnEvents.reduce((sum: number, itemReturn: any) => sum + Math.max(0, Number(itemReturn?.totalValue || 0)), 0)
        : 0;
      const returnedAmount = Math.max(0, Math.max(Number(invoice?.returnedAmount || 0), returnedByEvents));
      const invoiceBalance = Math.max(0, Number(invoice?.invoiceBalance ?? invoiceTotal - paidAmount));
      acc.total += invoiceTotal;
      acc.paid += paidAmount;
      acc.returned += returnedAmount;
      acc.balance += invoiceBalance;
      return acc;
    },
    { total: 0, paid: 0, returned: 0, balance: 0 },
  );

  return `
    <section class="sheet customer-group-sheet reconciliation-sheet">
      <div class="header reconciliation-header">
        <h1 class="title">Акт сверки</h1>
        <div class="subtitle customer-title">${escapeHtml(customer.name)}${customer.phone ? ` | ${escapeHtml(customer.phone)}` : ''}</div>
      </div>
      <div class="parties reconciliation-parties">
        <div class="party-block customer-party">
          <p class="label">Клиент</p>
          <p class="value customer-name-value">${escapeHtml(customer.name)}</p>
          ${customer.phone ? `<p class="subvalue">Телефон: ${escapeHtml(customer.phone)}</p>` : ''}
        </div>
        <div class="party-block">
          <p class="label">Итоги</p>
          <p class="value">Купил всего: ${escapeHtml(formatMoney(customer.purchasedTotal))}</p>
          <p class="subvalue">Оплатил: ${escapeHtml(formatMoney(customer.paidTotal))}</p>
        </div>
        <div class="party-block party-meta">
          <p class="label">Осталось оплатить</p>
          <p class="value">${escapeHtml(formatMoney(customer.debtTotal))}</p>
          <p class="subvalue">Накладные: ${escapeHtml(String(customer.invoices.length))}</p>
        </div>
      </div>
      <div class="section">
        <h3>Накладные и оплаты</h3>
        <table class="reconciliation-table reconciliation-detail-table">
          <thead>
            <tr>
              <th style="width: 38px;">№</th>
              <th style="width: 82px;">Дата</th>
              <th>Документ</th>
              <th style="width: 110px;">Склад</th>
              <th style="width: 110px;">Сумма</th>
              <th style="width: 110px;">Оплачено</th>
              <th style="width: 110px;">Возврат</th>
              <th style="width: 110px;">Остаток</th>
            </tr>
          </thead>
          <tbody>
            ${invoiceRows || '<tr><td colspan="8">Накладных нет</td></tr>'}
            <tr>
              <td colspan="4"><strong>Итого по клиенту</strong></td>
              <td><strong>${escapeHtml(formatMoney(invoiceTotals.total || customer.purchasedTotal))}</strong></td>
              <td><strong>${escapeHtml(formatMoney(invoiceTotals.paid || customer.paidTotal))}</strong></td>
              <td><strong>${escapeHtml(formatMoney(invoiceTotals.returned))}</strong></td>
              <td><strong>${escapeHtml(formatMoney(invoiceTotals.balance || customer.debtTotal))}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="signatures">
        <div class="signature-block">
          <div class="signature-line"><span>Дата</span><strong></strong></div>
          <div class="signature-line"><span>Агент</span><strong></strong></div>
          <div class="signature-line"><span>Подпись агента</span><strong></strong></div>
        </div>
        <div class="signature-block">
          <div class="signature-line"><span>Дата</span><strong></strong></div>
          <div class="signature-line"><span>Клиент</span><strong>${escapeHtml(customer.name)}</strong></div>
          <div class="signature-line"><span>Подпись клиента</span><strong></strong></div>
        </div>
      </div>
    </section>
  `;
};

const buildDocumentHtml = (
  sectionsHtml: string,
  title: string,
  autoClose = false,
  pageMargin = '10mm',
  bodyClass = '',
) => `<!doctype html>
  <html lang="ru">
    <head>
      <meta charset="utf-8" />
      <title>${escapeHtml(title)}</title>
      <style>
        * { box-sizing: border-box; }
        body { margin: 0; padding: 16px; font-family: Arial, sans-serif; color: #0f172a; background: #fff; }
        body.print-without-browser-header { padding: 10mm; }
        .sheet { max-width: 900px; margin: 0 auto; }
        .sheet + .sheet { page-break-before: always; margin-top: 24px; }
        .doc-meta { display: flex; justify-content: space-between; gap: 12px; margin: 0 auto 8px; max-width: 900px; color: #64748b; font-size: 9px; }
        .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 10px; }
        .title { font-size: 24px; font-weight: 800; margin: 0; }
        .subtitle { margin-top: 4px; font-size: 12px; font-weight: 700; color: #334155; }
        .parties { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-bottom: 12px; }
        .party-block { padding: 0; border: none; background: transparent; }
        .party-meta { text-align: right; }
        .label { margin: 0 0 4px; color: #64748b; font-size: 8px; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 700; }
        .value { margin: 0; font-size: 13px; font-weight: 800; }
        .subvalue { margin: 2px 0 0; color: #475569; font-size: 10px; line-height: 1.25; font-weight: 700; }
        .section { margin-top: 12px; }
        .section h3 { margin: 0 0 6px; font-size: 11px; font-weight: 800; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #0f172a; padding: 5px 6px; font-size: 10px; text-align: left; vertical-align: top; font-weight: 700; }
        th { background: #f8fafc; font-weight: 800; }
        .manual-cell { height: 28px; }
        .summary { margin-left: auto; margin-top: 12px; width: 260px; }
        .summary-row { display: flex; justify-content: space-between; gap: 12px; padding: 4px 0; border-bottom: 1px solid #0f172a; font-size: 10px; font-weight: 700; }
        .summary-row.total { font-size: 16px; font-weight: 900; border-top: 2px solid #0f172a; border-bottom: 2px solid #0f172a; margin-top: 6px; padding: 8px 0; letter-spacing: 0.06em; }
        .section-no-gap { margin-top: 0; }
        .customer-group-sheet { page-break-before: always; }
        .customer-group-card { display: grid; grid-template-columns: minmax(0, 180px) minmax(0, 1fr); gap: 12px; border: 2px solid #0f172a; padding: 12px; }
        .customer-group-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
        .customer-group-stat { border: 1px solid #0f172a; padding: 8px 10px; }
        .customer-group-stat-label { display: block; margin-bottom: 3px; color: #64748b; font-size: 8px; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 700; }
        .signatures { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px; margin-top: 28px; font-size: 11px; font-weight: 800; }
        .signature-block { display: grid; gap: 12px; }
        .signature-line { display: grid; grid-template-columns: 96px minmax(0, 1fr); align-items: end; gap: 10px; }
        .signature-line span { color: #334155; }
        .signature-line strong { min-height: 18px; border-bottom: 1px solid #0f172a; font-weight: 800; }
        .reconciliation-sheet { max-width: 960px; color: #000; }
        .reconciliation-header { text-align: left; border-bottom: 1px solid #000; padding-bottom: 5px; margin-bottom: 8px; }
        .reconciliation-header .title { font-size: 17px; font-weight: 700; }
        .reconciliation-header .subtitle { color: #000; font-size: 10px; font-weight: 700; line-height: 1.2; }
        .reconciliation-sheet .section h3 { font-size: 10px; font-weight: 700; margin-bottom: 4px; }
        .reconciliation-table { table-layout: fixed; }
        .reconciliation-table th,
        .reconciliation-table td { border: 1px solid #555; padding: 3px 4px; color: #000; font-size: 9px; line-height: 1.15; font-weight: 400; }
        .reconciliation-table th { background: #e6e6e6; text-align: center; font-weight: 700; }
        .reconciliation-overview-table td:nth-child(4),
        .reconciliation-overview-table td:nth-child(5),
        .reconciliation-overview-table td:nth-child(6),
        .reconciliation-detail-table td:nth-child(5),
        .reconciliation-detail-table td:nth-child(6),
        .reconciliation-detail-table td:nth-child(7),
        .reconciliation-detail-table td:nth-child(8) { text-align: right; white-space: nowrap; }
        .reconciliation-overview-table td:nth-child(7),
        .reconciliation-overview-table td:nth-child(8) { text-align: left; white-space: normal; }
        .customer-name-cell { font-size: 8.5px; line-height: 1.12; font-weight: 700; overflow-wrap: anywhere; word-break: break-word; hyphens: auto; }
        .customer-title { overflow-wrap: anywhere; word-break: break-word; }
        .reconciliation-parties { grid-template-columns: minmax(0, 2fr) minmax(130px, 1fr) minmax(130px, 1fr); gap: 10px; border: 1px solid #555; padding: 6px; margin-bottom: 8px; }
        .reconciliation-parties .party-block + .party-block { border-left: 1px solid #bbb; padding-left: 8px; }
        .reconciliation-parties .label { color: #333; font-size: 7.5px; letter-spacing: 0; }
        .reconciliation-parties .value { color: #000; font-size: 10px; line-height: 1.15; font-weight: 700; }
        .reconciliation-parties .subvalue { color: #000; font-size: 9px; font-weight: 400; }
        .customer-name-value { font-size: 9px; overflow-wrap: anywhere; word-break: break-word; }
        .reconciliation-sheet .manual-cell { height: 24px; }
        .reconciliation-sheet .signatures { gap: 18px; margin-top: 20px; font-size: 10px; }
        @page { size: A4 portrait; margin: ${escapeHtml(pageMargin)}; }
      </style>
    </head>
    <body class="${escapeHtml(bodyClass)}">
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
  customers,
  filterLabel,
  generatedAt = new Date(),
}: BatchCustomerInvoicePrintOptions) {
  if (typeof window === 'undefined' || !Array.isArray(customers) || customers.length === 0) {
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

  const sectionsHtml = renderBatchOverviewSection(customers, filterLabel, generatedAt);

  iframeDocument.open();
  iframeDocument.write(buildDocumentHtml(sectionsHtml, `Клиенты и долги - ${filterLabel}`));
  iframeDocument.close();

  iframe.onload = () => {
    iframeWindow.focus();
    iframeWindow.print();
    cleanup();
  };

  return { ok: true as const };
}

export function printCustomerReconciliationBatch({
  customers,
  includeCustomerDetails = true,
}: ReconciliationBatchPrintOptions) {
  if (typeof window === 'undefined' || !Array.isArray(customers) || customers.length === 0) {
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

  const sectionsHtml = [
    renderReconciliationOverviewSection(customers),
    ...(includeCustomerDetails ? customers.map((customer) => renderCustomerReconciliationSection(customer)) : []),
  ].join('');

  iframeDocument.open();
  iframeDocument.write(buildDocumentHtml(sectionsHtml, '', false, '0', 'print-without-browser-header'));
  iframeDocument.close();

  iframe.onload = () => {
    iframeWindow.focus();
    iframeWindow.print();
    cleanup();
  };

  return { ok: true as const };
}
