import { Router } from 'express';
import { login, loginSchema, me, register, registerSchema } from '../controllers/auth.controller';
import { requireAuth, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

router.post('/login', validate(loginSchema), login);
router.get('/me', requireAuth, me);
router.post('/register', requireAuth, requireRole('ADMIN'), validate(registerSchema), register);

export default router;
