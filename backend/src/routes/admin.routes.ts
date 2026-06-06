import { Router } from 'express';
import {
  adminListWithdrawals,
  adminProcessWithdrawal,
  listWithdrawalsSchema,
  processWithdrawalSchema,
} from '../controllers/withdrawal.controller';
import { requireAuth, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

// จัดการคำขอถอนคอมมิชชั่น — เห็น/ดำเนินการโดย ADMIN หรือ MANAGER
router.use(requireAuth, requireRole('ADMIN', 'MANAGER'));

router.get('/withdrawals', validate(listWithdrawalsSchema, 'query'), adminListWithdrawals);
router.patch('/withdrawals/:id', validate(processWithdrawalSchema), adminProcessWithdrawal);

export default router;
