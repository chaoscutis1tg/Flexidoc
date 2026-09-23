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

  async getAdminReportData({ timeframe = 'ALL', startDate, endDate }) {
    let dateFilter = { status: 'SUCCESS' };

    const now = new Date();
    let start = null;
    let end = new Date();

    if (timeframe === 'TODAY') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    } else if (timeframe === 'THIS_WEEK') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      start = new Date(now.setDate(diff));
      start.setHours(0, 0, 0, 0);
    } else if (timeframe === 'THIS_MONTH') {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    } else if (timeframe === 'THIS_YEAR') {
      start = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
    } else if (timeframe === 'CUSTOM' && startDate) {
      start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      if (endDate) {
        end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
      }
    }

    if (start) {
      dateFilter.createdAt = { $gte: start, $lte: end };
    }

    const orders = await Order.find(dateFilter)
      .populate('organizationId', 'name code plan planExpiresAt')
      .populate('userId', 'fullName email phone')
      .sort({ createdAt: -1 })
      .lean();

    const totalRevenue = orders.reduce((sum, o) => sum + (o.amount || 0), 0);
    const successOrdersCount = orders.length;

    const packageMap = {};
    orders.forEach(o => {
      const plan = o.plan || 'UNKNOWN';
      if (!packageMap[plan]) {
        packageMap[plan] = { plan, count: 0, totalRevenue: 0 };
      }
      packageMap[plan].count += 1;
      packageMap[plan].totalRevenue += (o.amount || 0);
    });

    const packageBreakdown = Object.values(packageMap).map(p => ({
      ...p,
      percentage: totalRevenue > 0 ? parseFloat(((p.totalRevenue / totalRevenue) * 100).toFixed(1)) : 0
    })).sort((a, b) => b.totalRevenue - a.totalRevenue);

    const mostPopularPlan = packageBreakdown.length > 0
      ? packageBreakdown.reduce((max, p) => p.count > max.count ? p : max, packageBreakdown[0])
      : null;

    const buyerMap = {};
    orders.forEach(o => {
      const orgId = o.organizationId?._id?.toString() || o.organizationId?.toString() || 'NO_ORG';
      const orgName = o.organizationId?.name || 'Tổ chức không xác định';
      const orgCode = o.organizationId?.code || '---';
      const userFullName = o.userId?.fullName || 'Khách hàng';
      const userEmail = o.userId?.email || 'N/A';
      const userPhone = o.userId?.phone || '';

      if (!buyerMap[orgId]) {
        buyerMap[orgId] = {
          orgId,
          orgName,
          orgCode,
          userFullName,
          userEmail,
          userPhone,
          ordersCount: 0,
          totalSpent: 0,
          plansPurchased: [],
          lastPurchaseDate: o.createdAt
        };
      }

      buyerMap[orgId].ordersCount += 1;
      buyerMap[orgId].totalSpent += (o.amount || 0);
      if (!buyerMap[orgId].plansPurchased.includes(o.plan)) {
        buyerMap[orgId].plansPurchased.push(o.plan);
      }
      if (new Date(o.createdAt) > new Date(buyerMap[orgId].lastPurchaseDate)) {
        buyerMap[orgId].lastPurchaseDate = o.createdAt;
      }
    });

    const buyersList = Object.values(buyerMap).sort((a, b) => b.totalSpent - a.totalSpent);
    const topBuyer = buyersList.length > 0 ? buyersList[0] : null;

    return {
      timeframe,
      startDate: start ? start.toISOString() : null,
      endDate: end ? end.toISOString() : null,
      summary: {
        totalRevenue,
        successOrdersCount,
        mostPopularPlan,
        topBuyer,
      },
      packageBreakdown,
      buyersList,
      orders,
    };
  }
}

export const orderRepository = new OrderRepository();
