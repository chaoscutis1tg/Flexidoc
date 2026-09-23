import { Router } from 'express';
import {
  createOrder,
  getOrderById,
  manualApproveOrder,
  rejectOrder,
  processSepayWebhook,
  getAdminOrdersAndStats,
  getAdminReportData,
} from '../controllers/order.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { rbacGuard } from '../middlewares/rbac-guard.js';

const router = Router();

// 1. Webhook endpoint for SePay (Public endpoint protected by Apikey Authorization Header)
router.post('/payments/sepay-webhook', processSepayWebhook);
router.post('/sepay-webhook', processSepayWebhook);

// 2. User/Org Admin create order
router.post('/', authMiddleware, createOrder);

// 3. Super Admin routes
router.get('/admin/all', authMiddleware, rbacGuard(['SUPER_ADMIN']), getAdminOrdersAndStats);
router.get('/admin/report', authMiddleware, rbacGuard(['SUPER_ADMIN']), getAdminReportData);
router.patch('/:id/approve', authMiddleware, rbacGuard(['SUPER_ADMIN']), manualApproveOrder);
router.patch('/:id/reject', authMiddleware, rbacGuard(['SUPER_ADMIN']), rejectOrder);

// 4. User view order detail
router.get('/:id', authMiddleware, getOrderById);

export default router;

