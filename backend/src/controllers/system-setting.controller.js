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

export const getSystemConfig = async (req, res, next) => {
  try {
    const config = await systemSettingService.getSystemConfig();
    return sendSuccess(res, 200, 'Lấy cài đặt bảo mật & hệ thống thành công', config);
  } catch (error) {
    next(error);
  }
};

export const updateSystemConfig = async (req, res, next) => {
  try {
    const updated = await systemSettingService.updateSystemConfig(req.body, req.user);
    return sendSuccess(res, 200, 'Cập nhật cài đặt bảo mật & hệ thống thành công', updated);
  } catch (error) {
    next(error);
  }
};

export const getPricingConfig = async (req, res, next) => {
  try {
    const config = await systemSettingService.getPricingConfig();
    return sendSuccess(res, 200, 'Lấy cấu hình bảng giá thành công', config);
  } catch (error) {
    next(error);
  }
};

export const updatePricingConfig = async (req, res, next) => {
  try {
    const updated = await systemSettingService.updatePricingConfig(req.body, req.user);
    return sendSuccess(res, 200, 'Cập nhật cấu hình bảng giá & chiết khấu thành công', updated);
  } catch (error) {
    next(error);
  }
};

export const getAllSettings = async (req, res, next) => {
  try {
    const all = await systemSettingService.getAllSettings();
    return sendSuccess(res, 200, 'Lấy toàn bộ cấu hình hệ thống thành công', all);
  } catch (error) {
    next(error);
  }
};

