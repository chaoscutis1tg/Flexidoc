import { Router } from 'express';
import { 
  createOrganization, 
  updateOrganization, 
  deleteOrganization, 
  getOrganizationTree, 
  grantPermission, 
  renewSubscription, 
  approveOrganization,
  rejectOrganization,
  getMyPendingInvitations,
  getSubscriptionPlans,
  updateSubscriptionPlan,
  grantCustomPlan,
  toggleBanOrganization,
  getPaginatedRootOrganizations,
  getOrganizationChildren
} from '../controllers/organization.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { tenantContextMiddleware } from '../middlewares/tenant-context.middleware.js';
import { rbacGuard } from '../middlewares/rbac-guard.js';

const router = Router();

router.get('/plans', getSubscriptionPlans);

router.use(authMiddleware);
router.use(tenantContextMiddleware);

router.get('/my-pending-invitations', getMyPendingInvitations);
router.get('/tree', getOrganizationTree);
router.get('/paginated-roots', getPaginatedRootOrganizations);
router.get('/:id/children', getOrganizationChildren);
router.post('/', rbacGuard(['SUPER_ADMIN', 'ORGANIZATION_ADMIN']), createOrganization);
router.patch('/plans/:code', rbacGuard(['SUPER_ADMIN']), updateSubscriptionPlan);
router.patch('/:id/grant-plan', rbacGuard(['SUPER_ADMIN']), grantCustomPlan);
router.patch('/:id/ban-status', rbacGuard(['SUPER_ADMIN']), toggleBanOrganization);
router.patch('/:id', rbacGuard(['SUPER_ADMIN', 'ORGANIZATION_ADMIN']), updateOrganization);
router.post('/:id/approve', approveOrganization);
router.post('/:id/reject', rejectOrganization);
router.delete('/:id', rbacGuard(['SUPER_ADMIN', 'ORGANIZATION_ADMIN']), deleteOrganization);
router.post('/permission-grants', rbacGuard(['SUPER_ADMIN', 'ORGANIZATION_ADMIN']), grantPermission);
router.post('/renew-subscription', rbacGuard(['SUPER_ADMIN', 'ORGANIZATION_ADMIN']), renewSubscription);

export default router;

