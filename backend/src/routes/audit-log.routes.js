import { Router } from 'express';
import { getAuditLogs } from '../controllers/audit-log.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { tenantContextMiddleware } from '../middlewares/tenant-context.middleware.js';
import { rbacGuard } from '../middlewares/rbac-guard.js';

const router = Router();

router.use(authMiddleware);
router.use(tenantContextMiddleware);

router.get('/', rbacGuard(['SUPER_ADMIN', 'ORGANIZATION_ADMIN']), getAuditLogs);

export default router;
