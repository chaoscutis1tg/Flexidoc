import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Settings,
  ShieldCheck,
  Building,
  Key,
  Copy,
  Check,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Lock,
  Zap,
  Globe,
  Sliders,
  Server,
  Radio,
  ExternalLink,
  Info,
  RefreshCw,
  DollarSign,
  Tag,
  Trash2
} from 'lucide-react';
import { useConfirm } from '../../app/ConfirmContext';

import { VIETNAM_BANKS } from '../../utils/banks';

export const AdminSettingsPage = () => {
  const [activeTab, setActiveTab] = useState('payment'); // 'payment' | 'security' | 'general'

  // Payment & Network Config State
  const [paymentConfig, setPaymentConfig] = useState({
    bankName: 'MB BANK',
    bankCode: 'MB',
    accountNumber: '5408092006',
    accountName: 'DO VAN KHOA',
    orderPrefix: 'FDDH',
    sepayApiKey: 'sepay_secret_key_flexidoc_2026',
    serverBaseUrl: 'http://localhost:5000',
    sepayWebhookPath: '/api/v1/payments/sepay-webhook',
  });

  const handleBankCodeChange = (e) => {
    const selectedCode = e.target.value;
    const foundBank = VIETNAM_BANKS.find(b => b.code === selectedCode);
    setPaymentConfig(prev => ({
      ...prev,
      bankCode: selectedCode,
      bankName: foundBank ? foundBank.name : prev.bankName
    }));
  };

  // Security & Response Encryption State
  const [securitySettings, setSecuritySettings] = useState({
    enableResponseEncryption: true,
    enableSepayHeaderAuth: true,
    tokenExpiryHours: 24,
    allowPublicOrgRegistration: true,
    defaultFreeContractLimit: 10,
  });

  // Dynamic Package Pricing & Discount State
  const [pricingSettings, setPricingSettings] = useState({
    starterPrice: 0,
    basicMonthlyPrice: 199000,
    proMonthlyPrice: 299000,
    vipMonthlyPrice: 999000,
    discount3MonthsPercent: 5,
    discount6MonthsPercent: 10,
    yearlyDiscountPercent: 20,
  });

  const [loading, setLoading] = useState(true);
  const [savingPayment, setSavingPayment] = useState(false);
  const [savingSecurity, setSavingSecurity] = useState(false);
  const [savingPricing, setSavingPricing] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [cleaningUp, setCleaningUp] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const { confirm } = useConfirm();

  const handleTriggerBackup = async () => {
    const isConfirm = await confirm({
      title: 'Xác Nhận Sao Lưu MongoDB',
      message: 'Bạn có chắc chắn muốn thực thi mongodump thủ công ngay bây giờ không? Tiến trình này có thể gây trễ hệ thống nhẹ.',
      confirmText: 'Đồng Ý & Sao Lưu',
      cancelText: 'Hủy Bỏ',
      variant: 'warning'
    });
    if (!isConfirm) return;

    setBackingUp(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await api.post('/system-settings/trigger-backup');
      if (res.success) {
        setMessage({ type: 'success', text: 'Sao lưu MongoDB và xoay vòng giữ đúng 3 bản gần nhất thành công!' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Sao lưu MongoDB thất bại.' });
    } finally {
      setBackingUp(false);
    }
  };

  const handleTriggerCleanup = async () => {
    const isConfirm = await confirm({
      title: 'Xác Nhận Dọn Dẹp Dữ Liệu Rác (Hard Delete)',
      message: 'Hành động này sẽ xóa vĩnh viễn toàn bộ các bản ghi đã được đánh dấu xóa (Soft Delete) khỏi Database.',
      subMessage: 'Bao gồm Tổ chức, Người dùng, Hợp đồng, Mẫu hợp đồng,... Dữ liệu không thể khôi phục lại. Bạn có chắc chắn không?',
      confirmText: 'Xóa Vĩnh Viễn',
      cancelText: 'Hủy Bỏ',
      variant: 'danger'
    });
    if (!isConfirm) return;

    setCleaningUp(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await api.delete('/system-settings/cleanup');
      if (res.success) {
        const details = res.data;
        const msg = `Dọn dẹp thành công!
Đã xóa: ${details.organizations || 0} tổ chức, ${details.users || 0} người dùng, ${details.contracts || 0} hợp đồng, ${details.templates || 0} mẫu...`;
        await confirm({
          title: 'Kết Quả Dọn Dẹp',
          message: msg,
          variant: 'success',
          hideCancel: true,
          confirmText: 'Đóng'
        });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Lỗi khi dọn dẹp dữ liệu.' });
    } finally {
      setCleaningUp(false);
    }
  };

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/system-settings/all');
      if (res.success && res.data) {
        if (res.data.payment) setPaymentConfig(prev => ({ ...prev, ...res.data.payment }));
        if (res.data.system) setSecuritySettings(prev => ({ ...prev, ...res.data.system }));
        if (res.data.pricing) setPricingSettings(prev => ({ ...prev, ...res.data.pricing }));
      }
    } catch (err) {
      console.error('Lỗi khi tải cài đặt hệ thống:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSavePaymentConfig = async (e) => {
    e.preventDefault();
    setSavingPayment(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await api.put('/system-settings/payment', paymentConfig);
      if (res.success) {
        setMessage({ type: 'success', text: 'Cập nhật Cấu hình Thanh toán & Tên miền Endpoint thành công!' });
        if (res.data) setPaymentConfig(prev => ({ ...prev, ...res.data }));
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Cập nhật cấu hình thanh toán thất bại.' });
    } finally {
      setSavingPayment(false);
    }
  };

  const handleSaveSecuritySettings = async (e) => {
    e.preventDefault();
    setSavingSecurity(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await api.put('/system-settings/system', securitySettings);
      if (res.success) {
        setMessage({ type: 'success', text: 'Cập nhật Cài Đặt Bảo Mật & Mã Hóa Response thành công!' });
        if (res.data) setSecuritySettings(prev => ({ ...prev, ...res.data }));
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Cập nhật cấu hình bảo mật thất bại.' });
    } finally {
      setSavingSecurity(false);
    }
  };

  const handleSavePricingSettings = async (e) => {
    e.preventDefault();
    setSavingPricing(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await api.put('/system-settings/pricing', pricingSettings);
      if (res.success) {
        setMessage({ type: 'success', text: 'Cập nhật Cấu hình Bảng Giá & Chiết Khấu thành công!' });
        if (res.data) setPricingSettings(prev => ({ ...prev, ...res.data }));
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Cập nhật cấu hình bảng giá thất bại.' });
    } finally {
      setSavingPricing(false);
    }
  };

  // Compute effective server base URL dynamically
  const effectiveServerUrl = (paymentConfig.serverBaseUrl && paymentConfig.serverBaseUrl.trim() !== '')
    ? paymentConfig.serverBaseUrl.trim().replace(/\/+$/, '')
    : `${window.location.protocol}//${window.location.hostname}:5000`;

  const webhookUrl = `${effectiveServerUrl}${paymentConfig.sepayWebhookPath || '/api/v1/payments/sepay-webhook'}`;

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  const envServerUrl = import.meta.env.VITE_SERVER_BASE_URL || 'http://localhost:5000';

  const handleSetEnvDomain = () => {
    setPaymentConfig({ ...paymentConfig, serverBaseUrl: envServerUrl });
  };

  const handleSetAutoDomain = () => {
    const autoUrl = `${window.location.protocol}//${window.location.hostname}:5000`;
    setPaymentConfig({ ...paymentConfig, serverBaseUrl: autoUrl });
  };

  const handleSetLocalhost = () => {
    setPaymentConfig({ ...paymentConfig, serverBaseUrl: 'http://localhost:5000' });
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3 text-slate-600">
        <Loader2 size={36} className="animate-spin text-sky-600" />
        <span className="text-sm font-bold">Đang tải toàn bộ cài đặt hệ thống...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-12 select-none">
      {/* 1. Page Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold px-2.5 py-0.5 rounded-md flex items-center gap-1">
              <ShieldCheck size={13} /> Quản Trị Tối Cao (Super Admin)
            </span>
            <span className="bg-sky-50 text-sky-700 border border-sky-200 text-xs font-extrabold px-2.5 py-0.5 rounded-md flex items-center gap-1">
              <Lock size={13} /> Cài Đặt Hệ Thống & Dynamic Domain
            </span>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold px-2.5 py-0.5 rounded-md flex items-center gap-1">
              <Radio size={12} className="animate-pulse text-emerald-600" /> Webhook Live: {effectiveServerUrl}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5 break-words">
              <Settings size={26} className="text-sky-600 shrink-0" />
              <span>Cài Đặt Hệ Thống (System Settings)</span>
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Cấu hình cổng thanh toán SePay, tài khoản MB Bank 5408092006, tên miền Backend / IP LAN linh hoạt và tùy chọn mã hóa Response API.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl shrink-0 self-start lg:self-center">
          <button
            onClick={() => { setActiveTab('payment'); setMessage({ type: '', text: '' }); }}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'payment'
                ? 'bg-white text-sky-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Zap size={15} className="text-amber-500" /> Thanh Toán & Webhook Endpoint
          </button>
          <button
            onClick={() => { setActiveTab('pricing'); setMessage({ type: '', text: '' }); }}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'pricing'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <DollarSign size={15} className="text-emerald-500" /> Bảng Giá & Chiết Khấu
          </button>
          <button
            onClick={() => { setActiveTab('security'); setMessage({ type: '', text: '' }); }}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'security'
                ? 'bg-white text-sky-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Lock size={15} className="text-emerald-600" /> Bảo Mật & Mã Hóa API
          </button>
          <button
            onClick={() => { setActiveTab('general'); setMessage({ type: '', text: '' }); }}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'general'
                ? 'bg-white text-sky-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders size={15} className="text-purple-600" /> Cấu Hình Chung
          </button>
        </div>
      </div>

      {/* Global Message Banner */}
      {message.text && (
        <div className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between gap-2.5 animate-fade-in ${
          message.type === 'success'
            ? 'bg-emerald-50 text-emerald-900 border border-emerald-300 shadow-xs'
            : 'bg-red-50 text-red-900 border border-red-300 shadow-xs'
        }`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? <CheckCircle2 size={18} className="text-emerald-600 shrink-0" /> : <AlertCircle size={18} className="text-red-600 shrink-0" />}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage({ type: '', text: '' })} className="text-slate-400 hover:text-slate-700 p-1">
            ✕
          </button>
        </div>
      )}

      {/* TAB 1: PAYMENT SETTINGS & DYNAMIC ENDPOINT */}
      {activeTab === 'payment' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Form Left 2 Cols */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-7 border border-slate-200 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Building size={20} className="text-sky-600" /> Cài Đặt Ngân Hàng & Tên Miền Dynamic Endpoint
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Thay đổi thông tin số tài khoản MB BANK 5408092006, tên miền Backend Server (Domain hoặc IP LAN) để sinh Webhook URL chính xác.
              </p>
            </div>

            <form onSubmit={handleSavePaymentConfig} className="space-y-5">
              
              {/* SECTION A: SERVER BASE URL / DYNAMIC DOMAIN */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Server size={15} className="text-sky-600" /> Tên Miền Backend / IP LAN Endpoint Server:
                  </label>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={handleSetEnvDomain}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 hover:border-emerald-500 text-emerald-800 font-bold text-[11px] shadow-2xs transition-all cursor-pointer flex items-center gap-1"
                      title={`Lấy trực tiếp từ tệp .env (${envServerUrl})`}
                    >
                      <Globe size={13} className="inline text-emerald-600 mr-1" /> Từ .env ({envServerUrl})
                    </button>
                    <button
                      type="button"
                      onClick={handleSetAutoDomain}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-sky-500 text-slate-700 font-bold text-[11px] shadow-2xs hover:text-sky-600 transition-all cursor-pointer"
                      title="Sử dụng Host IP/Domain hiện tại trên trình duyệt"
                    >
                      <Zap size={13} className="inline text-amber-500 mr-1" /> Auto Host (:5000)
                    </button>
                    <button
                      type="button"
                      onClick={handleSetLocalhost}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-sky-500 text-slate-700 font-bold text-[11px] shadow-2xs hover:text-sky-600 transition-all cursor-pointer"
                    >
                      Localhost (5000)
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <input
                    type="url"
                    required
                    placeholder="http://192.168.1.100:5000 hoặc https://api.yourdomain.com"
                    value={paymentConfig.serverBaseUrl}
                    onChange={(e) => setPaymentConfig({ ...paymentConfig, serverBaseUrl: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono font-bold text-slate-800 focus:ring-2 focus:ring-sky-500 outline-none bg-white"
                  />
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Nhập URL Server Backend chính xác (ví dụ: <code className="text-sky-700 font-mono">http://192.168.1.100:5000</code> hoặc <code className="text-sky-700 font-mono">https://api.domain.com</code>). Khi triển khai tên miền thực tế hoặc IP mạng nội bộ, chỉ cần sửa ô này.
                </p>
              </div>

              {/* SECTION B: BANKING DETAILS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Mã Ngân Hàng VietQR (Chọn Ngân Hàng):
                  </label>
                  <select
                    value={paymentConfig.bankCode}
                    onChange={handleBankCodeChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold focus:ring-2 focus:ring-sky-500 outline-none bg-white cursor-pointer"
                  >
                    {VIETNAM_BANKS.map((b) => (
                      <option key={b.code} value={b.code}>
                        {b.code} - {b.fullName}
                      </option>
                    ))}
                    {!VIETNAM_BANKS.some(b => b.code === paymentConfig.bankCode) && paymentConfig.bankCode && (
                      <option value={paymentConfig.bankCode}>
                        {paymentConfig.bankCode} (Khác)
                      </option>
                    )}
                  </select>
                  <span className="text-[10.5px] text-slate-400 mt-1 block">Tên ngân hàng bên cạnh sẽ tự động cập nhật khi bạn chọn mã.</span>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Tên Ngân Hàng Hiển Thị:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: MB BANK"
                    value={paymentConfig.bankName}
                    onChange={(e) => setPaymentConfig({ ...paymentConfig, bankName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                  <span className="text-[10.5px] text-slate-400 mt-1 block">Có thể chỉnh sửa tên tùy chỉnh nếu muốn.</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Số Tài Khoản Nhận Tiền:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="5408092006"
                    value={paymentConfig.accountNumber}
                    onChange={(e) => setPaymentConfig({ ...paymentConfig, accountNumber: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono font-black text-sky-700 focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Tên Chủ Tài Khoản:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="DO VAN KHOA"
                    value={paymentConfig.accountName}
                    onChange={(e) => setPaymentConfig({ ...paymentConfig, accountName: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-extrabold focus:ring-2 focus:ring-sky-500 outline-none uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Tiền Tố Mã Đơn Hàng (Nội Dung Chuyển Khoản):
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="FDDH"
                    value={paymentConfig.orderPrefix}
                    onChange={(e) => setPaymentConfig({ ...paymentConfig, orderPrefix: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono font-bold focus:ring-2 focus:ring-sky-500 outline-none uppercase"
                  />
                  <span className="text-[10.5px] text-slate-400 mt-1 block">Nội dung CK ví dụ: <code>{paymentConfig.orderPrefix || 'FDDH'} DH16780</code></span>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1">
                    <Key size={14} className="text-amber-600" /> API Key Bảo Mật SePay:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="sepay_secret_key_mtctms_2026"
                    value={paymentConfig.sepayApiKey}
                    onChange={(e) => setPaymentConfig({ ...paymentConfig, sepayApiKey: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                  <span className="text-[10.5px] text-slate-400 mt-1 block">Khóa bí mật xác minh request từ SePay Webhook.</span>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={savingPayment}
                  className="px-6 py-3 rounded-full bg-gradient-to-r from-sky-600 to-blue-600 text-white font-extrabold text-sm flex items-center gap-2 shadow-md shadow-sky-600/25 hover:shadow-sky-600/40 hover:-translate-y-0.5 transition-all cursor-pointer"
                >
                  {savingPayment ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Lưu Cấu Hình Thanh Toán & Dynamic Endpoint
                </button>
              </div>
            </form>
          </div>

          {/* SePay Webhook Guide Card Right 1 Col */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 flex flex-col justify-between shadow-xl">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold shadow-xs">
                  <Zap size={18} />
                </div>
                <div>
                  <h4 className="text-base font-black text-white">Kết Nối SePay Webhook Auto</h4>
                  <span className="text-[10.5px] text-sky-400 font-mono">Real-time Balance Listener</span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                SePay tự động gửi thông báo biến động số dư ngân hàng về URL bên dưới để tự động kích hoạt gói dịch vụ cho khách hàng ngay lập tức.
              </p>

              <div className="space-y-4 text-xs">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                    <Globe size={13} className="text-sky-400" /> 1. Webhook URL Động Cần Đăng Ký Tại SePay.vn:
                  </span>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-sky-300 break-all flex items-center justify-between gap-2 shadow-inner">
                    <span className="font-bold">{webhookUrl}</span>
                    <button
                      type="button"
                      onClick={handleCopyWebhook}
                      className="text-slate-400 hover:text-white p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-600 transition-all cursor-pointer shrink-0"
                      title="Sao chép Webhook URL"
                    >
                      {copiedWebhook ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    2. Cấu hình Authentication Tại SePay:
                  </span>
                  <p className="text-slate-300 text-[11.5px] leading-relaxed bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                    Chọn loại <strong>API Key</strong> trong SePay và dán mã API Key: <code className="text-amber-400 bg-slate-950 px-1.5 py-0.5 rounded font-mono">{paymentConfig.sepayApiKey}</code>.
                  </p>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    3. Header Tự Động SePay Gửi Về Server:
                  </span>
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-[11px] text-emerald-400 font-mono">
                    "Authorization": "Apikey {paymentConfig.sepayApiKey}"
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
              <div className="flex items-center gap-1 text-slate-300">
                <Info size={13} className="text-amber-400" /> <strong>Cấu hình linh hoạt:</strong>
              </div>
              <p>
                Khi có tên miền chính thức hoặc IP LAN, bạn chỉ cần thay đổi <strong>Tên Miền Backend</strong> ở form bên trái, URL Webhook trên sẽ tự động cập nhật!
              </p>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: SECURITY & RESPONSE ENCRYPTION */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-3xl p-7 border border-slate-200 shadow-sm max-w-4xl space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Lock size={20} className="text-emerald-600" /> Tùy Chọn Bảo Mật & Mã Hóa Response API
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Quản lý chính sách mã hóa dữ liệu phản hồi API (Response Encryption), bảo mật token JWT và xác thực Webhook header.
            </p>
          </div>

          <form onSubmit={handleSaveSecuritySettings} className="space-y-6">
            
            {/* Toggle 1: Response Encryption */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={18} className="text-emerald-600" />
                  <span className="text-sm font-black text-slate-900">Mã Hóa Dữ Liệu Phản Hồi API (Response Data Encryption)</span>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">Khuyên dùng</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Khi bật, dữ liệu response trả về từ Backend (các API nhạy cảm) sẽ được mã hóa chuẩn <strong>AES-256</strong>, chống việc soi và bóc tách dữ liệu trên công cụ DevTools Network Tab.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                <input
                  type="checkbox"
                  checked={securitySettings.enableResponseEncryption}
                  onChange={(e) => setSecuritySettings({ ...securitySettings, enableResponseEncryption: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {/* Toggle 2: SePay Apikey Header Verification */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Key size={18} className="text-amber-600" />
                  <span className="text-sm font-black text-slate-900">Bắt Buộc Xác Thực Apikey Header Cho Webhook SePay</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Yêu cầu request Webhook từ SePay gửi đúng Header <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-amber-700">Authorization: Apikey {paymentConfig.sepayApiKey}</code>. Ngăn chặn việc giả lập cuộc gọi Webhook từ bên ngoài.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                <input
                  type="checkbox"
                  checked={securitySettings.enableSepayHeaderAuth}
                  onChange={(e) => setSecuritySettings({ ...securitySettings, enableSepayHeaderAuth: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {/* Select Expiry Hours */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Thời Gian Hết Hạn Token Phiên Đăng Nhập (JWT AccessToken Expiration):
              </label>
              <select
                value={securitySettings.tokenExpiryHours}
                onChange={(e) => setSecuritySettings({ ...securitySettings, tokenExpiryHours: parseInt(e.target.value) || 24 })}
                className="w-full md:w-72 px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold focus:ring-2 focus:ring-sky-500 outline-none bg-white"
              >
                <option value={12}>12 Giờ</option>
                <option value={24}>24 Giờ (Mặc định chuẩn)</option>
                <option value={72}>3 Ngày</option>
                <option value={168}>7 Ngày</option>
              </select>
              <span className="text-[10.5px] text-slate-400 mt-1 block">Sau khoảng thời gian này, người dùng cần đăng nhập lại để làm mới phiên làm việc.</span>
            </div>

            <div className="pt-2 flex items-center justify-end">
              <button
                type="submit"
                disabled={savingSecurity}
                className="px-6 py-3 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-extrabold text-sm flex items-center gap-2 shadow-md shadow-emerald-600/25 hover:shadow-emerald-600/40 hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                {savingSecurity ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Lưu Cấu Hình Bảo Mật
              </button>
            </div>

          </form>
        </div>
      )}

      {/* TAB 3: GENERAL SYSTEM CONFIG */}
      {activeTab === 'general' && (
        <div className="bg-white rounded-3xl p-7 border border-slate-200 shadow-sm max-w-4xl space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Sliders size={20} className="text-purple-600" /> Tùy Chọn Đăng Ký & Giới Hạn Gói Miễn Phí
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Cấu hình các giới hạn mặc định của hệ thống đa tổ chức MT-CTMS.
            </p>
          </div>

          <form onSubmit={handleSaveSecuritySettings} className="space-y-5">
            {/* Toggle Registration */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="text-sm font-black text-slate-900">Cho Phép Mở Đăng Ký Tổ Chức Mới Tự Do</span>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Khi bật, người dùng truy cập trang chủ có thể tự tạo tài khoản Tổ chức mới mà không cần Super Admin khởi tạo trước.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                <input
                  type="checkbox"
                  checked={securitySettings.allowPublicOrgRegistration}
                  onChange={(e) => setSecuritySettings({ ...securitySettings, allowPublicOrgRegistration: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            {/* Default Free Contract Limit */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Giới Hạn Số Hợp Đồng Mặc Định Cho Gói Miễn Phí (Gói FREE):
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={securitySettings.defaultFreeContractLimit}
                onChange={(e) => setSecuritySettings({ ...securitySettings, defaultFreeContractLimit: parseInt(e.target.value) || 10 })}
                className="w-full md:w-72 px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold focus:ring-2 focus:ring-purple-500 outline-none bg-white"
              />
              <span className="text-[10.5px] text-slate-400 mt-1 block">Tổ chức dùng gói FREE sẽ không thể tạo vượt quá số lượng hợp đồng này trừ khi nâng cấp gói PRO/VIP.</span>
            </div>

            {/* Backup & 3-Rotation Panel */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <Server size={18} className="text-indigo-600" /> Tự Động Sao Lưu MongoDB (Mongodump Archive & Retention 3 Bản)
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Hệ thống thực thi <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-purple-700">mongodump --archive --gzip</code> và xoay vòng tự động <strong>chỉ giữ lại đúng 3 bản dump gần nhất</strong> trên ổ đĩa.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={backingUp}
                  onClick={handleTriggerBackup}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-extrabold text-xs flex items-center gap-2 hover:bg-slate-800 transition-all shadow-sm shrink-0 cursor-pointer hover:scale-105"
                >
                  {backingUp ? <Loader2 size={15} className="animate-spin text-sky-400" /> : <RefreshCw size={15} className="text-amber-400" />}
                  Thực Hiện Sao Lưu & Xoay Vòng
                </button>
              </div>
            </div>

            {/* Hard Delete / Cleanup Panel */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3 mt-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <Trash2 size={18} className="text-red-600" /> Dọn Dẹp Dữ Liệu Rác (Hard Delete)
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Hệ thống sẽ <strong>xóa vĩnh viễn</strong> toàn bộ các bản ghi (Tổ chức, Người dùng, Hợp đồng...) đã được đánh dấu xóa (Soft Delete) trước đó khỏi Database. Hành động này không thể khôi phục.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={cleaningUp}
                  onClick={handleTriggerCleanup}
                  className="px-5 py-2.5 rounded-xl bg-red-600 text-white font-extrabold text-xs flex items-center gap-2 hover:bg-red-700 transition-all shadow-sm shrink-0 cursor-pointer hover:scale-105"
                >
                  {cleaningUp ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                  Thực Hiện Dọn Dẹp
                </button>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end">
              <button
                type="submit"
                disabled={savingSecurity}
                className="px-6 py-3 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-extrabold text-sm flex items-center gap-2 shadow-md shadow-purple-600/25 hover:shadow-purple-600/40 hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                {savingSecurity ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Lưu Cấu Hình Hệ Thống
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 4: DYNAMIC PRICING & DISCOUNTS */}
      {activeTab === 'pricing' && (
        <div className="bg-white rounded-3xl p-7 border border-slate-200 shadow-sm max-w-4xl space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <DollarSign size={20} className="text-emerald-600" /> Quản Lý Giá Gói Dịch Vụ & Chiết Khấu Ưu Đãi
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Điều chỉnh linh hoạt giá các gói dịch vụ (Starter, Pro, VIP), phần trăm chiết khấu theo năm và mã giảm giá khuyến mãi.
            </p>
          </div>

          <form onSubmit={handleSavePricingSettings} className="space-y-6">
            
            {/* Package Pricing Section */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Tag size={15} className="text-emerald-600" /> Giá Tiền Các Gói Dịch Vụ (VNĐ / Tháng):
              </h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Gói Miễn Phí (Starter / Free):
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      value={pricingSettings.starterPrice}
                      onChange={(e) => setPricingSettings({ ...pricingSettings, starterPrice: parseInt(e.target.value) || 0 })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                    />
                    <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">VNĐ</span>
                  </div>
                  <span className="text-[10.5px] text-slate-400 mt-1 block">Mặc định 0đ (Gói dùng thử).</span>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Gói Cơ Bản (BASIC):
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      step={1000}
                      value={pricingSettings.basicMonthlyPrice ?? 199000}
                      onChange={(e) => setPricingSettings({ ...pricingSettings, basicMonthlyPrice: parseInt(e.target.value) || 0 })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-teal-700 focus:ring-2 focus:ring-teal-500 outline-none bg-white"
                    />
                    <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">VNĐ/Tháng</span>
                  </div>
                  <span className="text-[10.5px] text-slate-400 mt-1 block">Giá hiện tại: {(pricingSettings.basicMonthlyPrice ?? 199000).toLocaleString('vi-VN')} đ</span>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Gói Chuyên Nghiệp (PRO):
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      step={1000}
                      value={pricingSettings.proMonthlyPrice}
                      onChange={(e) => setPricingSettings({ ...pricingSettings, proMonthlyPrice: parseInt(e.target.value) || 0 })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-sky-700 focus:ring-2 focus:ring-sky-500 outline-none bg-white"
                    />
                    <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">VNĐ/Tháng</span>
                  </div>
                  <span className="text-[10.5px] text-slate-400 mt-1 block">Giá hiện tại: {pricingSettings.proMonthlyPrice?.toLocaleString('vi-VN')} đ</span>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Gói VIP Doanh Nghiệp (VIP):
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      step={1000}
                      value={pricingSettings.vipMonthlyPrice}
                      onChange={(e) => setPricingSettings({ ...pricingSettings, vipMonthlyPrice: parseInt(e.target.value) || 0 })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-purple-700 focus:ring-2 focus:ring-purple-500 outline-none bg-white"
                    />
                    <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">VNĐ/Tháng</span>
                  </div>
                  <span className="text-[10.5px] text-slate-400 mt-1 block">Giá hiện tại: {pricingSettings.vipMonthlyPrice?.toLocaleString('vi-VN')} đ</span>
                </div>
              </div>
            </div>

            {/* Discount Section */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Zap size={15} className="text-amber-500" /> Tùy Chỉnh % Chiết Khấu Cho Các Kỳ Thanh Toán:
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    % Giảm Giá Kỳ 3 Tháng:
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={pricingSettings.discount3MonthsPercent ?? 5}
                      onChange={(e) => setPricingSettings({ ...pricingSettings, discount3MonthsPercent: parseInt(e.target.value) || 0 })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-sky-700 focus:ring-2 focus:ring-sky-500 outline-none bg-white"
                    />
                    <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">%</span>
                  </div>
                  <span className="text-[10.5px] text-slate-400 mt-1 block">Áp dụng khi chọn thanh toán 3 tháng.</span>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    % Giảm Giá Kỳ 6 Tháng:
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={pricingSettings.discount6MonthsPercent ?? 10}
                      onChange={(e) => setPricingSettings({ ...pricingSettings, discount6MonthsPercent: parseInt(e.target.value) || 0 })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-blue-700 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    />
                    <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">%</span>
                  </div>
                  <span className="text-[10.5px] text-slate-400 mt-1 block">Áp dụng khi chọn thanh toán 6 tháng.</span>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    % Giảm Giá Kỳ 12 Tháng (Theo Năm):
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={pricingSettings.yearlyDiscountPercent ?? 20}
                      onChange={(e) => setPricingSettings({ ...pricingSettings, yearlyDiscountPercent: parseInt(e.target.value) || 0 })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-emerald-700 focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                    />
                    <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">%</span>
                  </div>
                  <span className="text-[10.5px] text-slate-400 mt-1 block">Áp dụng khi chọn thanh toán 12 tháng.</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end">
              <button
                type="submit"
                disabled={savingPricing}
                className="px-6 py-3 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-extrabold text-sm flex items-center gap-2 shadow-md shadow-emerald-600/25 hover:shadow-emerald-600/40 hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                {savingPricing ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Lưu Cấu Hình Bảng Giá & Chiết Khấu
              </button>
            </div>

          </form>
        </div>
      )}
    </div>
  );
};
