import { systemSettingService } from '../services/system-setting.service.js';
import { sendSuccess } from '../utils/response.util.js';

export const getPaymentConfig = async (req, res, next) => {
  try {
    const config = await systemSettingService.getPaymentConfig();
    return sendSuccess(res, 200, 'Lấy cấu hình thanh toán thành công', config);
  } catch (error) {
    next(error);
  }
};

export const updatePaymentConfig = async (req, res, next) => {
  try {
    const updated = await systemSettingService.updatePaymentConfig(req.body, req.user);
    return sendSuccess(res, 200, 'Cập nhật cấu hình thanh toán thành công', updated);
  } catch (error) {
    next(error);
  }
};
