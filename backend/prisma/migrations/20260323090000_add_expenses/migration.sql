CREATE TABLE "expenses" (
  "id" SERIAL NOT NULL,
  "warehouse_id" INTEGER NOT NULL,
  "user_id" INTEGER NOT NULL,
  "category" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "expense_date" TIMESTAMP(3) NOT NULL,
  "note" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "expenses"
ADD CONSTRAINT "expenses_warehouse_id_fkey"
FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "expenses"
ADD CONSTRAINT "expenses_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "expenses_warehouse_id_expense_date_idx" ON "expenses"("warehouse_id", "expense_date");
CREATE INDEX "expenses_user_id_idx" ON "expenses"("user_id");
