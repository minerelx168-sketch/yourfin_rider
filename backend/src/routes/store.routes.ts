import { Router } from 'express';
import {
  createStore,
  createStoreSchema,
  getStore,
  listStores,
  listStoresSchema,
} from '../controllers/store.controller';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

router.use(requireAuth);

router.get('/', validate(listStoresSchema, 'query'), listStores);
router.post('/', validate(createStoreSchema), createStore);
router.get('/:id', getStore);

export default router;
