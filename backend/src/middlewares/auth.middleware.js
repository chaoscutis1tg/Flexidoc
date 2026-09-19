import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { userRepository } from '../repositories/user.repository.js';
import { AppError } from '../utils/app-error.js';

export const authMiddleware = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('Bạn chưa đăng nhập. Vui lòng cung cấp Access Token.', 401));
    }

    const decoded = jwt.verify(token, config.jwtSecret);
    const user = await userRepository.findById(decoded.id, null, { populate: 'organizationId' });

    if (!user || user.status !== 'ACTIVE' || user.deletedAt) {
      return next(new AppError('Tài khoản người dùng không tồn tại hoặc đã bị khóa.', 401));
    }

    req.user = user;
    next();
  } catch (error) {
    next(new AppError('Phiên làm việc không hợp lệ hoặc đã hết hạn.', 401));
  }
};
