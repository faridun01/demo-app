-- DropIndex
DROP INDEX "expenses_user_id_idx";

-- AlterTable
ALTER TABLE "expenses" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "invoice_items" ADD COLUMN     "discount" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- RenameIndex
ALTER INDEX "customers_created_by_user_created_at_idx" RENAME TO "customers_created_by_user_id_created_at_idx";

-- RenameIndex
ALTER INDEX "expense_payments_expense_payment_date_idx" RENAME TO "expense_payments_expense_id_payment_date_idx";

-- RenameIndex
ALTER INDEX "expense_payments_user_payment_date_idx" RENAME TO "expense_payments_user_id_payment_date_idx";

-- RenameIndex
ALTER INDEX "expenses_user_created_at_idx" RENAME TO "expenses_user_id_created_at_idx";

-- RenameIndex
ALTER INDEX "inventory_transactions_product_created_at_idx" RENAME TO "inventory_transactions_product_id_created_at_idx";

-- RenameIndex
ALTER INDEX "inventory_transactions_type_warehouse_created_at_idx" RENAME TO "inventory_transactions_type_warehouse_id_created_at_idx";

-- RenameIndex
ALTER INDEX "inventory_transactions_user_created_at_idx" RENAME TO "inventory_transactions_user_id_created_at_idx";

-- RenameIndex
ALTER INDEX "inventory_transactions_warehouse_created_at_idx" RENAME TO "inventory_transactions_warehouse_id_created_at_idx";

-- RenameIndex
ALTER INDEX "invoices_customer_created_at_idx" RENAME TO "invoices_customer_id_created_at_idx";

-- RenameIndex
ALTER INDEX "invoices_user_created_at_idx" RENAME TO "invoices_user_id_created_at_idx";

-- RenameIndex
ALTER INDEX "invoices_warehouse_cancelled_created_at_idx" RENAME TO "invoices_warehouse_id_cancelled_created_at_idx";

-- RenameIndex
ALTER INDEX "payments_customer_created_at_idx" RENAME TO "payments_customer_id_created_at_idx";

-- RenameIndex
ALTER INDEX "payments_invoice_created_at_idx" RENAME TO "payments_invoice_id_created_at_idx";

-- RenameIndex
ALTER INDEX "payments_user_created_at_idx" RENAME TO "payments_user_id_created_at_idx";

-- RenameIndex
ALTER INDEX "price_history_product_created_at_idx" RENAME TO "price_history_product_id_created_at_idx";

-- RenameIndex
ALTER INDEX "product_batches_product_warehouse_idx" RENAME TO "product_batches_product_id_warehouse_id_idx";

-- RenameIndex
ALTER INDEX "product_batches_warehouse_remaining_idx" RENAME TO "product_batches_warehouse_id_remaining_quantity_idx";

-- RenameIndex
ALTER INDEX "product_packagings_product_active_default_idx" RENAME TO "product_packagings_product_id_active_is_default_idx";

-- RenameIndex
ALTER INDEX "product_packagings_product_id_package_name_units_per_package_ke" RENAME TO "product_packagings_product_id_package_name_units_per_packag_key";

-- RenameIndex
ALTER INDEX "product_packagings_warehouse_active_idx" RENAME TO "product_packagings_warehouse_id_active_idx";

-- RenameIndex
ALTER INDEX "products_category_warehouse_active_idx" RENAME TO "products_category_id_warehouse_id_active_idx";

-- RenameIndex
ALTER INDEX "products_warehouse_active_created_at_idx" RENAME TO "products_warehouse_id_active_created_at_idx";

-- RenameIndex
ALTER INDEX "purchase_document_items_document_id_idx" RENAME TO "purchase_document_items_purchase_document_id_idx";

-- RenameIndex
ALTER INDEX "purchase_documents_supplier_created_at_idx" RENAME TO "purchase_documents_supplier_id_created_at_idx";

-- RenameIndex
ALTER INDEX "purchase_documents_warehouse_created_at_idx" RENAME TO "purchase_documents_warehouse_id_created_at_idx";

-- RenameIndex
ALTER INDEX "reminders_user_completed_due_date_idx" RENAME TO "reminders_user_id_is_completed_due_date_idx";

-- RenameIndex
ALTER INDEX "returns_customer_created_at_idx" RENAME TO "returns_customer_id_created_at_idx";

-- RenameIndex
ALTER INDEX "returns_invoice_created_at_idx" RENAME TO "returns_invoice_id_created_at_idx";

-- RenameIndex
ALTER INDEX "returns_user_created_at_idx" RENAME TO "returns_user_id_created_at_idx";
