import prisma from '../db/prisma.js';
import type { AuthRequest } from '../middlewares/auth.middleware.js';
import { AppError } from '../lib/http.js';
import { normalizeMoney } from '../utils/money.js';

type ExpenseFilters = {
  warehouseId?: number;
  start?: string | null;
  end?: string | null;
};

export type ExpensePayload = {
  warehouseId: number;
  title: string;
  category: string;
  amount: number;
  paidAmount: number;
  expenseDate: Date;
  note: string | null;
};

const expenseInclude = {
  warehouse: {
    select: { id: true, name: true },
  },
  user: {
    select: { id: true, username: true },
  },
} as const;

export const normalizePositiveExpenseAmount = (value: unknown) => {
  const amount = normalizeMoney(value, 'Expense amount', { allowZero: false });
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new AppError('Сумма расхода должна быть больше нуля', { status: 400, code: 'INVALID_EXPENSE_AMOUNT' });
  }

  return amount;
};

const normalizePaidAmount = (value: unknown, totalAmount: number) => {
  const amount = normalizeMoney(value ?? 0, 'Expense paid amount');
  if (!Number.isFinite(amount) || amount < 0) {
    throw new AppError('Сумма оплаты не может быть отрицательной', { status: 400, code: 'INVALID_EXPENSE_PAYMENT' });
  }

  if (amount > totalAmount) {
    throw new AppError('Сумма оплаты не может быть больше суммы расхода', { status: 400, code: 'EXPENSE_PAYMENT_OVERFLOW' });
  }

  return amount;
};

const normalizeExpenseDate = (value: unknown) => {
  if (value === undefined || value === null || value === '') {
    return new Date();
  }

  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) {
    throw new AppError('Дата расхода указана некорректно', { status: 400, code: 'INVALID_EXPENSE_DATE' });
  }

  return parsed;
};

export class ExpenseService {
  static ensureAdminOnly(isAdmin: boolean) {
    if (!isAdmin) {
      throw new AppError('Forbidden', { status: 403, code: 'FORBIDDEN' });
    }
  }

  static buildPayload(input: {
    warehouseId: number;
    title: string;
    category?: string | null;
    amount: unknown;
    paidAmount?: unknown;
    expenseDate?: unknown;
    note?: string | null;
  }): ExpensePayload {
    const title = String(input.title || '').trim();
    if (!title) {
      throw new AppError('Название расхода обязательно', { status: 400, code: 'EXPENSE_TITLE_REQUIRED' });
    }

    const warehouseId = Number(input.warehouseId);
    if (!warehouseId || !Number.isFinite(warehouseId)) {
      throw new AppError('Склад обязателен', { status: 400, code: 'EXPENSE_WAREHOUSE_REQUIRED' });
    }

    const amount = normalizePositiveExpenseAmount(input.amount);

    return {
      warehouseId,
      title,
      category: String(input.category || 'Прочее').trim() || 'Прочее',
      amount,
      paidAmount: normalizePaidAmount(input.paidAmount, amount),
      expenseDate: normalizeExpenseDate(input.expenseDate),
      note: input.note ?? null,
    };
  }

  static async list(filters: ExpenseFilters) {
    return prisma.expense.findMany({
      where: {
        warehouseId: filters.warehouseId ?? undefined,
        expenseDate: filters.start || filters.end
          ? {
              gte: filters.start ? new Date(`${filters.start}T00:00:00.000Z`) : undefined,
              lte: filters.end ? new Date(`${filters.end}T23:59:59.999Z`) : undefined,
            }
          : undefined,
      },
      include: expenseInclude,
      orderBy: [{ expenseDate: 'desc' }, { id: 'desc' }],
    });
  }

  static async getById(id: number) {
    return prisma.expense.findUnique({
      where: { id },
      select: {
        id: true,
        warehouseId: true,
        userId: true,
        amount: true,
        paidAmount: true,
      },
    });
  }

  static async create(payload: ExpensePayload, req: AuthRequest) {
    return prisma.expense.create({
      data: {
        ...payload,
        userId: req.user!.id,
      },
      include: expenseInclude,
    });
  }

  static async update(id: number, payload: ExpensePayload) {
    return prisma.expense.update({
      where: { id },
      data: payload,
      include: expenseInclude,
    });
  }

  static async addPayment(id: number, amount: number) {
    const expense = await this.getById(id);
    if (!expense) {
      throw new AppError('Расход не найден', { status: 404, code: 'EXPENSE_NOT_FOUND' });
    }

    const nextPaidAmount = normalizePaidAmount(Number(expense.paidAmount || 0) + amount, Number(expense.amount || 0));

    return prisma.expense.update({
      where: { id },
      data: { paidAmount: nextPaidAmount },
      include: expenseInclude,
    });
  }

  static async remove(id: number) {
    const expense = await this.getById(id);
    if (!expense) {
      throw new AppError('Расход не найден', { status: 404, code: 'EXPENSE_NOT_FOUND' });
    }

    await prisma.expense.delete({ where: { id } });
    return { success: true };
  }
}
