import { Router } from 'express';
import authRoutes from './auth.routes.js';
import organizationRoutes from './organization.routes.js';
import userRoutes from './user.routes.js';
import masterDataRoutes from './master-data.routes.js';
import templateRoutes from './template.routes.js';
import contractRoutes from './contract.routes.js';
import auditLogRoutes from './audit-log.routes.js';
import systemSettingRoutes from './system-setting.routes.js';
import orderRoutes from './order.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/organizations', organizationRoutes);
router.use('/users', userRoutes);
router.use('/master-data', masterDataRoutes);
router.use('/templates', templateRoutes);
router.use('/contracts', contractRoutes);
router.use('/audit-logs', auditLogRoutes);
router.use('/system-settings', systemSettingRoutes);
router.use('/orders', orderRoutes);
router.use('/payments', orderRoutes);

export default router;

