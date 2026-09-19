import { Router } from 'express';
import { createUser, getUsers, getUserById, updateUser, deleteUser } from '../controllers/user.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { tenantContextMiddleware } from '../middlewares/tenant-context.middleware.js';
import { rbacGuard } from '../middlewares/rbac-guard.js';

const router = Router();

router.use(authMiddleware);
router.use(tenantContextMiddleware);

router.get('/', getUsers);
router.get('/:id', getUserById);
router.post('/', rbacGuard(['SUPER_ADMIN', 'ORGANIZATION_ADMIN']), createUser);
router.patch('/:id', rbacGuard(['SUPER_ADMIN', 'ORGANIZATION_ADMIN']), updateUser);
router.delete('/:id', rbacGuard(['SUPER_ADMIN', 'ORGANIZATION_ADMIN']), deleteUser);

export default router;
