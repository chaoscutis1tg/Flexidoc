import { Router } from 'express';
import { 
  getPaymentConfig, 
  updatePaymentConfig, 
  getSystemConfig, 
  updateSystemConfig, 
  getPricingConfig,
  updatePricingConfig,
  getAllSettings 
} from '../controllers/system-setting.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { rbacGuard } from '../middlewares/rbac-guard.js';

const router = Router();

// Public / Authenticated route to get payment and pricing config for landing page and modals
router.get('/payment', getPaymentConfig);
router.get('/pricing', getPricingConfig);

// Super Admin routes to manage all system settings
router.get('/all', authMiddleware, rbacGuard(['SUPER_ADMIN']), getAllSettings);

router.put('/payment', authMiddleware, rbacGuard(['SUPER_ADMIN']), updatePaymentConfig);
router.put('/pricing', authMiddleware, rbacGuard(['SUPER_ADMIN']), updatePricingConfig);

router.get('/system', authMiddleware, rbacGuard(['SUPER_ADMIN']), getSystemConfig);
router.put('/system', authMiddleware, rbacGuard(['SUPER_ADMIN']), updateSystemConfig);

export default router;


