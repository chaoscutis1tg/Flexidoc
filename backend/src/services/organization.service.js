import { Organization } from '../models/organization.model.js';
import { organizationRepository } from '../repositories/organization.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { PermissionGrant } from '../models/permission-grant.model.js';
import { AppError } from '../utils/app-error.js';
import bcrypt from 'bcryptjs';

export class OrganizationService {
  async getMyPendingInvitations(userEmail) {
    if (!userEmail) return [];
    const normalizedEmail = userEmail.toLowerCase().trim();
    return await Organization.find({
      managerEmail: normalizedEmail,
      status: 'PENDING_APPROVAL',
      deletedAt: null
    }).populate('parentOrganizationId', 'name code');
  }

  async createOrganization(data, parentId = null, tenantContext = null) {
    const existing = await organizationRepository.findByCode(data.code);
    if (existing) {
      throw new AppError(`Mã tổ chức '${data.code}' đã tồn tại trong hệ thống.`, 400);
    }

    let ancestors = [];
    let level = 0;

    if (parentId) {
      const parentOrg = await organizationRepository.findById(parentId, tenantContext);
      if (!parentOrg) {
        throw new AppError('Tổ chức cha không tồn tại hoặc bạn không có quyền gán chi nhánh con vào đây.', 404);
      }

      // Mandatory Rule: Child organization creation MUST specify a manager name and email
      if (!data.managerEmail || !data.managerName) {
        throw new AppError('Khởi tạo Chi nhánh con bắt buộc phải chọn/chỉ định Người Quản Lý Chi Nhánh (Họ tên & Email).', 400);
      }

      ancestors = [...(parentOrg.ancestors || []), parentOrg._id];
      level = (parentOrg.level || 0) + 1;
      data.parentOrganizationId = parentOrg._id;
      data.status = 'PENDING_APPROVAL'; // Child organization requires manager acceptance/approval to activate
    } else {
      data.parentOrganizationId = null;
      data.status = data.status || 'ACTIVE';
    }

    data.ancestors = ancestors;
    data.level = level;

    // Single Manager Constraint: Check if managerEmail is already assigned to another active/pending org
    if (data.managerEmail) {
      const normalizedEmail = data.managerEmail.toLowerCase().trim();
      const existingManagerOrg = await Organization.findOne({
        managerEmail: normalizedEmail,
        deletedAt: null
      });
      if (existingManagerOrg) {
        throw new AppError(`Mỗi nhân sự chỉ được quản lý duy nhất 1 tổ chức/chi nhánh. Email '${data.managerEmail}' hiện đang là Quản lý của '${existingManagerOrg.name}' (Mã: ${existingManagerOrg.code}).`, 400);
      }

      const managerUser = await userRepository.findByEmail(data.managerEmail);
      if (managerUser) {
        data.managerUserId = managerUser._id;
      }
    }

    return await organizationRepository.create(data, tenantContext);
  }

  async approveOrganization(orgId, currentUser = null) {
    const org = await Organization.findById(orgId);
    if (!org || org.deletedAt) {
      throw new AppError('Tổ chức không tồn tại.', 404);
    }

    // Authorization check: Must be assigned manager, or SUPER_ADMIN / ORGANIZATION_ADMIN
    const userEmail = currentUser?.email?.toLowerCase()?.trim();
    const isTargetManager = userEmail && org.managerEmail && (userEmail === org.managerEmail.toLowerCase().trim());
    const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

    if (!isTargetManager && !isSuperAdmin) {
      throw new AppError(`Chỉ duy nhất người được phân quyền (${org.managerEmail}) mới có quyền xác nhận tiếp nhận chi nhánh này.`, 403);
    }

    if (org.status === 'ACTIVE') {
      throw new AppError('Chi nhánh tổ chức đã ở trạng thái Hoạt động (ACTIVE).', 400);
    }

    org.status = 'ACTIVE';

    // Auto setup manager account or promote current assigned user
    if (org.managerEmail) {
      let managerUser = await userRepository.findByEmail(org.managerEmail);
      if (!managerUser && currentUser && currentUser.email?.toLowerCase() === org.managerEmail.toLowerCase()) {
        managerUser = currentUser;
      }

      if (!managerUser) {
        const hashedPassword = await bcrypt.hash('123456', 10);
        managerUser = await userRepository.create({
          fullName: org.managerName || 'Quản Lý Chi Nhánh',
          email: org.managerEmail.toLowerCase(),
          passwordHash: hashedPassword,
          role: 'ORGANIZATION_ADMIN',
          organizationId: org._id,
          status: 'ACTIVE'
        });
      } else {
        await userRepository.updateById(managerUser._id, {
          role: 'ORGANIZATION_ADMIN',
          organizationId: org._id
        });
      }
      org.managerUserId = managerUser._id;
    }

    await org.save();
    return org;
  }

  async rejectOrganization(orgId, reason = '', currentUser = null) {
    const org = await Organization.findById(orgId);
    if (!org || org.deletedAt) {
      throw new AppError('Tổ chức không tồn tại.', 404);
    }

    const userEmail = currentUser?.email?.toLowerCase()?.trim();
    const isTargetManager = userEmail && org.managerEmail && (userEmail === org.managerEmail.toLowerCase().trim());
    const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

    if (!isTargetManager && !isSuperAdmin) {
      throw new AppError(`Chỉ duy nhất người được phân quyền (${org.managerEmail}) mới có quyền phản hồi từ chối chi nhánh này.`, 403);
    }

    org.status = 'REJECTED_BY_MANAGER';
    org.rejectionReason = reason || 'Người quản lý từ chối nhận quyền quản lý chi nhánh.';
    await org.save();
    return org;
  }

  async updateOrganization(orgId, updateData, tenantContext = null) {
    const org = await organizationRepository.findById(orgId, tenantContext);
    if (!org) {
      throw new AppError('Tổ chức không tồn tại hoặc bạn không có quyền cập nhật.', 404);
    }

    if (updateData.code && updateData.code.toUpperCase().trim() !== (org.code || '').toUpperCase().trim()) {
      const existingCodeOrg = await organizationRepository.findByCode(updateData.code);
      if (existingCodeOrg && String(existingCodeOrg._id) !== String(orgId)) {
        throw new AppError(`Mã tổ chức '${updateData.code}' đã được sử dụng bởi tổ chức '${existingCodeOrg.name}'.`, 400);
      }
    }

    // Nếu đổi người quản lý mới hoặc gửi lại yêu cầu khi đang ở trạng thái bị từ chối
    const isNewManagerEmail = updateData.managerEmail && (updateData.managerEmail.toLowerCase().trim() !== (org.managerEmail || '').toLowerCase().trim());
    
    // Single Manager Constraint: Ensure manager is not already assigned to another org
    if (updateData.managerEmail && isNewManagerEmail) {
      const normalizedEmail = updateData.managerEmail.toLowerCase().trim();
      const existingManagerOrg = await Organization.findOne({
        managerEmail: normalizedEmail,
        _id: { $ne: orgId },
        deletedAt: null
      });
      if (existingManagerOrg) {
        throw new AppError(`Mỗi nhân sự chỉ được quản lý duy nhất 1 tổ chức/chi nhánh. Email '${updateData.managerEmail}' hiện đang là Quản lý của tổ chức '${existingManagerOrg.name}' (Mã: ${existingManagerOrg.code}).`, 400);
      }
    }

    if (org.status === 'REJECTED_BY_MANAGER' || isNewManagerEmail) {
      updateData.status = 'PENDING_APPROVAL';
      updateData.rejectionReason = '';

      // Tự động liên kết managerUserId nếu email đã tồn tại trong danh sách tài khoản
      if (updateData.managerEmail) {
        const managerUser = await userRepository.findByEmail(updateData.managerEmail.trim());
        if (managerUser) {
          updateData.managerUserId = managerUser._id;
        }
      }
    }

    // Trích xuất ID chuỗi từ parentOrganizationId để tránh lỗi so sánh Object [object Object]
    let newParentId = updateData.parentOrganizationId;
    if (newParentId && typeof newParentId === 'object' && newParentId._id) {
      newParentId = newParentId._id.toString();
    } else if (newParentId) {
      newParentId = newParentId.toString();
    } else {
      newParentId = null;
    }
    updateData.parentOrganizationId = newParentId;

    const currentParentId = org.parentOrganizationId 
      ? (org.parentOrganizationId._id || org.parentOrganizationId).toString() 
      : null;

    // Tự động bảo vệ: Tổ chức không thể làm cha của chính mình -> tự động giữ nguyên parent hiện tại
    if (newParentId && String(newParentId) === String(org._id)) {
      newParentId = currentParentId;
      updateData.parentOrganizationId = currentParentId;
    }

    // Nếu đổi parentOrganizationId thực sự, chạy thuật toán kiểm tra chống vòng lặp (Cycle Detection BR-006, BR-007)
    if (updateData.parentOrganizationId !== undefined && newParentId !== currentParentId) {
      if (newParentId) {
        const newParent = await organizationRepository.findById(newParentId);
        if (!newParent) {
          throw new AppError('Tổ chức cha mới không tồn tại.', 404);
        }

        // Kiểm tra newParent không phải là hậu duệ (descendant) của org
        if (newParent.ancestors && newParent.ancestors.some(aId => String(aId) === String(org._id))) {
          throw new AppError('Không thể gán tổ chức con/cháu thành tổ chức cha (tạo vòng lặp cây organization BR-007).', 400);
        }

        updateData.ancestors = [...(newParent.ancestors || []), newParent._id];
        updateData.level = (newParent.level || 0) + 1;
      } else {
        updateData.parentOrganizationId = null;
        updateData.ancestors = [];
        updateData.level = 0;
      }

      const updatedOrg = await organizationRepository.updateById(orgId, updateData, tenantContext);
      // Tự động cập nhật lại ancestors cho toàn bộ cây con phía dưới (Subtree recalculation)
      await this._recalculateSubtreeAncestors(orgId, updateData.ancestors, updateData.level);
      return updatedOrg;
    }

    return await organizationRepository.updateById(orgId, updateData, tenantContext);
  }

  async _recalculateSubtreeAncestors(parentOrgId, parentAncestors, parentLevel) {
    const children = await organizationRepository.findDirectChildren(parentOrgId);
    for (const child of children) {
      const childAncestors = [...parentAncestors, parentOrgId];
      const childLevel = parentLevel + 1;
      await organizationRepository.updateById(child._id, {
        ancestors: childAncestors,
        level: childLevel
      });
      await this._recalculateSubtreeAncestors(child._id, childAncestors, childLevel);
    }
  }

  async getOrganizationTree(tenantContext = null) {
    let orgs = [];

    if (!tenantContext || tenantContext.role === 'SUPER_ADMIN') {
      orgs = await organizationRepository.find({}, null, { sort: { level: 1, name: 1 } });
    } else {
      const scopedOrgIds = (tenantContext.allowedOrgIds && tenantContext.allowedOrgIds.length > 0)
        ? tenantContext.allowedOrgIds.map(id => String(id._id || id))
        : (tenantContext.organizationId ? [String(tenantContext.organizationId._id || tenantContext.organizationId)] : []);

      if (scopedOrgIds.length === 0) {
        return [];
      }

      // Fetch base orgs to extract all parent/ancestor IDs
      const baseOrgs = await Organization.find({ _id: { $in: scopedOrgIds }, deletedAt: null });
      const allRelevantIds = new Set(scopedOrgIds);

      baseOrgs.forEach(org => {
        if (org.parentOrganizationId) {
          allRelevantIds.add(String(org.parentOrganizationId._id || org.parentOrganizationId));
        }
        if (org.ancestors && Array.isArray(org.ancestors)) {
          org.ancestors.forEach(aId => allRelevantIds.add(String(aId._id || aId)));
        }
      });

      // Query all ancestors, current orgs, and descendants
      orgs = await Organization.find({
        $or: [
          { _id: { $in: Array.from(allRelevantIds) } },
          { ancestors: { $in: scopedOrgIds } }
        ],
        deletedAt: null
      }).sort({ level: 1, name: 1 });
    }
    
    // Build tree representation
    const orgMap = {};
    const tree = [];

    orgs.forEach(org => {
      const orgObj = org.toObject();
      orgObj.children = [];
      orgMap[orgObj._id.toString()] = orgObj;
    });

    orgs.forEach(org => {
      const orgObj = orgMap[org._id.toString()];
      if (org.parentOrganizationId && orgMap[org.parentOrganizationId.toString()]) {
        orgMap[org.parentOrganizationId.toString()].children.push(orgObj);
      } else {
        tree.push(orgObj);
      }
    });

    return tree;
  }

  async getPaginatedRootOrganizations(queryParams = {}, tenantContext = null) {
    const page = Math.max(1, parseInt(queryParams.page) || 1);
    const limit = Math.max(1, parseInt(queryParams.limit) || 20);
    const search = (queryParams.search || '').trim();

    const filter = { parentOrganizationId: null, deletedAt: null };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { managerEmail: { $regex: search, $options: 'i' } },
      ];
    }

    if (tenantContext && tenantContext.role !== 'SUPER_ADMIN') {
      const allowedOrgIds = (tenantContext.allowedOrgIds && tenantContext.allowedOrgIds.length > 0)
        ? tenantContext.allowedOrgIds.map(id => String(id._id || id))
        : (tenantContext.organizationId ? [String(tenantContext.organizationId._id || tenantContext.organizationId)] : []);
      if (allowedOrgIds.length > 0) {
        filter._id = { $in: allowedOrgIds };
      }
    }

    const totalRoots = await Organization.countDocuments(filter);
    const roots = await Organization.find(filter)
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const enrichedRoots = await Promise.all(
      roots.map(async (root) => {
        const rootObj = root.toObject();
        const childCount = await Organization.countDocuments({
          parentOrganizationId: root._id,
          deletedAt: null,
        });
        rootObj.childCount = childCount;
        rootObj.hasChildren = childCount > 0;
        return rootObj;
      })
    );

    return {
      roots: enrichedRoots,
      totalRoots,
      page,
      limit,
      hasMore: page * limit < totalRoots,
    };
  }

  async getOrganizationChildren(parentId, tenantContext = null) {
    const filter = { parentOrganizationId: parentId, deletedAt: null };
    const children = await Organization.find(filter).sort({ name: 1 });

    const enrichedChildren = await Promise.all(
      children.map(async (child) => {
        const childObj = child.toObject();
        const childCount = await Organization.countDocuments({
          parentOrganizationId: child._id,
          deletedAt: null,
        });
        childObj.childCount = childCount;
        childObj.hasChildren = childCount > 0;
        return childObj;
      })
    );

    return enrichedChildren;
  }

  async deleteOrganization(orgId, tenantContext = null) {
    const org = await organizationRepository.findById(orgId, tenantContext);
    if (!org) {
      throw new AppError('Tổ chức không tồn tại.', 404);
    }
    const children = await organizationRepository.findDirectChildren(orgId);
    if (children && children.length > 0) {
      throw new AppError('Không thể xóa tổ chức đang chứa các chi nhánh con phía dưới. Vui lòng xóa hoặc chuyển chi nhánh con trước.', 400);
    }
    return await organizationRepository.deleteById(orgId, tenantContext);
  }

  async grantPermission(granterOrgId, granteeOrgId, resource, action, scope, userId) {
    const grant = new PermissionGrant({
      granterOrganizationId: granterOrgId,
      granteeOrganizationId: granteeOrgId,
      resource,
      action,
      scope,
      grantedBy: userId,
    });
    return await grant.save();
  }

  async renewSubscription(orgId, planName, durationMonths = 1, tenantContext = null) {
    const org = await organizationRepository.findById(orgId, tenantContext);
    if (!org) {
      throw new AppError('Tổ chức không tồn tại hoặc bạn không có quyền gia hạn.', 404);
    }

    const validPlans = ['FREE', 'BASIC', 'PRO', 'VIP'];
    if (!validPlans.includes(planName)) {
      throw new AppError('Gói cước không hợp lệ. Vui lòng chọn FREE, BASIC, PRO hoặc VIP.', 400);
    }

    const months = Math.max(1, parseInt(durationMonths) || 1);
    const now = new Date();

    if (planName === 'FREE') {
      org.plan = 'FREE';
      org.planExpiresAt = null;
      org.status = 'ACTIVE';
    } else {
      let baseDate = new Date();
      if (org.planExpiresAt && new Date(org.planExpiresAt) > now) {
        baseDate = new Date(org.planExpiresAt);
      }
      baseDate.setMonth(baseDate.getMonth() + months);

      org.plan = planName;
      org.planExpiresAt = baseDate;
      org.status = 'ACTIVE';
    }

    await org.save();
    return org;
  }

  async grantCustomPlan(orgId, planName, durationMonths = 1, adminUser) {
    const org = await organizationRepository.findById(orgId);
    if (!org) {
      throw new AppError('Tổ chức không tồn tại.', 404);
    }

    const validPlans = ['FREE', 'BASIC', 'PRO', 'VIP'];
    if (!validPlans.includes(planName)) {
      throw new AppError('Gói cước không hợp lệ. Vui lòng chọn FREE, BASIC, PRO hoặc VIP.', 400);
    }

    const months = Math.max(1, parseInt(durationMonths) || 1);
    const now = new Date();

    if (planName === 'FREE') {
      org.plan = 'FREE';
      org.planExpiresAt = null;
      org.status = 'ACTIVE';
    } else {
      let baseDate = new Date();
      if (org.planExpiresAt && new Date(org.planExpiresAt) > now) {
        baseDate = new Date(org.planExpiresAt);
      }
      baseDate.setMonth(baseDate.getMonth() + months);

      org.plan = planName;
      org.planExpiresAt = baseDate;
      org.status = 'ACTIVE';
    }

    await org.save();

    // Audit Log
    if (adminUser) {
      const adminOrgId = adminUser.organizationId ? (adminUser.organizationId._id || adminUser.organizationId) : null;
      await auditLogService.logAction(
        { user: adminUser, tenantContext: { organizationId: adminOrgId } },
        'ADMIN_GRANTED_PLAN',
        'organization',
        org._id
      );
    }

    return org;
  }

  async toggleBanOrganization(orgId, banStatus, reason = '', adminUser) {
    const org = await organizationRepository.findById(orgId);
    if (!org) {
      throw new AppError('Tổ chức không tồn tại.', 404);
    }

    const newStatus = banStatus === 'BANNED' || banStatus === 'SUSPENDED' ? 'SUSPENDED' : 'ACTIVE';
    org.status = newStatus;
    if (reason) {
      org.rejectionReason = reason;
    }

    await org.save();

    // Audit Log
    if (adminUser) {
      const adminOrgId = adminUser.organizationId ? (adminUser.organizationId._id || adminUser.organizationId) : null;
      const actionType = newStatus === 'SUSPENDED' ? 'ADMIN_BANNED_ORG' : 'ADMIN_UNBANNED_ORG';
      await auditLogService.logAction(
        { user: adminUser, tenantContext: { organizationId: adminOrgId } },
        actionType,
        'organization',
        org._id
      );
    }

    return org;
  }
}

export const organizationService = new OrganizationService();

