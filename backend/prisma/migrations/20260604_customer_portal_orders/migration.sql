-- Add customer portal users and pending customer orders.
ALTER TABLE "users" ADD COLUMN "customer_id" INTEGER;

ALTER TABLE "users"
  ADD CONSTRAINT "users_customer_id_fkey"
  FOREIGN KEY ("customer_id") REFERENCES "customers"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "users_customer_id_active_idx" ON "users"("customer_id", "active");

CREATE TABLE "customer_orders" (
  "id" SERIAL NOT NULL,
  "customer_id" INTEGER NOT NULL,
  "user_id" INTEGER NOT NULL,
  "warehouse_id" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "total_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "note" TEXT,
  "invoice_id" INTEGER,
  "approved_by_user_id" INTEGER,
  "approved_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "customer_orders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "customer_order_items" (
  "id" SERIAL NOT NULL,
  "order_id" INTEGER NOT NULL,
  "product_id" INTEGER NOT NULL,
  "quantity" DOUBLE PRECISION NOT NULL,
  "total_base_units" DOUBLE PRECISION,
  "package_quantity" DOUBLE PRECISION,
  "extra_unit_quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "packaging_id" INTEGER,
  "package_name" TEXT,
  "base_unit_name" TEXT,
  "units_per_package" INTEGER,
  "selling_price" DECIMAL(12,2) NOT NULL,
  "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,

  CONSTRAINT "customer_order_items_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "customer_orders"
  ADD CONSTRAINT "customer_orders_customer_id_fkey"
  FOREIGN KEY ("customer_id") REFERENCES "customers"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "customer_orders"
  ADD CONSTRAINT "customer_orders_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "customer_orders"
  ADD CONSTRAINT "customer_orders_warehouse_id_fkey"
  FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "customer_orders"
  ADD CONSTRAINT "customer_orders_invoice_id_fkey"
  FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "customer_orders"
  ADD CONSTRAINT "customer_orders_approved_by_user_id_fkey"
  FOREIGN KEY ("approved_by_user_id") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "customer_order_items"
  ADD CONSTRAINT "customer_order_items_order_id_fkey"
  FOREIGN KEY ("order_id") REFERENCES "customer_orders"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "customer_order_items"
  ADD CONSTRAINT "customer_order_items_product_id_fkey"
  FOREIGN KEY ("product_id") REFERENCES "products"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "customer_orders_status_created_at_idx" ON "customer_orders"("status", "created_at");
CREATE INDEX "customer_orders_customer_id_created_at_idx" ON "customer_orders"("customer_id", "created_at");
CREATE INDEX "customer_orders_warehouse_id_status_idx" ON "customer_orders"("warehouse_id", "status");
CREATE INDEX "customer_order_items_order_id_idx" ON "customer_order_items"("order_id");
CREATE INDEX "customer_order_items_product_id_idx" ON "customer_order_items"("product_id");
