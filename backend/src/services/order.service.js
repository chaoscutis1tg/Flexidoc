import { orderRepository } from '../repositories/order.repository.js';
import { Organization } from '../models/organization.model.js';
import { systemSettingService } from './system-setting.service.js';
import { auditLogService } from './audit-log.service.js';
import { AppError } from '../utils/app-error.js';

const PLAN_PRICES = {
  FREE: 0,
  BASIC: 199000,
  PRO: 499000,
  VIP: 999000,
};

const DURATION_DISCOUNTS = {
  1: 0,
  3: 5,   // 5% discount
  6: 10,  // 10% discount
  12: 20, // 20% discount
};

export class OrderService {
  async createOrder({ plan, durationMonths = 1, targetOrgId, user }) {
    if (!['BASIC', 'PRO', 'VIP'].includes(plan)) {
      throw new AppError('Gói dịch vụ không hợp lệ.', 400);
    }
    const months = Math.max(1, parseInt(durationMonths) || 1);
    const unitPrice = PLAN_PRICES[plan] || 199000;
    const rawAmount = unitPrice * months;
    const discountPercent = DURATION_DISCOUNTS[months] || 0;
    const amount = Math.round(rawAmount * (1 - discountPercent / 100));

    const orgId = targetOrgId || (user.organizationId ? (user.organizationId._id || user.organizationId) : null);
    if (!orgId) {
      throw new AppError('Không tìm thấy thông tin tổ chức cần gia hạn.', 400);
    }

    // Generate unique order code (e.g. DH88910)
    const randomDigits = Math.floor(10000 + Math.random() * 90000);
    const orderCode = `DH${randomDigits}`;

    const order = await orderRepository.create({
      orderCode,
      organizationId: orgId,
      userId: user._id,
      plan,
      durationMonths: months,
      amount,
      status: 'PENDING',
      paymentMethod: 'SEPAY_WEBHOOK',
    });

    const paymentConfig = await systemSettingService.getPaymentConfig();

    return {
      order,
      paymentConfig,
      transferContent: `${paymentConfig.orderPrefix} ${orderCode}`,
    };
  }

  async getOrderById(id) {
    const order = await orderRepository.findById(id);
    if (!order) {
      throw new AppError('Không tìm thấy đơn hàng.', 404);
    }
    return order;
  }

  async getOrderByCode(code) {
    return await orderRepository.findByCode(code);
  }

  async manualApproveOrder(orderId, adminUser, notes = '') {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new AppError('Đơn hàng không tồn tại.', 404);
    }

    if (order.status === 'SUCCESS') {
      throw new AppError('Đơn hàng đã được duyệt thành công trước đó.', 400);
    }

    // Update order status
    const updatedOrder = await orderRepository.updateById(orderId, {
      status: 'SUCCESS',
      paymentMethod: 'MANUAL_ADMIN',
      approvedBy: adminUser._id,
      approvedAt: new Date(),
      notes: notes || 'Admin duyệt bằng tay',
    });

    // Update Organization Subscription Plan & Expiration
    await this._activateOrgPlan(order.organizationId._id || order.organizationId, order.plan, order.durationMonths);

    // Audit Log
    const orgId = adminUser.organizationId ? (adminUser.organizationId._id || adminUser.organizationId) : null;
    await auditLogService.logAction(
      { user: adminUser, tenantContext: { organizationId: orgId } },
      'ADMIN_MANUAL_APPROVE_ORDER',
      'order',
      order._id
    );

    return updatedOrder;
  }

  async rejectOrder(orderId, adminUser, rejectionReason = '') {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new AppError('Đơn hàng không tồn tại.', 404);
    }

    if (order.status === 'SUCCESS') {
      throw new AppError('Đơn hàng đã hoàn thành, không thể từ chối.', 400);
    }

    const updatedOrder = await orderRepository.updateById(orderId, {
      status: 'REJECTED',
      rejectionReason: rejectionReason || 'Admin từ chối đơn hàng',
      approvedBy: adminUser._id,
      approvedAt: new Date(),
    });

    // Audit Log
    const orgId = adminUser.organizationId ? (adminUser.organizationId._id || adminUser.organizationId) : null;
    await auditLogService.logAction(
      { user: adminUser, tenantContext: { organizationId: orgId } },
      'ADMIN_REJECT_ORDER',
      'order',
      order._id
    );

    return updatedOrder;
  }

  async processSepayWebhook(reqHeaders, reqBody) {
    const paymentConfig = await systemSettingService.getPaymentConfig();
    const expectedApiKey = paymentConfig.sepayApiKey;

    // 1. Check Authorization Header
    const authHeader = reqHeaders.authorization || reqHeaders.Authorization || '';
    const cleanHeaderToken = authHeader.replace(/^Apikey\s+/i, '').replace(/^Bearer\s+/i, '').trim();

    if (!cleanHeaderToken || cleanHeaderToken !== expectedApiKey) {
      throw new AppError('Xác thực Webhook SePay thất bại: API Key không chính xác hoặc không được cung cấp.', 401);
    }

    // 2. Parse SePay Webhook Payload fields
    const {
      id: sepayId = '',
      gateway = '',
      transactionDate = '',
      accountNumber = '',
      subAccount = '',
      transferType = '',
      transferAmount = 0,
      accumulated = 0,
      code = '',
      content = '',
      referenceCode = '',
      description = ''
    } = reqBody || {};

    const textToScan = (JSON.stringify(reqBody || {}) + ' ' + (content || '')).toUpperCase();
    const orderCodeMatch = textToScan.match(/DH\d{4,10}/i);
    if (!orderCodeMatch) {
      return {
        success: false,
        message: 'Không tìm thấy mã đơn hàng DHxxxxx trong nội dung chuyển khoản.',
      };
    }

    const matchedOrderCode = orderCodeMatch[0].toUpperCase();
    const order = await orderRepository.findByCode(matchedOrderCode);

    if (!order) {
      return {
        success: false,
        message: `Đơn hàng ${matchedOrderCode} không tồn tại trong hệ thống.`,
      };
    }

    if (order.status === 'SUCCESS') {
      return {
        success: true,
        message: `Đơn hàng ${matchedOrderCode} đã được duyệt từ trước.`,
        order,
      };
    }

    // 3. Mark Order SUCCESS with full SePay payment details stored
    const updatedOrder = await orderRepository.updateById(order._id, {
      status: 'SUCCESS',
      paymentMethod: 'SEPAY_WEBHOOK',
      paymentRef: String(sepayId || referenceCode || 'SEPAY_WEBHOOK'),
      approvedAt: new Date(),
      notes: `Tự động duyệt qua SePay Webhook (Số tiền: ${Number(transferAmount).toLocaleString('vi-VN')} VNĐ)`,
      paymentDetails: {
        sepayId: String(sepayId),
        gateway: String(gateway),
        transactionDate: String(transactionDate),
        accountNumber: String(accountNumber),
        subAccount: String(subAccount),
        transferType: String(transferType),
        transferAmount: Number(transferAmount) || 0,
        accumulated: Number(accumulated) || 0,
        code: String(code),
        content: String(content),
        referenceCode: String(referenceCode),
        description: String(description),
        rawWebhookData: reqBody
      }
    });

    // 4. Activate Organization Package
    await this._activateOrgPlan(order.organizationId._id || order.organizationId, order.plan, order.durationMonths);

    // 5. Write Audit Log (System process)
    await auditLogService.logAction(
      { user: order.userId, tenantContext: { organizationId: order.organizationId._id || order.organizationId } },
      'SEPAY_WEBHOOK_PAYMENT_SUCCESS',
      'order',
      order._id
    );

    return {
      success: true,
      message: `Đã tự động duyệt đơn hàng ${matchedOrderCode} thành công!`,
      order: updatedOrder,
    };
  }

  async getAdminOrdersAndStats(queryParams) {
    const { status, search, page, limit } = queryParams || {};
    const ordersResult = await orderRepository.searchOrders({
      status,
      search,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
    });
    const stats = await orderRepository.getRevenueStats();

    return {
      orders: ordersResult,
      stats,
    };
  }

  async _activateOrgPlan(orgId, newPlan, durationMonths = 1) {
    const org = await Organization.findById(orgId);
    if (!org) return;

    const months = Math.max(1, parseInt(durationMonths) || 1);
    const now = new Date();

    let currentExpiry = org.planExpiresAt ? new Date(org.planExpiresAt) : null;
    if (!currentExpiry || currentExpiry < now) {
      currentExpiry = new Date();
    }

    // Add months to expiration date
    currentExpiry.setMonth(currentExpiry.getMonth() + months);

    org.plan = newPlan;
    org.planExpiresAt = currentExpiry;
    await org.save();

    return org;
  }
}

export const orderService = new OrderService();
