/**
 * Helper formatter for Audit Logs in Vietnamese
 */

export const formatAuditAction = (action) => {
  if (!action) return 'THAO TÁC HỆ THỐNG';
  const act = action.toUpperCase();
  switch (act) {
    case 'GOOGLE_ORG_SETUP_SUCCESS':
      return 'Tạo / Gia nhập Tổ chức (Google)';
    case 'GOOGLE_AUTH_SUCCESS':
      return 'Đăng nhập Google';
    case 'LOGIN_SUCCESS':
      return 'Đăng nhập Mật khẩu';
    case 'REGISTER_SUCCESS':
      return 'Tạo Tài Khoản Mới';
    case 'CREATE_CONTRACT':
    case 'CONTRACT_CREATED':
    case 'SINH_HỢP_ĐỒNG':
      return 'Sinh Hợp Đồng PDF';
    case 'CONTRACT_DOWNLOADED_PDF':
      return 'Tải Hợp Đồng PDF';
    case 'CREATE_TEMPLATE':
    case 'TEMPLATE_CREATED':
    case 'TEMPLATE_PUBLISHED':
    case 'TẠO_TEMPLATE_MỚI':
      return 'Tạo Mẫu Template';
    case 'UPDATE_TEMPLATE':
      return 'Cập Nhật Template';
    case 'DELETE_TEMPLATE':
      return 'Xóa Template';
    case 'CREATE_MASTER_DATA':
      return 'Tạo Master Data';
    case 'UPDATE_USER':
      return 'Cập Nhật Nhân Sự';
    case 'CREATE_USER':
    case 'USER_CREATED':
      return 'Thêm Nhân Sự Mới';
    case 'PASSWORD_CHANGED':
      return 'Đổi Mật Khẩu';
    case 'ORGANIZATION_CREATED':
      return 'Khởi Tạo Tổ Chức';
    default:
      return action.replace(/_/g, ' ');
  }
};

export const formatAuditDetail = (log) => {
  if (!log) return 'Thông tin hệ thống';

  // If metadata has custom resource title or name
  if (log.metadata?.title) return log.metadata.title;
  if (log.metadata?.name) return log.metadata.name;
  if (log.metadata?.description) return log.metadata.description;

  const res = (log.resource || '').toLowerCase();
  const act = (log.action || '').toUpperCase();

  if (res === 'user') {
    if (act.includes('GOOGLE') || act.includes('SETUP') || act.includes('REGISTER')) {
      return 'Khởi tạo tài khoản & Thiết lập Tổ chức';
    }
    if (act.includes('LOGIN') || act.includes('AUTH')) {
      return 'Đăng nhập hệ thống thành công';
    }
    if (act.includes('PASSWORD')) {
      return 'Đổi mật khẩu tài khoản';
    }
    return `Tài khoản: ${log.userId?.fullName || log.userId?.email || 'Thành viên'}`;
  }

  if (res === 'contract') {
    return 'Hồ sơ Hợp đồng thương mại';
  }
  if (res === 'template') {
    return 'Mẫu Template hợp đồng (.DOCX)';
  }
  if (res === 'masterdata' || res === 'master-data') {
    return 'Dữ liệu Hồ sơ Master Data';
  }
  if (res === 'organization') {
    return 'Thông tin cấu hình Tổ chức';
  }

  return log.resource || 'Tài nguyên hệ thống';
};
