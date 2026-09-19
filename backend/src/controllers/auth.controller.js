import { authService } from '../services/auth.service.js';
import { auditLogService } from '../services/audit-log.service.js';
import { userRepository } from '../repositories/user.repository.js';
import { sendSuccess } from '../utils/response.util.js';

export const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    const orgId = result.user.organizationId ? (result.user.organizationId._id || result.user.organizationId) : null;
    await auditLogService.logAction(
      { user: result.user, tenantContext: { organizationId: orgId }, headers: req.headers, socket: req.socket },
      'REGISTER_SUCCESS',
      'user',
      result.user._id
    );
    return sendSuccess(res, 201, 'Đăng ký tài khoản thành công', result);
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    const orgId = result.user.organizationId ? (result.user.organizationId._id || result.user.organizationId) : null;

    // Write Audit Log
    await auditLogService.logAction(
      { user: result.user, tenantContext: { organizationId: orgId }, headers: req.headers, socket: req.socket },
      'LOGIN_SUCCESS',
      'user',
      result.user._id
    );

    return sendSuccess(res, 200, 'Đăng nhập thành công', result);
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const populatedUser = await userRepository.findById(req.user._id, null, { populate: 'organizationId' });
    const userObj = (populatedUser || req.user).toObject();
    delete userObj.passwordHash;
    return sendSuccess(res, 200, 'Lấy thông tin tài khoản thành công', {
      user: userObj,
      tenantContext: req.tenantContext,
    });
  } catch (error) {
    next(error);
  }
};

export const googleAuth = async (req, res, next) => {
  try {
    const result = await authService.loginWithGoogle(req.body);

    if (result.user && result.user.organizationId) {
      const orgId = result.user.organizationId._id || result.user.organizationId;
      await auditLogService.logAction(
        { user: result.user, tenantContext: { organizationId: orgId }, headers: req.headers, socket: req.socket },
        'GOOGLE_AUTH_SUCCESS',
        'user',
        result.user._id
      );
    }

    return sendSuccess(res, 200, 'Đăng nhập Google thành công', result);
  } catch (error) {
    next(error);
  }
};

export const setupGoogleOrg = async (req, res, next) => {
  try {
    const result = await authService.setupGoogleOrganization(req.body);
    const orgId = result.user.organizationId ? (result.user.organizationId._id || result.user.organizationId) : null;

    await auditLogService.logAction(
      { user: result.user, tenantContext: { organizationId: orgId }, headers: req.headers, socket: req.socket },
      'GOOGLE_ORG_SETUP_SUCCESS',
      'user',
      result.user._id
    );

    return sendSuccess(res, 200, 'Thiết lập Tổ chức thành công', result);
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    await authService.changePassword(req.user._id, oldPassword, newPassword);
    
    await auditLogService.logAction(req, 'PASSWORD_CHANGED', 'user', req.user._id);

    return sendSuccess(res, 200, 'Đổi mật khẩu thành công');
  } catch (error) {
    next(error);
  }
};

export const checkOrgCode = async (req, res, next) => {
  try {
    const { code } = req.query;
    const result = await authService.checkOrgCode(code);
    return sendSuccess(res, 200, 'Kiểm tra mã tổ chức thành công', result);
  } catch (error) {
    next(error);
  }
};


