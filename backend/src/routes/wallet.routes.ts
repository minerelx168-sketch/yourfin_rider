import { Router } from 'express';
import { myWallet } from '../controllers/wallet.controller';
import {
  createWithdrawalSchema,
  myWithdrawals,
  requestWithdrawal,
} from '../controllers/withdrawal.controller';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();
router.use(requireAuth);

// กระเป๋าเงิน + คำขอถอนของไรเดอร์เอง
router.get('/', myWallet);
router.post('/withdrawals', validate(createWithdrawalSchema), requestWithdrawal);
router.get('/withdrawals', myWithdrawals);

export default router;
