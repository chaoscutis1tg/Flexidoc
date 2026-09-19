import React, { useState } from 'react';
import { useAuth } from '../../app/AuthContext';
import { useNavigate } from 'react-router-dom';
import { AuthModal } from '../auth/AuthModal';
import {
  Briefcase,
  FileText,
  Sparkles,
  ShieldCheck,
  Building2,
  Users,
  Check,
  Lock,
  Unlock,
  ArrowRight,
  CheckCircle2,
  Zap,
  Crown,
  Download,
  Printer,
  LayoutDashboard,
  LogIn,
  UserPlus
} from 'lucide-react';

export const LandingPage = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authDefaultTab, setAuthDefaultTab] = useState('login');

  const openLoginModal = () => {
    setAuthDefaultTab('login');
    setAuthModalOpen(true);
  };

  const openRegisterModal = () => {
    setAuthDefaultTab('register');
    setAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">

      {/* Sleek Full-Width Glassmorphic Header */}
      <header className="w-full bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-50 shadow-sm transition-all py-4">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">

          {/* Brand Logo */}
          <div className="flex items-center gap-3.5 cursor-pointer group" onClick={() => navigate('/')}>
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-sky-600 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/25 group-hover:scale-105 transition-all">
              <Briefcase size={23} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl md:text-2xl font-black text-slate-900 leading-none tracking-tight">
                  MT-CTMS
                </h2>
                <span className="bg-sky-100 text-sky-700 text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-sky-200 uppercase tracking-wider">
                  SaaS
                </span>
              </div>
              <span className="text-xs text-slate-500 font-semibold tracking-wide block mt-1">
                Nền Tảng Quản Lý Hợp Đồng
              </span>
            </div>
          </div>

          {/* Centered Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-full border border-slate-200/70 shadow-inner">
            <a href="#features" className="px-5 py-2 rounded-full text-slate-700 hover:text-sky-700 hover:bg-white text-xs md:text-sm font-extrabold transition-all no-underline">
              Tính Năng
            </a>
            <a href="#pricing" className="px-5 py-2 rounded-full text-slate-700 hover:text-sky-700 hover:bg-white text-xs md:text-sm font-extrabold transition-all no-underline">
              Gói Dịch Vụ
            </a>
            <a href="#workflow" className="px-5 py-2 rounded-full text-slate-700 hover:text-sky-700 hover:bg-white text-xs md:text-sm font-extrabold transition-all no-underline">
              Quy Trình
            </a>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {token && user ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="px-6 py-2.5 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 text-white font-extrabold text-xs md:text-sm flex items-center gap-2 shadow-md shadow-sky-500/25 hover:shadow-sky-500/40 hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer"
              >
                <LayoutDashboard size={18} /> Vào Dashboard
              </button>
            ) : (
              <>
                <button
                  onClick={openLoginModal}
                  className="px-5 py-2.5 rounded-full text-slate-700 font-extrabold text-xs md:text-sm flex items-center gap-2 hover:text-sky-600 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  <LogIn size={16} /> Đăng Nhập
                </button>
                <button
                  onClick={openRegisterModal}
                  className="px-6 py-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-xs md:text-sm flex items-center gap-2 shadow-md shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer"
                >
                  <UserPlus size={17} /> Đăng Ký Miễn Phí
                </button>
              </>
            )}
          </div>

        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-5 text-center bg-gradient-to-b from-white via-sky-50/50 to-slate-50 border-b border-sky-100">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-sky-100/80 text-sky-800 px-4 py-1.5 rounded-full text-xs md:text-sm font-extrabold mb-6 border border-sky-200/80 shadow-xs">
            <Sparkles size={16} className="text-sky-600" /> Nền Tảng Số Hóa & Quản Lý Hợp Đồng Thương Mại Đa Tổ Chức
          </div>

          <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight tracking-tight">
            Số Hóa Mẫu Hợp Đồng Từ Word <br />
            <span className="text-sky-600">Sinh Hợp Đồng Tự Động Trong 30 Giây</span>
          </h1>

          <p className="text-base text-slate-600 mt-5 leading-relaxed max-w-2xl mx-auto">
            Tải trực tiếp file Word (<code className="bg-slate-200/70 px-2 py-0.5 rounded text-slate-900 font-mono text-xs">.DOCX</code>) lên hệ thống, tự động giữ nguyên 100% định dạng căn lề, thụt đầu dòng, bảng biểu. Sinh hàng loạt hợp đồng & xuất file PDF chuẩn Times New Roman A4.
          </p>

          <div className="flex flex-wrap justify-center gap-4 mt-8">
            <button
              onClick={token ? () => navigate('/contracts') : openRegisterModal}
              className="px-7 py-3.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-extrabold text-base flex items-center gap-2.5 shadow-xl shadow-emerald-500/35 hover:shadow-emerald-500/50 hover:-translate-y-1 active:scale-95 transition-all cursor-pointer"
            >
              <Zap size={20} /> Thử Nghiệm Ngay (Miễn Phí 2 Mẫu)
            </button>

            <a
              href="#pricing"
              className="px-7 py-3.5 rounded-full bg-white border border-slate-300 text-slate-700 font-extrabold text-base flex items-center gap-2 shadow-md hover:border-slate-400 hover:bg-slate-50 hover:-translate-y-0.5 transition-all cursor-pointer no-underline"
            >
              Xem Bảng Giá Gói Dịch Vụ
            </a>
          </div>

          {/* Metric Badges */}
          <div className="flex flex-wrap justify-center gap-8 md:gap-12 mt-12 pt-8 border-t border-slate-200">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 size={22} className="text-emerald-500" />
              <span className="text-sm font-bold text-slate-700">Giữ 100% Định Dạng Word</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 size={22} className="text-emerald-500" />
              <span className="text-sm font-bold text-slate-700">Mã Gia Nhập Nhân Sự Tiện Lợi</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 size={22} className="text-emerald-500" />
              <span className="text-sm font-bold text-slate-700">Xuất A4 PDF Chuẩn Doanh Nghiệp</span>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-5 max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <div className="text-xs font-black text-sky-600 uppercase tracking-widest mb-1">GÓI THƯƠNG MẠI HOÀN HẢO</div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
            Bảng Giá Gói Dịch Vụ Phù Hợp Mọi Quy Mô
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            Đăng ký sử dụng miễn phí ngay lập tức hoặc nâng cấp lên gói Pro/VIP để mở khóa tính năng cao cấp.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

          {/* PLAN 1: FREE */}
          <div className="bg-white rounded-3xl p-7 border border-slate-200 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
            <div>
              <div className="text-xs font-black text-slate-500 uppercase tracking-wider">Gói Trải Nghiệm</div>
              <h3 className="text-2xl font-black mt-1 text-slate-900">FREE</h3>
              <div className="my-4 flex items-baseline gap-1">
                <span className="text-4xl font-black text-slate-900">0đ</span>
                <span className="text-xs text-slate-500">/ vĩnh viễn</span>
              </div>

              <ul className="space-y-3 my-6 text-xs text-slate-600 font-medium">
                <li className="flex items-center gap-2 font-bold text-slate-900">
                  <Check size={16} className="text-emerald-500 shrink-0" /> Tối đa 2 Mẫu Hợp Đồng
                </li>
                <li className="flex items-center gap-2 text-slate-400">
                  <Lock size={16} className="text-slate-400 shrink-0" /> Tạo 1 lần (Không sửa / xóa)
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-emerald-500 shrink-0" /> Sinh hợp đồng không giới hạn
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-emerald-500 shrink-0" /> Xuất file PDF / In A4 chuẩn
                </li>
              </ul>
            </div>

            <button
              onClick={openRegisterModal}
              className="w-full py-3 rounded-full border border-slate-300 bg-slate-50 text-slate-700 font-extrabold text-xs md:text-sm hover:bg-slate-100 hover:border-slate-400 transition-all cursor-pointer"
            >
              Đăng Ký Miễn Phí
            </button>
          </div>

          {/* PLAN 2: BASIC */}
          <div className="bg-white rounded-3xl p-7 border border-slate-200 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
            <div>
              <div className="text-xs font-black text-sky-600 uppercase tracking-wider">Gói Doanh Nghiệp</div>
              <h3 className="text-2xl font-black mt-1 text-slate-900">BASIC</h3>
              <div className="my-4 flex items-baseline gap-1">
                <span className="text-4xl font-black text-sky-600">199.000đ</span>
                <span className="text-xs text-slate-500">/ tháng</span>
              </div>

              <ul className="space-y-3 my-6 text-xs text-slate-600 font-medium">
                <li className="flex items-center gap-2 font-bold text-slate-900">
                  <Check size={16} className="text-emerald-500 shrink-0" /> Tối đa 10 Mẫu Hợp Đồng
                </li>
                <li className="flex items-center gap-2 font-bold text-slate-900">
                  <Unlock size={16} className="text-emerald-500 shrink-0" /> Cho phép Thêm, Sửa, Xóa
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-emerald-500 shrink-0" /> Thời hạn 30 ngày
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-emerald-500 shrink-0" /> Tự động khóa sau 2 mẫu nếu hết hạn
                </li>
              </ul>
            </div>

            <button
              onClick={openRegisterModal}
              className="w-full py-3 rounded-full bg-gradient-to-r from-sky-500 to-sky-600 text-white font-extrabold text-xs md:text-sm shadow-md shadow-sky-500/25 hover:shadow-sky-500/40 hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer"
            >
              Chọn Gói Basic
            </button>
          </div>

          {/* PLAN 3: PRO (POPULAR) */}
          <div className="bg-white rounded-3xl p-7 border-2 border-sky-500 flex flex-col justify-between shadow-xl shadow-sky-500/10 relative">
            <div className="absolute -top-3.5 right-5 bg-sky-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
              Phổ Biến Nhất
            </div>
            <div>
              <div className="text-xs font-black text-sky-600 uppercase tracking-wider">Gói Doanh Nghiệp Vừa</div>
              <h3 className="text-2xl font-black mt-1 text-slate-900">PRO</h3>
              <div className="my-4 flex items-baseline gap-1">
                <span className="text-4xl font-black text-sky-600">499.000đ</span>
                <span className="text-xs text-slate-500">/ tháng</span>
              </div>

              <ul className="space-y-3 my-6 text-xs text-slate-600 font-medium">
                <li className="flex items-center gap-2 font-bold text-slate-900">
                  <Check size={16} className="text-emerald-500 shrink-0" /> Tối đa 20 Mẫu Hợp Đồng
                </li>
                <li className="flex items-center gap-2 font-bold text-slate-900">
                  <Unlock size={16} className="text-emerald-500 shrink-0" /> Cho phép Thêm, Sửa, Xóa
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-emerald-500 shrink-0" /> Mã gia nhập nhân sự tổ chức
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-emerald-500 shrink-0" /> Thời hạn 30 ngày (Gia hạn hàng tháng)
                </li>
              </ul>
            </div>

            <button
              onClick={openRegisterModal}
              className="w-full py-3 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold text-xs md:text-sm shadow-lg shadow-blue-600/30 hover:shadow-blue-600/45 hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer"
            >
              Bắt Đầu Gói Pro
            </button>
          </div>

          {/* PLAN 4: VIP UNLIMITED */}
          <div className="bg-gradient-to-b from-white to-purple-50/50 rounded-3xl p-7 border border-purple-200 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
            <div>
              <div className="text-xs font-black text-purple-600 uppercase tracking-wider flex items-center gap-1">
                <Crown size={15} className="text-purple-600" /> Gói VIP
              </div>
              <h3 className="text-2xl font-black mt-1 text-slate-900">VIP UNLIMITED</h3>
              <div className="my-4 flex items-baseline gap-1">
                <span className="text-4xl font-black text-purple-600">999.000đ</span>
                <span className="text-xs text-slate-500">/ tháng</span>
              </div>

              <ul className="space-y-3 my-6 text-xs text-slate-600 font-medium">
                <li className="flex items-center gap-2 font-bold text-purple-900">
                  <Crown size={16} className="text-purple-600 shrink-0" /> Không Giới Hạn Mẫu Hợp Đồng
                </li>
                <li className="flex items-center gap-2 font-bold text-slate-900">
                  <Unlock size={16} className="text-purple-600 shrink-0" /> Toàn quyền Thêm, Sửa, Xóa
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-purple-600 shrink-0" /> Quản lý nhân sự & phân quyền
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-purple-600 shrink-0" /> Hỗ trợ kỹ thuật 24/7
                </li>
              </ul>
            </div>

            <button
              onClick={openRegisterModal}
              className="w-full py-3 rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-extrabold text-xs md:text-sm shadow-lg shadow-purple-600/30 hover:shadow-purple-600/45 hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer"
            >
              Nâng Cấp Gói VIP
            </button>
          </div>

        </div>
      </section>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultTab={authDefaultTab}
      />
    </div>
  );
};
