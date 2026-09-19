import { Order } from '../models/order.model.js';

export class OrderRepository {
  async create(orderData) {
    return await Order.create(orderData);
  }

  async findById(id) {
    return await Order.findById(id)
      .populate('organizationId', 'name code plan planExpiresAt')
      .populate('userId', 'fullName email phone')
      .populate('approvedBy', 'fullName email');
  }

  async findByCode(orderCode) {
    return await Order.findOne({ orderCode: orderCode.toUpperCase() })
      .populate('organizationId', 'name code plan planExpiresAt')
      .populate('userId', 'fullName email phone');
  }

  async updateById(id, updateData) {
    return await Order.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
      .populate('organizationId', 'name code plan planExpiresAt')
      .populate('userId', 'fullName email phone')
      .populate('approvedBy', 'fullName email');
  }

  async searchOrders({ status, search, page = 1, limit = 20 }) {
    const filter = {};
    if (status && status !== 'ALL') {
      filter.status = status;
    }
    if (search) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { orderCode: regex },
        { notes: regex },
      ];
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Order.find(filter)
        .populate('organizationId', 'name code plan planExpiresAt')
        .populate('userId', 'fullName email phone')
        .populate('approvedBy', 'fullName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter)
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1
    };
  }

  async getRevenueStats() {
    const [totalRevenueAgg, monthlyRevenueAgg, totalOrdersCount, successOrdersCount, pendingOrdersCount] = await Promise.all([
      Order.aggregate([
        { $match: { status: 'SUCCESS' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Order.aggregate([
        {
          $match: {
            status: 'SUCCESS',
            createdAt: {
              $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            }
          }
        },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Order.countDocuments(),
      Order.countDocuments({ status: 'SUCCESS' }),
      Order.countDocuments({ status: 'PENDING' }),
    ]);

    const totalRevenue = totalRevenueAgg[0]?.total || 0;
    const monthlyRevenue = monthlyRevenueAgg[0]?.total || 0;

    return {
      totalRevenue,
      monthlyRevenue,
      totalOrdersCount,
      successOrdersCount,
      pendingOrdersCount,
    };
  }
}

export const orderRepository = new OrderRepository();
