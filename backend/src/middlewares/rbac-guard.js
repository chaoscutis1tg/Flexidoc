import { AppError } from '../utils/app-error.js';

export const rbacGuard = (requiredRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Chưa xác thực người dùng.', 401));
    }

    if (requiredRoles.length > 0 && !requiredRoles.includes(req.user.role)) {
      return next(new AppError('Bạn không có quyền thực hiện hành động này (403 Forbidden).', 403));
    }

    next();
  };
};
