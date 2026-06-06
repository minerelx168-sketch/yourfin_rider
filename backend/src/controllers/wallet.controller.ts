import type { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error';
import { getWallet } from '../services/commission.service';

/** กระเป๋าเงินของไรเดอร์ — ยอดคงเหลือ + ค่าคอม + ค่าแนะนำ + ledger ล่าสุด */
export const myWallet = asyncHandler(async (req: Request, res: Response) => {
  res.json(await getWallet(req.user!.sub));
});
