CREATE INDEX IF NOT EXISTS "products_name_key_warehouse_id_idx"
  ON "products"("name_key", "warehouse_id");

CREATE INDEX IF NOT EXISTS "invoices_warehouse_id_cancelled_status_created_at_idx"
  ON "invoices"("warehouse_id", "cancelled", "status", "created_at");

CREATE INDEX IF NOT EXISTS "payments_customer_id_invoice_id_idx"
  ON "payments"("customer_id", "invoice_id");
