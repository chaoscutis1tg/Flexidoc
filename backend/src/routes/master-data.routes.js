import { Router } from 'express';
import { createMasterData, getMasterDataList, updateMasterData, deleteMasterData } from '../controllers/master-data.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { tenantContextMiddleware } from '../middlewares/tenant-context.middleware.js';

const router = Router();

router.use(authMiddleware);
router.use(tenantContextMiddleware);

router.get('/', getMasterDataList);
router.post('/', createMasterData);
router.patch('/:id', updateMasterData);
router.delete('/:id', deleteMasterData);

export default router;
