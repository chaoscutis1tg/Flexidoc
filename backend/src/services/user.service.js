import { userRepository } from '../repositories/user.repository.js';
import { organizationRepository } from '../repositories/organization.repository.js';
import { AppError } from '../utils/app-error.js';

export class UserService {
  async _checkPlanLimits(tenantContext) {
    if (!tenantContext || !tenantContext.organizationId || tenantContext.role === 'SUPER_ADMIN') return;

    const org = await organizationRepository.findById(tenantContext.organizationId);
    if (!org) return;

    const plan = org.plan || 'FREE';
    const now = new Date();
    const isExpired = plan !== 'FREE' && org.planExpiresAt && new Date(org.planExpiresAt) < now;

    if (isExpired) {
      const expDate = org.planExpiresAt ? new Date(org.planExpiresAt).toLocaleDateString('vi-VN') : 'gần đây';
      throw new AppError(`Gói dịch vụ '${plan}' của tổ chức bạn đã HẾT HẠN ngày ${expDate}. Vui lòng gia hạn gói dịch vụ để thêm tài khoản nhân sự mới!`, 403);
    }

    const existingUsersCount = await userRepository.count({ deletedAt: null }, tenantContext);
    
    // Giới hạn số lượng tài khoản theo gói cước (FREE: 3, BASIC: 10, PRO: 30, VIP: Unlimited)
    let maxLimit = 3; 
    if (plan === 'FREE') maxLimit = 3;
    else if (plan === 'BASIC') maxLimit = 10;
    else if (plan === 'PRO') maxLimit = 30;
    else if (plan === 'VIP') maxLimit = Infinity;

    if (existingUsersCount >= maxLimit) {
      throw new AppError(`Tổ chức của bạn (Gói ${plan}) đã đạt giới hạn tối đa ${maxLimit} tài khoản nhân sự. Vui lòng nâng cấp gói cước để thêm người dùng!`, 403);
    }
  }

  async createUser(userData, tenantContext = null) {
    await this._checkPlanLimits(tenantContext);

    const existing = await userRepository.findByEmail(userData.email);
    if (existing) {
      throw new AppError(`Email '${userData.email}' đã được đăng ký trong hệ thống. Vui lòng sử dụng email khác.`, 400);
    }
    return await userRepository.create(userData, tenantContext);
  }

  async getUsers(filter = {}, tenantContext = null, limit = 50, skip = 0) {
    return await userRepository.find(filter, tenantContext, {
      limit,
      skip,
      sort: { createdAt: -1 },
      populate: { path: 'organizationId', select: 'name code' }
    });
  }

  async getUserById(id, tenantContext = null) {
    const user = await userRepository.findById(id, tenantContext, {
      populate: { path: 'organizationId', select: 'name code' }
    });
    if (!user) {
      throw new AppError('Người dùng không tồn tại.', 404);
    }
    return user;
  }

  async updateUser(id, updateData, tenantContext = null) {
    delete updateData.passwordHash; // password update is via changePassword

    const currentUser = await userRepository.findById(id, tenantContext);
    if (!currentUser) {
      throw new AppError('Người dùng không tồn tại hoặc không có quyền.', 404);
    }

    const orgId = currentUser.organizationId?._id || currentUser.organizationId;
    const isDemotingRole = currentUser.role === 'ORGANIZATION_ADMIN' && updateData.role && updateData.role !== 'ORGANIZATION_ADMIN';
    const isDeactivating = currentUser.role === 'ORGANIZATION_ADMIN' && updateData.status && updateData.status !== 'ACTIVE';

    if (isDemotingRole || isDeactivating) {
      const adminCount = await userRepository.model.countDocuments({
        organizationId: orgId,
        role: 'ORGANIZATION_ADMIN',
        status: 'ACTIVE',
        deletedAt: null
      });

      if (adminCount <= 1) {
        throw new AppError('Mỗi Tổ chức phải có ít nhất 1 Quản trị viên (ORGANIZATION_ADMIN). Bạn không thể giáng chức hoặc vô hiệu hóa Quản trị viên duy nhất của Tổ chức!', 400);
      }
    }

    const user = await userRepository.updateById(id, updateData, tenantContext);
    if (!user) {
      throw new AppError('Không thể cập nhật người dùng hoặc không có quyền.', 404);
    }
    return user;
  }

  async deleteUser(id, tenantContext = null) {
    const currentUser = await userRepository.findById(id, tenantContext);
    if (!currentUser) {
      throw new AppError('Người dùng không tồn tại hoặc không có quyền.', 404);
    }

    if (currentUser.role === 'ORGANIZATION_ADMIN') {
      const orgId = currentUser.organizationId?._id || currentUser.organizationId;
      const adminCount = await userRepository.model.countDocuments({
        organizationId: orgId,
        role: 'ORGANIZATION_ADMIN',
        status: 'ACTIVE',
        deletedAt: null
      });

      if (adminCount <= 1) {
        throw new AppError('Mỗi Tổ chức phải có ít nhất 1 Quản trị viên (ORGANIZATION_ADMIN). Không thể xóa Quản trị viên duy nhất của Tổ chức!', 400);
      }
    }

    // Cascade: Clear manager fields in Organization if this user was manager
    const { Organization } = await import('../models/organization.model.js');
    await Organization.updateMany(
      { managerUserId: id },
      { $set: { managerUserId: null } }
    );

    // Cascade: Delete permission grants created by this user
    const { PermissionGrant } = await import('../models/permission-grant.model.js');
    await PermissionGrant.deleteMany({ grantedBy: id });

    return await userRepository.deleteById(id, tenantContext);
  }
}

export const userService = new UserService();
