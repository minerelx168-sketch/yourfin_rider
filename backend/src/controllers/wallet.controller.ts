import type { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../middleware/error';
import { getWallet } from '../services/commission.service';

/** กระเป๋าเงินของไรเดอร์ — ยอดคงเหลือ + ค่าคอม + ค่าแนะนำ + ledger ล่าสุด */
export const myWallet = asyncHandler(async (req: Request, res: Response) => {
  res.json(await getWallet(req.user!.sub));
});

// ── บัญชีรับเงิน (1 ยูส = 1 บัญชี) ────────────────────────────
export const updateBankSchema = z.object({
  bankName: z.string().min(1, 'ระบุชื่อธนาคาร').max(100),
  bankAccountNumber: z.string().min(1, 'ระบุเลขบัญชี').max(40),
  bankAccountName: z.string().min(1, 'ระบุชื่อบัญชี').max(120),
});

/** ไรเดอร์ตั้ง/แก้บัญชีรับเงินของตัวเอง (มีได้บัญชีเดียว — ทับของเดิม) */
export const updateMyBank = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as z.infer<typeof updateBankSchema>;
  const bank = await prisma.user.update({
    where: { id: req.user!.sub },
    data: {
      bankName: body.bankName,
      bankAccountNumber: body.bankAccountNumber,
      bankAccountName: body.bankAccountName,
    },
    select: { bankName: true, bankAccountNumber: true, bankAccountName: true },
  });
  res.json({ bank });
});
