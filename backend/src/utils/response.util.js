import { encryptPayload } from './crypto.util.js';

export const sendSuccess = (res, statusCode = 200, message = 'Thành công', data = null, meta = null) => {
  const response = {
    success: true,
    message,
    data,
  };
  if (meta) response.meta = meta;

  const encryptedPayload = encryptPayload(response);
  if (encryptedPayload) {
    res.setHeader('X-Payload-Encrypted', 'true');
    return res.status(statusCode).json({
      encrypted: true,
      payload: encryptedPayload,
    });
  }

  return res.status(statusCode).json(response);
};

export const sendError = (res, statusCode = 500, message = 'Có lỗi xảy ra', error = null) => {
  const response = {
    success: false,
    message,
    error: error ? (error.details || error.message || error) : null,
  };

  const encryptedPayload = encryptPayload(response);
  if (encryptedPayload) {
    res.setHeader('X-Payload-Encrypted', 'true');
    return res.status(statusCode).json({
      encrypted: true,
      payload: encryptedPayload,
    });
  }

  return res.status(statusCode).json(response);
};
