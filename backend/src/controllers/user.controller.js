import { userService } from '../services/user.service.js';
import { auditLogService } from '../services/audit-log.service.js';
import { sendSuccess } from '../utils/response.util.js';

export const createUser = async (req, res, next) => {
  try {
    const user = await userService.createUser(req.body, req.tenantContext);
    await auditLogService.logAction(req, 'USER_CREATED', 'user', user._id);
    return sendSuccess(res, 201, 'Tạo người dùng mới thành công', user);
  } catch (error) {
    next(error);
  }
};

export const getUsers = async (req, res, next) => {
  try {
    const users = await userService.getUsers({}, req.tenantContext);
    return sendSuccess(res, 200, 'Lấy danh sách người dùng thành công', users);
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id, req.tenantContext);
    return sendSuccess(res, 200, 'Lấy thông tin người dùng thành công', user);
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body, req.tenantContext);
    await auditLogService.logAction(req, 'USER_UPDATED', 'user', user._id);
    return sendSuccess(res, 200, 'Cập nhật người dùng thành công', user);
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const user = await userService.deleteUser(req.params.id, req.tenantContext);
    await auditLogService.logAction(req, 'USER_DELETED', 'user', user._id);
    return sendSuccess(res, 200, 'Vô hiệu hóa người dùng thành công', user);
  } catch (error) {
    next(error);
  }
};
