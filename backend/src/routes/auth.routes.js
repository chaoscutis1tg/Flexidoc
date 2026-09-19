import { Router } from 'express';
import { login, register, getMe, changePassword, googleAuth, setupGoogleOrg, checkOrgCode } from '../controllers/auth.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { tenantContextMiddleware } from '../middlewares/tenant-context.middleware.js';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.post('/google', googleAuth);
router.post('/google/setup-org', setupGoogleOrg);
router.get('/check-org-code', checkOrgCode);
router.get('/me', authMiddleware, tenantContextMiddleware, getMe);
router.post('/change-password', authMiddleware, tenantContextMiddleware, changePassword);

export default router;
