import { organizationRepository } from '../repositories/organization.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { PermissionGrant } from '../models/permission-grant.model.js';
import { AppError } from '../utils/app-error.js';
import bcrypt from 'bcryptjs';

export class OrganizationService {
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

    // Check if manager email already has a user account in the database
    if (data.managerEmail) {
      const managerUser = await userRepository.findByEmail(data.managerEmail);
      if (managerUser) {
        data.managerUserId = managerUser._id;
      }
    }

    return await organizationRepository.create(data, tenantContext);
  }

  async approveOrganization(orgId, tenantContext = null) {
    const org = await organizationRepository.findById(orgId, tenantContext);
    if (!org) {
      throw new AppError('Tổ chức không tồn tại hoặc bạn không có quyền duyệt.', 404);
    }

    if (org.status === 'ACTIVE') {
      throw new AppError('Chi nhánh tổ chức đã ở trạng thái Hoạt động (ACTIVE).', 400);
    }

    org.status = 'ACTIVE';

    // Auto setup manager account if user doesn't exist
    if (org.managerEmail) {
      let managerUser = await userRepository.findByEmail(org.managerEmail);
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

  async updateOrganization(orgId, updateData, tenantContext = null) {
    const org = await organizationRepository.findById(orgId, tenantContext);
    if (!org) {
      throw new AppError('Tổ chức không tồn tại hoặc bạn không có quyền cập nhật.', 404);
    }

    // Nếu đổi parentOrganizationId, chạy thuật toán kiểm tra chống vòng lặp (Cycle Detection BR-006, BR-007)
    if (updateData.parentOrganizationId !== undefined && String(updateData.parentOrganizationId) !== String(org.parentOrganizationId)) {
      const newParentId = updateData.parentOrganizationId;

      if (newParentId) {
        if (String(newParentId) === String(org._id)) {
          throw new AppError('Tổ chức không thể làm cha của chính mình (BR-006).', 400);
        }

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
    const orgs = await organizationRepository.find({}, tenantContext, { sort: { level: 1, name: 1 } });
    
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

  async renewSubscription(orgId, planName, tenantContext = null) {
    const org = await organizationRepository.findById(orgId, tenantContext);
    if (!org) {
      throw new AppError('Tổ chức không tồn tại hoặc bạn không có quyền gia hạn.', 404);
    }

    const validPlans = ['FREE', 'BASIC', 'PRO', 'VIP'];
    if (!validPlans.includes(planName)) {
      throw new AppError('Gói cước không hợp lệ. Vui lòng chọn FREE, BASIC, PRO hoặc VIP.', 400);
    }

    const now = new Date();
    let newExpiresAt = new Date();

    if (planName === 'FREE') {
      org.plan = 'FREE';
      org.planExpiresAt = null;
      org.status = 'ACTIVE';
    } else {
      // If currently active and not expired, extend from existing expiration
      if (org.plan === planName && org.planExpiresAt && new Date(org.planExpiresAt) > now) {
        newExpiresAt = new Date(org.planExpiresAt);
      }
      // Add 30 days
      newExpiresAt.setDate(newExpiresAt.getDate() + 30);

      org.plan = planName;
      org.planExpiresAt = newExpiresAt;
      org.status = 'ACTIVE';
    }

    await org.save();
    return org;
  }
}

export const organizationService = new OrganizationService();
