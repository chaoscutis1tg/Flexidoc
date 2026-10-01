import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '../../services/api';
import { useAuth } from '../../app/AuthContext';
import { fetchDynamicPlans, DEFAULT_PLANS_DATA } from '../../utils/planData';
import {
  X,
  Crown,
  Check,
  Building,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Zap,
  Copy,
  Loader2,
  QrCode,
  ArrowLeft,
  Clock,
  Sparkles,
  Briefcase,
  Star,
  Info
} from 'lucide-react';

export const RenewalModal = ({ isOpen, onClose, targetOrg = null }) => {
  const { user, refreshUser } = useAuth();
  const [plans, setPlans] = useState(DEFAULT_PLANS_DATA);
  const [selectedPlan, setSelectedPlan] = useState('PRO');
  const [durationMonths, setDurationMonths] = useState(1);

  // Flow Step: 'SELECT_PLAN' | 'PAYMENT_QR'
  const [step, setStep] = useState('SELECT_PLAN');

  // Created Order State
  const [createdOrder, setCreatedOrder] = useState(null);
  const [paymentConfig, setPaymentConfig] = useState({
    bankName: 'MB BANK',
    bankCode: 'MB',
    accountNumber: '5408092006',
    accountName: 'DO VAN KHOA',
    orderPrefix: 'FDDH',
  });

  const [loading, setLoading] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedAcc, setCopiedAcc] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [manualSubmitted, setManualSubmitted] = useState(false);

  const [pricingConfig, setPricingConfig] = useState({
    discount3MonthsPercent: 5,
    discount6MonthsPercent: 10,
    yearlyDiscountPercent: 20,
  });

  // Fetch commercial plans and payment config on modal open
  useEffect(() => {
    if (isOpen) {
      setStep('SELECT_PLAN');
      setCreatedOrder(null);
      setSuccessMsg('');
      setErrorMsg('');
      setManualSubmitted(false);

      const userOrgPlan = targetOrg?.plan || (typeof user?.organizationId === 'object' ? user?.organizationId?.plan : null);
      if (userOrgPlan && ['BASIC', 'PRO', 'VIP'].includes(userOrgPlan)) {
        setSelectedPlan(userOrgPlan);
      }

      fetchDynamicPlans().then((data) => {
        if (data && data.length > 0) {
          const commercialPlans = data.filter((p) => p.code !== 'FREE');
          if (commercialPlans.length > 0) {
            setPlans(commercialPlans);
          }
        }
      });

      api.get('/system-settings/payment')
        .then((res) => {
          if (res.success && res.data) {
            setPaymentConfig(res.data);
          }
        })
        .catch(() => { });

      api.get('/system-settings/pricing')
        .then((res) => {
          if (res.success && res.data) {
            setPricingConfig(res.data);
          }
        })
        .catch(() => { });
    }
  }, [isOpen]);

  // Polling order status if createdOrder is PENDING
  useEffect(() => {
    let timer;
    if ((step === 'PAYMENT_QR' || step === 'SELECT_PLAN') && createdOrder && createdOrder.status === 'PENDING') {
      timer = setInterval(async () => {
        try {
          const res = await api.get(`/orders/${createdOrder._id}`);
          if (res.success && res.data) {
            if (res.data.status === 'SUCCESS') {
              setCreatedOrder(res.data);
              setSuccessMsg(`Thanh toán thành công! Gói ${res.data.plan} đã được kích hoạt tự động.`);
              setStep('SUCCESS');
              await refreshUser();
              clearInterval(timer);
            }
          }
        } catch (e) {
          // Silent polling fail
        }
      }, 3000);
    }
    return () => clearInterval(timer);
  }, [step, createdOrder]);

  const d3 = pricingConfig.discount3MonthsPercent ?? 5;
  const d6 = pricingConfig.discount6MonthsPercent ?? 10;
  const d12 = pricingConfig.yearlyDiscountPercent ?? 20;

  const DURATION_OPTIONS = [
    { months: 1, label: '1 Tháng', discountPercent: 0, tag: null },
    { months: 3, label: '3 Tháng', discountPercent: d3, tag: d3 > 0 ? `Giảm ${d3}%` : null },
    { months: 6, label: '6 Tháng', discountPercent: d6, tag: d6 > 0 ? `Giảm ${d6}%` : null },
    { months: 12, label: '12 Tháng', discountPercent: d12, tag: d12 > 0 ? `Giảm ${d12}%` : null },
  ];

  if (!isOpen) return null;

  const currentOrg = targetOrg || user?.organizationId || {};
  const currentPlanCode = currentOrg.plan || 'FREE';
  const planExpiry = currentOrg.planExpiresAt ? new Date(currentOrg.planExpiresAt) : null;
  const now = new Date();
  const daysLeft = planExpiry && planExpiry > now ? Math.ceil((planExpiry - now) / (1000 * 60 * 60 * 24)) : 0;

  const planLevels = { 'FREE': 0, 'BASIC': 1, 'PRO': 2, 'VIP': 3 };
  const currentLevel = planLevels[currentPlanCode] || 0;
  const selectedLevel = planLevels[selectedPlan] || 0;
  
  const isDowngrading = selectedLevel < currentLevel;
  const isUpgrading = selectedLevel > currentLevel;
  const hasTimeLeft = daysLeft > 0;

  const currentPlanObj = plans.find((p) => p.code === selectedPlan) || plans[0];
  const unitPrice = currentPlanObj ? (currentPlanObj.price || 199000) : 199000;

  const selectedDurationOpt = DURATION_OPTIONS.find((d) => d.months === durationMonths) || DURATION_OPTIONS[0];
  const discountPercent = selectedDurationOpt.discountPercent || 0;
  const rawTotalPrice = unitPrice * durationMonths;
  const totalPrice = Math.round(rawTotalPrice * (1 - discountPercent / 100));
  const totalSaved = rawTotalPrice - totalPrice;

  const handleCreateOrder = async () => {
    setLoading(true);
    setErrorMsg('');
    setManualSubmitted(false);
    try {
      const res = await api.post('/orders', {
        plan: selectedPlan,
        durationMonths,
        targetOrgId: targetOrg ? targetOrg._id : undefined,
      });

      if (res.success && res.data) {
        setCreatedOrder({
          ...res.data.order,
          transferContent: res.data.transferContent,
        });
        if (res.data.paymentConfig) {
          setPaymentConfig(res.data.paymentConfig);
        }
        setStep('PAYMENT_QR');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Tạo đơn hàng thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmittedClick = () => {
    setManualSubmitted(true);
  };

  const handleCopyAcc = () => {
    if (paymentConfig.accountNumber) {
      navigator.clipboard.writeText(paymentConfig.accountNumber);
      setCopiedAcc(true);
      setTimeout(() => setCopiedAcc(false), 2000);
    }
  };

  const handleCopyContent = () => {
    const content = createdOrder?.transferContent || `${paymentConfig.orderPrefix} ${createdOrder?.orderCode}`;
    if (content) {
      navigator.clipboard.writeText(content);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const vietQrUrl = createdOrder
    ? `https://img.vietqr.io/image/${paymentConfig.bankCode || 'MB'}-${paymentConfig.accountNumber || '5408092006'}-compact2.png?amount=${createdOrder.amount}&addInfo=${encodeURIComponent(createdOrder.transferContent || `${paymentConfig.orderPrefix} ${createdOrder.orderCode}`)}&accountName=${encodeURIComponent(paymentConfig.accountName || 'DO VAN KHOA')}`
    : '';

  // Helper theme for each package tier
  const getPlanTheme = (code) => {
    switch (code) {
      case 'BASIC':
        return {
          cardSelected: 'bg-sky-50/30 border-sky-400 ring-1 ring-sky-400/50 shadow-sm z-10',
          cardUnselected: 'bg-white border-slate-200 hover:border-sky-300 hover:shadow-md transition-all',
          badgeClass: 'bg-slate-100 text-slate-600',
          badgeText: 'Doanh Nghiệp Nhỏ',
          iconBg: 'bg-sky-50 text-sky-600 border border-sky-100',
          priceColor: 'text-sky-700',
          checkBg: 'text-sky-500',
          titleColor: 'text-slate-800',
          Icon: Briefcase
        };
      case 'PRO':
        return {
          cardSelected: 'bg-blue-50/30 border-blue-500 ring-1 ring-blue-500/50 shadow-md z-20',
          cardUnselected: 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-md transition-all',
          badgeClass: 'bg-blue-100 text-blue-700',
          badgeText: 'Phổ Biến Nhất',
          iconBg: 'bg-blue-50 text-blue-600 border border-blue-100',
          priceColor: 'text-blue-700',
          checkBg: 'text-blue-500',
          titleColor: 'text-slate-900',
          Icon: Zap
        };
      case 'VIP':
      case 'VIP_UNLIMITED':
        return {
          cardSelected: 'bg-purple-50/30 border-purple-400 ring-1 ring-purple-400/50 shadow-md z-10',
          cardUnselected: 'bg-white border-slate-200 hover:border-purple-300 hover:shadow-md transition-all',
          badgeClass: 'bg-purple-100 text-purple-700',
          badgeText: 'Đẳng Cấp Nhất',
          iconBg: 'bg-purple-50 text-purple-600 border border-purple-100',
          priceColor: 'text-purple-700',
          checkBg: 'text-purple-500',
          titleColor: 'text-slate-900',
          Icon: Crown
        };
      default:
        return {
          cardSelected: 'bg-slate-50 border-slate-400 shadow-sm',
          cardUnselected: 'bg-white border-slate-200',
          badgeClass: 'bg-slate-100 text-slate-600',
          badgeText: 'Nổi Bật',
          iconBg: 'bg-slate-100 text-slate-600',
          priceColor: 'text-slate-700',
          checkBg: 'text-slate-500',
          titleColor: 'text-slate-800',
          Icon: Star
        };
    }
  };

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[99999] bg-slate-900/40 backdrop-blur-sm p-0 sm:p-4 flex items-center justify-center animate-fade-in select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white sm:rounded-2xl w-full h-full sm:h-auto max-w-[1000px] sm:max-h-[95vh] flex flex-col shadow-xl border-0 sm:border sm:border-slate-100 text-slate-900 relative overflow-hidden"
      >
        {/* Header - Fixed at top */}
        <div className="flex-none p-4 sm:p-5 pb-3 sm:pb-4 flex items-center justify-between border-b border-slate-100 bg-white z-20 gap-2">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2 min-w-0">
              <Crown className="text-blue-600 shrink-0" size={20} />
              <span className="truncate break-words whitespace-normal">Nâng Cấp Gói Dịch Vụ</span>
            </h2>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5 text-xs text-slate-500 font-medium min-w-0">
              <span className="flex items-center gap-1 min-w-0">
                <Building size={13} className="text-slate-400 shrink-0" />
                <span className="font-semibold text-slate-700 truncate max-w-[150px] sm:max-w-none">{currentOrg.name || 'Tổ chức của tôi'}</span>
              </span>
              <span className="text-slate-300 hidden sm:inline">•</span>
              <span>Gói hiện tại:</span>
              <span className="font-bold text-slate-700 uppercase">
                 {currentPlanCode}
              </span>
              {hasTimeLeft && (
                <>
                  <span className="text-slate-300 hidden sm:inline">•</span>
                  <span className="text-emerald-600 flex items-center gap-1 font-semibold">
                    <Clock size={13} /> Còn {daysLeft} ngày
                  </span>
                </>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer shrink-0 ml-2"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-5 pt-4">
          
          {/* Global Messages */}
          {errorMsg && (
            <div className="bg-red-50 border border-red-100 p-3 rounded-lg text-sm text-red-700 font-medium mb-4 flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" /> {errorMsg}
            </div>
          )}

          {/* STEP 3: INSTANT SUCCESS CELEBRATION SCREEN */}
          {step === 'SUCCESS' ? (
            <div className="py-6 flex flex-col items-center text-center animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
                <CheckCircle2 size={32} strokeWidth={2.5} />
              </div>

              <h3 className="text-xl md:text-2xl font-bold text-slate-800 mb-2">
                Kích Hoạt Gói {createdOrder?.plan || selectedPlan} Thành Công!
              </h3>

              <p className="text-sm text-slate-500 max-w-md mb-6">
                Hệ thống đã nhận được thanh toán cho đơn hàng <strong>{createdOrder?.orderCode}</strong>. Gói dịch vụ đã được kích hoạt cho <strong>{currentOrg.name}</strong>.
              </p>

              {/* Receipt Card */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 w-full max-w-sm text-sm space-y-3 mb-6">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                  <span className="text-slate-500">Tổ chức:</span>
                  <strong className="text-slate-800 text-right">{currentOrg.name}</strong>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                  <span className="text-slate-500">Gói cước:</span>
                  <strong className="text-blue-700 text-right">Gói {createdOrder?.plan || selectedPlan}</strong>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                  <span className="text-slate-500">Gia hạn:</span>
                  <strong className="text-emerald-600 text-right">+{createdOrder?.durationMonths || durationMonths} Tháng</strong>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-slate-600 font-medium">Tổng thanh toán:</span>
                  <strong className="text-slate-900 text-lg text-right">{(createdOrder?.amount || totalPrice).toLocaleString('vi-VN')}đ</strong>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  refreshUser();
                }}
                className="w-full max-w-sm py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors cursor-pointer"
              >
                Bắt Đầu Trải Nghiệm
              </button>
            </div>
          ) : step === 'SELECT_PLAN' ? (
            <div>
              {/* Plan Selector Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mb-5">
                {plans.map((p) => {
                  const isSelected = selectedPlan === p.code;
                  const pLevel = planLevels[p.code] || 0;
                  const isLowerTier = pLevel < currentLevel;
                  const theme = getPlanTheme(p.code);
                  const PlanIcon = theme.Icon;

                  return (
                    <div
                      key={p.code}
                      onClick={() => {
                        if (!isLowerTier) setSelectedPlan(p.code);
                      }}
                      className={`rounded-xl p-4 relative flex flex-col justify-between 
                        ${isLowerTier ? 'opacity-50 cursor-not-allowed bg-slate-50/50' : 'cursor-pointer'} 
                        ${isSelected ? theme.cardSelected : isLowerTier ? 'border border-slate-200 grayscale' : theme.cardUnselected}
                      `}
                    >
                      {/* Header Icon + Subtitle + Badge */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${theme.iconBg}`}>
                            <PlanIcon size={14} strokeWidth={2.5} />
                          </div>
                          <span className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wide">
                            {p.subtitle || p.badge}
                          </span>
                        </div>

                        {(p.popular || p.code === 'PRO' || p.code === 'VIP') && !isLowerTier && (
                          <span className={`${theme.badgeClass} text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wide`}>
                            {p.code === 'PRO' ? 'Phổ Biến' : p.code === 'VIP' ? 'Cao Cấp' : theme.badgeText}
                          </span>
                        )}
                      </div>

                      <h3 className={`text-lg sm:text-xl font-bold ${theme.titleColor} mt-1 mb-2 flex items-center justify-between`}>
                        <span>{p.title}</span>
                        {isSelected && (
                          <CheckCircle2 size={18} className="text-blue-600 shrink-0" />
                        )}
                      </h3>

                      {/* Pricing Box */}
                      <div className="mb-4 flex items-baseline gap-1">
                        <span className={`text-xl sm:text-2xl font-bold ${theme.priceColor}`}>
                          {p.formattedPrice}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">{p.billingCycle}</span>
                      </div>

                      {/* Features List */}
                      <ul className="space-y-2 pt-3 border-t border-slate-100 text-xs text-slate-600">
                        {p.features?.map((feat, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <Check size={14} strokeWidth={3} className={`shrink-0 ${theme.checkBg} mt-0.5`} />
                            <span className="leading-snug">{feat}</span>
                          </li>
                        ))}
                      </ul>
                      
                      {isLowerTier && (
                         <div className="absolute top-2 right-2 text-[10px] font-medium bg-slate-200 text-slate-600 px-2 py-0.5 rounded">
                            Đang dùng
                         </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Warning Banner when Upgrading */}
              {isUpgrading && hasTimeLeft && (
                <div className="bg-orange-50 border border-orange-100 p-3 rounded-lg text-sm text-orange-800 mb-5 flex items-start sm:items-center gap-3">
                  <AlertCircle size={18} className="shrink-0 text-orange-500 mt-0.5 sm:mt-0" />
                  <div className="leading-snug">
                    <strong>Lưu ý:</strong> Bạn đang còn <strong className="text-orange-600">{daysLeft} ngày</strong> gói <strong>{currentPlanCode}</strong>. Thời gian này sẽ bị thay thế khi nâng cấp.
                  </div>
                </div>
              )}

              {/* Duration Selector */}
              <div className="bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-100 mb-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
                  <label className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                    <Clock size={16} className="text-slate-400" />
                    Chọn Thời Gian Đăng Ký:
                  </label>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {DURATION_OPTIONS.map((opt) => {
                    const isSelected = durationMonths === opt.months;

                    return (
                      <button
                        key={opt.months}
                        type="button"
                        onClick={() => setDurationMonths(opt.months)}
                        className={`py-2 px-2 sm:px-3 rounded-lg text-xs sm:text-sm font-semibold transition-colors border flex flex-col sm:flex-row items-center sm:justify-between gap-1 sm:gap-2 ${isSelected
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300'
                          }`}
                      >
                        <span>{opt.label}</span>
                        {opt.tag && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isSelected ? 'bg-blue-500 text-white' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                            }`}>
                            {opt.tag}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Total Calculation */}
                <div className="mt-4 pt-3 border-t border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600 font-medium">Tổng Thanh Toán ({durationMonths} tháng):</span>
                    {discountPercent > 0 && (
                      <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                        Tiết kiệm {totalSaved.toLocaleString('vi-VN')}đ
                      </span>
                    )}
                  </div>

                  <div className="flex items-baseline gap-2">
                    {discountPercent > 0 && (
                      <span className="text-sm line-through text-slate-400">
                        {rawTotalPrice.toLocaleString('vi-VN')}đ
                      </span>
                    )}
                    <span className="text-lg sm:text-xl font-bold text-blue-700">
                      {totalPrice.toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-xs text-slate-500 flex items-center justify-center gap-1.5">
                  <ShieldCheck size={16} className="text-emerald-500 shrink-0" /> Thanh toán an toàn qua mã QR
                </span>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-slate-200 text-slate-600 font-medium text-sm hover:bg-slate-50 transition-colors"
                  >
                    Hủy Bỏ
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleCreateOrder}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-blue-600 text-white font-semibold text-sm flex justify-center items-center gap-2 hover:bg-blue-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <QrCode size={16} />}
                    Thanh Toán Ngay
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* STEP 2: VIETQR PAYMENT MODAL */
            <div className="animate-fade-in max-w-3xl mx-auto w-full">
              <div className="bg-sky-50 border border-sky-100 p-3 rounded-lg flex items-start gap-2 mb-4">
                <Info size={18} className="text-sky-600 shrink-0 mt-0.5" />
                <p className="text-sm text-sky-800">
                  Vui lòng dùng ứng dụng ngân hàng quét mã QR bên dưới. Hệ thống sẽ tự động kích hoạt gói sau khi nhận được thanh toán thành công (thường mất 1-3 phút).
                </p>
              </div>

              <div className="flex flex-col md:flex-row gap-5 mb-5">
                {/* Left: QR Code Wrapper */}
                <div className="w-full md:w-[320px] shrink-0 bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col items-center justify-center">
                  <h3 className="font-bold text-slate-800 text-base mb-3 flex items-center gap-2">
                    <QrCode size={18} className="text-blue-600" />
                    Quét Mã VietQR
                  </h3>
                  
                  {qrLoading ? (
                    <div className="w-full aspect-square bg-slate-200/50 animate-pulse rounded-lg flex items-center justify-center">
                      <Loader2 size={32} className="animate-spin text-slate-400" />
                    </div>
                  ) : (
                    <div className="w-full aspect-square bg-white rounded-lg p-2 border border-slate-200 shadow-sm relative group overflow-hidden">
                      <img
                        src={paymentConfig.qrUrl || vietQrUrl}
                        alt="VietQR"
                        className="w-full h-full object-contain"
                      />
                      <div className="absolute inset-0 bg-blue-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                         <span className="text-white font-bold text-sm">Dùng App Ngân Hàng Quét</span>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify-center gap-3 w-full">
                    <img src="https://img.vietqr.io/image/vietqr.png" alt="Napas247" className="h-5 object-contain opacity-70" />
                  </div>
                </div>

                {/* Right: Bank Details */}
                <div className="flex-1 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <span className="text-slate-400 block text-[10px] font-semibold">Ngân Hàng:</span>
                      <strong className="text-slate-800 font-bold text-sm sm:text-base uppercase flex items-center gap-2">
                         {paymentConfig.bankId}
                      </strong>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <span className="text-slate-400 block text-[10px] font-semibold">Chủ Tài Khoản:</span>
                      <strong className="text-slate-800 font-bold text-xs sm:text-sm uppercase">{paymentConfig.accountName}</strong>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-slate-400 block text-[10px] font-semibold">Số Tài Khoản:</span>
                      <strong className="text-blue-700 font-mono font-bold text-sm sm:text-base">{paymentConfig.accountNumber}</strong>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyAcc}
                      className="px-3 py-1.5 rounded bg-white hover:bg-slate-100 text-slate-700 font-medium text-xs flex items-center gap-1.5 border border-slate-200 transition-colors"
                    >
                      {copiedAcc ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                      {copiedAcc ? 'Đã sao chép' : 'Sao chép'}
                    </button>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-slate-400 block text-[10px] font-semibold">Số Tiền Cần Chuyển:</span>
                      <strong className="text-emerald-600 font-bold text-sm sm:text-base">{createdOrder?.amount?.toLocaleString('vi-VN')} VNĐ</strong>
                    </div>
                  </div>

                  {/* Important Transfer Content */}
                  <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                    <span className="text-orange-800 block text-[10px] font-bold uppercase mb-1.5 flex items-center gap-1">
                      <AlertCircle size={13} className="text-orange-600" /> Nội Dung Chuyển Khoản (Bắt buộc):
                    </span>
                    <div className="flex flex-wrap sm:flex-nowrap items-center justify-between bg-white p-2.5 rounded border border-orange-200 gap-2">
                      <span className="font-mono text-sm sm:text-base font-bold text-red-600 tracking-wider break-all">
                        {createdOrder?.transferContent}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyContent}
                        className="px-3 py-1.5 rounded bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-colors whitespace-nowrap shrink-0"
                      >
                        {copiedCode ? <Check size={14} /> : <Copy size={14} />}
                        {copiedCode ? 'Đã chép' : 'Copy Nội Dung'}
                      </button>
                    </div>
                  </div>

                </div>
              </div>

              {/* Action Buttons Step 2 */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep('SELECT_PLAN')}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 font-medium text-sm flex justify-center items-center gap-2 transition-colors"
                >
                  <ArrowLeft size={16} /> Chọn lại gói cước
                </button>

                <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto justify-end">
                  {!manualSubmitted && !successMsg && (
                    <button
                      type="button"
                      onClick={handleManualSubmittedClick}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm flex justify-center items-center gap-2 shadow-sm transition-colors"
                    >
                      <CheckCircle2 size={16} /> Đã Chuyển Khoản
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-semibold text-sm shadow-sm transition-colors"
                  >
                    Đóng
                  </button>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default RenewalModal;
