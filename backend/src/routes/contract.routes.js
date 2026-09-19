import { Router } from 'express';
import { createContract, getContracts, getContractDetails, updateContractData, downloadContractPdf } from '../controllers/contract.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { tenantContextMiddleware } from '../middlewares/tenant-context.middleware.js';
import { rbacGuard } from '../middlewares/rbac-guard.js';

const router = Router();

router.use(authMiddleware);
router.use(tenantContextMiddleware);

router.get('/', getContracts);
router.get('/:id', getContractDetails);
router.post('/', rbacGuard(['SUPER_ADMIN', 'ORGANIZATION_ADMIN', 'STAFF']), createContract);
router.patch('/:id', rbacGuard(['SUPER_ADMIN', 'ORGANIZATION_ADMIN', 'STAFF']), updateContractData);
router.get('/:id/download-pdf', downloadContractPdf);

export default router;
