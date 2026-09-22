import React from 'react';
import { Shield, ArrowLeft, BookOpen, CheckCircle, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const TermsPage = () => {
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
            <BookOpen size={20} className="text-sky-400" />
            <span className="text-sm font-black tracking-wide text-white">FlexiDoc Terms</span>
          </div>
        </div>
      </header>

      {/* Main Legal Content Container */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-3xl p-8 md:p-12 shadow-2xl backdrop-blur-sm">
          <div className="inline-flex items-center gap-2 bg-sky-500/10 border border-sky-500/20 px-4.5 py-1.5 rounded-full text-xs font-bold text-sky-400 mb-6">
            <BookOpen size={14} /> Điều Khoản Sử Dụng Dịch Vụ (Terms of Service)
          </div>

          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-4">
            Điều Khoản Sử Dụng FlexiDoc
          </h1>
          <p className="text-xs text-slate-400 mb-8 border-b border-slate-700/80 pb-6">
            Cập nhật lần cuối: Ngày 22 tháng 09 năm 2026 | Tên miền chính thức: <a href="https://flexidoc.io.vn" className="text-sky-400 underline">https://flexidoc.io.vn</a>
          </p>

          <div className="space-y-8 text-sm text-slate-300 leading-relaxed font-normal">
            <section>
              <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <CheckCircle size={18} className="text-emerald-400" /> 1. Quy Định Chung
              </h2>
              <p>
                Chào mừng bạn đến với <strong>FlexiDoc</strong> (<a href="https://flexidoc.io.vn" className="text-sky-400">https://flexidoc.io.vn</a>) - Hệ thống Quản lý & Số hóa Hợp đồng Đa tổ chức. Khi truy cập và sử dụng dịch vụ của chúng tôi, bạn đồng ý tuân thủ các điều khoản dịch vụ được nêu tại đây.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <Shield size={18} className="text-sky-400" /> 2. Quyền và Tách Biệt Tổ Chức (Multi-Tenant)
              </h2>
              <p>
                Mỗi Tổ chức (doanh nghiệp) có không gian làm việc hoàn toàn độc lập và bảo mật. Trưởng Tổ chức (Admin) chịu trách nhiệm cấp phát mã gia nhập và phân quyền nhân sự thành viên trong Tổ chức của mình.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-400" /> 3. Trách Nhiệm Người Dùng
              </h2>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-400">
                <li>Bảo mật tài khoản cá nhân và mật khẩu đăng nhập.</li>
                <li>Không tải lên các hợp đồng chứa nội dung vi phạm pháp luật Việt Nam.</li>
                <li>Tuân thủ quy định thanh toán gói cước theo đúng cú pháp VietQR do hệ thống cung cấp.</li>
              </ul>
            </section>
          </div>

          <div className="mt-10 pt-6 border-t border-slate-700/80 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <div>© 2026 FlexiDoc System. Tất cả quyền được bảo lưu.</div>
            <div>Hỗ trợ Email: <strong className="text-white">dovankhoa091@gmail.com</strong></div>
          </div>
        </div>
      </main>
    </div>
  );
};
