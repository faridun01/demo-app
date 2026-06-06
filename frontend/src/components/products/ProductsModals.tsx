import React from 'react';
import { AnimatePresence } from 'motion/react';
import ConfirmationModal from '../common/ConfirmationModal';
import { formatProductName } from '../../utils/productName';
import ProductFormModal from './ProductFormModal';
import ProductMergeModal from './ProductMergeModal';
import ProductOcrResultsModal from './ProductOcrResultsModal';
import ProductRestockModal from './ProductRestockModal';
import ProductReturnWriteOffModal from './ProductReturnWriteOffModal';
import ProductTransferModal from './ProductTransferModal';
import ProductWriteOffModal from './ProductWriteOffModal';

const ProductHistoryModal = React.lazy(() => import('./ProductHistoryModal'));
const ProductBatchesModal = React.lazy(() => import('./ProductBatchesModal'));

interface ProductsModalsProps {
  isAdmin: boolean;
  isLoading: boolean;
  showAddModal: boolean;
  showEditModal: boolean;
  showTransferModal: boolean;
  showRestockModal: boolean;
  showWriteOffModal: boolean;
  showMergeModal: boolean;
  showDeleteConfirm: boolean;
  showHistoryModal: boolean;
  showBatchesModal: boolean;
  showReturnWriteOffModal: boolean;
  showDeleteWriteOffConfirm: boolean;
  selectedProduct: any;
  selectedHistoryTransaction: any;
  selectedWriteOffProduct: any;
  warehouses: any[];
  visibleCategories: any[];
  productHistory: any[];
  productBatches: any[];
  formData: any;
  categoryInput: string;
  isPhotoUploading: boolean;
  transferData: any;
  selectedTransferPackaging: any;
  transferUnitsPerPackage: number;
  transferAvailableFullPackages: number;
  transferRemainderUnits: number;
  transferPackageQuantity: number;
  totalTransferUnits: number;
  availableTransferStock: number | null;
  restockData: any;
  restockPackagings: any[];
  selectedRestockPackaging: any;
  totalRestockUnits: number;
  writeOffData: any;
  selectedWriteOffPackaging: any;
  writeOffReasonPresets: string[];
  normalizedWriteOffReason: string;
  isCustomWriteOffReason: boolean;
  ocrResults: any[] | null;
  visibleOcrResults: any[];
  invalidOcrRowsCount: number;
  problematicOcrRows: Array<{ lineIndex: number; reason: string }>;
  ocrImportedCount: number;
  ocrOriginalCount: number;
  usdRate: string;
  scanExpensePercent: string;
  showOnlyProblematicOcrRows: boolean;
  highlightedOcrLine: number | null;
  ocrRowRefs: React.MutableRefObject<Record<number, HTMLDivElement | null>>;
  mergeCandidates: any[];
  mergeTargetId: string;
  returnWriteOffData: { quantity: string; reason: string };
  closeProductFormModal: () => void;
  closeTransferModal: () => void;
  closeRestockModal: () => void;
  closeWriteOffModal: () => void;
  closeOcrResultsModal: () => void;
  closeHistoryModal: () => void;
  closeBatchesModal: () => void;
  closeMergeModal: () => void;
  closeDeleteConfirm: () => void;
  closeDeleteWriteOffConfirm: () => void;
  closeReturnWriteOffModal: () => void;
  handleAddProduct: (event: React.FormEvent) => void;
  handleEditProduct: (event: React.FormEvent) => void;
  handleTransfer: (event: React.FormEvent) => void;
  handleRestock: (event: React.FormEvent) => void;
  handleSubmitWriteOff: (event: React.FormEvent) => void;
  handleSetWriteOffQuantity: (value: number) => void;
  handleAddOcrToStock: () => void;
  jumpToOcrLine: (lineIndex: number) => void;
  handleReverseIncoming: (transactionId: number) => void;
  handleReverseCorrectionWriteOff: (transactionId: number) => void;
  handleOpenReturnWriteOffModal: (transaction: any) => void;
  handleOpenDeleteWriteOffConfirm: (transaction: any) => void;
  handleOpenWriteOffModal: (product?: any) => void;
  handleDeleteBatch: (batchId: number) => void;
  handleMergeProduct: () => void;
  handleConfirmDeleteProduct: () => void;
  handleDeleteWriteOffPermanently: () => void;
  handleSubmitReturnWriteOff: (event: React.FormEvent) => void;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  setCategoryInput: React.Dispatch<React.SetStateAction<string>>;
  setIsCategoryManual: React.Dispatch<React.SetStateAction<boolean>>;
  handlePhotoUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  setTransferData: React.Dispatch<React.SetStateAction<any>>;
  setRestockData: React.Dispatch<React.SetStateAction<any>>;
  setWriteOffData: React.Dispatch<React.SetStateAction<any>>;
  setOcrResults: React.Dispatch<React.SetStateAction<any[] | null>>;
  setUsdRate: React.Dispatch<React.SetStateAction<string>>;
  setScanExpensePercent: React.Dispatch<React.SetStateAction<string>>;
  setShowOnlyProblematicOcrRows: React.Dispatch<React.SetStateAction<boolean>>;
  setMergeTargetId: React.Dispatch<React.SetStateAction<string>>;
  setReturnWriteOffData: React.Dispatch<React.SetStateAction<{ quantity: string; reason: string }>>;
}

export default function ProductsModals(props: ProductsModalsProps) {
  const {
    isAdmin,
    isLoading,
    showAddModal,
    showEditModal,
    showTransferModal,
    showRestockModal,
    showWriteOffModal,
    showMergeModal,
    showDeleteConfirm,
    showHistoryModal,
    showBatchesModal,
    showReturnWriteOffModal,
    showDeleteWriteOffConfirm,
    selectedProduct,
    selectedHistoryTransaction,
    selectedWriteOffProduct,
    warehouses,
    visibleCategories,
    productHistory,
    productBatches,
    formData,
    categoryInput,
    isPhotoUploading,
    transferData,
    selectedTransferPackaging,
    transferUnitsPerPackage,
    transferAvailableFullPackages,
    transferRemainderUnits,
    transferPackageQuantity,
    totalTransferUnits,
    availableTransferStock,
    restockData,
    restockPackagings,
    selectedRestockPackaging,
    totalRestockUnits,
    writeOffData,
    selectedWriteOffPackaging,
    writeOffReasonPresets,
    normalizedWriteOffReason,
    isCustomWriteOffReason,
    ocrResults,
    visibleOcrResults,
    invalidOcrRowsCount,
    problematicOcrRows,
    ocrImportedCount,
    ocrOriginalCount,
    usdRate,
    scanExpensePercent,
    showOnlyProblematicOcrRows,
    highlightedOcrLine,
    ocrRowRefs,
    mergeCandidates,
    mergeTargetId,
    returnWriteOffData,
    closeProductFormModal,
    closeTransferModal,
    closeRestockModal,
    closeWriteOffModal,
    closeOcrResultsModal,
    closeHistoryModal,
    closeBatchesModal,
    closeMergeModal,
    closeDeleteConfirm,
    closeDeleteWriteOffConfirm,
    closeReturnWriteOffModal,
    handleAddProduct,
    handleEditProduct,
    handleTransfer,
    handleRestock,
    handleSubmitWriteOff,
    handleSetWriteOffQuantity,
    handleAddOcrToStock,
    jumpToOcrLine,
    handleReverseIncoming,
    handleReverseCorrectionWriteOff,
    handleOpenReturnWriteOffModal,
    handleOpenDeleteWriteOffConfirm,
    handleOpenWriteOffModal,
    handleDeleteBatch,
    handleMergeProduct,
    handleConfirmDeleteProduct,
    handleDeleteWriteOffPermanently,
    handleSubmitReturnWriteOff,
    setFormData,
    setCategoryInput,
    setIsCategoryManual,
    handlePhotoUpload,
    setTransferData,
    setRestockData,
    setWriteOffData,
    setOcrResults,
    setUsdRate,
    setScanExpensePercent,
    setShowOnlyProblematicOcrRows,
    setMergeTargetId,
    setReturnWriteOffData,
  } = props;

  return (
    <>
      <AnimatePresence>
        <ProductFormModal
          isOpen={showAddModal || showEditModal}
          isEditMode={showEditModal}
          isAdmin={isAdmin}
          formData={formData}
          categoryInput={categoryInput}
          visibleCategories={visibleCategories}
          warehouses={warehouses}
          isPhotoUploading={isPhotoUploading}
          onClose={closeProductFormModal}
          onSubmit={showEditModal ? handleEditProduct : handleAddProduct}
          setFormData={setFormData}
          setCategoryInput={setCategoryInput}
          setIsCategoryManual={setIsCategoryManual}
          onPhotoUpload={handlePhotoUpload}
        />
      </AnimatePresence>

      <AnimatePresence>
        <ProductTransferModal
          isOpen={showTransferModal}
          selectedProduct={selectedProduct}
          warehouses={warehouses}
          transferData={transferData}
          selectedTransferPackaging={selectedTransferPackaging}
          transferUnitsPerPackage={transferUnitsPerPackage}
          transferAvailableFullPackages={transferAvailableFullPackages}
          transferRemainderUnits={transferRemainderUnits}
          transferPackageQuantity={transferPackageQuantity}
          totalTransferUnits={totalTransferUnits}
          availableTransferStock={availableTransferStock}
          onClose={closeTransferModal}
          onSubmit={handleTransfer}
          setTransferData={setTransferData}
        />
      </AnimatePresence>

      <AnimatePresence>
        <ProductRestockModal
          isOpen={showRestockModal}
          isAdmin={isAdmin}
          selectedProduct={selectedProduct}
          warehouses={warehouses}
          restockData={restockData}
          restockPackagings={restockPackagings}
          selectedRestockPackaging={selectedRestockPackaging}
          totalRestockUnits={totalRestockUnits}
          onClose={closeRestockModal}
          onSubmit={handleRestock}
          setRestockData={setRestockData}
        />
      </AnimatePresence>

      <AnimatePresence>
        <ProductWriteOffModal
          isOpen={showWriteOffModal}
          selectedProduct={selectedWriteOffProduct}
          warehouses={warehouses}
          writeOffData={writeOffData}
          selectedPackaging={selectedWriteOffPackaging}
          reasonPresets={writeOffReasonPresets}
          normalizedReason={normalizedWriteOffReason}
          isCustomReason={isCustomWriteOffReason}
          onClose={closeWriteOffModal}
          onSubmit={handleSubmitWriteOff}
          onSetQuantity={handleSetWriteOffQuantity}
          setWriteOffData={setWriteOffData}
        />
      </AnimatePresence>

      <AnimatePresence>
        <ProductOcrResultsModal
          isOpen={Boolean(ocrResults)}
          ocrResults={ocrResults}
          visibleOcrResults={visibleOcrResults}
          invalidOcrRowsCount={invalidOcrRowsCount}
          problematicOcrRows={problematicOcrRows}
          ocrImportedCount={ocrImportedCount}
          ocrOriginalCount={ocrOriginalCount}
          usdRate={usdRate}
          scanExpensePercent={scanExpensePercent}
          showOnlyProblematicOcrRows={showOnlyProblematicOcrRows}
          highlightedOcrLine={highlightedOcrLine}
          isLoading={isLoading}
          ocrRowRefs={ocrRowRefs}
          onBackdropClose={() => setOcrResults(null)}
          onClose={closeOcrResultsModal}
          onAddOcrToStock={handleAddOcrToStock}
          onJumpToOcrLine={jumpToOcrLine}
          setOcrResults={setOcrResults}
          setUsdRate={setUsdRate}
          setScanExpensePercent={setScanExpensePercent}
          setShowOnlyProblematicOcrRows={setShowOnlyProblematicOcrRows}
        />
      </AnimatePresence>

      <React.Suspense fallback={null}>
        <ProductHistoryModal
          key={showHistoryModal ? `history-${selectedProduct?.id || 'empty'}` : 'history-closed'}
          isOpen={showHistoryModal}
          onClose={closeHistoryModal}
          productName={selectedProduct?.name}
          product={selectedProduct}
          productHistory={productHistory}
          onReverseIncoming={handleReverseIncoming}
          onReverseCorrectionWriteOff={handleReverseCorrectionWriteOff}
          onReturnWriteOff={handleOpenReturnWriteOffModal}
          onDeleteWriteOffPermanently={handleOpenDeleteWriteOffConfirm}
          onWriteOff={isAdmin ? handleOpenWriteOffModal : undefined}
        />
        <ProductBatchesModal
          key={showBatchesModal ? `batches-${selectedProduct?.id || 'empty'}` : 'batches-closed'}
          isOpen={showBatchesModal}
          onClose={closeBatchesModal}
          selectedProduct={selectedProduct}
          productBatches={productBatches}
          canManage={isAdmin}
          onDeleteBatch={handleDeleteBatch}
        />
      </React.Suspense>

      <AnimatePresence>
        <ProductMergeModal
          isOpen={showMergeModal}
          selectedProduct={selectedProduct}
          mergeCandidates={mergeCandidates}
          mergeTargetId={mergeTargetId}
          onClose={closeMergeModal}
          onMerge={handleMergeProduct}
          onMergeTargetChange={setMergeTargetId}
        />
      </AnimatePresence>

      <React.Suspense fallback={null}>
        <ConfirmationModal
          isOpen={showDeleteConfirm}
          onClose={closeDeleteConfirm}
          onConfirm={handleConfirmDeleteProduct}
          title="Удалить товар навсегда?"
          message={`Товар "${formatProductName(selectedProduct?.name)}" будет удалён навсегда. Если он уже участвовал в продажах, система не даст удалить его полностью.`}
        />
      </React.Suspense>

      <React.Suspense fallback={null}>
        <ConfirmationModal
          isOpen={showDeleteWriteOffConfirm}
          onClose={closeDeleteWriteOffConfirm}
          onConfirm={handleDeleteWriteOffPermanently}
          title="Удалить списание навсегда?"
          message="Операция полностью удалит запись списания из истории. Складской остаток и приход будут восстановлены, но восстановить саму удалённую запись потом уже нельзя."
          confirmText="Удалить навсегда"
          cancelText="Отмена"
          type="danger"
        />
      </React.Suspense>

      <AnimatePresence>
        <ProductReturnWriteOffModal
          isOpen={showReturnWriteOffModal}
          transaction={selectedHistoryTransaction}
          returnWriteOffData={returnWriteOffData}
          onClose={closeReturnWriteOffModal}
          onSubmit={handleSubmitReturnWriteOff}
          setReturnWriteOffData={setReturnWriteOffData}
        />
      </AnimatePresence>
    </>
  );
}
