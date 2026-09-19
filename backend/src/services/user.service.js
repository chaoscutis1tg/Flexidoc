import { userRepository } from '../repositories/user.repository.js';
import { AppError } from '../utils/app-error.js';

export class UserService {
  async createUser(userData, tenantContext = null) {
    const existing = await userRepository.findByEmail(userData.email);
    if (existing) {
      throw new AppError(`Email '${userData.email}' đã được đăng ký trong hệ thống.`, 400);
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

    return await userRepository.softDeleteById(id, tenantContext);
  }
}

export const userService = new UserService();
