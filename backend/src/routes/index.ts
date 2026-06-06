import { Router } from 'express';
import authRoutes from './auth.routes';
import activityRoutes from './activity.routes';
import storeRoutes from './store.routes';
import dashboardRoutes from './dashboard.routes';
import userRoutes from './user.routes';
import uploadRoutes from './upload.routes';
import walletRoutes from './wallet.routes';
import adminRoutes from './admin.routes';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'yourfin-rider-api', time: new Date().toISOString() });
});

router.use('/auth', authRoutes);
router.use('/activities', activityRoutes);
router.use('/stores', storeRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/users', userRoutes);
router.use('/uploads', uploadRoutes);
router.use('/wallet', walletRoutes);
router.use('/admin', adminRoutes);

export default router;
