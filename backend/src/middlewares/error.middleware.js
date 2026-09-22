import { AppError } from '../utils/app-error.js';
import { sendError } from '../utils/response.util.js';

export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Lỗi hệ thống';

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map(val => val.message).join(', ');
  }

  if (err.code === 11000) {
    statusCode = 400;
    const field = err.keyValue ? Object.keys(err.keyValue)[0] : '';
    if (field === 'email') {
      message = 'Email này đã tồn tại trong hệ thống. Vui lòng sử dụng tính năng Đăng nhập!';
    } else if (field === 'code') {
      message = 'Mã Tổ Chức này đã được sử dụng. Vui lòng chọn Mã Tổ Chức khác!';
    } else {
      message = `Dữ liệu '${field}' đã tồn tại trong hệ thống.`;
    }
  }

  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Token không hợp lệ';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.';
  }

  console.error(`[Error Handler] ${req.method} ${req.originalUrl} - Status: ${statusCode} - ${err.stack || message}`);

  return sendError(res, statusCode, message, err);
};
