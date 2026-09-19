import api from '../services/api';

export const DEFAULT_PLANS_DATA = [
  {
    code: 'BASIC',
    title: 'BASIC',
    subtitle: 'Doanh Nghiệp Nhỏ',
    price: 199000,
    formattedPrice: '199.000đ',
    billingCycle: '/ tháng',
    badge: 'BASIC',
    popular: false,
    maxTemplates: 10,
    allowEditDelete: true,
    features: [
      'Tối đa 10 Mẫu Hợp Đồng',
      'Cho phép Thêm, Sửa, Xóa',
      'Thời hạn 30 ngày (Gia hạn hàng tháng)',
      'Khóa tạo mẫu quá hạn sau 2 mẫu'
    ]
  },
  {
    code: 'PRO',
    title: 'PRO',
    subtitle: 'Doanh Nghiệp Vừa',
    price: 499000,
    formattedPrice: '499.000đ',
    billingCycle: '/ tháng',
    badge: 'PRO',
    popular: true,
    popularBadgeText: 'Phổ Biến Nhất',
    maxTemplates: 20,
    allowEditDelete: true,
    features: [
      'Tối đa 20 Mẫu Hợp Đồng',
      'Cho phép Thêm, Sửa, Xóa',
      'Mã gia nhập & Cây tổ chức',
      'Thời hạn 30 ngày (Gia hạn hàng tháng)'
    ]
  },
  {
    code: 'VIP',
    title: 'VIP UNLIMITED',
    subtitle: 'Tổ Chức & Tập Đoàn',
    price: 999000,
    formattedPrice: '999.000đ',
    billingCycle: '/ tháng',
    badge: 'VIP UNLIMITED',
    popular: false,
    maxTemplates: -1,
    allowEditDelete: true,
    features: [
      'Không Giới Hạn Mẫu Hợp Đồng',
      'Toàn quyền Thêm, Sửa, Xóa',
      'Quản lý cây sơ đồ tổ chức & phân quyền',
      'Hỗ trợ kỹ thuật ưu tiên 24/7'
    ]
  }
];

export const fetchDynamicPlans = async () => {
  try {
    const res = await api.get('/organizations/plans');
    if (res.success && Array.isArray(res.data) && res.data.length > 0) {
      // Filter out FREE for upgrade modals if needed or return commercial plans
      return res.data;
    }
  } catch (err) {
    console.warn('[PlanData] Using default plans:', err);
  }
  return DEFAULT_PLANS_DATA;
};
