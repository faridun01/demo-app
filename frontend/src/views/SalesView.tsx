import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { 
  Plus, 
  Search, 
  Receipt, 
  ChevronDown,
  ChevronRight, 
  Pencil,
  Trash2, 
  X,
  Banknote,
  User as UserIcon,
  Warehouse as WarehouseIcon,
  CheckCircle2,
  Clock,
  AlertCircle,
  RotateCcw,
  Printer
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';
import { filterWarehousesForUser, getCurrentUser, getUserWarehouseId, isAdminUser } from '../utils/userAccess';
import { formatCount, formatMoney, toFixedNumber, ceilMoney } from '../utils/format';
import { formatProductName } from '../utils/productName';
import { getDefaultWarehouseId } from '../utils/warehouse';
import { getCustomers } from '../api/customers.api';
import { getWarehouses } from '../api/warehouses.api';
import SalesInvoicesSection from '../components/sales/SalesInvoicesSection';
import useSalesEditInvoice from '../components/sales/useSalesEditInvoice';
import useSalesInvoiceActions from '../components/sales/useSalesInvoiceActions';
import useSalesListData from '../components/sales/useSalesListData';
import useSalesPaymentActions from '../components/sales/useSalesPaymentActions';
import useSalesReturnActions from '../components/sales/useSalesReturnActions';
import type { EditProductOption, ReturnInvoiceItem } from '../components/sales/salesTypes';
import {
  SALES_PAYMENT_EPSILON,
  getEffectiveStatus,
  getInvoiceAppliedPaidAmount,
  getInvoiceBalance,
  getInvoiceChangeAmount,
  getInvoiceDiscountAmount,
  getInvoiceItemQuantityParts,
  getInvoiceItemReturnedQty,
  getInvoiceNetAmount,
  getInvoiceReturnedItems,
  getInvoiceSubtotal,
  getProductStockParts,
  getReturnItemDisplayName,
  getReturnItemPackaging,
  getReturnItemRemainingUnits,
  isPaymentActionDisabled,
  isReturnActionDisabled,
  normalizeDisplayBaseUnit,
} from '../utils/salesViewUtils';

export default function SalesView() {
  const PAYMENT_EPSILON = SALES_PAYMENT_EPSILON;
  const pageSize = 8;
  const [invoices, setInvoices] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const hasLoadedCustomersRef = React.useRef(false);
  const hasLoadedWarehousesRef = React.useRef(false);
  const user = React.useMemo(() => getCurrentUser(), []);
  const isAdmin = isAdminUser(user);
  const userWarehouseId = getUserWarehouseId(user);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>(userWarehouseId ? String(userWarehouseId) : '');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'partial' | 'unpaid'>('all');
  const [staffFilter, setStaffFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'createdAt',
    direction: 'desc',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();
  const location = useLocation();

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
  };

  const escapeHtml = (value: unknown) =>
    String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  useEffect(() => {
    fetchInvoices();
  }, [selectedWarehouseId, isAdmin, userWarehouseId]);

  useEffect(() => {
    const incomingWarehouseId = location.state && typeof location.state === 'object'
      ? String((location.state as { warehouseId?: string | number | null }).warehouseId || '')
      : '';

    if (!incomingWarehouseId) {
      return;
    }

    setSelectedWarehouseId(incomingWarehouseId);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    if (hasLoadedWarehousesRef.current) {
      return;
    }

    hasLoadedWarehousesRef.current = true;
    fetchWarehouses();
  }, [isAdmin]);

  useEffect(() => {
    if (hasLoadedCustomersRef.current) {
      return;
    }

    hasLoadedCustomersRef.current = true;
    fetchCustomers();
  }, []);

  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      const effectiveWarehouseId = !isAdmin && userWarehouseId ? String(userWarehouseId) : selectedWarehouseId;
      const query = effectiveWarehouseId ? `?warehouseId=${effectiveWarehouseId}` : '';
      const res = await client.get(`/invoices${query}`);
      setInvoices(Array.isArray(res.data) ? res.data.filter((invoice) => !invoice?.cancelled) : []);
    } catch (err) {
      toast.error('ÐžÑˆÐ¸Ð±ÐºÐ° Ð¿Ñ€Ð¸ Ð·Ð°Ð³Ñ€ÑƒÐ·ÐºÐµ Ð½Ð°ÐºÐ»Ð°Ð´Ð½Ñ‹Ñ…');
    } finally {
      setIsLoading(false);
    }
  };

  const {
    showEditModal,
    editCustomerId,
    editDiscount,
    editInvoiceItems,
    editProducts,
    editInvoiceSearch,
    openEditProductMenuKey,
    editProductMenuSearch,
    isSavingEdit,
    isEditItemsDirty,
    filteredEditInvoiceItems,
    editInvoiceSubtotal,
    editInvoiceDiscountAmount,
    editInvoiceTaxAmount,
    editInvoiceNetAmount,
    setEditCustomerId,
    setEditDiscount,
    setEditInvoiceSearch,
    setOpenEditProductMenuKey,
    setEditProductMenuSearch,
    closeEditModal,
    canEditInvoice,
    getEditBlockedReason,
    getEditProductMeta,
    findEditProductBySearch,
    updateEditInvoiceItem,
    getEditItemPackaging,
    getEditItemDefaultBulkPackaging,
    getEditItemMaxAllowedQuantity,
    updateNormalizedEditInvoiceItem,
    selectEditProductForItem,
    addEditInvoiceItem,
    removeEditInvoiceItem,
    openEditInvoiceModal,
    handleUpdateInvoice,
  } = useSalesEditInvoice({
    selectedInvoice,
    setSelectedInvoice,
    setInvoices,
    isAdmin,
    user,
    fetchInvoices,
  });

  const fetchWarehouses = async () => {
    try {
      const data = await getWarehouses();
      const filteredWarehouses = filterWarehousesForUser(Array.isArray(data) ? data : [], user);
      setWarehouses(filteredWarehouses);
      const defaultWarehouseId = getDefaultWarehouseId(filteredWarehouses);
      if (isAdmin && !selectedWarehouseId && defaultWarehouseId) {
        setSelectedWarehouseId(String(defaultWarehouseId));
      } else if (!isAdmin && filteredWarehouses[0]) {
        setSelectedWarehouseId(String(filteredWarehouses[0].id));
      }
    } catch (err) {
      hasLoadedWarehousesRef.current = false;
      console.error(err);
    }
  };

  const handleSort = (key: string) => {
    setSortConfig((current) => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const getStatusBadge = (status: string, cancelled: boolean) => {
    if (cancelled) return <span className="rounded-full bg-rose-50 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-rose-500">ÐžÑ‚Ð¼ÐµÐ½ÐµÐ½Ð°</span>;
    switch (status) {
      case 'paid': return <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-emerald-500">ÐžÐ¿Ð»Ð°Ñ‡ÐµÐ½Ð¾</span>;
      case 'partial': return <span className="rounded-full bg-amber-50 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-amber-500">Ð§Ð°ÑÑ‚Ð¸Ñ‡Ð½Ð¾</span>;
      default: return <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">ÐÐµ Ð¾Ð¿Ð»Ð°Ñ‡ÐµÐ½Ð¾</span>;
    }
  };

  const fetchCustomers = async () => {
    try {
      const data = await getCustomers();
      setCustomers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const applyInvoiceToHistory = (updatedInvoice: any) => {
    if (!updatedInvoice?.id) {
      return;
    }

    setInvoices((current) =>
      current.map((invoice) =>
        Number(invoice.id) === Number(updatedInvoice.id)
          ? {
              ...invoice,
              ...updatedInvoice,
              customer_name: updatedInvoice.customer_name || updatedInvoice.customer?.name || invoice.customer_name,
              staff_name: updatedInvoice.staff_name || updatedInvoice.user?.username || invoice.staff_name,
              items: Array.isArray(updatedInvoice.items) ? updatedInvoice.items : invoice.items,
              totalAmount: updatedInvoice.totalAmount,
              netAmount: updatedInvoice.netAmount,
              paidAmount: updatedInvoice.paidAmount,
              returnedAmount: updatedInvoice.returnedAmount,
              discount: updatedInvoice.discount,
              tax: updatedInvoice.tax,
              status: updatedInvoice.status,
              cancelled: Boolean(updatedInvoice.cancelled),
            }
          : invoice,
      ),
    );
  };

  const refreshSelectedInvoice = async (invoiceId: number) => {
    try {
      const res = await client.get(`/invoices/${invoiceId}`);
      setSelectedInvoice(res.data);
      applyInvoiceToHistory(res.data);
      return res.data;
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  const {
    showPaymentModal,
    setShowPaymentModal,
    paymentAmount,
    setPaymentAmount,
    isPaying,
    cancellingPaymentId,
    closePaymentModal,
    handlePayment,
    handleCancelPayment,
  } = useSalesPaymentActions({
    selectedInvoice,
    refreshSelectedInvoice,
    fetchInvoices,
  });

  const {
    showReturnModal,
    returnReason,
    returnItems,
    isReturning,
    setReturnReason,
    setReturnItems,
    closeReturnModal,
    openReturnInvoiceModal,
    handleReturn,
  } = useSalesReturnActions({
    selectedInvoice,
    setSelectedInvoice,
    refreshSelectedInvoice,
    fetchInvoices,
  });

  const {
    fetchInvoiceDetails,
    handleDeleteInvoice,
    handlePrintInvoice,
    handleQuickPrintInvoice,
  } = useSalesInvoiceActions({
    selectedInvoice,
    setSelectedInvoice,
    setShowDetailsModal,
    closeDetailsModal,
    closeEditModal,
    closePaymentModal,
    closeReturnModal,
    fetchInvoices,
  });

  useEffect(() => {
    if (!showDetailsModal && !showPaymentModal && !showReturnModal && !showEditModal) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') {
        return;
      }

      if (showPaymentModal) return closePaymentModal();
      if (showReturnModal) return closeReturnModal();
      if (showEditModal) return closeEditModal();
      if (showDetailsModal) return closeDetailsModal();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showDetailsModal, showEditModal, showPaymentModal, showReturnModal]);

  const {
    sortedInvoices,
    totalPages,
    paginatedInvoices,
    staffOptions,
  } = useSalesListData({
    invoices,
    search,
    statusFilter,
    staffFilter,
    dateFrom,
    dateTo,
    sortConfig,
    isAdmin,
    userWarehouseId,
    currentPage,
    pageSize,
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedWarehouseId, sortConfig.key, sortConfig.direction, statusFilter, staffFilter, dateFrom, dateTo]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const clearInvoiceFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setStaffFilter('all');
    setDateFrom('');
    setDateTo('');
  };

  return (
    <div className="min-h-full bg-[#e9edf2] px-3 py-3 text-[#1f2933] md:px-4">
      <div className="flex flex-col gap-3">
        <div className="rounded-md border border-[#b7c2ce] bg-[linear-gradient(180deg,#ffffff_0%,#dde5ee_100%)] px-4 py-3 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal text-[#1f2933]">ÐŸÑ€Ð¾Ð´Ð°Ð¶Ð¸</h1>
          <p className="mt-0.5 text-xs text-[#5f6f7f]">Ð£Ð¿Ñ€Ð°Ð²Ð»ÐµÐ½Ð¸Ðµ Ð½Ð°ÐºÐ»Ð°Ð´Ð½Ñ‹Ð¼Ð¸ Ð¸ Ð·Ð°ÐºÐ°Ð·Ð°Ð¼Ð¸ ÐºÐ»Ð¸ÐµÐ½Ñ‚Ð¾Ð².</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-4 mr-4">
             <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-slate-900 leading-none">{user.username}</p>
                <p className="mt-1 text-[10px] font-medium uppercase tracking-widest text-slate-400">{user.role}</p>
             </div>
          </div>
          {isAdmin && (
          <>
          <select 
            value={selectedWarehouseId}
            onChange={(e) => setSelectedWarehouseId(e.target.value)}
            disabled={!isAdmin}
            className="min-w-[200px] rounded border border-[#9fb7d5] bg-white px-3 py-2 text-sm font-medium text-[#1f2933] outline-none transition-colors focus:border-[#4f81bd]"
          >
            <option value="">Ð’ÑÐµ ÑÐºÐ»Ð°Ð´Ñ‹</option>
            {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
          <button 
            onClick={() => navigate('/pos')}
            className="flex items-center space-x-2 rounded border border-[#7f9db9] bg-[#eaf2fb] px-4 py-2 text-sm font-medium text-[#1f3f63] transition-colors hover:bg-[#dbeafd]"
          >
            <Plus size={18} />
            <span>ÐÐ¾Ð²Ð°Ñ Ð¿Ñ€Ð¾Ð´Ð°Ð¶Ð°</span>
          </button>
          </>
          )}
        </div>
      </div>
        </div>
      <SalesInvoicesSection
        isAdmin={isAdmin}
        invoicesCount={invoices.length}
        search={search}
        setSearch={setSearch}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        staffFilter={staffFilter}
        setStaffFilter={setStaffFilter}
        dateFrom={dateFrom}
        setDateFrom={setDateFrom}
        dateTo={dateTo}
        setDateTo={setDateTo}
        staffOptions={staffOptions}
        clearInvoiceFilters={clearInvoiceFilters}
        paginatedInvoices={paginatedInvoices}
        sortedInvoicesLength={sortedInvoices.length}
        isLoading={isLoading}
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        setCurrentPage={setCurrentPage}
        sortConfig={sortConfig}
        onSort={handleSort}
        getStatusBadge={getStatusBadge}
        setSelectedInvoice={setSelectedInvoice}
        setPaymentAmount={setPaymentAmount}
        setShowPaymentModal={setShowPaymentModal}
        openReturnInvoiceModal={openReturnInvoiceModal}
        canEditInvoice={canEditInvoice}
        getEditBlockedReason={getEditBlockedReason}
        openEditInvoiceModal={openEditInvoiceModal}
        fetchInvoiceDetails={fetchInvoiceDetails}
        handleQuickPrintInvoice={handleQuickPrintInvoice}
        handleDeleteInvoice={handleDeleteInvoice}
      />

      <AnimatePresence>
        {showDetailsModal && selectedInvoice && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeDetailsModal}
            className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/35 p-2 sm:items-center sm:p-3"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-md border border-[#9fb7d5] bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-[#b7c2ce] bg-[linear-gradient(180deg,#ffffff_0%,#dde5ee_100%)] px-4 py-3">
                <div className="flex items-center space-x-4">
                  <div className="rounded border border-[#9fb7d5] bg-[#eaf2fb] p-2 text-[#23527c]">
                    <Receipt size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900">ÐÐ°ÐºÐ»Ð°Ð´Ð½Ð°Ñ #{selectedInvoice.id}</h3>
                    <p className="text-slate-500 font-bold">{new Date(selectedInvoice.createdAt).toLocaleString('ru-RU')}</p>
                  </div>
                </div>
                <button onClick={closeDetailsModal} className="flex h-8 w-8 items-center justify-center rounded border border-[#9fb7d5] bg-white text-[#23527c] transition-colors hover:bg-[#eaf2fb]">
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex-1 space-y-4 overflow-y-auto bg-[#f3f5f7] p-3 md:p-4">
                <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                  <div className="rounded border border-[#c8d2df] bg-white p-3">
                    <div className="mb-2 flex items-center space-x-2 text-[#48627f]">
                      <UserIcon size={18} />
                      <span className="text-[10px] font-black uppercase tracking-widest">ÐšÐ»Ð¸ÐµÐ½Ñ‚</span>
                    </div>
                    <p className="text-lg font-black text-slate-900">{selectedInvoice.customer_name}</p>
                    <p className="text-sm font-bold text-slate-500 mt-1">{selectedInvoice.customer_phone || 'ÐÐµÑ‚ Ñ‚ÐµÐ»ÐµÑ„Ð¾Ð½Ð°'}</p>
                  </div>
                  <div className="rounded border border-[#c8d2df] bg-white p-3">
                    <div className="mb-2 flex items-center space-x-2 text-[#48627f]">
                      <WarehouseIcon size={18} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Ð¡ÐºÐ»Ð°Ð´</span>
                    </div>
                    <p className="text-lg font-black text-slate-900">{selectedInvoice.warehouse?.name}</p>
                    <p className="text-sm font-bold text-slate-500 mt-1">{selectedInvoice.warehouse?.address || '---'}</p>
                  </div>
                  <div className="rounded border border-[#c8d2df] bg-white p-3">
                    <div className="mb-2 flex items-center space-x-2 text-[#48627f]">
                      <Clock size={18} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Ð¡Ñ‚Ð°Ñ‚ÑƒÑ</span>
                    </div>
                    <div>{getStatusBadge(getEffectiveStatus(selectedInvoice), selectedInvoice.cancelled)}</div>
                    <p className="text-sm font-bold text-slate-500 mt-2">Ð¡Ð¾Ñ‚Ñ€ÑƒÐ´Ð½Ð¸Ðº: {selectedInvoice.staff_name}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="ml-1 text-sm font-semibold text-[#32465a]">Ð¢Ð¾Ð²Ð°Ñ€Ñ‹</h4>
                  <div className="overflow-hidden rounded border border-[#b7c2ce] bg-white">
                    <div className="space-y-3 p-3 md:hidden">
                      {selectedInvoice.items.map((item: any) => {
                        const quantityInfo = getInvoiceItemQuantityParts(item);
                        const returnedQty = getInvoiceItemReturnedQty(item);
                        const remainingQty = getReturnItemRemainingUnits(item);

                        return (
                          <div key={`mobile-item-${item.id}`} className="rounded-2xl bg-slate-50 p-3">
                            <p className="break-words text-sm font-black text-slate-900">{formatProductName(item.product_name)}</p>
                            <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                              <div className="rounded-xl bg-white px-2.5 py-2">
                                <p className="text-[9px] uppercase tracking-[0.14em] text-slate-400">ÐšÐ¾Ð»-Ð²Ð¾</p>
                                <p className="mt-1 whitespace-nowrap text-xs font-semibold text-slate-700">{quantityInfo.primary}</p>
                                {quantityInfo.secondary && (
                                  <p className="mt-0.5 whitespace-nowrap text-[10px] text-slate-400">{quantityInfo.secondary}</p>
                                )}
                              </div>
                              <div className="rounded-xl bg-white px-2.5 py-2">
                                <p className="text-[9px] uppercase tracking-[0.14em] text-slate-400">Ð¦ÐµÐ½Ð°</p>
                                <p className="mt-1 font-bold text-slate-700">{formatMoney(item.sellingPrice)}</p>
                              </div>
                              <div className="rounded-xl bg-white px-2.5 py-2">
                                <p className="text-[9px] uppercase tracking-[0.14em] text-slate-400">Ð˜Ñ‚Ð¾Ð³Ð¾</p>
                                <p className="mt-1 font-black text-slate-900">{formatMoney(item.totalPrice)}</p>
                              </div>
                            </div>
                            {returnedQty > PAYMENT_EPSILON && (
                              <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700">
                                <span>Ð’Ð¾Ð·Ð²Ñ€Ð°Ñ‰ÐµÐ½Ð¾: {formatCount(returnedQty)} {normalizeDisplayBaseUnit(item?.unit || item?.baseUnitNameSnapshot || item?.baseUnitName || 'ÑˆÑ‚')}</span>
                                <span className="text-slate-400">ÐžÑÑ‚Ð°Ð»Ð¾ÑÑŒ: {formatCount(remainingQty)}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <table className="hidden w-full border-collapse text-left text-sm md:table">
                      <thead>
                        <tr className="border-b border-[#b7c2ce] bg-[#dbe5f1] text-[12px] font-semibold text-[#32465a]">
                          <th className="px-3 py-2">Ð¢Ð¾Ð²Ð°Ñ€</th>
                          <th className="px-3 py-2">ÐšÐ¾Ð»-Ð²Ð¾</th>
                          <th className="px-3 py-2">Ð¦ÐµÐ½Ð°</th>
                          <th className="px-3 py-2 text-right">Ð˜Ñ‚Ð¾Ð³Ð¾</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#d5dde6]">
                        {selectedInvoice.items.map((item: any) => {
                          const quantityInfo = getInvoiceItemQuantityParts(item);
                          const returnedQty = getInvoiceItemReturnedQty(item);
                          const remainingQty = getReturnItemRemainingUnits(item);

                          return (
                            <tr key={item.id}>
                              <td className="px-3 py-2">
                                <p className="font-black text-slate-900">{formatProductName(item.product_name)}</p>
                                {item.saleAllocations && item.saleAllocations.length > 0 && (
                                  <div className="mt-1 flex flex-wrap gap-1">
                                    {item.saleAllocations.map((sa: any) => (
                                      <span key={sa.id} className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 text-[8px] rounded font-black uppercase tracking-tighter">
                                        ÐŸÐ°Ñ€Ñ‚Ð¸Ñ #{sa.batchId} ({sa.quantity} {item.unit})
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </td>
                              <td className="whitespace-nowrap px-3 py-2 text-[11px] text-slate-500">
                                <p className="whitespace-nowrap text-xs font-semibold text-slate-700">{quantityInfo.primary}</p>
                                {quantityInfo.secondary && (
                                  <p className="mt-0.5 whitespace-nowrap text-[10px] text-slate-400">{quantityInfo.secondary}</p>
                                )}
                                {returnedQty > PAYMENT_EPSILON && (
                                  <div className="mt-2 inline-flex flex-col rounded-xl border border-amber-100 bg-amber-50 px-2.5 py-1.5">
                                    <span className="text-[10px] font-black text-amber-700">Ð’Ð¾Ð·Ð²Ñ€Ð°Ñ‰ÐµÐ½Ð¾: {formatCount(returnedQty)}</span>
                                    <span className="text-[10px] text-slate-500">ÐžÑÑ‚Ð°Ð»Ð¾ÑÑŒ: {formatCount(remainingQty)}</span>
                                  </div>
                                )}
                              </td>
                              <td className="px-3 py-2 font-medium tabular-nums text-[#48627f]">{formatMoney(item.sellingPrice)}</td>
                              <td className="px-3 py-2 text-right font-semibold tabular-nums text-[#1f2933]">{formatMoney(item.totalPrice)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex justify-end">
                  <div className="w-full max-w-sm space-y-2 rounded border border-[#d6c07a] bg-[#fff8dc] px-3 py-3">
                    <div className="flex items-center justify-between text-sm text-[#48627f]">
                      <span className="font-bold">ÐŸÐ¾Ð´Ñ‹Ñ‚Ð¾Ð³:</span>
                      <span className="font-black">{formatMoney(getInvoiceSubtotal(selectedInvoice))}</span>
                    </div>
                    {getInvoiceChangeAmount(selectedInvoice) > PAYMENT_EPSILON && (
                      <div className="flex items-center justify-between text-sm text-slate-500">
                        <span className="font-bold">Ð¡Ð´Ð°Ñ‡Ð° ÐºÐ»Ð¸ÐµÐ½Ñ‚Ñƒ:</span>
                        <span className="font-black text-amber-600">{formatMoney(getInvoiceChangeAmount(selectedInvoice))}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm text-slate-500">
                      <span className="font-bold">Ð¡ÐºÐ¸Ð´ÐºÐ° ({selectedInvoice.discount}%):</span>
                      <span className="font-black">-{formatMoney(getInvoiceDiscountAmount(selectedInvoice))}</span>
                    </div>
                    {selectedInvoice.returnedAmount > 0 && (
                      <div className="flex items-center justify-between text-sm text-rose-500">
                        <span className="font-bold">Ð’Ð¾Ð·Ð²Ñ€Ð°Ñ‰ÐµÐ½Ð¾:</span>
                        <span className="font-black">-{formatMoney(selectedInvoice.returnedAmount || 0)}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between border-t border-[#d6c07a] pt-2 text-lg font-semibold text-[#1f2933]">
                      <span>Ð˜Ñ‚Ð¾Ð³Ð¾:</span>
                      <span>{formatMoney(getInvoiceNetAmount(selectedInvoice))}</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-[#d6c07a] pt-2 text-sm text-[#48627f]">
                      <span className="font-bold">ÐžÐ¿Ð»Ð°Ñ‡ÐµÐ½Ð¾:</span>
                      <span className="font-black text-emerald-600">{formatMoney(getInvoiceAppliedPaidAmount(selectedInvoice))}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-slate-500">
                      <span className="font-bold">ÐžÑÑ‚Ð°Ñ‚Ð¾Ðº (Ð”Ð¾Ð»Ð³):</span>
                      <span className="font-black text-rose-600">{formatMoney(getInvoiceBalance(selectedInvoice))}</span>
                    </div>
                  </div>
                </div>

                {selectedInvoice.payments && selectedInvoice.payments.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest ml-2">Ð˜ÑÑ‚Ð¾Ñ€Ð¸Ñ Ð¿Ð»Ð°Ñ‚ÐµÐ¶ÐµÐ¹</h4>
                    <div className="overflow-x-auto rounded-3xl border border-slate-100 bg-white">
                      <table className="min-w-[760px] w-full text-left text-sm">
                        <thead>
                          <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                            <th className="px-6 py-4">Ð”Ð°Ñ‚Ð°</th>
                            <th className="px-6 py-4">Ð¡ÑƒÐ¼Ð¼Ð°</th>
                            <th className="px-6 py-4">Ð¡Ð¾Ñ‚Ñ€ÑƒÐ´Ð½Ð¸Ðº</th>
                            <th className="px-6 py-4 text-right">Ð”ÐµÐ¹ÑÑ‚Ð²Ð¸Ðµ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {selectedInvoice.payments.map((p: any) => (
                            <tr key={p.id}>
                              <td className="px-6 py-4 font-bold text-slate-500">{new Date(p.createdAt).toLocaleString('ru-RU')}</td>
                              <td className="px-6 py-4 font-black text-emerald-600">{formatMoney(p.amount)}</td>
                              <td className="px-6 py-4 text-slate-500">{p.staff_name}</td>
                              <td className="px-6 py-4 text-right">
                                <button
                                  type="button"
                                  onClick={() => void handleCancelPayment(p)}
                                  disabled={cancellingPaymentId === Number(p.id)}
                                  className="inline-flex items-center gap-1.5 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <X size={14} />
                                  {cancellingPaymentId === Number(p.id) ? 'ÐžÑ‚Ð¼ÐµÐ½Ð°...' : 'ÐžÑ‚Ð¼ÐµÐ½Ð¸Ñ‚ÑŒ'}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {getInvoiceReturnedItems(selectedInvoice).length > 0 && (
                  <div className="space-y-4">
                    <h4 className="ml-2 text-sm font-black uppercase tracking-widest text-slate-400">Ð’Ð¾Ð·Ð²Ñ€Ð°Ñ‰ÐµÐ½Ð½Ñ‹Ðµ Ñ‚Ð¾Ð²Ð°Ñ€Ñ‹</h4>
                    <div className="grid gap-3 md:grid-cols-2">
                      {getInvoiceReturnedItems(selectedInvoice).map((item: any) => {
                        const returnedQty = getInvoiceItemReturnedQty(item);
                        const remainingQty = getReturnItemRemainingUnits(item);
                        const unitName = normalizeDisplayBaseUnit(item?.unit || item?.baseUnitNameSnapshot || item?.baseUnitName || 'ÑˆÑ‚');

                        return (
                          <div key={`returned-item-${item.id}`} className="rounded-3xl border border-amber-100 bg-amber-50 p-4">
                            <p className="break-words text-sm font-black text-slate-900">{getReturnItemDisplayName(item)}</p>
                            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                              <div className="rounded-2xl bg-white px-3 py-2">
                                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-amber-600">Ð’Ð¾Ð·Ð²Ñ€Ð°Ñ‰ÐµÐ½Ð¾</p>
                                <p className="mt-1 font-black text-rose-600">{formatCount(returnedQty)} {unitName}</p>
                              </div>
                              <div className="rounded-2xl bg-white px-3 py-2">
                                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">ÐžÑÑ‚Ð°Ð»Ð¾ÑÑŒ</p>
                                <p className="mt-1 font-black text-slate-700">{formatCount(remainingQty)} {unitName}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {selectedInvoice.returns && selectedInvoice.returns.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest ml-2">Ð˜ÑÑ‚Ð¾Ñ€Ð¸Ñ Ð²Ð¾Ð·Ð²Ñ€Ð°Ñ‚Ð¾Ð²</h4>
                    <div className="overflow-x-auto rounded-3xl border border-slate-100 bg-white">
                      <table className="min-w-[760px] w-full text-left text-sm">
                        <thead>
                          <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                            <th className="px-6 py-4">Ð”Ð°Ñ‚Ð°</th>
                            <th className="px-6 py-4">Ð¡ÑƒÐ¼Ð¼Ð°</th>
                            <th className="px-6 py-4">ÐŸÑ€Ð¸Ñ‡Ð¸Ð½Ð°</th>
                            <th className="px-6 py-4">Ð¡Ð¾Ñ‚Ñ€ÑƒÐ´Ð½Ð¸Ðº</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {selectedInvoice.returns.map((r: any) => (
                            <tr key={r.id}>
                              <td className="px-6 py-4 font-bold text-slate-500">{new Date(r.createdAt).toLocaleString('ru-RU')}</td>
                              <td className="px-6 py-4 font-black text-rose-600">-{formatMoney(r.totalValue)}</td>
                              <td className="max-w-[320px] break-words px-6 py-4 italic text-slate-500">{r.reason || 'Ð‘ÐµÐ· Ð¿Ñ€Ð¸Ñ‡Ð¸Ð½Ñ‹'}</td>
                              <td className="px-6 py-4 text-slate-500">{r.staff_name}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex flex-wrap justify-end gap-2 border-t border-[#b7c2ce] bg-[#eef3f8] px-4 py-3">
                <button
                    onClick={() => {
                      if (isPaymentActionDisabled(selectedInvoice)) return;
                      setPaymentAmount(String(toFixedNumber(getInvoiceBalance(selectedInvoice))));
                      setShowPaymentModal(true);
                    }}
                    disabled={isPaymentActionDisabled(selectedInvoice)}
                    className={`inline-flex items-center gap-2 rounded border px-4 py-2 text-sm font-medium transition-colors ${
                      isPaymentActionDisabled(selectedInvoice)
                        ? 'cursor-not-allowed border-[#d5dde6] bg-[#f7f9fb] text-slate-300'
                        : 'border-[#a9d8c7] bg-white text-[#007a4d] hover:bg-[#effaf5]'
                    }`}
                  >
                    <Banknote size={18} />
                    <span>ÐžÐ¿Ð»Ð°Ñ‚Ð°</span>
                  </button>
                <button
                    onClick={() => {
                      void openReturnInvoiceModal(selectedInvoice);
                    }}
                    disabled={isReturnActionDisabled(selectedInvoice)}
                    className={`inline-flex items-center gap-2 rounded border px-4 py-2 text-sm font-medium transition-colors ${
                      isReturnActionDisabled(selectedInvoice)
                        ? 'cursor-not-allowed border-[#d5dde6] bg-[#f7f9fb] text-slate-300'
                        : 'border-[#d6c07a] bg-white text-[#7a5a00] hover:bg-[#fff8dc]'
                    }`}
                  >
                    <RotateCcw size={18} />
                    <span>Ð’Ð¾Ð·Ð²Ñ€Ð°Ñ‚</span>
                  </button>
                <button
                  onClick={() => handlePrintInvoice(selectedInvoice)}
                  className="inline-flex items-center gap-2 rounded border border-[#9fb7d5] bg-white px-4 py-2 text-sm font-medium text-[#23527c] transition-colors hover:bg-[#eaf2fb]"
                >
                  <Printer size={18} />
                  <span>ÐŸÐµÑ‡Ð°Ñ‚ÑŒ</span>
                </button>
                <button 
                  onClick={closeDetailsModal}
                  className="rounded border border-[#9fb7d5] bg-white px-5 py-2 text-sm font-medium text-[#1f3f63] transition-colors hover:bg-[#eaf2fb]"
                >
                  Ð—Ð°ÐºÑ€Ñ‹Ñ‚ÑŒ
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEditModal && selectedInvoice && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeEditModal}
            className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/35 p-2 sm:items-center sm:p-3"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-md border border-[#9fb7d5] bg-white shadow-2xl sm:max-h-[92vh]"
            >
              <div className="flex items-center justify-between border-b border-[#b7c2ce] bg-[linear-gradient(180deg,#ffffff_0%,#dde5ee_100%)] px-4 py-3">
                <div className="flex items-center space-x-4">
                  <div className="rounded border border-[#9fb7d5] bg-[#eaf2fb] p-2 text-[#23527c]">
                    <Pencil size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-[#1f2933]">Ð˜Ð·Ð¼ÐµÐ½Ð¸Ñ‚ÑŒ Ð¿Ñ€Ð¾Ð´Ð°Ð¶Ñƒ</h3>
                    <p className="text-xs font-medium text-[#5f6f7f]">ÐÐ°ÐºÐ»Ð°Ð´Ð½Ð°Ñ #{selectedInvoice.id}</p>
                  </div>
                </div>
                <button onClick={closeEditModal} className="flex h-8 w-8 items-center justify-center rounded border border-[#9fb7d5] bg-white text-[#23527c] transition-colors hover:bg-[#eaf2fb]">
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto bg-[#f3f5f7] p-3 sm:p-4">
                <div className="rounded border border-[#c8d2df] bg-white p-3">
                  <label className="ml-1 text-sm font-semibold text-[#32465a]">ÐšÐ»Ð¸ÐµÐ½Ñ‚</label>
                  <select
                    value={editCustomerId}
                    onChange={(e) => setEditCustomerId(e.target.value ? Number(e.target.value) : '')}
                    className="mt-2 w-full rounded border border-[#9fb7d5] bg-white px-3 py-2 text-sm font-medium text-[#1f2933] outline-none transition-colors focus:border-[#4f81bd]"
                  >
                    <option value="">Ð‘ÐµÐ· Ð½Ð°Ð·Ð²Ð°Ð½Ð¸Ñ</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-xs text-[#5f6f7f]">
                    ÐŸÑ€Ð¸ ÑÐ¼ÐµÐ½Ðµ ÐºÐ»Ð¸ÐµÐ½Ñ‚Ð° Ð¿ÐµÑ€ÐµÐ½Ð¾ÑÐ¸Ñ‚ÑÑ Ñ‚Ð¾Ð»ÑŒÐºÐ¾ Ñ‚ÐµÐºÑƒÑ‰Ð°Ñ Ð½Ð°ÐºÐ»Ð°Ð´Ð½Ð°Ñ, ÐµÐµ Ð¾Ð¿Ð»Ð°Ñ‚Ñ‹ Ð¸ Ð²Ð¾Ð·Ð²Ñ€Ð°Ñ‚Ñ‹.
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-[#32465a]">Ð¢Ð¾Ð²Ð°Ñ€Ñ‹ Ð² Ð½Ð°ÐºÐ»Ð°Ð´Ð½Ð¾Ð¹</p>
                      <p className="mt-1 text-xs text-[#5f6f7f]">ÐŸÑ€Ð¾Ð²ÐµÑ€ÑŒÑ‚Ðµ ÑÑ‚Ñ€Ð¾ÐºÐ¸, ÐºÐ¾Ð»Ð¸Ñ‡ÐµÑÑ‚Ð²Ð¾, Ñ†ÐµÐ½Ñƒ Ð¸ ÑÐºÐ¸Ð´ÐºÑƒ Ð¿ÐµÑ€ÐµÐ´ ÑÐ¾Ñ…Ñ€Ð°Ð½ÐµÐ½Ð¸ÐµÐ¼.</p>
                    </div>
                    <button
                      type="button"
                      onClick={addEditInvoiceItem}
                      className="inline-flex items-center gap-2 rounded border border-[#7f9db9] bg-[#eaf2fb] px-3 py-2 text-sm font-medium text-[#1f3f63] transition-colors hover:bg-[#dbe9f6]"
                    >
                      <Plus size={16} />
                      <span>Ð”Ð¾Ð±Ð°Ð²Ð¸Ñ‚ÑŒ Ñ‚Ð¾Ð²Ð°Ñ€</span>
                    </button>
                  </div>

                  <div className="relative">
                    <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#48627f]" />
                    <input
                      type="text"
                      value={editInvoiceSearch}
                      onChange={(e) => setEditInvoiceSearch(e.target.value)}
                      placeholder="ÐŸÐ¾Ð¸ÑÐº Ñ‚Ð¾Ð²Ð°Ñ€Ð° Ð²Ð½ÑƒÑ‚Ñ€Ð¸ Ð½Ð°ÐºÐ»Ð°Ð´Ð½Ð¾Ð¹..."
                      className="w-full rounded border border-[#9fb7d5] bg-white py-2 pl-10 pr-3 text-sm text-[#1f2933] outline-none transition-colors focus:border-[#4f81bd]"
                    />
                  </div>

                  <div className="space-y-3">
                    {filteredEditInvoiceItems.map((item) => {
                      const index = editInvoiceItems.findIndex((entry) => entry.key === item.key);
                      const selectedProduct = getEditProductMeta(item.productId);
                      const itemMaxAllowedQuantity = getEditItemMaxAllowedQuantity(item, editInvoiceItems);
                      const selectedPackagingForRow = getEditItemPackaging(item);
                      const unitsPerPackageForRow = Math.max(0, Number(selectedPackagingForRow?.unitsPerPackage || 0));
                      const maxPackageCount =
                        selectedPackagingForRow && unitsPerPackageForRow > 0
                          ? Math.floor(itemMaxAllowedQuantity / unitsPerPackageForRow)
                          : 0;
                      const visibleEditProducts = editProducts
                        .filter((product) => {
                          const productId = Number(product.id);
                          const isSelectedProduct = productId === Number(item.productId || 0);
                          const hasStock = Math.max(0, Number(product.stock || 0)) > 0;
                          return isSelectedProduct || hasStock;
                        })
                        .filter((product) => {
                          const query = editProductMenuSearch.trim().toLowerCase();
                          if (!query) return true;
                          return formatProductName(product.name).toLowerCase().includes(query);
                        });

                      return (
                        <div
                          key={item.key}
                          className={`rounded border p-3 shadow-sm transition-colors ${
                            item.isNew
                              ? 'border-[#9fb7d5] bg-[#f7fbff]'
                              : 'border-[#b7c2ce] bg-white'
                          }`}
                        >
                          <div className="mb-2.5 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#48627f]">Ð¡Ñ‚Ñ€Ð¾ÐºÐ° #{index + 1}</p>
                              {item.isNew ? (
                                <span className="rounded border border-[#9fb7d5] bg-[#eaf2fb] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#23527c]">
                                  ÐÐ¾Ð²Ð°Ñ
                                </span>
                              ) : null}
                            </div>
                            <button
                              type="button"
                              onClick={() => removeEditInvoiceItem(item.key)}
                              disabled={editInvoiceItems.length === 1}
                              className="inline-flex items-center gap-1 rounded border border-[#d6a1a1] bg-[#fff1f1] px-3 py-1.5 text-xs font-medium text-[#9f1239] transition-colors hover:bg-[#ffe4e6] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Trash2 size={14} />
                              <span>Ð£Ð±Ñ€Ð°Ñ‚ÑŒ</span>
                            </button>
                          </div>

                          <div className="space-y-3">
                            <div className="space-y-2">
                              <p className="text-xs font-semibold text-[#48627f]">Ð¢Ð¾Ð²Ð°Ñ€</p>
                              <div className="relative">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenEditProductMenuKey((current) => {
                                        const nextKey = current === item.key ? null : item.key;
                                        setEditProductMenuSearch('');
                                        return nextKey;
                                      });
                                    }}
                                    className="flex w-full items-center justify-between rounded border border-[#9fb7d5] bg-white px-3 py-2 text-left text-sm text-[#1f2933] transition-colors hover:bg-[#f7fbff] focus:border-[#4f81bd]"
                                  >
                                  <span className="truncate">
                                    {selectedProduct ? formatProductName(selectedProduct.name) : 'Ð’Ñ‹Ð±ÐµÑ€Ð¸Ñ‚Ðµ Ñ‚Ð¾Ð²Ð°Ñ€ Ð¸Ð· ÑÐ¿Ð¸ÑÐºÐ°'}
                                  </span>
                                  <ChevronDown size={18} className="shrink-0 text-[#48627f]" />
                                </button>

                                {openEditProductMenuKey === item.key ? (
                                  <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-20 overflow-hidden rounded border border-[#9fb7d5] bg-white shadow-2xl shadow-slate-900/10">
                                    <div className="border-b border-[#c8d2df] bg-[#eef3f8] p-2">
                                      <div className="relative">
                                        <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#48627f]" />
                                        <input
                                          type="text"
                                          value={editProductMenuSearch}
                                          onChange={(e) => setEditProductMenuSearch(e.target.value)}
                                          placeholder="ÐŸÐ¾Ð¸ÑÐº Ñ‚Ð¾Ð²Ð°Ñ€Ð°..."
                                          className="w-full rounded border border-[#9fb7d5] bg-white py-2 pl-9 pr-3 text-sm text-[#1f2933] outline-none transition-colors focus:border-[#4f81bd]"
                                        />
                                      </div>
                                    </div>
                                    <div className="max-h-64 overflow-y-auto py-1">
                                      {visibleEditProducts
                                        .map((product, productIndex) => {
                                          const stockInfo = getProductStockParts(product as EditProductOption);

                                          return (
                                            <button
                                              key={product.id}
                                              type="button"
                                              onClick={() => {
                                                selectEditProductForItem(item.key, product);
                                                setOpenEditProductMenuKey(null);
                                                setEditProductMenuSearch('');
                                              }}
                                              className="flex w-full items-start justify-between gap-3 px-3 py-2 text-left transition-colors hover:bg-[#fff8dc]"
                                            >
                                              <div className="min-w-0">
                                                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#6b7d90]">#{productIndex + 1}</p>
                                                <p className="truncate text-sm font-semibold text-[#1f2933]">
                                                  {formatProductName(product.name)}
                                                </p>
                                                <p className="mt-1 text-xs font-medium text-[#48627f]">{stockInfo.primary}</p>
                                                {stockInfo.secondary && (
                                                  <p className="mt-0.5 text-[10px] text-[#6b7d90]">{stockInfo.secondary}</p>
                                                )}
                                              </div>
                                            </button>
                                          );
                                        })}
                                      {!visibleEditProducts.length ? (
                                        <div className="px-4 py-6 text-center text-sm font-medium text-slate-400">
                                          ÐÐ¸Ñ‡ÐµÐ³Ð¾ Ð½Ðµ Ð½Ð°Ð¹Ð´ÐµÐ½Ð¾
                                        </div>
                                      ) : null}
                                    </div>
                                  </div>
                                ) : null}
                              </div>
                            </div>

                            <div className="rounded border border-[#c8d2df] bg-[#f7f9fb] px-3 py-2">
                              <p className={`break-words text-sm font-semibold leading-5 ${selectedProduct ? 'text-[#1f2933]' : 'text-[#23527c]'}`}>
                                {selectedProduct ? formatProductName(selectedProduct.name) : 'Ð¡Ð½Ð°Ñ‡Ð°Ð»Ð° Ð²Ñ‹Ð±ÐµÑ€Ð¸Ñ‚Ðµ Ñ‚Ð¾Ð²Ð°Ñ€, Ð¿Ð¾Ñ‚Ð¾Ð¼ ÑƒÐºÐ°Ð¶Ð¸Ñ‚Ðµ Ñ‚Ð¸Ð¿ Ð¿Ñ€Ð¾Ð´Ð°Ð¶Ð¸ Ð¸ ÐºÐ¾Ð»Ð¸Ñ‡ÐµÑÑ‚Ð²Ð¾'}
                              </p>
                            </div>

                            <div className="space-y-2">
                              <p className="text-xs font-semibold text-[#48627f]">Ð¢Ð¸Ð¿ Ð¿Ñ€Ð¾Ð´Ð°Ð¶Ð¸ Ð¸ ÐºÐ¾Ð»Ð¸Ñ‡ÐµÑÑ‚Ð²Ð¾</p>
                              <div className="rounded border border-[#c8d2df] bg-[#eef3f8] p-2">
                                <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_1.1fr]">
                                  <select
                                    value={item.selectedPackagingId ? 'bulk' : 'piece'}
                                    onChange={(e) => {
                                      const bulkPackaging = getEditItemDefaultBulkPackaging(item);
                                      const isBulk = e.target.value === 'bulk' && bulkPackaging;
                                      updateNormalizedEditInvoiceItem(item.key, {
                                        selectedPackagingId: isBulk ? Number(bulkPackaging?.id || '') : '',
                                        packageQuantityInput: isBulk ? (item.packageQuantityInput || '1') : '0',
                                        extraUnitQuantityInput: isBulk ? item.extraUnitQuantityInput || '0' : item.quantity || '1',
                                      });
                                    }}
                                    disabled={!selectedProduct}
                                    className="w-full rounded border border-[#9fb7d5] bg-white px-3 py-2 text-sm font-medium text-[#1f2933] outline-none transition-colors focus:border-[#4f81bd]"
                                  >
                                    <option value="piece">Ð Ð¾Ð·Ð½Ð¸Ñ†Ð°</option>
                                    {getEditItemDefaultBulkPackaging(item) ? (
                                      <option value="bulk">ÐžÐ¿Ñ‚Ð¾Ð¼</option>
                                    ) : null}
                                  </select>
                                  <div className="flex items-center rounded border border-[#c8d2df] bg-white px-3 py-2 text-xs font-medium leading-5 text-[#5f6f7f]">
                                    {!selectedProduct
                                      ? 'Ð’Ñ‹Ð±ÐµÑ€Ð¸Ñ‚Ðµ Ñ‚Ð¾Ð²Ð°Ñ€, Ñ‡Ñ‚Ð¾Ð±Ñ‹ Ð¿Ð¾ÑÐ²Ð¸Ð»ÑÑ Ñ€ÐµÐ¶Ð¸Ð¼ Ð¿Ñ€Ð¾Ð´Ð°Ð¶Ð¸'
                                      : item.selectedPackagingId && getEditItemPackaging(item)
                                      ? `ÐŸÐ¾ ÑƒÐ¼Ð¾Ð»Ñ‡Ð°Ð½Ð¸ÑŽ: ${getEditItemPackaging(item)?.packageName} x ${getEditItemPackaging(item)?.unitsPerPackage}`
                                      : 'ÐŸÑ€Ð¾Ð´Ð°Ð¶Ð° Ð² Ñ€Ð¾Ð·Ð½Ð¸Ñ†Ñƒ'}
                                  </div>
                                </div>
                                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                                {item.selectedPackagingId ? (
                                  <>
                                    <input
                                      type="number"
                                      min="0"
                                      max={maxPackageCount}
                                      step="1"
                                      value={item.packageQuantityInput}
                                      onChange={(e) => updateNormalizedEditInvoiceItem(item.key, { packageQuantityInput: e.target.value })}
                                      placeholder="ÐšÐ¾Ð»-Ð²Ð¾ ÑƒÐ¿Ð°ÐºÐ¾Ð²Ð¾Ðº"
                                      disabled={!selectedProduct}
                                      className="rounded border border-[#9fb7d5] bg-white px-3 py-2 text-sm font-medium text-[#1f2933] outline-none transition-colors focus:border-[#4f81bd]"
                                    />
                                    <input
                                      type="number"
                                      min="0"
                                      max={itemMaxAllowedQuantity}
                                      step="0.01"
                                      value={item.extraUnitQuantityInput}
                                      onChange={(e) => updateNormalizedEditInvoiceItem(item.key, { extraUnitQuantityInput: e.target.value })}
                                      placeholder="+ ÑˆÑ‚"
                                      disabled={!selectedProduct}
                                      className="rounded border border-[#9fb7d5] bg-white px-3 py-2 text-sm font-medium text-[#1f2933] outline-none transition-colors focus:border-[#4f81bd]"
                                    />
                                  </>
                                ) : (
                                  <input
                                    type="number"
                                    min="0"
                                    max={itemMaxAllowedQuantity}
                                    step="1"
                                    value={item.extraUnitQuantityInput}
                                    onChange={(e) => updateNormalizedEditInvoiceItem(item.key, { extraUnitQuantityInput: e.target.value })}
                                    placeholder="ÐšÐ¾Ð»-Ð²Ð¾, ÑˆÑ‚"
                                    disabled={!selectedProduct}
                                    className="sm:col-span-2 rounded border border-[#9fb7d5] bg-white px-3 py-2 text-sm font-medium text-[#1f2933] outline-none transition-colors focus:border-[#4f81bd]"
                                  />
                                )}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="mt-3 grid gap-2 sm:grid-cols-4">
                            <div className="rounded border border-[#c8d2df] bg-[#f7f9fb] px-3 py-2">
                              <p className="text-[11px] font-semibold text-[#48627f]">ÐšÐ¾Ð»-Ð²Ð¾</p>
                              <p className="mt-1 text-sm font-semibold text-[#1f2933]">
                                {item.selectedPackagingId
                                  ? (() => {
                                      const selectedPackaging = getEditItemPackaging(item);
                                      const packageCount = Math.max(0, Number(item.packageQuantityInput || 0) || 0);
                                      const extraCount = Math.max(0, Number(item.extraUnitQuantityInput || 0) || 0);
                                      const lines = [];
                                      if (packageCount > 0 && selectedPackaging) {
                                        lines.push(`${packageCount} ${selectedPackaging.packageName}`);
                                      }
                                      if (extraCount > 0 || lines.length === 0) {
                                        lines.push(`${extraCount} ${item.baseUnitName || 'ÑˆÑ‚'}`);
                                      }
                                      return lines.join(' + ');
                                    })()
                                  : (Number(item.quantity || 0) > 0 ? `${item.quantity} ${item.baseUnitName || 'ÑˆÑ‚'}` : '0')}
                              </p>
                            </div>
                            <div className="rounded border border-[#c8d2df] bg-[#f7f9fb] px-3 py-2">
                              <p className="text-[11px] font-semibold text-[#48627f]">Ð¦ÐµÐ½Ð°</p>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.sellingPrice}
                                onChange={(e) => updateNormalizedEditInvoiceItem(item.key, { sellingPrice: e.target.value })}
                                placeholder="Ð¦ÐµÐ½Ð°"
                                disabled={!selectedProduct}
                                className="mt-1 w-full rounded border border-[#9fb7d5] bg-white px-2 py-1.5 text-sm font-semibold text-[#1f2933] outline-none transition-colors focus:border-[#4f81bd]"
                              />
                            </div>
                            <div className="rounded border border-[#c8d2df] bg-[#f7f9fb] px-3 py-2">
                              <p className="text-[11px] font-semibold text-[#48627f]">Ð¡ÐºÐ¸Ð´ÐºÐ° %</p>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="1"
                                value={item.discount}
                                onChange={(e) => updateNormalizedEditInvoiceItem(item.key, { discount: e.target.value })}
                                placeholder="%"
                                disabled={!selectedProduct}
                                className="mt-1 w-full rounded border border-[#9fb7d5] bg-white px-2 py-1.5 text-sm font-semibold text-[#1f2933] outline-none transition-colors focus:border-[#4f81bd]"
                              />
                            </div>
                            <div className="rounded border border-[#d6c07a] bg-[#fff8dc] px-3 py-2">
                              <p className="text-[11px] font-semibold text-[#7a5a00]">Ð˜Ñ‚Ð¾Ð³Ð¾</p>
                              <p className="mt-1 text-sm font-bold text-[#1f2933]">
                                {(() => {
                                  const q = Math.max(0, Number(item.quantity || 0));
                                  const p = Math.max(0, Number(item.sellingPrice || 0));
                                  const d = Math.max(0, Number(item.discount || 0));
                                  return formatMoney(q * ceilMoney(p * (1 - d / 100)));
                                })()}
                              </p>
                            </div>
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-[#d5dde6] pt-2 text-xs text-[#5f6f7f]">
                            <span>Ð•Ð´.: {item.baseUnitName || selectedProduct?.baseUnitName || selectedProduct?.unit || item.unit || 'ÑˆÑ‚'}</span>
                            {item.selectedPackagingId && getEditItemPackaging(item) ? (
                              <span>
                                ÐŸÐ¾ ÑƒÐ¼Ð¾Ð»Ñ‡Ð°Ð½Ð¸ÑŽ: {getEditItemPackaging(item)?.packageName} x {getEditItemPackaging(item)?.unitsPerPackage}
                              </span>
                            ) : null}
                            {selectedProduct ? (
                              <span>
                                ÐžÑÑ‚Ð°Ñ‚Ð¾Ðº ÑÐµÐ¹Ñ‡Ð°Ñ: {getProductStockParts(selectedProduct as EditProductOption).primary}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                    {!filteredEditInvoiceItems.length && (
                      <div className="rounded border border-dashed border-[#b7c2ce] bg-white px-4 py-6 text-center text-sm text-[#5f6f7f]">
                        ÐŸÐ¾ ÑÑ‚Ð¾Ð¼Ñƒ Ð¿Ð¾Ð¸ÑÐºÑƒ Ñ‚Ð¾Ð²Ð°Ñ€Ñ‹ Ð² Ð½Ð°ÐºÐ»Ð°Ð´Ð½Ð¾Ð¹ Ð½Ðµ Ð½Ð°Ð¹Ð´ÐµÐ½Ñ‹.
                      </div>
                    )}
                  </div>

                  <div className="rounded border border-[#d6c07a] bg-[#fff8dc] p-3">
                    <div className="grid gap-3 sm:grid-cols-4">
                      <div className="rounded border border-[#c8d2df] bg-white px-3 py-2">
                        <p className="text-[11px] font-semibold text-[#48627f]">Ð¢Ð¾Ð²Ð°Ñ€Ð¾Ð²</p>
                        <p className="mt-1 text-lg font-bold text-[#1f2933]">{editInvoiceItems.length}</p>
                      </div>
                      <div className="rounded border border-[#c8d2df] bg-white px-3 py-2">
                        <p className="text-[11px] font-semibold text-[#48627f]">Ð¡ÑƒÐ¼Ð¼Ð°</p>
                        <p className="mt-1 text-lg font-bold text-[#1f2933]">{formatMoney(editInvoiceSubtotal)}</p>
                      </div>
                      <div className="rounded border border-[#c8d2df] bg-white px-3 py-2">
                        <p className="text-[11px] font-semibold text-[#48627f]">Ð¡ÐºÐ¸Ð´ÐºÐ° %</p>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={editDiscount}
                          onChange={(e) => {
                            const value = e.target.value;
                            setEditDiscount(value === '' ? '' : String(Math.max(0, Math.min(100, Number(value) || 0))));
                          }}
                          className="mt-1 w-full rounded border border-[#9fb7d5] bg-white px-2 py-1 text-lg font-bold text-[#1f2933] outline-none transition-colors focus:border-[#4f81bd]"
                          placeholder="0"
                        />
                      </div>
                      <div className="rounded border border-[#8f6f18] bg-[#ffd966] px-3 py-2 text-[#1f2933]">
                        <p className="text-[11px] font-semibold text-[#7a5a00]">Ð˜Ñ‚Ð¾Ð³Ð¾</p>
                        <p className="mt-1 text-lg font-bold">{formatMoney(editInvoiceNetAmount)}</p>
                      </div>
                    </div>
                  </div>
                  {Number(selectedInvoice?.tax || 0) > 0 ? (
                    <p className="mt-3 text-sm text-slate-500">
                      ÐÐ°Ð»Ð¾Ð³: +{formatMoney(editInvoiceTaxAmount)}
                    </p>
                  ) : null}
                </div> {/* container of summary and list (space-y-4 line 2004) */}
              </div> {/* scrollable area (line 1985) */}

              <div className="flex flex-col-reverse gap-2 border-t border-[#b7c2ce] bg-[#eef3f8] px-4 py-3 sm:flex-row">
                <button
                  onClick={closeEditModal}
                  className="flex-1 rounded border border-[#9fb7d5] bg-white px-4 py-2.5 text-sm font-medium text-[#1f3f63] transition-colors hover:bg-[#eaf2fb]"
                >
                  ÐžÑ‚Ð¼ÐµÐ½Ð°
                </button>
                <button
                  onClick={handleUpdateInvoice}
                  disabled={isSavingEdit}
                  className="flex-1 rounded border border-[#8f6f18] bg-[#ffd966] px-4 py-2.5 text-sm font-semibold text-[#1f2933] shadow-sm transition-colors hover:bg-[#f7c948] disabled:opacity-50"
                >
                  {isSavingEdit ? 'Ð¡Ð¾Ñ…Ñ€Ð°Ð½ÐµÐ½Ð¸Ðµ...' : 'Ð¡Ð¾Ñ…Ñ€Ð°Ð½Ð¸Ñ‚ÑŒ'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPaymentModal && selectedInvoice && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closePaymentModal}
            className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/50 p-3 backdrop-blur-sm sm:items-center sm:p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md overflow-hidden rounded-t-[2rem] bg-white shadow-2xl sm:rounded-[2.5rem]"
            >
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 p-4 sm:p-8">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-emerald-600 text-white rounded-2xl">
                    <Banknote size={24} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900">ÐŸÑ€Ð¸Ð½ÑÑ‚ÑŒ Ð¾Ð¿Ð»Ð°Ñ‚Ñƒ</h3>
                </div>
                <button onClick={closePaymentModal} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <X size={24} />
                </button>
              </div>
              
              <div className="space-y-5 p-4 sm:space-y-6 sm:p-8">
                <div>
                    <p className="text-sm font-bold text-slate-500 mb-1">ÐÐ°ÐºÐ»Ð°Ð´Ð½Ð°Ñ #{selectedInvoice.id}</p>
                  <p className="text-lg font-black text-slate-900">{selectedInvoice.customer_name}</p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="p-4 bg-slate-50 rounded-2xl">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ð˜Ñ‚Ð¾Ð³Ð¾</p>
                    <p className="text-lg font-black text-slate-900">{formatMoney(getInvoiceNetAmount(selectedInvoice))}</p>
                  </div>
                  <div className="p-4 bg-rose-50 rounded-2xl">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ð”Ð¾Ð»Ð³</p>
                    <p className="text-lg font-black text-rose-600">{formatMoney(getInvoiceBalance(selectedInvoice))}</p>
                  </div>
                </div>

                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ð¡ÑƒÐ¼Ð¼Ð° Ð¾Ð¿Ð»Ð°Ñ‚Ñ‹</label>
                  <input 
                    type="number" 
                    min={0}
                    value={paymentAmount}
                    onChange={(e) => {
                      const value = e.target.value;
                      setPaymentAmount(value === '' ? '' : String(Math.max(0, Number(value) || 0)));
                    }}
                    className="w-full mt-1 px-5 py-4 rounded-2xl border border-slate-200 focus:ring-8 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none transition-all font-black text-2xl text-slate-900 shadow-sm"
                    placeholder="0.00"
                    autoFocus
                  />
                </div>
              </div>
              
              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50 p-4 sm:flex-row sm:p-8">
                <button 
                  onClick={closePaymentModal}
                  className="flex-1 py-4 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold hover:bg-slate-50 transition-all"
                >
                  ÐžÑ‚Ð¼ÐµÐ½Ð°
                </button>
                <button 
                  onClick={handlePayment}
                  disabled={isPaying || !paymentAmount}
                  className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isPaying ? 'Ð¡Ð¾Ñ…Ñ€Ð°Ð½ÐµÐ½Ð¸Ðµ...' : 'Ð’Ð½ÐµÑÑ‚Ð¸'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showReturnModal && selectedInvoice && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeReturnModal}
            className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/50 p-3 backdrop-blur-sm sm:items-center sm:p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-md border border-[#9fb7d5] bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-[#b7c2ce] bg-[linear-gradient(180deg,#ffffff_0%,#dde5ee_100%)] px-4 py-3">
                <div className="flex items-center space-x-4">
                  <div className="rounded border border-[#d6c07a] bg-[#fff8dc] p-2 text-[#7a5a00]">
                    <RotateCcw size={24} />
                  </div>
                  <h3 className="text-xl font-semibold text-[#1f2933]">ÐžÑ„Ð¾Ñ€Ð¼Ð¸Ñ‚ÑŒ Ð²Ð¾Ð·Ð²Ñ€Ð°Ñ‚</h3>
                </div>
                <button onClick={closeReturnModal} className="flex h-8 w-8 items-center justify-center rounded border border-[#9fb7d5] bg-white text-[#23527c] transition-colors hover:bg-[#eaf2fb]">
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex-1 space-y-4 overflow-y-auto bg-[#f3f5f7] p-3 sm:p-4">
                <div className="grid gap-2 rounded border border-[#c8d2df] bg-white p-3 md:grid-cols-3">
                  <div>
                    <p className="text-[11px] font-semibold text-[#48627f]">ÐÐ°ÐºÐ»Ð°Ð´Ð½Ð°Ñ</p>
                    <p className="mt-1 text-sm font-semibold text-[#1f2933]">#{selectedInvoice.id}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-[#48627f]">ÐšÐ»Ð¸ÐµÐ½Ñ‚</p>
                    <p className="mt-1 break-words text-sm font-semibold text-[#1f2933]">{selectedInvoice.customer_name}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-[#48627f]">Ð”Ð°Ñ‚Ð°</p>
                    <p className="mt-1 text-sm font-medium text-[#1f2933]">{new Date(selectedInvoice.createdAt).toLocaleDateString('ru-RU')}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="ml-1 text-sm font-semibold text-[#32465a]">Ð’Ñ‹Ð±ÐµÑ€Ð¸Ñ‚Ðµ Ñ‚Ð¾Ð²Ð°Ñ€Ñ‹ Ð´Ð»Ñ Ð²Ð¾Ð·Ð²Ñ€Ð°Ñ‚Ð°</h4>
                  <div className="overflow-x-auto rounded border border-[#b7c2ce] bg-white">
                    <table className="w-full min-w-[760px] table-fixed border-collapse text-left text-sm">
                      <colgroup>
                        <col className="w-[36%]" />
                        <col className="w-[30%]" />
                        <col className="w-[34%]" />
                      </colgroup>
                      <thead>
                        <tr className="border-b border-[#b7c2ce] bg-[#dbe5f1] text-[12px] font-semibold text-[#32465a]">
                          <th className="px-3 py-2">Ð¢Ð¾Ð²Ð°Ñ€</th>
                          <th className="px-3 py-2">ÐŸÑ€Ð¾Ð´Ð°Ð½Ð¾ / Ð´Ð¾ÑÑ‚ÑƒÐ¿Ð½Ð¾</th>
                          <th className="px-3 py-2">Ð’Ð¾Ð·Ð²Ñ€Ð°Ñ‚</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#d5dde6]">
                        {returnItems.map((item: ReturnInvoiceItem, idx: number) => {
                          const quantityInfo = getInvoiceItemQuantityParts(item);
                          const packaging = getReturnItemPackaging(item);
                          const remainingUnits = getReturnItemRemainingUnits(item);
                          const maxPackages = packaging ? Math.floor(remainingUnits / packaging.unitsPerPackage) : 0;
                          const inputMax = item.returnMode === 'package' ? maxPackages : remainingUnits;
                          const itemMeta = [
                            `Ð¡Ñ‚Ñ€Ð¾ÐºÐ° #${idx + 1}`,
                            item?.product?.sku ? `ÐÑ€Ñ‚Ð¸ÐºÑƒÐ»: ${item.product.sku}` : null,
                            item?.brandSnapshot || item?.product?.brand ? `Ð‘Ñ€ÐµÐ½Ð´: ${item.brandSnapshot || item.product.brand}` : null,
                          ].filter(Boolean).join(' Â· ');

                          return (
                            <tr key={item.id} className="even:bg-[#fbfcfd]">
                              <td className="px-3 py-3 align-top">
                                <p className="mb-1 text-[10px] font-medium text-[#6b7b8d]">
                                  {itemMeta}
                                </p>
                                <p className="break-words text-sm font-semibold leading-5 text-[#1f2933]">
                                  {getReturnItemDisplayName(item)}
                                </p>
                              </td>
                              <td className="px-3 py-3 align-top text-[11px] text-[#48627f]">
                                <p className="whitespace-nowrap text-xs font-semibold text-[#1f2933]">{quantityInfo.primary}</p>
                                {quantityInfo.secondary && (
                                  <p className="mt-0.5 whitespace-nowrap text-[10px] text-[#6b7b8d]">{quantityInfo.secondary}</p>
                                )}
                                <p className="mt-2 inline-flex rounded border border-[#c8d2df] bg-[#f7f9fb] px-2 py-1 text-[10px] text-[#48627f]">
                                  Ð”Ð¾ÑÑ‚ÑƒÐ¿Ð½Ð¾: {packaging ? `${maxPackages} ${packaging.packageName} Ð¸Ð»Ð¸ ` : ''}{formatCount(remainingUnits)} {packaging?.baseUnitName || 'ÑˆÑ‚'}
                                </p>
                              </td>
                              <td className="px-3 py-3 align-top">
                                <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_120px] gap-2">
                                  {packaging ? (
                                    <select
                                      value={item.returnMode}
                                      onChange={(e) => {
                                        const newItems = [...returnItems] as ReturnInvoiceItem[];
                                        newItems[idx] = {
                                          ...newItems[idx],
                                          returnMode: e.target.value === 'package' ? 'package' : 'unit',
                                          returnQty: '',
                                        };
                                        setReturnItems(newItems);
                                      }}
                                      className="h-9 w-full min-w-0 rounded border border-[#9fb7d5] bg-white px-2 text-xs font-medium text-[#1f2933] outline-none focus:border-[#4f81bd]"
                                    >
                                      <option value="package">{packaging.packageName}</option>
                                      <option value="unit">{packaging.baseUnitName}</option>
                                    </select>
                                  ) : null}
                                  <input 
                                    type="number" 
                                    min="0"
                                    step="0.01"
                                    max={inputMax}
                                    value={item.returnQty}
                                    onChange={(e) => {
                                      const newItems = [...returnItems] as ReturnInvoiceItem[];
                                      newItems[idx] = {
                                        ...newItems[idx],
                                        returnQty: e.target.value,
                                      };
                                      setReturnItems(newItems);
                                    }}
                                    placeholder={item.returnMode === 'package' ? 'ÐšÐ¾Ð»-Ð²Ð¾ ÐºÐ¾Ñ€Ð¾Ð±Ð¾Ðº' : 'ÐšÐ¾Ð»-Ð²Ð¾ ÑˆÑ‚'}
                                    className={clsx(
                                      'h-9 w-full min-w-0 rounded border border-[#9fb7d5] bg-white px-2 text-center text-sm font-semibold text-[#1f2933] outline-none focus:border-[#4f81bd]',
                                      !packaging && 'col-span-2'
                                    )}
                                  />
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="rounded border border-[#c8d2df] bg-white p-3">
                  <label className="ml-1 text-sm font-semibold text-[#32465a]">ÐŸÑ€Ð¸Ñ‡Ð¸Ð½Ð° Ð²Ð¾Ð·Ð²Ñ€Ð°Ñ‚Ð°</label>
                  <textarea 
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    className="mt-2 min-h-[86px] w-full rounded border border-[#9fb7d5] bg-white px-3 py-2 text-sm font-medium text-[#1f2933] outline-none transition-colors focus:border-[#4f81bd]"
                    placeholder="Ð£ÐºÐ°Ð¶Ð¸Ñ‚Ðµ Ð¿Ñ€Ð¸Ñ‡Ð¸Ð½Ñƒ Ð²Ð¾Ð·Ð²Ñ€Ð°Ñ‚Ð°..."
                  />
                </div>
              </div>
              
              <div className="flex flex-col-reverse gap-2 border-t border-[#b7c2ce] bg-[#eef3f8] px-4 py-3 sm:flex-row">
                <button 
                  onClick={closeReturnModal}
                  className="flex-1 rounded border border-[#9fb7d5] bg-white px-4 py-2 text-sm font-medium text-[#1f3f63] transition-colors hover:bg-[#eaf2fb]"
                >
                  ÐžÑ‚Ð¼ÐµÐ½Ð°
                </button>
                <button 
                  onClick={handleReturn}
                  disabled={isReturning || returnItems.every((item: ReturnInvoiceItem) => !item.returnQty || parseFloat(item.returnQty) === 0)}
                  className="flex-1 rounded border border-[#8f6f18] bg-[#ffd966] px-4 py-2 text-sm font-semibold text-[#2f2f2f] transition-colors hover:bg-[#ffc83d] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isReturning ? 'ÐžÑ„Ð¾Ñ€Ð¼Ð»ÐµÐ½Ð¸Ðµ...' : 'ÐžÑ„Ð¾Ñ€Ð¼Ð¸Ñ‚ÑŒ Ð²Ð¾Ð·Ð²Ñ€Ð°Ñ‚'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}
