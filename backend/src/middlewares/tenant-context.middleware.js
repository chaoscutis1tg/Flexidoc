import { Organization } from '../models/organization.model.js';
import { PermissionGrant } from '../models/permission-grant.model.js';
import { AppError } from '../utils/app-error.js';

export const tenantContextMiddleware = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) {
      return next();
    }

    let activeOrgId = req.headers['x-organization-id'];
    if (!activeOrgId && user.role !== 'SUPER_ADMIN') {
      activeOrgId = user.organizationId ? (user.organizationId._id || user.organizationId) : null;
    }
    
    if (activeOrgId === "" || activeOrgId === "null" || activeOrgId === "undefined") {
      activeOrgId = null;
    }

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
      const currentOrg = await Organization.findById(orgId).select('status name');
      if (currentOrg && currentOrg.status === 'SUSPENDED' && user.role !== 'SUPER_ADMIN') {
        return next(new AppError(`Tổ chức "${currentOrg.name}" hiện đang bị tạm khóa (Banned) bởi Super Admin. Vui lòng liên hệ hỗ trợ để mở khóa.`, 403));
      }

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
