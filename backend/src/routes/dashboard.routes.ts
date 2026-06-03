import { Router } from 'express';
import {
  activityFeed,
  leaderboard,
  mapPoints,
  overview,
  rangeQuerySchema,
  timeseries,
} from '../controllers/dashboard.controller';
import { requireAuth, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

// dashboard เห็นได้เฉพาะ MANAGER / ADMIN
router.use(requireAuth, requireRole('MANAGER', 'ADMIN'));
router.use(validate(rangeQuerySchema, 'query'));

router.get('/overview', overview);
router.get('/leaderboard', leaderboard);
router.get('/timeseries', timeseries);
router.get('/map', mapPoints);
router.get('/feed', activityFeed);

export default router;
