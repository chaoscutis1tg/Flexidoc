import React, { useState, useEffect } from 'react';
import { useAuth } from '../../app/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
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
  LayoutDashboard,
  LogIn,
  UserPlus,
  Globe,
  Sliders,
  Award,
  Layers,
  FileCheck,
  Phone,
  Mail,
  MapPin,
  Headphones,
  ChevronRight
} from 'lucide-react';

export const LandingPage = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authDefaultTab, setAuthDefaultTab] = useState('login');
  const [activeNav, setActiveNav] = useState('features');

  // Auto open AuthModal if route is /login, /register, or setup_org=1
  useEffect(() => {
    if (location.pathname === '/login') {
      setAuthDefaultTab('login');
      setAuthModalOpen(true);
    } else if (location.pathname === '/register') {
      setAuthDefaultTab('register');
      setAuthModalOpen(true);
    } else if (location.search.includes('setup_org=1') || (user && !user.organizationId && user.role !== 'SUPER_ADMIN')) {
      setAuthDefaultTab('login');
      setAuthModalOpen(true);
    }
  }, [location.pathname, location.search, user]);

  const handleCloseAuthModal = () => {
    setAuthModalOpen(false);
    if (location.pathname === '/login' || location.pathname === '/register') {
      navigate('/', { replace: true });
    }
  };

  const openLoginModal = () => {
    setAuthDefaultTab('login');
    setAuthModalOpen(true);
  };

  const openRegisterModal = () => {
    setAuthDefaultTab('register');
    setAuthModalOpen(true);
  };

  // Smooth scroll handler
  const scrollToSection = (id) => {
    setActiveNav(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Auto detect active section on scroll
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['features', 'pricing', 'workflow'];
      const scrollPosition = window.scrollY + 220;

      for (const sectionId of sections) {
        const el = document.getElementById(sectionId);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveNav(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-sky-500 selection:text-white">

      {/* 1. Sleek Full-Width Glassmorphic Sticky Header */}
      <header className="w-full bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-50 shadow-xs transition-all py-3.5">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">

          {/* Brand Logo */}
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
            <img src="/logo.png" alt="FlexiDoc Logo" className="w-10 h-10 object-contain group-hover:scale-105 transition-all" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-900 leading-none tracking-tight">
                  FlexiDoc
                </h2>
                <span className="bg-sky-100 text-sky-700 text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-sky-200 uppercase tracking-wider">
                  SaaS
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-semibold tracking-wide block mt-0.5">
                Số Hóa & Quản Lý Hợp Đồng
              </span>
            </div>
          </div>

          {/* Centered Navigation Links - Text Only with Smooth Underline Active Indicator */}
          <nav className="hidden md:flex items-center gap-8">
            <button
              type="button"
              onClick={() => scrollToSection('features')}
              className={`text-sm transition-all cursor-pointer border-none bg-transparent py-1 px-1 relative font-extrabold outline-none ${
                activeNav === 'features'
                  ? 'text-sky-600 font-black'
                  : 'text-slate-600 hover:text-sky-600 font-extrabold'
              }`}
            >
              Tính Năng
              {activeNav === 'features' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-600 rounded-full transition-all duration-300" />
              )}
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('pricing')}
              className={`text-sm transition-all cursor-pointer border-none bg-transparent py-1 px-1 relative font-extrabold outline-none ${
                activeNav === 'pricing'
                  ? 'text-sky-600 font-black'
                  : 'text-slate-600 hover:text-sky-600 font-extrabold'
              }`}
            >
              Gói Dịch Vụ
              {activeNav === 'pricing' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-600 rounded-full transition-all duration-300" />
              )}
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('workflow')}
              className={`text-sm transition-all cursor-pointer border-none bg-transparent py-1 px-1 relative font-extrabold outline-none ${
                activeNav === 'workflow'
                  ? 'text-sky-600 font-black'
                  : 'text-slate-600 hover:text-sky-600 font-extrabold'
              }`}
            >
              Quy Trình
              {activeNav === 'workflow' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-600 rounded-full transition-all duration-300" />
              )}
            </button>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {token && user ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="px-5 py-2 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 text-white font-extrabold text-xs md:text-sm flex items-center gap-2 shadow-md shadow-sky-500/25 hover:shadow-sky-500/40 hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer"
              >
                <LayoutDashboard size={17} /> Vào Dashboard
              </button>
            ) : (
              <>
                <button
                  onClick={openLoginModal}
                  className="px-4 py-2 rounded-full text-slate-700 font-extrabold text-xs md:text-sm flex items-center gap-2 hover:text-sky-600 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  <LogIn size={16} /> Đăng Nhập
                </button>
                <button
                  onClick={openRegisterModal}
                  className="px-5 py-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-xs md:text-sm flex items-center gap-2 shadow-md shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer"
                >
                  <UserPlus size={17} /> Đăng Ký Miễn Phí
                </button>
              </>
            )}
          </div>

        </div>
      </header>

      {/* 2. Hero & Features Section (#features) */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 text-center bg-gradient-to-b from-white via-sky-50/40 to-slate-50 border-b border-slate-200/80 scroll-mt-20">
        <div className="max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-sky-100/90 text-sky-800 px-4 py-1.5 rounded-full text-xs md:text-sm font-extrabold mb-6 border border-sky-200 shadow-2xs">
            <Sparkles size={16} className="text-sky-600 shrink-0" /> Nền Tảng Số Hóa & Quản Lý Hợp Đồng Thương Mại Đa Tổ Chức
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 leading-tight tracking-tight">
            Số Hóa Mẫu Hợp Đồng Từ Word <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">
              Sinh Hợp Đồng Tự Động Trong 30 Giây
            </span>
          </h1>

          <p className="text-base text-slate-600 mt-6 leading-relaxed max-w-2xl mx-auto font-medium">
            Tải trực tiếp file Word (<code className="bg-slate-200/80 px-2 py-0.5 rounded text-slate-900 font-mono text-xs">.DOCX</code>) lên hệ thống, giữ nguyên 100% định dạng căn lề, thụt đầu dòng, bảng biểu. Phân quyền tổ chức chi nhánh & xuất file PDF chuẩn Times New Roman A4.
          </p>

          <div className="flex flex-wrap justify-center gap-4 mt-8">
            <button
              onClick={token ? () => navigate('/contracts') : openRegisterModal}
              className="px-7 py-3.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-extrabold text-base flex items-center gap-2.5 shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/45 hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer"
            >
              <Zap size={20} /> Thử Nghiệm Ngay (Miễn Phí 2 Mẫu)
            </button>

            <button
              onClick={() => scrollToSection('pricing')}
              className="px-7 py-3.5 rounded-full bg-white border border-slate-300 text-slate-700 font-extrabold text-base flex items-center gap-2 shadow-md hover:border-slate-400 hover:bg-slate-50 hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              Xem Bảng Giá Gói Dịch Vụ
            </button>
          </div>

          {/* Metric Badges */}
          <div className="flex flex-wrap justify-center gap-6 sm:gap-10 mt-12 pt-8 border-t border-slate-200/80">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
              <span className="text-xs sm:text-sm font-extrabold text-slate-800">Giữ 100% Định Dạng Word</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
              <span className="text-xs sm:text-sm font-extrabold text-slate-800">Mã Gia Nhập Nhân Sự Tiện Lợi</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
              <span className="text-xs sm:text-sm font-extrabold text-slate-800">Xuất A4 PDF Chuẩn Doanh Nghiệp</span>
            </div>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="max-w-6xl mx-auto mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="bg-white p-7 rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mb-5 group-hover:bg-sky-600 group-hover:text-white transition-all">
              <FileText size={24} />
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-2">Số Hóa Mẫu Word (.DOCX)</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Không cần gõ lại nội dung. Tải mẫu hợp đồng Word của công ty bạn lên hệ thống, hệ thống tự động bóc tách các trường biến tự động.
            </p>
          </div>

          <div className="bg-white p-7 rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-5 group-hover:bg-indigo-600 group-hover:text-white transition-all">
              <Building2 size={24} />
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-2">Cấu Trúc Đa Chi Nhánh</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Quản lý mô hình tập đoàn, tổng công ty và các chi nhánh con. Phân quyền Người Quản Lý Chi Nhánh với luồng xác nhận duyệt vai trò minh bạch.
            </p>
          </div>

          <div className="bg-white p-7 rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5 group-hover:bg-emerald-600 group-hover:text-white transition-all">
              <ShieldCheck size={24} />
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-2">Lưu Trữ & Xuất PDF Pháp Lý</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Tạo phiên bản Snapshot bất biến cho từng bản ghi hợp đồng. Xuất file PDF Times New Roman A4 sẵn sàng cho in ấn & ký kết thương mại.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Workflow Section (#workflow) */}
      <section id="workflow" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50 via-sky-50/30 to-white border-b border-slate-200/80 scroll-mt-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="text-xs font-black text-sky-600 uppercase tracking-widest mb-1.5 flex items-center justify-center gap-1.5">
              <Sliders size={15} /> QUY TRÌNH ĐƠN GIẢN
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              Quy Trình Quản Lý & Sinh Hợp Đồng Trong 4 Bước
            </h2>
            <p className="text-sm text-slate-500 mt-2 font-medium">
              Dễ dàng triển khai số hóa hợp đồng cho doanh nghiệp chỉ với vài thao tác trực quan.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-7 rounded-3xl border border-slate-200/90 shadow-sm relative flex flex-col justify-between hover:shadow-md transition-all">
              <div>
                <div className="w-11 h-11 rounded-2xl bg-sky-100 text-sky-700 font-black text-base flex items-center justify-center mb-5">
                  01
                </div>
                <h3 className="text-base font-extrabold text-slate-900 mb-2">1. Tải Mẫu Word (.DOCX)</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Tải file Word mẫu hợp đồng của công ty bạn lên hệ thống. Hệ thống tự động nhận diện các trường biến thông tin.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-[11px] font-bold text-sky-700">
                <FileText size={15} /> Tải file Word mẫu
              </div>
            </div>

            <div className="bg-white p-7 rounded-3xl border border-slate-200/90 shadow-sm relative flex flex-col justify-between hover:shadow-md transition-all">
              <div>
                <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-700 font-black text-base flex items-center justify-center mb-5">
                  02
                </div>
                <h3 className="text-base font-extrabold text-slate-900 mb-2">2. Phân Quyền Chi Nhánh</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Tạo chi nhánh con, tìm kiếm & chỉ định Người Quản Lý. Hệ thống tự động gửi lời mời xác nhận nhận quyền.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-[11px] font-bold text-blue-700">
                <Users size={15} /> Chỉ định quản lý
              </div>
            </div>

            <div className="bg-white p-7 rounded-3xl border border-slate-200/90 shadow-sm relative flex flex-col justify-between hover:shadow-md transition-all">
              <div>
                <div className="w-11 h-11 rounded-2xl bg-indigo-100 text-indigo-700 font-black text-base flex items-center justify-center mb-5">
                  03
                </div>
                <h3 className="text-base font-extrabold text-slate-900 mb-2">3. Sinh Hợp Đồng Tự Động</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Nhập thông tin hoặc chọn Master Data sẵn có để tạo hợp đồng hoàn chỉnh tự động trong 30 giây.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-[11px] font-bold text-indigo-700">
                <Zap size={15} /> Sinh dữ liệu 30s
              </div>
            </div>

            <div className="bg-white p-7 rounded-3xl border border-slate-200/90 shadow-sm relative flex flex-col justify-between hover:shadow-md transition-all">
              <div>
                <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 font-black text-base flex items-center justify-center mb-5">
                  04
                </div>
                <h3 className="text-base font-extrabold text-slate-900 mb-2">4. Xuất PDF & In A4</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Xuất file PDF chuẩn Times New Roman A4 để in ấn, trình ký và lưu trữ an toàn trong cơ sở dữ liệu.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-[11px] font-bold text-emerald-700">
                <Download size={15} /> Tải file PDF A4
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Pricing Section (#pricing) */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto scroll-mt-20">
        <div className="text-center mb-14">
          <div className="text-xs font-black text-sky-600 uppercase tracking-widest mb-1.5 flex items-center justify-center gap-1.5">
            <Award size={15} /> GÓI THƯƠNG MẠI HOÀN HẢO
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
            Bảng Giá Gói Dịch Vụ Phù Hợp Mọi Quy Mô
          </h2>
          <p className="text-sm text-slate-500 mt-2 font-medium">
            Đăng ký sử dụng miễn phí ngay lập tức hoặc nâng cấp lên gói Pro/VIP để mở khóa tính năng cao cấp.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

          {/* PLAN 1: FREE */}
          <div className="bg-white rounded-3xl p-7 border border-slate-200 flex flex-col justify-between shadow-sm hover:shadow-md transition-all">
            <div>
              <div className="text-xs font-black text-slate-500 uppercase tracking-wider">Gói Trải Nghiệm</div>
              <h3 className="text-2xl font-black mt-1 text-slate-900">FREE</h3>
              <div className="my-4 flex items-baseline gap-1">
                <span className="text-4xl font-black text-slate-900">0đ</span>
                <span className="text-xs text-slate-500 font-bold">/ vĩnh viễn</span>
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
          <div className="bg-white rounded-3xl p-7 border border-slate-200 flex flex-col justify-between shadow-sm hover:shadow-md transition-all">
            <div>
              <div className="text-xs font-black text-sky-600 uppercase tracking-wider">Gói Doanh Nghiệp</div>
              <h3 className="text-2xl font-black mt-1 text-slate-900">BASIC</h3>
              <div className="my-4 flex items-baseline gap-1">
                <span className="text-4xl font-black text-sky-600">199.000đ</span>
                <span className="text-xs text-slate-500 font-bold">/ tháng</span>
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
                  <Check size={16} className="text-emerald-500 shrink-0" /> Khóa về 2 mẫu nếu hết hạn
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
                <span className="text-4xl font-black text-sky-600">299.000đ</span>
                <span className="text-xs text-slate-500 font-bold">/ tháng</span>
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
                  <Check size={16} className="text-emerald-500 shrink-0" /> Thời hạn 30 ngày (Gia hạn tự động)
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
          <div className="bg-gradient-to-b from-white to-purple-50/50 rounded-3xl p-7 border border-purple-200 flex flex-col justify-between shadow-sm hover:shadow-md transition-all">
            <div>
              <div className="text-xs font-black text-purple-600 uppercase tracking-wider flex items-center gap-1">
                <Crown size={15} className="text-purple-600 shrink-0" /> Gói VIP
              </div>
              <h3 className="text-2xl font-black mt-1 text-slate-900">VIP UNLIMITED</h3>
              <div className="my-4 flex items-baseline gap-1">
                <span className="text-4xl font-black text-purple-600">999.000đ</span>
                <span className="text-xs text-slate-500 font-bold">/ tháng</span>
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

      {/* 5. Footer */}
      <footer className="bg-slate-950 text-slate-400 pt-16 pb-12 px-4 sm:px-6 lg:px-8 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto">
          {/* Main Footer Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800/80">
            
            {/* Col 1: Brand & Contact Info (Spans 2 cols on lg) */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <img src="/logo.png" alt="FlexiDoc Logo" className="w-10 h-10 object-contain" />
                <div>
                  <h4 className="text-base font-black text-white tracking-wide">FlexiDoc SaaS Platform</h4>
                  <p className="text-[11px] text-sky-400 font-medium">Hệ Thống Quản Lý & Số Hóa Hợp Đồng Thông Minh</p>
                </div>
              </div>

              <p className="text-slate-400 text-xs leading-relaxed max-w-md">
                Giải pháp phần mềm tối ưu hóa toàn bộ quy trình tạo, duyệt, lưu trữ và ký số hợp đồng dành cho doanh nghiệp và các tổ chức đa chi nhánh. Bảo mật dữ liệu tuyệt đối theo tiêu chuẩn mã hóa quốc tế.
              </p>

              <div className="space-y-2.5 pt-2 text-slate-300">
                <div className="flex items-center gap-2.5">
                  <Phone size={14} className="text-sky-400 shrink-0" />
                  <span>Hotline: <strong className="text-white">0846002611</strong></span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Mail size={14} className="text-sky-400 shrink-0" />
                  <span>Email Hỗ Trợ: <strong className="text-white">dovankhoa091@gmail.com</strong></span>
                </div>
              </div>
            </div>

            {/* Col 2: Tính Năng Nổi Bật */}
            <div>
              <h5 className="text-xs font-extrabold uppercase tracking-wider text-white mb-4 flex items-center gap-1.5">
                <Zap size={14} className="text-sky-400" /> Tính Năng Nổi Bật
              </h5>
              <ul className="space-y-2.5 text-slate-400 p-0 m-0 list-none">
                <li>
                  <button type="button" onClick={() => scrollToSection('features')} className="hover:text-sky-400 transition-colors flex items-center gap-1.5 bg-transparent border-none p-0 cursor-pointer text-slate-400">
                    <ChevronRight size={12} className="text-slate-600" /> Quản lý mẫu hợp đồng Word
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => scrollToSection('features')} className="hover:text-sky-400 transition-colors flex items-center gap-1.5 bg-transparent border-none p-0 cursor-pointer text-slate-400">
                    <ChevronRight size={12} className="text-slate-600" /> Trích xuất biến động tự động
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => scrollToSection('features')} className="hover:text-sky-400 transition-colors flex items-center gap-1.5 bg-transparent border-none p-0 cursor-pointer text-slate-400">
                    <ChevronRight size={12} className="text-slate-600" /> Phân quyền tổ chức đa cấp
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => scrollToSection('features')} className="hover:text-sky-400 transition-colors flex items-center gap-1.5 bg-transparent border-none p-0 cursor-pointer text-slate-400">
                    <ChevronRight size={12} className="text-slate-600" /> Xuất file PDF chuẩn A4 sắc nét
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => scrollToSection('features')} className="hover:text-sky-400 transition-colors flex items-center gap-1.5 bg-transparent border-none p-0 cursor-pointer text-slate-400">
                    <ChevronRight size={12} className="text-slate-600" /> Nhật ký kiểm toán & vết thao tác
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 3: Gói Dịch Vụ */}
            <div>
              <h5 className="text-xs font-extrabold uppercase tracking-wider text-white mb-4 flex items-center gap-1.5">
                <Crown size={14} className="text-amber-400" /> Gói Dịch Vụ
              </h5>
              <ul className="space-y-2.5 text-slate-400 p-0 m-0 list-none">
                <li>
                  <button type="button" onClick={() => scrollToSection('pricing')} className="hover:text-sky-400 transition-colors flex items-center gap-1.5 bg-transparent border-none p-0 cursor-pointer text-slate-400">
                    <ChevronRight size={12} className="text-slate-600" /> Gói Miễn Phí (Starter)
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => scrollToSection('pricing')} className="hover:text-sky-400 transition-colors flex items-center gap-1.5 bg-transparent border-none p-0 cursor-pointer text-slate-400">
                    <ChevronRight size={12} className="text-slate-600" /> Gói Chuyên Nghiệp (Pro)
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => scrollToSection('pricing')} className="hover:text-sky-400 transition-colors flex items-center gap-1.5 bg-transparent border-none p-0 cursor-pointer text-slate-400">
                    <ChevronRight size={12} className="text-slate-600" /> Gói Doanh Nghiệp (VIP)
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => scrollToSection('pricing')} className="hover:text-sky-400 transition-colors flex items-center gap-1.5 bg-transparent border-none p-0 cursor-pointer text-slate-400">
                    <ChevronRight size={12} className="text-slate-600" /> Giải pháp Enterprise Custom
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => scrollToSection('pricing')} className="hover:text-sky-400 transition-colors flex items-center gap-1.5 bg-transparent border-none p-0 cursor-pointer text-slate-400">
                    <ChevronRight size={12} className="text-slate-600" /> Bảng giá & Ưu đãi tổ chức
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 4: Hỗ Trợ & Pháp Lý */}
            <div>
              <h5 className="text-xs font-extrabold uppercase tracking-wider text-white mb-4 flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-400" /> Hỗ Trợ & Pháp Lý
              </h5>
              <ul className="space-y-2.5 text-slate-400 p-0 m-0 list-none">
                <li>
                  <a href="mailto:dovankhoa091@gmail.com" className="hover:text-sky-400 transition-colors flex items-center gap-1.5 text-slate-400">
                    <ChevronRight size={12} className="text-slate-600" /> Trung tâm hỗ trợ 24/7
                  </a>
                </li>
                <li>
                  <a href="/privacy" className="hover:text-sky-400 transition-colors flex items-center gap-1.5 text-slate-400">
                    <ChevronRight size={12} className="text-slate-600" /> <strong>Chính sách bảo mật (Privacy)</strong>
                  </a>
                </li>
                <li>
                  <a href="/terms" className="hover:text-sky-400 transition-colors flex items-center gap-1.5 text-slate-400">
                    <ChevronRight size={12} className="text-slate-600" /> <strong>Điều khoản sử dụng (Terms)</strong>
                  </a>
                </li>
              </ul>
            </div>

          </div>

          {/* Bottom Bar */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
              <span>© 2026 FlexiDoc Platform (https://flexidoc.io.vn). Bảo lưu mọi quyền. Mã hóa SSL 256-Bit chuẩn Quốc Tế.</span>
            </div>

            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1 text-slate-400">
                <Globe size={13} className="text-sky-400" /> Việt Nam (Tiếng Việt)
              </span>
            </div>
          </div>

        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={handleCloseAuthModal}
        defaultTab={authDefaultTab}
      />
    </div>
  );
};
