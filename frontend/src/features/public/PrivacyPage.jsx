import React from 'react';
import { Shield, ArrowLeft, FileText, Lock, Eye, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const PrivacyPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-sky-500 selection:text-white">
      {/* Top Header Navigation */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-sm font-bold text-sky-400 hover:text-sky-300 transition-colors cursor-pointer"
          >
            <ArrowLeft size={18} /> Quay lại Trang Chủ FlexiDoc
          </button>
          <div className="flex items-center gap-2">
            <Shield size={20} className="text-emerald-400" />
            <span className="text-sm font-black tracking-wide text-white">FlexiDoc Security</span>
          </div>
        </div>
      </header>

      {/* Main Legal Content Container */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-3xl p-8 md:p-12 shadow-2xl backdrop-blur-sm">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4.5 py-1.5 rounded-full text-xs font-bold text-emerald-400 mb-6">
            <Shield size={14} /> Chính Sách Bảo Mật Quyền Riêng Tư (Privacy Policy)
          </div>

          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-4">
            Chính Sách Bảo Mật FlexiDoc
          </h1>
          <p className="text-xs text-slate-400 mb-8 border-b border-slate-700/80 pb-6">
            Cập nhật lần cuối: Ngày 22 tháng 09 năm 2026 | Tên miền chính thức: <a href="https://flexidoc.io.vn" className="text-sky-400 underline">https://flexidoc.io.vn</a>
          </p>

          <div className="space-y-8 text-sm text-slate-300 leading-relaxed font-normal">
            <section>
              <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <FileText size={18} className="text-sky-400" /> 1. Thu Thập Thông Tin Người Dùng
              </h2>
              <p className="mb-3">
                FlexiDoc ("Chúng tôi") cam kết bảo vệ tuyệt đối quyền riêng tư và dữ liệu của cá nhân, doanh nghiệp khi sử dụng nền tảng số hóa hợp đồng đa tổ chức.
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-400">
                <li><strong>Thông tin tài khoản:</strong> Họ và tên, địa chỉ Email, ảnh đại diện Google (khi sử dụng Đăng nhập với Google OAuth 2.0).</li>
                <li><strong>Thông tin Tổ chức:</strong> Tên công ty/tổ chức, mã tổ chức, chức vụ công tác của nhân sự.</li>
                <li><strong>Dữ liệu Hợp đồng:</strong> Các tệp mẫu hợp đồng Word (.docx), dữ liệu biến trích xuất và file xuất PDF.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <Lock size={18} className="text-emerald-400" /> 2. Mục Đích Sử Dụng Dữ Liệu
              </h2>
              <p className="mb-2">Chúng tôi thu thập dữ liệu chỉ nhằm các mục đích sau:</p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-400">
                <li>Xác thực danh tính người dùng và phân quyền truy cập hợp đồng theo Tổ chức (Multi-Tenant).</li>
                <li>Cung cấp tính năng số hóa, trích xuất biến tự động và tạo hợp đồng định dạng chuẩn A4 PDF.</li>
                <li>Gửi thông báo trạng thái đơn hàng nâng cấp gói cước dịch vụ (BASIC, PRO, VIP).</li>
                <li>Tuyệt đối KHÔNG chia sẻ, bán hoặc kinh doanh dữ liệu người dùng cho bất kỳ bên thứ ba nào khác.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <Eye size={18} className="text-amber-400" /> 3. Bảo Mật Đăng Nhập Google OAuth 2.0
              </h2>
              <p className="text-slate-300">
                Ứng dụng FlexiDoc tuân thủ nghiêm ngặt Chính sách dữ liệu người dùng của Dịch vụ Google API (Google API Services User Data Policy). Thông tin thu thập qua Google Sign-In chỉ bao gồm địa chỉ Email và Họ tên công khai nhằm xác thực tài khoản an toàn không cần mật khẩu.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <RefreshCw size={18} className="text-sky-400" /> 4. Quyền Kiểm Soát & Xóa Dữ Liệu
              </h2>
              <p className="text-slate-300">
                Người dùng và Trưởng Tổ chức (Admin) có toàn quyền chỉnh sửa, trích xuất hoặc yêu cầu xóa hoàn toàn dữ liệu tài khoản và hợp đồng khỏi hệ thống máy chủ bất kỳ lúc nào bằng cách liên hệ bộ phận hỗ trợ kỹ thuật qua Email: <strong className="text-sky-300">dovankhoa091@gmail.com</strong>.
              </p>
            </section>
          </div>

          <div className="mt-10 pt-6 border-t border-slate-700/80 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <div>© 2026 FlexiDoc System. Tất cả quyền được bảo lưu.</div>
            <div>Tên miền chính thức: <strong className="text-white">flexidoc.io.vn</strong></div>
          </div>
        </div>
      </main>
    </div>
  );
};
