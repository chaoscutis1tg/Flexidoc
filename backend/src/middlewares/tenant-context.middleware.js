import { Organization } from '../models/organization.model.js';
import { PermissionGrant } from '../models/permission-grant.model.js';

export const tenantContextMiddleware = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) {
      return next();
    }

    const activeOrgId = req.headers['x-organization-id'] || (user.organizationId ? (user.organizationId._id || user.organizationId) : null);

    const tenantContext = {
      userId: user._id,
      organizationId: activeOrgId,
      role: user.role,
      permissions: user.permissions || [],
      allowedOrgIds: [],
    };

    if (user.role === 'SUPER_ADMIN' && !activeOrgId) {
      tenantContext.allowedOrgIds = []; // empty array means GLOBAL access for SUPER_ADMIN when no org selected
    } else if (activeOrgId) {
      const orgId = activeOrgId;
      const allowedSet = new Set([orgId.toString()]);

      // Nếu Role là Org Admin, tự động kiểm tra xem có quyền DESCENDANTS hoặc grants hay không
      if (user.role === 'ORGANIZATION_ADMIN') {
        const descendants = await Organization.find({ ancestors: orgId, deletedAt: null }).select('_id');
        descendants.forEach(d => allowedSet.add(d._id.toString()));
      }

      // Check PermissionGrants cấp cho Organization hiện tại
      const grants = await PermissionGrant.find({
        granteeOrganizationId: orgId,
        $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }]
      }).select('granterOrganizationId');

      grants.forEach(g => allowedSet.add(g.granterOrganizationId.toString()));

      tenantContext.allowedOrgIds = Array.from(allowedSet);
    }

    req.tenantContext = tenantContext;
    next();
  } catch (error) {
    next(error);
  }
};
