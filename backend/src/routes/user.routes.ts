import { Router } from 'express';
import {
  createUser,
  createUserSchema,
  listUsers,
  resetPassword,
  resetPasswordSchema,
  updateUser,
  updateUserSchema,
} from '../controllers/user.controller';
import { requireAuth, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

// จัดการผู้ใช้ — ADMIN และ MANAGER (ข้อจำกัดราย role อยู่ใน controller:
// MANAGER สร้าง/แก้/รีเซ็ตรหัสผู้ใช้ระดับ ADMIN ไม่ได้)
router.use(requireAuth, requireRole('ADMIN', 'MANAGER'));

router.get('/', listUsers);
router.post('/', validate(createUserSchema), createUser);
router.patch('/:id', validate(updateUserSchema), updateUser);
router.post('/:id/reset-password', validate(resetPasswordSchema), resetPassword);

export default router;
