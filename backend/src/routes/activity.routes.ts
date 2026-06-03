import { Router } from 'express';
import {
  checkIn,
  checkInSchema,
  clockIn,
  clockOut,
  clockSchema,
  dateQuerySchema,
  myDay,
} from '../controllers/activity.controller';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

router.use(requireAuth);

router.post('/clock-in', validate(clockSchema), clockIn);
router.post('/clock-out', validate(clockSchema), clockOut);
router.post('/check-in', validate(checkInSchema), checkIn);
router.get('/me/day', validate(dateQuerySchema, 'query'), myDay);

export default router;
