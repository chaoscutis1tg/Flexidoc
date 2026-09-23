import { orderService } from '../services/order.service.js';
import { sendSuccess } from '../utils/response.util.js';

export const createOrder = async (req, res, next) => {
  try {
    const result = await orderService.createOrder({
      plan: req.body.plan,
      durationMonths: req.body.durationMonths,
      targetOrgId: req.body.targetOrgId,
      user: req.user,
    });
    return sendSuccess(res, 201, 'Tạo đơn hàng thành công', result);
  } catch (error) {
    next(error);
  }
};

export const getOrderById = async (req, res, next) => {
  try {
    const order = await orderService.getOrderById(req.params.id);
    return sendSuccess(res, 200, 'Lấy chi tiết đơn hàng thành công', order);
  } catch (error) {
    next(error);
  }
};

export const manualApproveOrder = async (req, res, next) => {
  try {
    const order = await orderService.manualApproveOrder(req.params.id, req.user, req.body.notes);
    return sendSuccess(res, 200, 'Admin đã duyệt đơn hàng thành công', order);
  } catch (error) {
    next(error);
  }
};

export const rejectOrder = async (req, res, next) => {
  try {
    const order = await orderService.rejectOrder(req.params.id, req.user, req.body.rejectionReason);
    return sendSuccess(res, 200, 'Đã từ chối đơn hàng thành công', order);
  } catch (error) {
    next(error);
  }
};

export const processSepayWebhook = async (req, res, next) => {
  try {
    const result = await orderService.processSepayWebhook(req.headers, req.body);
    return sendSuccess(res, 200, result.message, result);
  } catch (error) {
    next(error);
  }
};

export const getAdminOrdersAndStats = async (req, res, next) => {
  try {
    const data = await orderService.getAdminOrdersAndStats(req.query);
    return sendSuccess(res, 200, 'Lấy danh sách đơn hàng và thống kê thành công', data);
  } catch (error) {
    next(error);
  }
};

export const getAdminReportData = async (req, res, next) => {
  try {
    const data = await orderService.getAdminReportData(req.query);
    return sendSuccess(res, 200, 'Lấy dữ liệu báo cáo doanh thu thành công', data);
  } catch (error) {
    next(error);
  }
};

