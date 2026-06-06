import type { Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/error';
import { parseWorkDate } from '../utils/date';
import {
  createWithdrawal,
  financeSummary,
  getMyWithdrawals,
  listWithdrawals,
  processWithdrawal,
  withdrawalSummary,
} from '../services/withdrawal.service';

// ── ฝั่งไรเดอร์ ────────────────────────────────────────────────
// บัญชีรับเงินถูกล็อกเป็นบัญชีเดียวในโปรไฟล์ (ตั้งผ่าน PATCH /wallet/bank)
// คำขอถอนจึงรับแค่จำนวนเงิน + หมายเหตุ
export const createWithdrawalSchema = z.object({
  amount: z.number().positive('จำนวนเงินต้องมากกว่า 0'),
  note: z.string().max(500).optional(),
});

export const requestWithdrawal = asyncHandler(async (req: Request, res: Response) => {
  const withdrawal = await createWithdrawal(req.user!.sub, req.body);
  res.status(201).json({ withdrawal });
});

export const myWithdrawals = asyncHandler(async (req: Request, res: Response) => {
  res.json({ withdrawals: await getMyWithdrawals(req.user!.sub) });
});

// ── ฝั่งแอดมิน ─────────────────────────────────────────────────
export const listWithdrawalsSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'PAID']).optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const adminListWithdrawals = asyncHandler(async (req: Request, res: Response) => {
  const q = req.query as z.infer<typeof listWithdrawalsSchema>;
  const from = q.from ? parseWorkDate(q.from) : undefined;
  // ครอบคลุมทั้งวันของ `to`
  const to = q.to ? new Date(parseWorkDate(q.to).getTime() + 86400000 - 1) : undefined;

  const [withdrawals, summary] = await Promise.all([
    listWithdrawals({ status: q.status, from, to }),
    withdrawalSummary(),
  ]);
  res.json({ withdrawals, summary });
});

export const processWithdrawalSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT', 'PAY']),
  slipUrl: z.string().url().optional(),
  adminNote: z.string().max(500).optional(),
});

export const adminProcessWithdrawal = asyncHandler(async (req: Request, res: Response) => {
  const { action, slipUrl, adminNote } = req.body as z.infer<typeof processWithdrawalSchema>;
  const withdrawal = await processWithdrawal(req.params.id, req.user!.sub, action, {
    slipUrl,
    adminNote,
  });
  res.json({ withdrawal });
});

// ภาพรวมการเงิน (สำหรับ role FINANCE / ADMIN / MANAGER)
export const adminFinanceSummary = asyncHandler(async (_req: Request, res: Response) => {
  res.json(await financeSummary());
});
