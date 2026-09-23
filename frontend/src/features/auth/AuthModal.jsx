import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../app/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Mail,
  Lock,
  User,
  Building2,
  Users,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Eye,
  EyeOff,
  Check,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  FileText,
  HelpCircle
} from 'lucide-react';

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" className="inline-block shrink-0">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
  </svg>
);

const showcaseSlides = [
  {
    badge: "Số Hóa Hợp Đồng Word",
    title: "Số Hóa Hợp Đồng Word Thông Minh",
    desc: "Giữ nguyên 100% định dạng Word gốc, tự động trích xuất biến thông minh & xuất file PDF A4 chuẩn sắc nét.",
    authorName: "FlexiDoc AI Engine",
    authorRole: "Giải Pháp Số Hóa Hợp Đồng",
    avatar: "/logo.png",
    bgImage: "/auth_illustration.png",
  },
  {
    badge: "Phân Quyền Doanh Nghiệp",
    title: "Phân Quyền & Quản Lý Tổ Chức",
    desc: "Dễ dàng phân quyền Quản trị viên, quản lý danh sách nhân sự và tạo mã gia nhập nhóm làm việc tiện lợi.",
    authorName: "FlexiDoc Enterprise",
    authorRole: "Quản Trị Doanh Nghiệp Multi-tenant",
    avatar: "/logo.png",
    bgImage: "/auth_illustration_2.png",
  },
  {
    badge: "Bảo Mật Chuẩn Đám Mây",
    title: "Bảo Mật & Lưu Trữ Tập Trung",
    desc: "Lưu trữ dữ liệu hợp đồng tập trung mã hóa, bảo mật tối đa và tra cứu lịch sử thay đổi 24/7.",
    authorName: "FlexiDoc Cloud",
    authorRole: "Nền Tảng Đám Mây An Toàn",
    avatar: "/logo.png",
    bgImage: "/auth_illustration_3.png",
  }
];

export const AuthModal = ({ isOpen, onClose, defaultTab = 'login' }) => {
  const { login, register, loginWithGoogle, setupGoogleOrg, checkOrgCode } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(defaultTab); // 'login' | 'register'
  const [registerMode, setRegisterMode] = useState('NEW_ORG'); // 'NEW_ORG' | 'JOIN_ORG'
  const [showPassword, setShowPassword] = useState(false);
  const [lang, setLang] = useState('VI'); // 'VI' | 'EN'
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slideAnimClass, setSlideAnimClass] = useState('animate-slide-next');
  const [forgotModalOpen, setForgotModalOpen] = useState(false);

  // Google User Onboarding Setup State
  const [googleOrgSetupUser, setGoogleOrgSetupUser] = useState(null);
  const [googleOrgMode, setGoogleOrgMode] = useState('NEW_ORG');
  const [googleOrgName, setGoogleOrgName] = useState('');
  const [googleOrgCode, setGoogleOrgCode] = useState('');

  // Form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regOrgName, setRegOrgName] = useState('');
  const [regOrgCode, setRegOrgCode] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Real-time Org Code Validation States
  const [googleOrgCodeCheck, setGoogleOrgCodeCheck] = useState({ checking: false, exists: null, orgName: '' });
  const [regOrgCodeCheck, setRegOrgCodeCheck] = useState({ checking: false, exists: null, orgName: '' });

  // Reset tab when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
      setErrorMessage('');
    }
  }, [isOpen, defaultTab]);

  // Debounced check for Google Org Code
  useEffect(() => {
    if (!googleOrgCode.trim()) {
      setGoogleOrgCodeCheck({ checking: false, exists: null, orgName: '' });
      return;
    }
    setGoogleOrgCodeCheck(prev => ({ ...prev, checking: true }));
    const timer = setTimeout(async () => {
      try {
        const res = await checkOrgCode(googleOrgCode);
        setGoogleOrgCodeCheck({ checking: false, exists: res.exists, orgName: res.orgName || '' });
      } catch (e) {
        setGoogleOrgCodeCheck({ checking: false, exists: null, orgName: '' });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [googleOrgCode]);

  // Debounced check for Regular Register Org Code
  useEffect(() => {
    if (!regOrgCode.trim()) {
      setRegOrgCodeCheck({ checking: false, exists: null, orgName: '' });
      return;
    }
    setRegOrgCodeCheck(prev => ({ ...prev, checking: true }));
    const timer = setTimeout(async () => {
      try {
        const res = await checkOrgCode(regOrgCode);
        setRegOrgCodeCheck({ checking: false, exists: res.exists, orgName: res.orgName || '' });
      } catch (e) {
        setRegOrgCodeCheck({ checking: false, exists: null, orgName: '' });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [regOrgCode]);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  // Lock body scroll when AuthModal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleNextSlide = () => {
    setSlideAnimClass('animate-slide-next');
    setCurrentSlide((prev) => (prev + 1) % showcaseSlides.length);
  };

  const handlePrevSlide = () => {
    setSlideAnimClass('animate-slide-prev');
    setCurrentSlide((prev) => (prev - 1 + showcaseSlides.length) % showcaseSlides.length);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);
    try {
      await login(loginEmail, loginPassword);
      onClose();
      navigate('/dashboard');
    } catch (err) {
      setErrorMessage(err.message || 'Đăng nhập thất bại.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (registerMode === 'NEW_ORG') {
      if (!regOrgName.trim()) {
        setErrorMessage('Vui lòng nhập Tên Công Ty / Tổ Chức.');
        return;
      }
      if (!regOrgCode.trim()) {
        setErrorMessage('Vui lòng nhập Mã Tổ Chức khi tạo mới.');
        return;
      }
      if (regOrgCodeCheck.exists) {
        setErrorMessage(`Mã Tổ chức '${regOrgCode.trim().toUpperCase()}' đã tồn tại! Vui lòng chọn Mã Tổ chức khác.`);
        return;
      }
    }
    if (registerMode === 'JOIN_ORG') {
      if (!regOrgCode.trim()) {
        setErrorMessage('Vui lòng nhập Mã Tổ Chức để gia nhập.');
        return;
      }
      if (regOrgCodeCheck.exists === false) {
        setErrorMessage(`Không tìm thấy Mã Tổ chức '${regOrgCode.trim().toUpperCase()}'. Vui lòng kiểm tra lại mã từ Quản trị viên!`);
        return;
      }
    }

    setLoading(true);
    try {
      await register({
        fullName: regFullName,
        email: regEmail,
        password: regPassword,
        mode: registerMode,
        organizationName: regOrgName,
        orgCode: regOrgCode,
      });
      onClose();
      navigate('/dashboard');
    } catch (err) {
      const msg = err.message || 'Đăng ký thất bại.';
      if (msg.includes('đã tồn tại') || msg.includes('đã được đăng ký') || msg.includes('trùng lặp')) {
        setLoginEmail(regEmail);
        setActiveTab('login');
        setErrorMessage('Email này đã có tài khoản trên hệ thống. Đã chuyển sang màn hình Đăng Nhập!');
      } else {
        setErrorMessage(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const executeGoogleAuth = async (googleEmail, googleName, accessToken, googleSub) => {
    setErrorMessage('');
    setLoading(true);
    try {
      const res = await loginWithGoogle({
        email: googleEmail || undefined,
        fullName: googleName || (googleEmail ? googleEmail.split('@')[0] : undefined),
        googleId: googleSub || undefined,
        accessToken: accessToken || undefined,
      });

      const responseData = res?.data || res;
      if (responseData && responseData.requiresOrgSetup) {
        setGoogleOrgSetupUser(responseData.user);
      } else if (responseData && (responseData.token || res?.token)) {
        onClose();
        navigate('/dashboard');
      } else {
        setErrorMessage('Đăng nhập không thành công. Vui lòng thử lại.');
      }
    } catch (err) {
      console.error('executeGoogleAuth error:', err);
      setErrorMessage(err.message || 'Đăng nhập Google thất bại.');
    } finally {
      setLoading(false);
    }
  };

  // Check for access_token in URL hash (Redirect/Popup Flow Callback)
  useEffect(() => {
    const handleHashAuth = async () => {
      if (window.location.hash && window.location.hash.includes('access_token=')) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const state = hashParams.get('state');

        const isPopup = state === 'is_popup_1' || Boolean(window.opener) || window.name === 'FlexiDocGoogleAuthPopup';

        if (accessToken) {
          window.history.replaceState(null, '', window.location.pathname);

          // Broadcast token to main window via BroadcastChannel
          try {
            const channel = new BroadcastChannel('flexidoc_oauth_channel');
            channel.postMessage({ type: 'GOOGLE_OAUTH_TOKEN', accessToken });
            channel.close();
          } catch (e) {
            console.warn('BroadcastChannel error:', e);
          }

          // Broadcast token to main window via window.opener
          if (window.opener && window.opener !== window) {
            try {
              window.opener.postMessage({ type: 'GOOGLE_OAUTH_TOKEN', accessToken }, '*');
            } catch (e) { }
          }

          // Broadcast token to main window via localStorage signal
          localStorage.setItem('flexidoc_pending_google_token', accessToken);
          localStorage.removeItem('flexidoc_pending_google_token');

          // If running inside popup window, force close immediately!
          if (isPopup) {
            document.body.style.display = 'none';
            window.close();
            setTimeout(() => {
              window.close();
            }, 100);
            return;
          }

          // Direct full-page redirect flow
          await executeGoogleAuth(null, null, accessToken, null);
        }
      }
    };
    handleHashAuth();
  }, []);

  // Listen for Google Auth token from Popup via BroadcastChannel, postMessage & storage events
  useEffect(() => {
    let channel;

    const processToken = async (token) => {
      if (token) {
        await executeGoogleAuth(null, null, token, null);
      }
    };

    // 1. BroadcastChannel listener
    try {
      channel = new BroadcastChannel('flexidoc_oauth_channel');
      channel.onmessage = (event) => {
        if (event.data && event.data.type === 'GOOGLE_OAUTH_TOKEN' && event.data.accessToken) {
          processToken(event.data.accessToken);
        }
      };
    } catch (e) { }

    // 2. postMessage listener
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'GOOGLE_OAUTH_TOKEN' && event.data.accessToken) {
        processToken(event.data.accessToken);
      }
    };
    window.addEventListener('message', handleMessage);

    // 3. Storage event listener
    const handleStorage = (event) => {
      if (event.key === 'flexidoc_pending_google_token' && event.newValue) {
        processToken(event.newValue);
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      if (channel) channel.close();
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);



  const handleGoogleClick = () => {
    setErrorMessage('');
    if (!googleClientId) {
      setErrorMessage('Chưa cấu hình Google Client ID.');
      return;
    }

    // Standard Google OAuth2 Endpoint (100% cross-browser popup & redirect compatibility)
    const redirectUri = window.location.origin + '/login';
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=email%20profile&prompt=select_account&state=is_popup_1`;

    const width = 520;
    const height = 650;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      googleAuthUrl,
      'FlexiDocGoogleAuthPopup',
      `width=${width},height=${height},top=${top},left=${left},scrollbars=yes,status=1`
    );

    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      window.location.href = googleAuthUrl;
    }
  };

  const handleGoogleOrgSetupSubmit = async (e) => {
    e.preventDefault();
    if (!googleOrgSetupUser) return;
    setErrorMessage('');

    if (googleOrgMode === 'NEW_ORG' && googleOrgCodeCheck.exists) {
      setErrorMessage(`Mã Tổ chức '${googleOrgCode.trim().toUpperCase()}' đã tồn tại! Vui lòng chọn Mã Tổ chức khác.`);
      return;
    }
    if (googleOrgMode === 'JOIN_ORG' && googleOrgCodeCheck.exists === false && googleOrgCode.trim()) {
      setErrorMessage(`Không tìm thấy Mã Tổ chức '${googleOrgCode.trim().toUpperCase()}'. Vui lòng kiểm tra lại mã từ Quản trị viên!`);
      return;
    }

    setLoading(true);
    try {
      await setupGoogleOrg({
        userId: googleOrgSetupUser._id || googleOrgSetupUser.id,
        email: googleOrgSetupUser.email,
        mode: googleOrgMode,
        organizationName: googleOrgName,
        orgCode: googleOrgCode,
      });
      setGoogleOrgSetupUser(null);
      onClose();
      navigate('/dashboard');
    } catch (err) {
      setErrorMessage(err.message || 'Thiết lập Tổ chức thất bại.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const currentSlideData = showcaseSlides[currentSlide];

  return createPortal(
    <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-md p-2 sm:p-4 flex items-center justify-center overflow-hidden select-none pointer-events-auto">
      {/* Outer Card Container */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-w-[880px] w-full max-h-[92vh] md:max-h-[86vh] bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200/60 grid grid-cols-1 md:grid-cols-2 relative animate-modal-pop select-text pointer-events-auto my-auto"
      >

        {/* LEFT COLUMN: Contract Management Branding Banner */}
        <div
          key={`slide-bg-${currentSlide}`}
          className="relative min-h-[200px] md:min-h-0 md:h-full p-4 md:p-5 flex flex-col justify-between text-white overflow-hidden rounded-2xl m-2 shadow-inner transition-all duration-500 animate-bg-zoom"
          style={{
            background: `linear-gradient(180deg, rgba(15, 23, 42, 0.45) 0%, rgba(15, 23, 42, 0.92) 100%), url("${currentSlideData.bgImage}")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Top Header Pill Controls */}
          <div className="flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="FlexiDoc Logo" className="w-7 h-7 object-contain" />
              <span className="text-base font-black tracking-tight text-white drop-shadow-sm">FlexiDoc</span>
            </div>
          </div>

          {/* Center Dynamic Content */}
          <div key={`slide-content-${currentSlide}`} className={`my-auto py-2.5 z-10 ${slideAnimClass}`}>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 backdrop-blur-md text-sky-200 text-[10.5px] font-bold mb-2 border border-white/20">
              <Sparkles size={12} className="text-amber-300" /> {currentSlideData.badge}
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight leading-snug mb-1.5 drop-shadow-md">
              {currentSlideData.title}
            </h2>
            <p className="text-xs text-slate-200 leading-relaxed font-normal max-w-xs drop-shadow-sm">
              {currentSlideData.desc}
            </p>
          </div>

          {/* Bottom Showcase Footer */}
          <div className="flex items-center justify-between pt-2.5 border-t border-white/15 z-10">
            <div key={`slide-author-${currentSlide}`} className={`flex items-center gap-2.5 ${slideAnimClass}`}>
              <img
                src={currentSlideData.avatar}
                alt="Avatar"
                className="w-8 h-8 rounded-full border border-white/30 object-cover shadow-md bg-slate-900"
              />
              <div>
                <h4 className="text-[11.5px] font-bold text-white tracking-wide">{currentSlideData.authorName}</h4>
                <p className="text-[10px] text-slate-300">{currentSlideData.authorRole}</p>
              </div>
            </div>

            {/* Carousel Arrows */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevSlide}
                className="w-7 h-7 rounded-full border border-white/25 bg-black/20 hover:bg-white/20 flex items-center justify-center text-white transition-all cursor-pointer active:scale-95"
                title="Slide trước"
              >
                <ChevronLeft size={15} />
              </button>
              <button
                type="button"
                onClick={handleNextSlide}
                className="w-7 h-7 rounded-full border border-white/25 bg-black/20 hover:bg-white/20 flex items-center justify-center text-white transition-all cursor-pointer active:scale-95"
                title="Slide tiếp"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Clean Contract Form Panel */}
        <div className="p-3.5 sm:p-5 md:p-5 flex flex-col justify-between bg-white relative overflow-y-auto md:overflow-hidden max-h-[88vh] md:max-h-none">
          {/* Top Controls Bar: Logo text / Language Selector & Close Button */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="FlexiDoc Logo" className="w-8 h-8 object-contain" />
              <span className="text-lg font-black tracking-tight text-slate-900">FlexiDoc</span>
            </div>

            <div className="flex items-center gap-2">
              {/* Language Switcher */}
              <button
                type="button"
                onClick={() => setLang(lang === 'VI' ? 'EN' : 'VI')}
                className="px-2.5 py-1 rounded-full border border-slate-200 hover:border-slate-300 bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                title="Chuyển đổi ngôn ngữ"
              >
                <span>{lang === 'VI' ? 'VN' : 'EN'}</span>
              </button>

              {/* Close Modal Button */}
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900 flex items-center justify-center transition-all cursor-pointer"
                title="Đóng Modal"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* GOOGLE ORG ONBOARDING STEP */}
          {googleOrgSetupUser ? (
            <div className="animate-fade-in flex flex-col justify-between h-full py-2">
              <div>
                <div className="mb-5">
                  <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full text-xs text-emerald-800 font-bold mb-2">
                    <Check size={14} className="text-emerald-600" /> Đã xác thực thành công với Google
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-1">
                    Thiết Lập Tổ Chức
                  </h3>
                  <p className="text-xs text-slate-500">
                    Chào <span className="font-bold text-slate-800">{googleOrgSetupUser.fullName}</span> ({googleOrgSetupUser.email}). Vui lòng chọn cách thiết lập tổ chức để bắt đầu:
                  </p>
                </div>

                {errorMessage && (
                  <div className="animate-fade-in bg-red-50 border border-red-300 p-3 rounded-2xl text-xs text-red-800 mb-4 flex items-center gap-2 font-medium">
                    <AlertCircle size={16} className="shrink-0" /> {errorMessage}
                  </div>
                )}

                <form onSubmit={handleGoogleOrgSetupSubmit} className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div
                      onClick={() => setGoogleOrgMode('NEW_ORG')}
                      className={`p-3 rounded-2xl border cursor-pointer text-center transition-all ${googleOrgMode === 'NEW_ORG'
                        ? 'border-red-500 bg-red-50/50 shadow-xs'
                        : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                        }`}
                    >
                      <Building2 size={20} className={`mx-auto mb-1 ${googleOrgMode === 'NEW_ORG' ? 'text-red-500' : 'text-slate-500'}`} />
                      <div className={`text-xs font-extrabold ${googleOrgMode === 'NEW_ORG' ? 'text-red-600' : 'text-slate-700'}`}>Tạo Tổ Chức Mới</div>
                      <span className="text-[10px] text-slate-500">Làm Quản trị viên Admin</span>
                    </div>

                    <div
                      onClick={() => setGoogleOrgMode('JOIN_ORG')}
                      className={`p-3 rounded-2xl border cursor-pointer text-center transition-all ${googleOrgMode === 'JOIN_ORG'
                        ? 'border-red-500 bg-red-50/50 shadow-xs'
                        : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                        }`}
                    >
                      <Users size={20} className={`mx-auto mb-1 ${googleOrgMode === 'JOIN_ORG' ? 'text-red-500' : 'text-slate-500'}`} />
                      <div className={`text-xs font-extrabold ${googleOrgMode === 'JOIN_ORG' ? 'text-red-600' : 'text-slate-700'}`}>Gia Nhập Bằng Mã</div>
                      <span className="text-[10px] text-slate-500">Nhân sự thành viên</span>
                    </div>
                  </div>

                  {googleOrgMode === 'NEW_ORG' ? (
                    <div className="flex flex-col gap-3">
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">
                          Tên Công Ty / Tổ Chức Mới:
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Tên Công Ty / Tổ Chức Mới "
                          value={googleOrgName}
                          onChange={(e) => setGoogleOrgName(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-xs md:text-sm focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none transition-all font-medium placeholder:text-xs placeholder:font-normal placeholder:normal-case placeholder:tracking-normal placeholder:text-slate-400"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">
                          Mã Tổ Chức <span className="text-red-500 font-bold">(Bắt buộc)</span>:
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Mã Tổ Chức (Bắt buộc, VD: CTYABC)"
                          value={googleOrgCode}
                          onChange={(e) => setGoogleOrgCode(e.target.value.toUpperCase())}
                          className={`w-full px-4 py-2.5 rounded-2xl border text-xs md:text-sm font-bold tracking-wider outline-none transition-all uppercase placeholder:text-xs placeholder:font-normal placeholder:normal-case placeholder:tracking-normal placeholder:text-slate-400 ${googleOrgCodeCheck.exists === true
                            ? 'border-red-400 bg-red-50 text-red-700'
                            : googleOrgCodeCheck.exists === false && googleOrgCode.trim()
                              ? 'border-emerald-400 bg-emerald-50 text-emerald-800'
                              : 'border-slate-200 focus:border-red-500'
                            }`}
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="text-xs font-bold text-red-600 block mb-1">
                        Mã Tổ Chức Đã Có (Bắt buộc):
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Mã Tổ Chức (Bắt buộc)"
                        value={googleOrgCode}
                        onChange={(e) => setGoogleOrgCode(e.target.value.toUpperCase())}
                        className={`w-full px-4 py-2.5 rounded-2xl border text-xs md:text-sm font-bold tracking-wider outline-none transition-all uppercase placeholder:text-xs placeholder:font-normal placeholder:normal-case placeholder:tracking-normal placeholder:text-slate-400 ${googleOrgCodeCheck.exists === false && googleOrgCode.trim()
                          ? 'border-red-400 bg-red-50 text-red-700'
                          : googleOrgCodeCheck.exists === true
                            ? 'border-emerald-400 bg-emerald-50 text-emerald-800'
                            : 'border-slate-200 focus:border-red-500'
                          }`}
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-6 rounded-2xl bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-500/25 active:scale-[0.99] transition-all cursor-pointer mt-2"
                  >
                    {loading ? 'Đang Thiết Lập...' : 'Xác Nhận & Vào Hệ Thống'} <ArrowRight size={16} />
                  </button>
                </form>
              </div>

              <div className="text-center pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setGoogleOrgSetupUser(null)}
                  className="text-xs text-slate-500 hover:text-slate-800 font-bold underline cursor-pointer"
                >
                  ← Quay lại trang đăng nhập
                </button>
              </div>
            </div>
          ) : (
            <>
              <div>
                {/* Greeting Section */}
                <div className="mb-3">
                  <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight mb-1">
                    {activeTab === 'login'
                      ? (lang === 'VI' ? 'Đăng Nhập Hệ Thống' : 'System Sign In')
                      : (lang === 'VI' ? 'Đăng Ký Tài Khoản' : 'Create Account')}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {activeTab === 'login'
                      ? (lang === 'VI' ? 'Quản lý hợp đồng, tạo biểu mẫu và trích xuất dữ liệu thông minh' : 'Manage contracts and automated workflows')
                      : (lang === 'VI' ? 'Khởi tạo không gian làm việc số cho công ty & tổ chức của bạn' : 'Set up smart contract workspace for your team')}
                  </p>
                </div>

                {/* Error Banner */}
                {errorMessage && (
                  <div className="animate-fade-in bg-red-50 border border-red-200 p-2.5 rounded-xl text-xs text-red-700 mb-3 flex items-center gap-2 font-semibold">
                    <AlertCircle size={15} className="shrink-0 text-red-500" /> {errorMessage}
                  </div>
                )}

                {/* LOGIN FORM */}
                {activeTab === 'login' && (
                  <form key="login" onSubmit={handleLoginSubmit} className="animate-tab-switch flex flex-col gap-2.5">
                    <div>
                      <input
                        type="email"
                        required
                        placeholder={lang === 'VI' ? 'Email đăng nhập' : 'Email'}
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs md:text-sm font-medium placeholder:text-xs placeholder:font-normal placeholder:normal-case placeholder:tracking-normal placeholder:text-slate-400 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none transition-all bg-white"
                      />
                    </div>

                    <div>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          placeholder={lang === 'VI' ? 'Mật khẩu' : 'Password'}
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          className="w-full px-3.5 py-2 pr-10 rounded-xl border border-slate-200 text-xs md:text-sm font-medium placeholder:text-xs placeholder:font-normal placeholder:normal-case placeholder:tracking-normal placeholder:text-slate-400 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none transition-all bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>

                      {/* Forgot Password Link */}
                      <div className="text-right mt-1">
                        <button
                          type="button"
                          onClick={() => setForgotModalOpen(true)}
                          className="text-[11px] text-red-500 hover:text-red-600 font-bold transition-colors cursor-pointer"
                        >
                          {lang === 'VI' ? 'Quên mật khẩu?' : 'Forgot password?'}
                        </button>
                      </div>
                    </div>

                    {/* Divider Line */}
                    <div className="flex items-center gap-2.5 my-0.5">
                      <div className="flex-1 h-px bg-slate-200" />
                      <span className="text-[11px] text-slate-400 font-medium">{lang === 'VI' ? 'hoặc đăng nhập với' : 'or sign in with'}</span>
                      <div className="flex-1 h-px bg-slate-200" />
                    </div>

                    {/* Google Login Button */}
                    <div className="w-full flex items-center justify-center">
                      <button
                        type="button"
                        onClick={handleGoogleClick}
                        className="w-full py-2 px-3 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer active:scale-[0.99]"
                      >
                        <GoogleIcon />
                        <span>{lang === 'VI' ? 'Tiếp tục với Google' : 'Continue with Google'}</span>
                      </button>
                    </div>

                    {/* Main Red Login Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 px-5 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-extrabold text-xs md:text-sm shadow-md shadow-red-500/25 hover:shadow-red-500/40 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 mt-0.5"
                    >
                      {loading ? (lang === 'VI' ? 'Đang Đăng Nhập...' : 'Logging in...') : (lang === 'VI' ? 'Đăng Nhập Hệ Thống' : 'Sign In')}
                    </button>
                  </form>
                )}

                {/* REGISTER FORM */}
                {activeTab === 'register' && (
                  <form key="register" onSubmit={handleRegisterSubmit} className="animate-tab-switch flex flex-col gap-1.5 md:gap-2">
                    {/* Organization Mode Selection */}
                    <div className="grid grid-cols-2 gap-2 mb-0.5">
                      <div
                        onClick={() => setRegisterMode('NEW_ORG')}
                        className={`py-1.5 px-2 rounded-xl border cursor-pointer text-center transition-all ${registerMode === 'NEW_ORG'
                          ? 'border-red-500 bg-red-50/50 text-red-600 font-bold shadow-2xs'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                          }`}
                      >
                        <div className="text-[11px] font-extrabold">{lang === 'VI' ? 'Tạo Tổ Chức Mới' : 'Create New Org'}</div>
                      </div>

                      <div
                        onClick={() => setRegisterMode('JOIN_ORG')}
                        className={`py-1.5 px-2 rounded-xl border cursor-pointer text-center transition-all ${registerMode === 'JOIN_ORG'
                          ? 'border-red-500 bg-red-50/50 text-red-600 font-bold shadow-2xs'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                          }`}
                      >
                        <div className="text-[11px] font-extrabold">{lang === 'VI' ? 'Gia Nhập Bằng Mã' : 'Join via Code'}</div>
                      </div>
                    </div>

                    {/* 2-Column Input Grid for Laptop/Desktop */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        required
                        placeholder={lang === 'VI' ? 'Họ và tên' : 'Full Name'}
                        value={regFullName}
                        onChange={(e) => setRegFullName(e.target.value)}
                        className="w-full px-3 py-1.5 md:py-2 rounded-xl border border-slate-200 text-xs font-medium placeholder:text-xs placeholder:font-normal placeholder:normal-case placeholder:tracking-normal placeholder:text-slate-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/10 outline-none transition-all bg-white"
                      />

                      <input
                        type="email"
                        required
                        placeholder={lang === 'VI' ? 'Email công việc' : 'Email'}
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        className="w-full px-3 py-1.5 md:py-2 rounded-xl border border-slate-200 text-xs font-medium placeholder:text-xs placeholder:font-normal placeholder:normal-case placeholder:tracking-normal placeholder:text-slate-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/10 outline-none transition-all bg-white"
                      />
                    </div>

                    {registerMode === 'NEW_ORG' ? (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div className="relative">
                            <input
                              type={showPassword ? 'text' : 'password'}
                              required
                              placeholder={lang === 'VI' ? 'Mật khẩu bảo mật' : 'Password'}
                              value={regPassword}
                              onChange={(e) => setRegPassword(e.target.value)}
                              className="w-full px-3 py-1.5 md:py-2 pr-9 rounded-xl border border-slate-200 text-xs font-medium placeholder:text-xs placeholder:font-normal placeholder:normal-case placeholder:tracking-normal placeholder:text-slate-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/10 outline-none transition-all bg-white"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-2.5 top-1.5 md:top-2 text-slate-400 hover:text-slate-600 p-0.5"
                            >
                              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                          </div>

                          <input
                            type="text"
                            required
                            placeholder={lang === 'VI' ? 'Tên Công Ty / Tổ Chức' : 'Organization Name'}
                            value={regOrgName}
                            onChange={(e) => setRegOrgName(e.target.value)}
                            className="w-full px-3 py-1.5 md:py-2 rounded-xl border border-slate-200 text-xs font-medium placeholder:text-xs placeholder:font-normal placeholder:normal-case placeholder:tracking-normal placeholder:text-slate-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/10 outline-none transition-all bg-white"
                          />
                        </div>

                        <div>
                          <input
                            type="text"
                            required
                            placeholder={lang === 'VI' ? 'Mã Tổ Chức (Bắt buộc, VD: CTYABC)' : 'Org Code (Required)'}
                            value={regOrgCode}
                            onChange={(e) => setRegOrgCode(e.target.value.toUpperCase())}
                            className={`w-full px-3 py-1.5 md:py-2 rounded-xl border text-xs font-bold uppercase tracking-wider placeholder:text-xs placeholder:font-normal placeholder:normal-case placeholder:tracking-normal placeholder:text-slate-400 outline-none transition-all bg-white ${
                              regOrgCodeCheck.exists === true
                                ? 'border-red-400 bg-red-50 text-red-700'
                                : regOrgCodeCheck.exists === false && regOrgCode.trim()
                                ? 'border-emerald-400 bg-emerald-50 text-emerald-800'
                                : 'border-slate-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/10'
                            }`}
                          />
                          {regOrgCodeCheck.checking && (
                            <span className="text-[10px] text-slate-400 mt-0.5 block">Đang kiểm tra mã tổ chức...</span>
                          )}
                          {regOrgCodeCheck.exists === true && (
                            <span className="text-[10px] text-red-500 font-semibold mt-0.5 block">Mã '{regOrgCode.trim()}' đã tồn tại. Vui lòng chọn mã khác.</span>
                          )}
                          {regOrgCodeCheck.exists === false && regOrgCode.trim() && (
                            <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 block">Mã '{regOrgCode.trim()}' khả dụng!</span>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            placeholder={lang === 'VI' ? 'Mật khẩu bảo mật' : 'Password'}
                            value={regPassword}
                            onChange={(e) => setRegPassword(e.target.value)}
                            className="w-full px-3 py-1.5 md:py-2 pr-9 rounded-xl border border-slate-200 text-xs font-medium placeholder:text-xs placeholder:font-normal placeholder:normal-case placeholder:tracking-normal placeholder:text-slate-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/10 outline-none transition-all bg-white"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-2.5 top-1.5 md:top-2 text-slate-400 hover:text-slate-600 p-0.5"
                          >
                            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        </div>

                        <div>
                          <input
                            type="text"
                            required
                            placeholder={lang === 'VI' ? 'Mã Tổ Chức (Bắt buộc)' : 'Required Org Code'}
                            value={regOrgCode}
                            onChange={(e) => setRegOrgCode(e.target.value.toUpperCase())}
                            className={`w-full px-3 py-1.5 md:py-2 rounded-xl border text-xs font-bold uppercase tracking-wider placeholder:text-xs placeholder:font-normal placeholder:normal-case placeholder:tracking-normal placeholder:text-slate-400 outline-none transition-all bg-white ${
                              regOrgCodeCheck.exists === false && regOrgCode.trim()
                                ? 'border-red-400 bg-red-50 text-red-700'
                                : regOrgCodeCheck.exists === true
                                ? 'border-emerald-400 bg-emerald-50 text-emerald-800'
                                : 'border-slate-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/10'
                            }`}
                          />
                          {regOrgCodeCheck.checking && (
                            <span className="text-[10px] text-slate-400 mt-0.5 block">Đang kiểm tra mã tổ chức...</span>
                          )}
                          {regOrgCodeCheck.exists === true && (
                            <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 block">Tổ chức: {regOrgCodeCheck.orgName || regOrgCode.trim()}</span>
                          )}
                          {regOrgCodeCheck.exists === false && regOrgCode.trim() && (
                            <span className="text-[10px] text-red-500 font-semibold mt-0.5 block">Mã '{regOrgCode.trim()}' không tồn tại.</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Divider Line */}
                    <div className="flex items-center gap-2.5 my-0.5">
                      <div className="flex-1 h-px bg-slate-200" />
                      <span className="text-[10px] text-slate-400 font-medium">{lang === 'VI' ? 'hoặc đăng ký với' : 'or sign up with'}</span>
                      <div className="flex-1 h-px bg-slate-200" />
                    </div>

                    {/* Google Register Button */}
                    <div className="w-full flex items-center justify-center">
                      <button
                        type="button"
                        onClick={handleGoogleClick}
                        className="w-full py-1.5 md:py-2 px-3 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-2xs cursor-pointer active:scale-[0.99]"
                      >
                        <GoogleIcon />
                        <span>{lang === 'VI' ? 'Đăng ký với Google' : 'Sign up with Google'}</span>
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2 md:py-2.5 px-5 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-extrabold text-xs shadow-md shadow-red-500/25 hover:shadow-red-500/40 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 mt-0.5"
                    >
                      {loading ? (lang === 'VI' ? 'Đang Khởi Tạo...' : 'Creating Account...') : (lang === 'VI' ? 'Tạo Tài Khoản Ngay' : 'Sign Up')}
                    </button>
                  </form>
                )}
              </div>

              {/* Bottom Footer Section */}
              <div className="text-center pt-2 mt-2 text-xs text-slate-500 font-medium">
                {activeTab === 'login' ? (
                  <>
                    {lang === 'VI' ? 'Chưa có tài khoản doanh nghiệp? ' : "Don't have an account? "}
                    <span
                      onClick={() => { setActiveTab('register'); setErrorMessage(''); }}
                      className="text-red-500 font-bold cursor-pointer hover:underline"
                    >
                      {lang === 'VI' ? 'Đăng ký ngay' : 'Sign up'}
                    </span>
                  </>
                ) : (
                  <>
                    {lang === 'VI' ? 'Đã có tài khoản? ' : 'Already have an account? '}
                    <span
                      onClick={() => { setActiveTab('login'); setErrorMessage(''); }}
                      className="text-red-500 font-bold cursor-pointer hover:underline"
                    >
                      {lang === 'VI' ? 'Đăng nhập ngay' : 'Sign in'}
                    </span>
                  </>
                )}
              </div>
            </>
          )}

          {/* FORGOT PASSWORD MODAL NOTE */}
          {forgotModalOpen && (
            <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-20 p-6 flex flex-col justify-between rounded-2xl animate-fade-in">
              <div className="text-center my-auto">
                <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-3 border border-red-100">
                  <HelpCircle size={24} />
                </div>
                <h4 className="text-lg font-black text-slate-900 mb-2">Khôi Phục Mật Khẩu</h4>
                <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto mb-4">
                  Để đảm bảo an toàn cho dữ liệu hợp đồng doanh nghiệp, vui lòng liên hệ trực tiếp với <strong>Quản trị viên (Admin)</strong> tổ chức của bạn để cài lại mật khẩu, hoặc gửi email tới <strong>dovankhoa091@gmail.com</strong>.
                </p>
                <button
                  type="button"
                  onClick={() => setForgotModalOpen(false)}
                  className="px-6 py-2.5 rounded-full bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-all cursor-pointer shadow-md"
                >
                  Đóng Hướng Dẫn
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>,
    document.body
  );
};


