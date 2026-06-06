import type React from 'react';
import toast from 'react-hot-toast';
import client from '../../api/client';
import {
  getEffectiveStatus,
  getInvoiceAppliedPaidAmount,
  getInvoiceBalance,
  getInvoiceChangeAmount,
  getInvoiceDiscountAmount,
  getInvoiceNetAmount,
  getInvoiceSubtotal,
} from '../../utils/salesViewUtils';

type UseSalesInvoiceActionsOptions = {
  selectedInvoice: any;
  setSelectedInvoice: React.Dispatch<React.SetStateAction<any>>;
  setShowDetailsModal: React.Dispatch<React.SetStateAction<boolean>>;
  closeDetailsModal: () => void;
  closeEditModal: () => void;
  closePaymentModal: () => void;
  closeReturnModal: () => void;
  fetchInvoices: () => Promise<void>;
};

const useSalesInvoiceActions = ({
  selectedInvoice,
  setSelectedInvoice,
  setShowDetailsModal,
  closeDetailsModal,
  closeEditModal,
  closePaymentModal,
  closeReturnModal,
  fetchInvoices,
}: UseSalesInvoiceActionsOptions) => {
  const fetchInvoiceDetails = async (id: number) => {
    try {
      const res = await client.get(`/invoices/${id}`);
      setSelectedInvoice(res.data);
      setShowDetailsModal(true);
    } catch (err) {
      toast.error('Ошибка при загрузке деталей накладной');
    }
  };

  const handleDeleteInvoice = async (id: number) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту накладную? Это действие нельзя отменить.')) return;

    try {
      await client.delete(`/invoices/${id}`);
      toast.success('Накладная удалена');
      if (Number(selectedInvoice?.id) === Number(id)) {
        closeDetailsModal();
        closeEditModal();
        closePaymentModal();
        closeReturnModal();
        setSelectedInvoice(null);
      }
      await fetchInvoices();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Ошибка при удалении накладной');
    }
  };

  const handlePrintInvoice = async (invoice: any) => {
    if (!invoice) {
      return;
    }

    const effectiveStatus = getEffectiveStatus(invoice);
    const statusLabel = invoice?.cancelled
      ? 'Отменена'
      : effectiveStatus === 'paid'
        ? 'Оплачено'
        : effectiveStatus === 'partial'
          ? 'Частично оплачено'
          : 'Не оплачено';

    const { printSalesInvoice } = await import('../../utils/print/salesInvoicePrint');
    const result = printSalesInvoice({
      invoice,
      statusLabel,
      subtotal: getInvoiceSubtotal(invoice),
      discountAmount: getInvoiceDiscountAmount(invoice),
      netAmount: getInvoiceNetAmount(invoice),
      balanceAmount: getInvoiceBalance(invoice),
      changeAmount: getInvoiceChangeAmount(invoice),
      appliedPaidAmount: getInvoiceAppliedPaidAmount(invoice),
    });

    if (!result.ok && result.reason === 'blocked') {
      toast.error('Разрешите всплывающие окна для печати накладной');
    }
  };

  const handleQuickPrintInvoice = async (invoiceId: number) => {
    try {
      const res = await client.get(`/invoices/${invoiceId}`);
      await handlePrintInvoice(res.data);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || err?.message || 'Ошибка при подготовке печати');
    }
  };

  return {
    fetchInvoiceDetails,
    handleDeleteInvoice,
    handlePrintInvoice,
    handleQuickPrintInvoice,
  };
};

export default useSalesInvoiceActions;
