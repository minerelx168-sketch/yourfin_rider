import { Router } from 'express';
import { uploadPhoto } from '../controllers/upload.controller';
import { requireAuth } from '../middleware/auth';
import { uploadImage } from '../middleware/upload';

const router = Router();

router.post('/', requireAuth, uploadImage.single('photo'), uploadPhoto);

export default router;
