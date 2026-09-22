import { SubscriptionPlan } from '../models/subscription-plan.model.js';
import { systemSettingRepository } from '../repositories/system-setting.repository.js';

export const DEFAULT_PLANS = [
  {
    code: 'FREE',
    title: 'FREE',
    subtitle: 'Gói Trải Nghiệm vĩnh viễn',
    price: 0,
    formattedPrice: '0đ',
    billingCycle: '/ vĩnh viễn',
    badge: 'Gói Trải Nghiệm',
    popular: false,
    maxTemplates: 2,
    allowEditDelete: false,
    sortOrder: 1,
    features: [
      'Tối đa 2 Mẫu Hợp Đồng',
      'Tạo 1 lần (Không sửa / xóa)',
      'Sinh hợp đồng không giới hạn',
      'Xuất file PDF / In A4 chuẩn Word'
    ]
  },
  {
    code: 'BASIC',
    title: 'BASIC',
    subtitle: 'Phù hợp doanh nghiệp nhỏ',
    price: 199000,
    formattedPrice: '199.000đ',
    billingCycle: '/ tháng',
    badge: 'Gói Doanh Nghiệp Nhỏ',
    popular: false,
    maxTemplates: 10,
    allowEditDelete: true,
    sortOrder: 2,
    features: [
      'Tối đa 10 Mẫu Hợp Đồng',
      'Cho phép Thêm, Sửa, Xóa',
      'Thời hạn 30 ngày (Gia hạn hàng tháng)',
      'Tự động khóa sau 2 mẫu nếu hết hạn'
    ]
  },
  {
    code: 'PRO',
    title: 'PRO',
    subtitle: 'Doanh nghiệp phát triển nhanh',
    price: 299000,
    formattedPrice: '299.000đ',
    billingCycle: '/ tháng',
    badge: 'Gói Doanh Nghiệp Vừa',
    popular: true,
    popularBadgeText: 'Phổ Biến Nhất',
    maxTemplates: 20,
    allowEditDelete: true,
    sortOrder: 3,
    features: [
      'Tối đa 20 Mẫu Hợp Đồng',
      'Cho phép Thêm, Sửa, Xóa',
      'Mã gia nhập nhân sự tổ chức',
      'Thời hạn 30 ngày (Gia hạn hàng tháng)'
    ]
  },
  {
    code: 'VIP',
    title: 'VIP UNLIMITED',
    subtitle: 'Tổ chức lớn & Tập đoàn',
    price: 999000,
    formattedPrice: '999.000đ',
    billingCycle: '/ tháng',
    badge: 'Gói VIP Unlimited',
    popular: false,
    maxTemplates: -1,
    allowEditDelete: true,
    sortOrder: 4,
    features: [
      'Không Giới Hạn Mẫu Hợp Đồng',
      'Toàn quyền Thêm, Sửa, Xóa',
      'Quản lý cây sơ đồ tổ chức & phân quyền',
      'Hỗ trợ kỹ thuật ưu tiên 24/7'
    ]
  }
];

export class SubscriptionPlanService {
  async ensureSeedPlans() {
    const count = await SubscriptionPlan.countDocuments();
    if (count === 0) {
      console.log('[SubscriptionPlan] Seeding default pricing plans...');
      await SubscriptionPlan.insertMany(DEFAULT_PLANS);
    }
  }

  async getAllPlans() {
    await this.ensureSeedPlans();
    try {
      const pricingSetting = await systemSettingRepository.getByKey('PRICING_CONFIG');
      if (pricingSetting && pricingSetting.value) {
        const { proMonthlyPrice, vipMonthlyPrice } = pricingSetting.value;
        if (proMonthlyPrice !== undefined) {
          await SubscriptionPlan.updateOne(
            { code: 'PRO' },
            { price: proMonthlyPrice, formattedPrice: new Intl.NumberFormat('vi-VN').format(proMonthlyPrice) + 'đ' }
          );
        }
        if (vipMonthlyPrice !== undefined) {
          await SubscriptionPlan.updateOne(
            { code: 'VIP' },
            { price: vipMonthlyPrice, formattedPrice: new Intl.NumberFormat('vi-VN').format(vipMonthlyPrice) + 'đ' }
          );
        }
      }
    } catch (e) {
      // Ignore if database setting not ready
    }
    return await SubscriptionPlan.find().sort({ sortOrder: 1 });
  }

  async updatePlan(code, data) {
    await this.ensureSeedPlans();
    if (data.price !== undefined && !data.formattedPrice) {
      data.formattedPrice = new Intl.NumberFormat('vi-VN').format(data.price) + 'đ';
    }
    const updated = await SubscriptionPlan.findOneAndUpdate(
      { code: code.toUpperCase() },
      { $set: data },
      { new: true }
    );
    return updated;
  }
}

export const subscriptionPlanService = new SubscriptionPlanService();
