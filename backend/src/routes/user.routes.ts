import { Router } from 'express';
import { listUsers, updateUser, updateUserSchema } from '../controllers/user.controller';
import { requireAuth, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

router.use(requireAuth, requireRole('ADMIN'));

router.get('/', listUsers);
router.patch('/:id', validate(updateUserSchema), updateUser);

export default router;
