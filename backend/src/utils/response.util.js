export const sendSuccess = (res, statusCode = 200, message = 'Thành công', data = null, meta = null) => {
  const response = {
    success: true,
    message,
    data,
  };
  if (meta) response.meta = meta;
  return res.status(statusCode).json(response);
};

export const sendError = (res, statusCode = 500, message = 'Có lỗi xảy ra', error = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    error: error ? (error.details || error.message || error) : null,
  });
};
