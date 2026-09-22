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
  Check
} from 'lucide-react';

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" className="inline-block shrink-0">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
  </svg>
);

export const AuthModal = ({ isOpen, onClose, defaultTab = 'login' }) => {
  const { login, register, loginWithGoogle, setupGoogleOrg, checkOrgCode } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(defaultTab); // 'login' | 'register'
  const [registerMode, setRegisterMode] = useState('NEW_ORG'); // 'NEW_ORG' | 'JOIN_ORG'
  const [showPassword, setShowPassword] = useState(false);

  // Google OAuth Modal & Setup State
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');

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

  // Initialize Official Google Identity Services SDK if Client ID is configured
  useEffect(() => {
    if ((isOpen || showGoogleModal) && googleClientId) {
      const initGoogleGIS = () => {
        if (!window.google?.accounts?.id) return;
        try {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: (response) => {
              if (response.credential) {
                try {
                  const base64Url = response.credential.split('.')[1];
                  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                  const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
                  const payload = JSON.parse(jsonPayload);
                  if (payload && payload.email) {
                    executeGoogleAuth(payload.email, payload.name || payload.given_name);
                  }
                } catch (e) {
                  console.error("JWT parse error", e);
                }
              }
            }
          });

          const btnContainer = document.getElementById('official-google-btn-slot');
          if (btnContainer) {
            btnContainer.innerHTML = '';
            window.google.accounts.id.renderButton(btnContainer, {
              theme: 'outline',
              size: 'large',
              width: 320,
              text: 'signin_with',
              locale: 'vi'
            });
          }
        } catch (err) {
          console.warn('Google GIS Notice:', err);
        }
      };

      initGoogleGIS();
      const timer = setTimeout(initGoogleGIS, 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen, showGoogleModal, googleClientId]);

  const handleOpenGoogle = () => {
    setShowGoogleModal(true);
    if (window.google?.accounts?.id && googleClientId) {
      try {
        window.google.accounts.id.prompt();
      } catch (e) {
        console.warn(e);
      }
    }
  };

  // Lock body scroll when AuthModal is open to completely block background interaction
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

  if (!isOpen) return null;

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

    if (registerMode === 'NEW_ORG' && regOrgCodeCheck.exists) {
      setErrorMessage(`Mã Tổ chức '${regOrgCode.trim().toUpperCase()}' đã tồn tại! Vui lòng chọn Mã Tổ chức khác.`);
      return;
    }
    if (registerMode === 'JOIN_ORG' && regOrgCodeCheck.exists === false && regOrgCode.trim()) {
      setErrorMessage(`Không tìm thấy Mã Tổ chức '${regOrgCode.trim().toUpperCase()}'. Vui lòng kiểm tra lại mã từ Quản trị viên!`);
      return;
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
      setErrorMessage(err.message || 'Đăng ký thất bại.');
    } finally {
      setLoading(false);
    }
  };

  const executeGoogleAuth = async (googleEmail, googleName) => {
    if (!googleEmail) return;
    setErrorMessage('');
    setLoading(true);
    try {
      const res = await loginWithGoogle({
        email: googleEmail,
        fullName: googleName || googleEmail.split('@')[0],
        googleId: 'GOOGLE_' + Math.random().toString(36).substring(2),
      });
      setShowGoogleModal(false);

      if (res.data && res.data.requiresOrgSetup) {
        setGoogleOrgSetupUser(res.data.user);
      } else {
        onClose();
        navigate('/dashboard');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Đăng nhập Google thất bại.');
      setShowGoogleModal(false);
    } finally {
      setLoading(false);
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
        userId: googleOrgSetupUser._id,
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

  return createPortal(
    <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-md p-4 flex items-center justify-center animate-backdrop overflow-hidden select-none pointer-events-auto">
      {/* Outer Card Container */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className="max-w-[920px] w-[95vw] max-h-[92vh] bg-slate-900 p-3 rounded-[28px] overflow-hidden grid grid-cols-1 md:grid-cols-[46%_54%] gap-3 shadow-2xl border border-white/15 animate-modal-pop select-text pointer-events-auto"
      >

        {/* LEFT COLUMN: Modern 3D Graphic Panel */}
        <div
          className="relative rounded-2xl p-8 flex flex-col justify-between text-white overflow-hidden shadow-inner animate-float-bg"
          style={{
            background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.3) 0%, rgba(15, 23, 42, 0.85) 100%), url("/auth_illustration.png")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Top Logo Overlay */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/95 flex items-center justify-center shadow-lg backdrop-blur-sm">
              <Briefcase size={22} className="text-sky-600" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-wider leading-tight">
                FlexiDoc
              </h2>
              <span className="text-[11px] text-sky-300 font-bold uppercase tracking-widest">
                Hệ Thống Số Hóa Hợp Đồng
              </span>
            </div>
          </div>

          {/* Bottom Features Glass Overlay */}
          <div className="bg-slate-900/65 backdrop-blur-md p-5 rounded-2xl border border-white/20 shadow-xl">
            <div className="text-sm font-extrabold mb-2 text-white flex items-center gap-2">
              <Sparkles size={18} className="text-sky-400" /> Quản Lý Hợp Đồng Thông Minh
            </div>
            <p className="text-xs text-sky-100 leading-relaxed m-0">
              Giữ nguyên 100% định dạng Word gốc. Xuất A4 PDF sắc nét & phân quyền tổ chức dễ dàng.
            </p>

            <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-white/15">
              <div className="text-[12px] text-sky-50 flex items-center gap-2 font-semibold">
                <CheckCircle2 size={15} className="text-emerald-400" /> Tự động trích xuất biến thông minh
              </div>
              <div className="text-[12px] text-sky-50 flex items-center gap-2 font-semibold">
                <CheckCircle2 size={15} className="text-emerald-400" /> Tạo mã gia nhập nhân viên nhanh chóng
              </div>
              <div className="text-[12px] text-sky-50 flex items-center gap-2 font-semibold">
                <CheckCircle2 size={15} className="text-emerald-400" /> Đăng nhập bằng Google linh hoạt
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Form Card */}
        <div className="bg-white rounded-2xl p-7 md:p-8 flex flex-col justify-between relative overflow-y-auto">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900 rounded-full w-9 h-9 flex items-center justify-center transition-all cursor-pointer z-10"
            title="Đóng Modal"
          >
            <X size={18} />
          </button>

          {/* ONBOARDING STEP FOR GOOGLE SIGN-IN USER */}
          {googleOrgSetupUser ? (
            <div className="animate-fade-in flex flex-col justify-between h-full">
              <div>
                <div className="text-center mb-6">
                  <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full text-xs text-emerald-800 font-bold mb-3">
                    <Check size={14} className="text-emerald-600" /> Đã đăng nhập bằng Google
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-1">
                    Thiết Lập Tổ Chức
                  </h3>
                  <p className="text-xs text-slate-500">
                    Chào <span className="font-bold text-slate-800">{googleOrgSetupUser.fullName}</span> ({googleOrgSetupUser.email}). Vui lòng chọn cách thiết lập Tổ chức:
                  </p>
                </div>

                {errorMessage && (
                  <div className="animate-fade-in bg-red-50 border border-red-300 p-3 rounded-xl text-xs text-red-800 mb-4 flex items-center gap-2">
                    <AlertCircle size={16} className="shrink-0" /> {errorMessage}
                  </div>
                )}

                <form onSubmit={handleGoogleOrgSetupSubmit} className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div
                      onClick={() => setGoogleOrgMode('NEW_ORG')}
                      className={`p-3.5 rounded-xl border cursor-pointer text-center transition-all ${googleOrgMode === 'NEW_ORG'
                        ? 'border-sky-600 bg-sky-50 shadow-sm'
                        : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                        }`}
                    >
                      <Building2 size={20} className={`mx-auto mb-1 ${googleOrgMode === 'NEW_ORG' ? 'text-sky-600' : 'text-slate-500'}`} />
                      <div className={`text-xs font-extrabold ${googleOrgMode === 'NEW_ORG' ? 'text-sky-600' : 'text-slate-700'}`}>Tạo Tổ Chức Mới</div>
                      <span className="text-[10px] text-slate-500">Làm chủ Quản trị (Admin)</span>
                    </div>

                    <div
                      onClick={() => setGoogleOrgMode('JOIN_ORG')}
                      className={`p-3.5 rounded-xl border cursor-pointer text-center transition-all ${googleOrgMode === 'JOIN_ORG'
                        ? 'border-sky-600 bg-sky-50 shadow-sm'
                        : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                        }`}
                    >
                      <Users size={20} className={`mx-auto mb-1 ${googleOrgMode === 'JOIN_ORG' ? 'text-sky-600' : 'text-slate-500'}`} />
                      <div className={`text-xs font-extrabold ${googleOrgMode === 'JOIN_ORG' ? 'text-sky-600' : 'text-slate-700'}`}>Gia Nhập Bằng Mã</div>
                      <span className="text-[10px] text-slate-500">Nhân sự thành viên</span>
                    </div>
                  </div>

                  {googleOrgMode === 'NEW_ORG' ? (
                    <div className="flex flex-col gap-3">
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">
                          Tên Công Ty / Tổ Chức Mới:
                        </label>
                        <div className="relative">
                          <Building2 size={18} className="absolute left-3.5 top-3 text-slate-400" />
                          <input
                            type="text"
                            required
                            placeholder="VD: Công Ty TNHH May Vina"
                            value={googleOrgName}
                            onChange={(e) => setGoogleOrgName(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-sky-500 outline-none transition-all font-medium"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">
                          Mã Tổ Chức <span className="text-slate-400 font-normal">(Tùy chọn, tự động tạo nếu bỏ trống)</span>:
                        </label>
                        <div className="relative">
                          <Building2 size={18} className="absolute left-3.5 top-3 text-sky-600" />
                          <input
                            type="text"
                            placeholder="VD: ORG-MAYVINA (Tự tạo nếu để trống)"
                            value={googleOrgCode}
                            onChange={(e) => setGoogleOrgCode(e.target.value.toUpperCase())}
                            className={`w-full pl-11 pr-4 py-2.5 rounded-xl border text-sm font-bold tracking-wider outline-none transition-all uppercase ${googleOrgCodeCheck.exists === true
                              ? 'border-red-400 bg-red-50 focus:ring-red-400 text-red-700'
                              : googleOrgCodeCheck.exists === false && googleOrgCode.trim()
                                ? 'border-emerald-400 bg-emerald-50 focus:ring-emerald-400 text-emerald-800'
                                : 'border-slate-200 focus:ring-sky-500'
                              }`}
                          />
                        </div>
                        {googleOrgCodeCheck.checking && (
                          <span className="text-[11px] text-slate-400 font-medium mt-1 block">⏳ Đang kiểm tra mã tổ chức...</span>
                        )}
                        {!googleOrgCodeCheck.checking && googleOrgCodeCheck.exists === true && (
                          <span className="text-[11px] text-red-600 font-bold mt-1 flex items-center gap-1">
                            <AlertCircle size={13} className="shrink-0" /> Mã '{googleOrgCode}' đã được sử dụng! Vui lòng chọn mã khác.
                          </span>
                        )}
                        {!googleOrgCodeCheck.checking && googleOrgCodeCheck.exists === false && googleOrgCode.trim() && (
                          <span className="text-[11px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
                            <CheckCircle2 size={13} className="shrink-0" /> Mã '{googleOrgCode}' hợp lệ và chưa ai sử dụng!
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="text-xs font-bold text-sky-600 block mb-1.5">
                        Mã Tổ Chức Gia Nhập (Bắt buộc):
                      </label>
                      <div className="relative">
                        <Building2 size={18} className="absolute left-3.5 top-3 text-sky-600" />
                        <input
                          type="text"
                          required
                          placeholder="VD: ORG-88910"
                          value={googleOrgCode}
                          onChange={(e) => setGoogleOrgCode(e.target.value.toUpperCase())}
                          className={`w-full pl-11 pr-4 py-2.5 rounded-xl border text-sm font-bold tracking-wider outline-none transition-all uppercase ${googleOrgCodeCheck.exists === false && googleOrgCode.trim()
                            ? 'border-red-400 bg-red-50 focus:ring-red-400 text-red-700'
                            : googleOrgCodeCheck.exists === true
                              ? 'border-emerald-400 bg-emerald-50 focus:ring-emerald-400 text-emerald-800'
                              : 'border-slate-200 focus:ring-sky-500'
                            }`}
                        />
                      </div>
                      {googleOrgCodeCheck.checking && (
                        <span className="text-[11px] text-slate-400 font-medium mt-1 block">⏳ Đang tìm kiếm tổ chức...</span>
                      )}
                      {!googleOrgCodeCheck.checking && googleOrgCodeCheck.exists === true && (
                        <span className="text-[11px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
                          <CheckCircle2 size={13} className="shrink-0" /> Đã tìm thấy: <strong className="underline">{googleOrgCodeCheck.orgName}</strong>. Sẵn sàng gia nhập!
                        </span>
                      )}
                      {!googleOrgCodeCheck.checking && googleOrgCodeCheck.exists === false && googleOrgCode.trim() && (
                        <span className="text-[11px] text-red-600 font-bold mt-1 flex items-center gap-1">
                          <AlertCircle size={13} className="shrink-0" /> Không tìm thấy tổ chức nào với mã '{googleOrgCode}'.
                        </span>
                      )}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 hover:-translate-y-0.5 hover:shadow-emerald-500/45 active:scale-[0.98] transition-all cursor-pointer mt-2"
                  >
                    {loading ? 'Đang Thiết Lập...' : 'Xác Nhận & Vào Hệ Thống'} <ArrowRight size={18} />
                  </button>
                </form>
              </div>

              <div className="text-center pt-3 border-t border-slate-100">
                <button
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
                {/* Header Title */}
                <div className="mb-5 text-center">
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-1">
                    {activeTab === 'login' ? 'Đăng Nhập Hệ Thống' : 'Khởi Tạo Tài Khoản'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {activeTab === 'login'
                      ? 'Chào mừng trở lại! Vui lòng nhập thông tin tài khoản'
                      : 'Điền thông tin để đăng ký thành viên mới'}
                  </p>
                </div>

                {/* Quick Google Sign-In Button */}
                <button
                  type="button"
                  onClick={handleOpenGoogle}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold text-xs md:text-sm flex items-center justify-center gap-2.5 shadow-sm hover:border-slate-300 hover:-translate-y-0.5 hover:shadow-md transition-all cursor-pointer mb-4"
                >
                  <GoogleIcon />
                  <span>Đăng nhập với Google</span>
                </button>

                {/* Divider */}
                <div className="flex items-center my-3 gap-3">
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-xs text-slate-400 font-semibold">hoặc</span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>

                {/* Error Message */}
                {errorMessage && (
                  <div className="animate-fade-in bg-red-50 border border-red-300 p-3 rounded-xl text-xs text-red-800 mb-4 flex items-center gap-2">
                    <AlertCircle size={16} className="shrink-0" /> {errorMessage}
                  </div>
                )}

                {/* TAB 1: LOGIN FORM */}
                {activeTab === 'login' && (
                  <form onSubmit={handleLoginSubmit} className="animate-tab-slide flex flex-col gap-3.5">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1.5">
                        Email đăng nhập:
                      </label>
                      <div className="relative">
                        <Mail size={18} className="absolute left-3.5 top-3 text-slate-400" />
                        <input
                          type="email"
                          required
                          placeholder="vidu@congty.com"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-sky-500 outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1.5">
                        Mật khẩu:
                      </label>
                      <div className="relative">
                        <Lock size={18} className="absolute left-3.5 top-3 text-slate-400" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          placeholder="••••••••"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          className="w-full pl-11 pr-11 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-sky-500 outline-none transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-1 rounded cursor-pointer"
                          title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    {/* Primary Action Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 px-4 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-500/30 hover:-translate-y-0.5 hover:shadow-orange-500/45 active:scale-[0.98] transition-all cursor-pointer mt-1"
                    >
                      {loading ? 'Đang Đăng Nhập...' : 'Đăng Nhập Ngay'} <ArrowRight size={18} />
                    </button>
                  </form>
                )}

                {/* TAB 2: REGISTER FORM */}
                {activeTab === 'register' && (
                  <form onSubmit={handleRegisterSubmit} className="animate-tab-slide flex flex-col gap-2.5">
                    {/* Mode Selector */}
                    <div className="grid grid-cols-2 gap-2 mb-1">
                      <div
                        onClick={() => setRegisterMode('NEW_ORG')}
                        className={`p-2 rounded-xl border cursor-pointer text-center transition-all ${registerMode === 'NEW_ORG'
                          ? 'border-sky-600 bg-sky-50'
                          : 'border-slate-200 bg-slate-50'
                          }`}
                      >
                        <Building2 size={16} className={`mx-auto mb-0.5 ${registerMode === 'NEW_ORG' ? 'text-sky-600' : 'text-slate-500'}`} />
                        <div className={`text-[11px] font-extrabold ${registerMode === 'NEW_ORG' ? 'text-sky-600' : 'text-slate-700'}`}>Tạo Tổ Chức Mới</div>
                        <span className="text-[9px] text-slate-500">Quản trị viên Admin</span>
                      </div>

                      <div
                        onClick={() => setRegisterMode('JOIN_ORG')}
                        className={`p-2 rounded-xl border cursor-pointer text-center transition-all ${registerMode === 'JOIN_ORG'
                          ? 'border-sky-600 bg-sky-50'
                          : 'border-slate-200 bg-slate-50'
                          }`}
                      >
                        <Users size={16} className={`mx-auto mb-0.5 ${registerMode === 'JOIN_ORG' ? 'text-sky-600' : 'text-slate-500'}`} />
                        <div className={`text-[11px] font-extrabold ${registerMode === 'JOIN_ORG' ? 'text-sky-600' : 'text-slate-700'}`}>Gia Nhập Bằng Mã</div>
                        <span className="text-[9px] text-slate-500">Nhân sự thành viên</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11.5px] font-bold text-slate-700 block mb-1">Họ và tên:</label>
                      <div className="relative">
                        <User size={16} className="absolute left-3 top-2.5 text-slate-400" />
                        <input
                          type="text"
                          required
                          placeholder="Nguyễn Văn A"
                          value={regFullName}
                          onChange={(e) => setRegFullName(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs md:text-sm focus:ring-2 focus:ring-sky-500 outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11.5px] font-bold text-slate-700 block mb-1">Email đăng ký:</label>
                      <div className="relative">
                        <Mail size={16} className="absolute left-3 top-2.5 text-slate-400" />
                        <input
                          type="email"
                          required
                          placeholder="nguyenvana@gmail.com"
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs md:text-sm focus:ring-2 focus:ring-sky-500 outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11.5px] font-bold text-slate-700 block mb-1">Mật khẩu:</label>
                      <div className="relative">
                        <Lock size={16} className="absolute left-3 top-2.5 text-slate-400" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          placeholder="••••••••"
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          className="w-full pl-9 pr-9 py-2 rounded-xl border border-slate-200 text-xs md:text-sm focus:ring-2 focus:ring-sky-500 outline-none transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 p-1"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    {registerMode === 'NEW_ORG' ? (
                      <div className="flex flex-col gap-2">
                        <div>
                          <label className="text-[11.5px] font-bold text-slate-700 block mb-1">Tên Tổ Chức / Công Ty:</label>
                          <div className="relative">
                            <Building2 size={16} className="absolute left-3 top-2.5 text-slate-400" />
                            <input
                              type="text"
                              required
                              placeholder="VD: Công Ty TNHH May Vina"
                              value={regOrgName}
                              onChange={(e) => setRegOrgName(e.target.value)}
                              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs md:text-sm focus:ring-2 focus:ring-sky-500 outline-none transition-all font-medium"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[11.5px] font-bold text-slate-700 block mb-1">
                            Mã Tổ Chức <span className="text-slate-400 font-normal">(Tùy chọn)</span>:
                          </label>
                          <div className="relative">
                            <Building2 size={16} className="absolute left-3 top-2.5 text-sky-600" />
                            <input
                              type="text"
                              placeholder="VINA"
                              value={regOrgCode}
                              onChange={(e) => setRegOrgCode(e.target.value.toUpperCase())}
                              className={`w-full pl-9 pr-3 py-2 rounded-xl border text-xs md:text-sm font-bold tracking-wider outline-none transition-all uppercase ${regOrgCodeCheck.exists === true
                                ? 'border-red-400 bg-red-50 focus:ring-red-400 text-red-700'
                                : regOrgCodeCheck.exists === false && regOrgCode.trim()
                                  ? 'border-emerald-400 bg-emerald-50 focus:ring-emerald-400 text-emerald-800'
                                  : 'border-slate-200 focus:ring-sky-500'
                                }`}
                            />
                          </div>
                          {regOrgCodeCheck.checking && (
                            <span className="text-[10.5px] text-slate-400 font-medium mt-0.5 block">Đang kiểm tra mã...</span>
                          )}
                          {!regOrgCodeCheck.checking && regOrgCodeCheck.exists === true && (
                            <span className="text-[10.5px] text-red-600 font-bold mt-0.5 flex items-center gap-1">
                              <AlertCircle size={12} className="shrink-0" /> Mã '{regOrgCode}' đã được sử dụng! Vui lòng chọn mã khác.
                            </span>
                          )}
                          {!regOrgCodeCheck.checking && regOrgCodeCheck.exists === false && regOrgCode.trim() && (
                            <span className="text-[10.5px] text-emerald-600 font-bold mt-0.5 flex items-center gap-1">
                              <CheckCircle2 size={12} className="shrink-0" /> Mã '{regOrgCode}' hợp lệ và chưa ai sử dụng!
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="text-[11.5px] font-bold text-sky-600 block mb-1">Mã Tổ Chức (Bắt buộc):</label>
                        <div className="relative">
                          <Building2 size={16} className="absolute left-3 top-2.5 text-sky-600" />
                          <input
                            type="text"
                            required
                            placeholder="VINA"
                            value={regOrgCode}
                            onChange={(e) => setRegOrgCode(e.target.value.toUpperCase())}
                            className={`w-full pl-9 pr-3 py-2 rounded-xl border text-xs md:text-sm font-bold tracking-wider outline-none transition-all uppercase ${regOrgCodeCheck.exists === false && regOrgCode.trim()
                              ? 'border-red-400 bg-red-50 focus:ring-red-400 text-red-700'
                              : regOrgCodeCheck.exists === true
                                ? 'border-emerald-400 bg-emerald-50 focus:ring-emerald-400 text-emerald-800'
                                : 'border-slate-200 focus:ring-sky-500'
                              }`}
                          />
                        </div>
                        {regOrgCodeCheck.checking && (
                          <span className="text-[10.5px] text-slate-400 font-medium mt-0.5 block"> Đang tìm kiếm tổ chức...</span>
                        )}
                        {!regOrgCodeCheck.checking && regOrgCodeCheck.exists === true && (
                          <span className="text-[10.5px] text-emerald-600 font-bold mt-0.5 flex items-center gap-1">
                            <CheckCircle2 size={12} className="shrink-0" /> Đã tìm thấy: <strong className="underline">{regOrgCodeCheck.orgName}</strong>. Sẵn sàng gia nhập!
                          </span>
                        )}
                        {!regOrgCodeCheck.checking && regOrgCodeCheck.exists === false && regOrgCode.trim() && (
                          <span className="text-[10.5px] text-red-600 font-bold mt-0.5 flex items-center gap-1">
                            <AlertCircle size={12} className="shrink-0" /> Không tìm thấy tổ chức nào với mã '{regOrgCode}'.
                          </span>
                        )}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 px-4 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-500/30 hover:-translate-y-0.5 hover:shadow-orange-500/45 active:scale-[0.98] transition-all cursor-pointer mt-1"
                    >
                      {loading ? 'Đang Khởi Tạo...' : 'Tạo Tài Khoản Ngay'} <ArrowRight size={18} />
                    </button>
                  </form>
                )}
              </div>

              {/* Bottom Footer Section */}
              <div className="text-center pt-3 mt-3 border-t border-slate-100 text-xs text-slate-500">
                {activeTab === 'login' ? (
                  <>
                    Chưa có tài khoản?{' '}
                    <span
                      onClick={() => { setActiveTab('register'); setErrorMessage(''); }}
                      className="text-orange-600 font-extrabold cursor-pointer hover:underline"
                    >
                      Đăng ký
                    </span>
                  </>
                ) : (
                  <>
                    Đã có tài khoản?{' '}
                    <span
                      onClick={() => { setActiveTab('login'); setErrorMessage(''); }}
                      className="text-orange-600 font-extrabold cursor-pointer hover:underline"
                    >
                      Đăng nhập
                    </span>
                  </>
                )}
              </div>
            </>
          )}
        </div>

      </div>

      {/* GOOGLE OAUTH REAL ACCOUNT DIALOG */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-[11000] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 animate-backdrop">
          <div className="w-full max-w-[440px] bg-white rounded-3xl p-7 shadow-2xl relative animate-modal-pop text-center border border-slate-100">
            <button
              onClick={() => setShowGoogleModal(false)}
              className="absolute top-4 right-4 bg-slate-100 hover:bg-slate-200 rounded-full w-8 h-8 flex items-center justify-center cursor-pointer transition-all"
              title="Đóng modal"
            >
              <X size={16} className="text-slate-500" />
            </button>

            <div className="mx-auto mb-3 w-14 h-14 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center shadow-xs">
              <GoogleIcon />
            </div>

            <h4 className="text-xl font-black text-slate-900 mb-1 tracking-tight">
              Đăng Nhập Tài Khoản Google
            </h4>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              {googleClientId
                ? 'Sử dụng nút Google chính thức hoặc nhập trực tiếp Email Google thật của bạn để tiếp tục.'
                : 'Nhập Email Google của bạn bên dưới để đăng nhập trực tiếp bằng tài khoản Google.'}
            </p>

            {/* Official Google Sign-In Button Container (If Client ID Configured) */}
            {googleClientId && (
              <>
                <div className="flex flex-col items-center justify-center mb-4 min-h-[46px]">
                  <div id="official-google-btn-slot" className="w-full flex justify-center"></div>
                </div>

                <div className="flex items-center my-4 gap-3">
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">hoặc nhập Email Google</span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>
              </>
            )}

            {/* Real Google Email Input Form */}
            <form onSubmit={(e) => { e.preventDefault(); executeGoogleAuth(customGoogleEmail); }} className="space-y-3.5">
              <div className="relative text-left">
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Email Google của bạn:
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="ten-cua-ban@gmail.com"
                    value={customGoogleEmail}
                    onChange={(e) => setCustomGoogleEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-xs md:text-sm rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-sky-500 font-semibold text-slate-800 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white font-extrabold text-xs md:text-sm shadow-md shadow-sky-600/25 hover:shadow-sky-600/40 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? 'Đang Xác Thực Google...' : 'Xác Nhận & Đăng Nhập Với Google'} <ArrowRight size={16} />
              </button>
            </form>

            <div className="mt-4 pt-3 border-t border-slate-100">
              <span className="text-[11px] text-slate-400 font-medium">
                Tài khoản Google sẽ được lưu vết phương thức "Google OAuth" trên hệ thống Admin.
              </span>
            </div>

          </div>
        </div>
      )}
    </div>,
    document.body
  );
};
