import { Router } from 'express';
import { getPaymentConfig, updatePaymentConfig } from '../controllers/system-setting.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { rbacGuard } from '../middlewares/rbac-guard.js';

const router = Router();

// Public / Authenticated route to get payment config for QR code modal
router.get('/payment', getPaymentConfig);

// Super Admin route to update payment config (Bank MB 5408092006, SePay key, etc.)
router.put('/payment', authMiddleware, rbacGuard(['SUPER_ADMIN']), updatePaymentConfig);

export default router;

