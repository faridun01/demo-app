import { Router } from 'express';
import { z } from 'zod';
import type { AuthRequest } from '../middlewares/auth.middleware.js';
import { AppError, created, ok, parseNumericId } from '../lib/http.js';
import { parseSchema, trimToNull } from '../lib/validation.js';
import { getAccessContext, getScopedWarehouseId } from '../utils/access.js';
import { ExpenseService, normalizePositiveExpenseAmount } from '../services/expense.service.js';

const router = Router();

const expenseQuerySchema = z.object({
  start: z.union([z.string(), z.undefined(), z.null()]).optional(),
  end: z.union([z.string(), z.undefined(), z.null()]).optional(),
});

const expenseBodySchema = z.object({
  warehouseId: z.union([z.number(), z.string()]),
  title: z.string(),
  category: z.union([z.string(), z.undefined(), z.null()]).optional(),
  amount: z.unknown(),
  paidAmount: z.unknown().optional(),
  expenseDate: z.unknown().optional(),
  note: z.union([z.string(), z.undefined(), z.null()]).optional(),
});

const expensePaymentSchema = z.object({
  amount: z.unknown(),
});

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const access = await getAccessContext(req);
    ExpenseService.ensureAdminOnly(access.isAdmin);
    const query = parseSchema(expenseQuerySchema, req.query);

    const expenses = await ExpenseService.list({
      warehouseId: getScopedWarehouseId(access, req.query.warehouseId) ?? undefined,
      start: trimToNull(query.start),
      end: trimToNull(query.end),
    });

    ok(res, expenses);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const access = await getAccessContext(req);
    ExpenseService.ensureAdminOnly(access.isAdmin);
    const body = parseSchema(expenseBodySchema, req.body);
    const payloadInput: Parameters<typeof ExpenseService.buildPayload>[0] = {
      warehouseId: Number(body.warehouseId),
      title: body.title,
      category: body.category,
      amount: body.amount,
      paidAmount: body.paidAmount,
      expenseDate: body.expenseDate,
      note: trimToNull(body.note),
    };
    const payload = ExpenseService.buildPayload(payloadInput);

    created(res, await ExpenseService.create(payload, req));
  } catch (error) {
    next(error);
  }
});

const updateExpenseHandler = async (req: AuthRequest, res: any, next: any) => {
  try {
    const access = await getAccessContext(req);
    ExpenseService.ensureAdminOnly(access.isAdmin);

    const expenseId = parseNumericId(req.params.id, 'Expense ID');
    const existingExpense = await ExpenseService.getById(expenseId);

    if (!existingExpense) {
      throw new AppError('Расход не найден', { status: 404, code: 'EXPENSE_NOT_FOUND' });
    }

    const body = parseSchema(expenseBodySchema, {
      ...req.body,
      warehouseId: req.body?.warehouseId ?? existingExpense.warehouseId,
    });

    const payloadInput: Parameters<typeof ExpenseService.buildPayload>[0] = {
      warehouseId: Number(body.warehouseId),
      title: body.title,
      category: body.category,
      amount: body.amount,
      paidAmount: body.paidAmount,
      expenseDate: body.expenseDate,
      note: trimToNull(body.note),
    };
    const payload = ExpenseService.buildPayload(payloadInput);

    ok(res, await ExpenseService.update(expenseId, payload));
  } catch (error) {
    next(error);
  }
};

router.put('/:id', updateExpenseHandler);
router.patch('/:id', updateExpenseHandler);

router.post('/:id/payments', async (req: AuthRequest, res, next) => {
  try {
    const access = await getAccessContext(req);
    ExpenseService.ensureAdminOnly(access.isAdmin);
    const expenseId = parseNumericId(req.params.id, 'Expense ID');
    const body = parseSchema(expensePaymentSchema, req.body);
    const amount = normalizePositiveExpenseAmount(body.amount);

    ok(res, await ExpenseService.addPayment(expenseId, amount));
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const access = await getAccessContext(req);
    ExpenseService.ensureAdminOnly(access.isAdmin);
    const expenseId = parseNumericId(req.params.id, 'Expense ID');

    ok(res, await ExpenseService.remove(expenseId));
  } catch (error) {
    next(error);
  }
});

export default router;
