import { Router } from 'express';
import {
  adminFinanceSummary,
  adminListWithdrawals,
  adminProcessWithdrawal,
  listWithdrawalsSchema,
  processWithdrawalSchema,
} from '../controllers/withdrawal.controller';
import { requireAuth, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

// งานถอนคอมมิชชั่น/การเงิน — เห็น/ดำเนินการโดย ADMIN, MANAGER หรือ FINANCE
router.use(requireAuth, requireRole('ADMIN', 'MANAGER', 'FINANCE'));

router.get('/finance/summary', adminFinanceSummary);
router.get('/withdrawals', validate(listWithdrawalsSchema, 'query'), adminListWithdrawals);
router.patch('/withdrawals/:id', validate(processWithdrawalSchema), adminProcessWithdrawal);

export default router;
