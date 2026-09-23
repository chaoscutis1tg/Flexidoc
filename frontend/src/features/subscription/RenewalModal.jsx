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
  Star
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
          cardSelected: 'bg-gradient-to-b from-sky-50 via-cyan-50/30 to-white border-sky-500 ring-2 ring-sky-400/25 shadow-xl shadow-sky-500/15',
          cardUnselected: 'bg-white border-slate-200 hover:border-sky-300 hover:shadow-lg hover:shadow-sky-500/5',
          badgeClass: 'bg-sky-600 text-white shadow-sm shadow-sky-500/30',
          badgeText: 'Doanh Nghiệp Nhỏ',
          iconBg: 'bg-sky-100 text-sky-600 border border-sky-200',
          priceColor: 'text-sky-600 font-black',
          checkBg: 'bg-sky-100 text-sky-600',
          topAccent: 'from-sky-500 via-cyan-500 to-teal-400',
          titleColor: 'text-slate-900',
          Icon: Briefcase
        };
      case 'PRO':
        return {
          cardSelected: 'bg-gradient-to-b from-indigo-50 via-blue-50/30 to-white border-indigo-500 ring-2 ring-indigo-400/25 shadow-xl shadow-indigo-500/20',
          cardUnselected: 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-500/5',
          badgeClass: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/30',
          badgeText: 'Phổ Biến Nhất',
          iconBg: 'bg-indigo-100 text-indigo-600 border border-indigo-200',
          priceColor: 'text-indigo-600 font-black',
          checkBg: 'bg-indigo-100 text-indigo-600',
          topAccent: 'from-blue-600 via-indigo-600 to-purple-600',
          titleColor: 'text-slate-900',
          Icon: Zap
        };
      case 'VIP':
      case 'VIP_UNLIMITED':
        return {
          cardSelected: 'bg-gradient-to-b from-purple-50 via-amber-50/20 to-white border-purple-500 ring-2 ring-purple-400/30 shadow-2xl shadow-purple-500/25',
          cardUnselected: 'bg-white border-purple-200 hover:border-purple-300 hover:shadow-xl hover:shadow-purple-500/10',
          badgeClass: 'bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 text-white shadow-md shadow-purple-500/30',
          badgeText: 'Đẳng Cấp Nhất',
          iconBg: 'bg-gradient-to-br from-purple-100 to-amber-100 text-purple-700 border border-purple-300',
          priceColor: 'text-purple-700 font-black',
          checkBg: 'bg-purple-100 text-purple-700',
          topAccent: 'from-purple-600 via-pink-600 to-amber-500',
          titleColor: 'text-slate-900',
          Icon: Crown
        };
      default:
        return {
          cardSelected: 'bg-sky-50 border-sky-500 shadow-md',
          cardUnselected: 'bg-white border-slate-200',
          badgeClass: 'bg-sky-600 text-white',
          badgeText: 'Nổi Bật',
          iconBg: 'bg-sky-100 text-sky-600',
          priceColor: 'text-sky-600 font-black',
          checkBg: 'bg-emerald-100 text-emerald-600',
          topAccent: 'from-sky-500 to-blue-600',
          titleColor: 'text-slate-900',
          Icon: Star
        };
    }
  };

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-md p-3 sm:p-4 flex items-center justify-center animate-backdrop select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl p-4 sm:p-5 max-w-5xl w-[95vw] shadow-2xl border border-slate-200 animate-modal-pop text-slate-900 relative z-10 overflow-hidden"
      >

        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 mb-3">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <Crown className="text-purple-600 shrink-0" size={20} />
              <span>Nâng Cấp Gói Dịch Vụ Cho Tổ Chức</span>
            </h2>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 font-medium">
              <span>Đơn vị:</span>
              <span className="font-extrabold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-md border border-sky-200 flex items-center gap-1">
                <Building size={12} /> {currentOrg.name || 'Tổ chức của tôi'} ({currentOrg.code || 'MAIN'})
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Global Messages */}
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 p-2.5 rounded-xl text-xs text-red-800 font-bold mb-3 flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" /> {errorMsg}
          </div>
        )}

        {/* STEP 3: INSTANT SUCCESS CELEBRATION SCREEN */}
        {step === 'SUCCESS' ? (
          <div className="py-4 px-2 flex flex-col items-center text-center animate-fade-in select-none">
            {/* Expanding Glow Ripple Wave Effect */}
            <div className="relative flex items-center justify-center my-3">
              <div className="absolute w-24 h-24 rounded-full bg-emerald-500/20 animate-ping duration-1000" />
              <div className="absolute w-20 h-20 rounded-full bg-emerald-400/25 animate-pulse" />
              <div className="absolute w-16 h-16 rounded-full bg-emerald-500/30 blur-xs" />
              <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700 text-white flex items-center justify-center shadow-xl shadow-emerald-600/40 border-2 border-white/60">
                <CheckCircle2 size={32} strokeWidth={2.5} />
              </div>
            </div>

            <span className="text-xs font-black text-emerald-700 uppercase tracking-widest bg-emerald-50 px-3 py-0.5 rounded-full border border-emerald-200/90 mb-2 shadow-2xs">
              ⚡ Giao Dịch Đã Xác Nhận Thành Công
            </span>

            <h3 className="text-xl md:text-2xl font-black text-slate-900 mb-1.5 tracking-tight">
              🎉 Kích Hoạt Gói {createdOrder?.plan || selectedPlan} Thành Công!
            </h3>

            <p className="text-xs text-slate-600 font-medium max-w-md mb-4 leading-relaxed">
              Hệ thống đã nhận được thanh toán cho đơn hàng <strong className="font-mono text-slate-900">{createdOrder?.orderCode}</strong>. Gói dịch vụ đã được kích hoạt tự động cho tổ chức <strong className="text-sky-700">{currentOrg.name}</strong>.
            </p>

            {/* Receipt Card */}
            <div className="bg-gradient-to-b from-slate-50 to-white border border-slate-200/90 rounded-2xl p-4 w-full max-w-md text-xs space-y-2.5 mb-5 shadow-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <span className="text-slate-500 font-bold">Tổ chức nâng cấp:</span>
                <strong className="text-slate-900 font-black">{currentOrg.name} ({currentOrg.code})</strong>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <span className="text-slate-500 font-bold">Gói cước đã chọn:</span>
                <span className="font-black text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-lg border border-sky-200/80">
                  Gói {createdOrder?.plan || selectedPlan}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <span className="text-slate-500 font-bold">Thời gian gia hạn:</span>
                <strong className="text-emerald-700 font-black">+{createdOrder?.durationMonths || durationMonths} Tháng</strong>
              </div>
              <div className="flex justify-between items-center pt-0.5">
                <span className="text-slate-500 font-bold">Số tiền đã thanh toán:</span>
                <strong className="text-slate-900 font-black text-sm md:text-base">{(createdOrder?.amount || totalPrice).toLocaleString('vi-VN')} VNĐ</strong>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                refreshUser();
              }}
              className="w-full max-w-md py-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs md:text-sm shadow-xl shadow-emerald-600/30 hover:shadow-emerald-600/40 hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Sparkles size={16} /> Bắt Đầu Sử Dụng Ngay
            </button>
          </div>
        ) : step === 'SELECT_PLAN' ? (
          <div>
            {/* Plan Selector Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3.5">
              {plans.map((p) => {
                const isSelected = selectedPlan === p.code;
                const theme = getPlanTheme(p.code);
                const PlanIcon = theme.Icon;

                return (
                  <div
                    key={p.code}
                    onClick={() => setSelectedPlan(p.code)}
                    className={`rounded-2xl p-3.5 cursor-pointer relative border transition-all duration-300 flex flex-col justify-between group ${isSelected ? theme.cardSelected : theme.cardUnselected
                      }`}
                  >
                    {/* Top Accent Gradient Bar when Selected */}
                    {isSelected && (
                      <div className={`absolute top-0 left-0 right-0 h-1.5 rounded-t-2xl bg-gradient-to-r ${theme.topAccent}`} />
                    )}

                    <div>
                      {/* Header Icon + Subtitle + Badge */}
                      <div className="flex items-center justify-between gap-1.5 mb-1.5 mt-0.5">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${theme.iconBg} shadow-2xs`}>
                            <PlanIcon size={14} />
                          </div>
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                            {p.subtitle || p.badge}
                          </span>
                        </div>

                        {(p.popular || p.code === 'PRO' || p.code === 'VIP') && (
                          <span className={`${theme.badgeClass} text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap`}>
                            {p.code === 'PRO' ? 'Phổ Biến Nhất' : p.code === 'VIP' ? 'Đẳng Cấp Nhất' : theme.badgeText}
                          </span>
                        )}
                      </div>

                      <h3 className={`text-base sm:text-lg font-black ${theme.titleColor} mt-0.5 mb-1.5 flex items-center justify-between`}>
                        <span>{p.title}</span>
                        {isSelected && (
                          <span className="text-[9.5px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1 whitespace-nowrap">
                            <CheckCircle2 size={10} /> Đã Chọn
                          </span>
                        )}
                      </h3>

                      {/* Pricing Box */}
                      <div className="my-1.5 py-1.5 px-2.5 rounded-xl bg-slate-50/90 border border-slate-200/80 flex items-baseline gap-1">
                        <span className={`text-lg sm:text-xl ${theme.priceColor}`}>
                          {p.formattedPrice}
                        </span>
                        <span className="text-[11px] text-slate-500 font-bold">{p.billingCycle}</span>
                      </div>
                    </div>

                    {/* Features List */}
                    <ul className="space-y-1.5 pt-2 border-t border-slate-200/60 text-[11px] text-slate-700 font-medium">
                      {p.features?.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${theme.checkBg}`}>
                            <Check size={9} strokeWidth={3} />
                          </div>
                          <span className="leading-tight font-medium text-slate-700">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>

            {/* Duration Selector */}
            <div className="bg-gradient-to-r from-slate-50 to-slate-100/70 p-3 rounded-2xl border border-slate-200 mb-3.5 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                  <Clock size={14} className="text-sky-600" />
                  <span>Chọn Thời Gian Gia Hạn / Đăng Ký:</span>
                </label>
                <span className="text-[10.5px] text-slate-500 font-semibold hidden sm:inline">
                  Đăng ký nhiều tháng để nhận chiết khấu tiết kiệm
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {DURATION_OPTIONS.map((opt) => {
                  const isSelected = durationMonths === opt.months;

                  return (
                    <button
                      key={opt.months}
                      type="button"
                      onClick={() => setDurationMonths(opt.months)}
                      className={`py-2 px-2.5 rounded-xl text-xs font-black transition-all cursor-pointer border flex items-center justify-between relative ${isSelected
                        ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white border-transparent shadow-md shadow-sky-600/25 scale-[1.01]'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                    >
                      <span>{opt.label}</span>
                      {opt.tag && (
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider ${isSelected ? 'bg-amber-400 text-slate-950 shadow-2xs' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}>
                          {opt.tag}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Total Calculation */}
              <div className="mt-2.5 pt-2 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs font-extrabold text-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-slate-600">Tổng Tiền Thanh Toán ({durationMonths} tháng):</span>
                  {discountPercent > 0 && (
                    <span className="text-[10.5px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Tiết kiệm {totalSaved.toLocaleString('vi-VN')}đ (-{discountPercent}%)
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-2">
                  {discountPercent > 0 && (
                    <span className="text-xs line-through text-slate-400 font-bold">
                      {rawTotalPrice.toLocaleString('vi-VN')}đ
                    </span>
                  )}
                  <span className="text-base sm:text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-700">
                    {totalPrice.toLocaleString('vi-VN')} VNĐ
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2.5 border-t border-slate-200">
              <span className="text-[11px] text-slate-600 font-medium flex items-center gap-1.5 bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-xl border border-emerald-200/80">
                <ShieldCheck size={16} className="text-emerald-600 shrink-0" /> Kích hoạt tự động 24/7 qua Ngân Hàng
              </span>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleCreateOrder}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-600 to-emerald-600 text-white font-extrabold text-xs md:text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/45 hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer"
                >
                  {loading ? <Loader2 size={15} className="animate-spin" /> : <QrCode size={16} />}
                  Thanh Toán Ngay ({totalPrice.toLocaleString('vi-VN')}đ)
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* STEP 2: VIETQR PAYMENT MODAL */
          <div className="space-y-4 animate-fade-in">
            {successMsg && (
              <div className="bg-emerald-50 border border-emerald-300 p-3 rounded-2xl text-xs text-emerald-900 font-bold flex items-center gap-3">
                <CheckCircle2 size={22} className="text-emerald-600 shrink-0" />
                <div>
                  <div className="text-xs font-black text-emerald-800">Thanh Toán Hoàn Tất!</div>
                  <div>{successMsg}</div>
                </div>
              </div>
            )}

            {manualSubmitted && !successMsg && (
              <div className="bg-sky-50 border border-sky-300 p-3 rounded-2xl text-xs text-sky-900 font-bold flex items-center gap-3 animate-fade-in">
                <CheckCircle2 size={22} className="text-sky-600 shrink-0" />
                <div>
                  <div className="text-xs font-black text-sky-900">Đã Ghi Nhận Thông Báo Chuyển Khoản!</div>
                  <div>Đơn hàng <span className="font-mono text-sky-700">{createdOrder?.orderCode}</span> đã hiển thị trên Danh Sách Đơn Hàng Dịch Vụ. Admin sẽ kiểm tra nội dung <code className="font-mono bg-sky-100 px-1 py-0.5 rounded text-sky-800">{createdOrder?.transferContent}</code> và xác nhận cho bạn.</div>
                </div>
              </div>
            )}

            {/* Notification Banner */}
            {!successMsg && !manualSubmitted && (
              <div className="bg-amber-50/90 border border-amber-200/90 p-2.5 rounded-2xl text-xs text-amber-900 font-medium flex items-center gap-2.5 shadow-2xs">
                <div className="w-7 h-7 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0 text-amber-600">
                  <Clock size={16} />
                </div>
                <div className="flex-1">
                  <strong className="font-bold text-amber-950 block text-xs">Hệ thống đang tự động kiểm tra giao dịch...</strong>
                </div>
              </div>
            )}

            {/* Grid Container for VietQR & Bank Info */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-slate-50/80 p-4 rounded-2xl border border-slate-200">

              {/* Left Column: VietQR Image (5 cols) */}
              <div className="md:col-span-5 flex flex-col items-center justify-center bg-white p-3 rounded-2xl border border-slate-200 shadow-sm text-center">
                <div className="text-xs font-black text-slate-800 mb-1.5 flex items-center gap-1.5">
                  <QrCode size={16} className="text-sky-600" />
                  <span>Mã VietQR Quét Nhanh Ngân Hàng</span>
                </div>

                <div className="bg-white p-1.5 rounded-xl border border-slate-200 shadow-inner my-1">
                  <img
                    src={vietQrUrl}
                    alt="VietQR Payment"
                    className="w-44 h-44 object-contain rounded-lg"
                  />
                </div>
              </div>

              {/* Right Column: Bank Details (7 cols) */}
              <div className="md:col-span-7 flex flex-col justify-between space-y-2.5">
                <span className="text-xs font-black text-sky-700 uppercase tracking-wider block">
                  Thông Tin Chuyển Khoản Thủ Công
                </span>

                <div className="space-y-2 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <span className="text-slate-400 block text-[10px] font-bold">Ngân Hàng:</span>
                      <strong className="text-slate-900 font-black text-xs sm:text-sm">{paymentConfig.bankName}</strong>
                    </div>

                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <span className="text-slate-400 block text-[10px] font-bold">Chủ Tài Khoản:</span>
                      <strong className="text-slate-900 font-black text-xs sm:text-sm uppercase">{paymentConfig.accountName}</strong>
                    </div>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-slate-400 block text-[10px] font-bold">Số Tài Khoản:</span>
                      <strong className="text-sky-700 font-mono font-black text-sm sm:text-base">{paymentConfig.accountNumber}</strong>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyAcc}
                      className="px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-xs flex items-center gap-1 border border-sky-200 cursor-pointer transition-all active:scale-95"
                    >
                      {copiedAcc ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                      {copiedAcc ? 'Đã sao chép' : 'Sao chép STK'}
                    </button>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-slate-400 block text-[10px] font-bold">Số Tiền Cần Chuyển:</span>
                      <strong className="text-emerald-700 font-black text-sm sm:text-base">{createdOrder?.amount?.toLocaleString('vi-VN')} VNĐ</strong>
                    </div>
                  </div>

                  {/* Important Transfer Content */}
                  <div className="bg-amber-100/80 p-3 rounded-xl border border-amber-300 shadow-2xs">
                    <span className="text-amber-900 block text-[10.5px] font-black uppercase mb-1 flex items-center gap-1">
                      <AlertCircle size={13} className="text-amber-600" /> Nội Dung Chuyển Khoản (Bắt buộc):
                    </span>
                    <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-amber-300">
                      <span className="font-mono text-sm sm:text-base font-black text-red-600 tracking-wider">
                        {createdOrder?.transferContent}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyContent}
                        className="px-2.5 py-1 rounded-md bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs flex items-center gap-1 cursor-pointer shadow-xs transition-all active:scale-95 whitespace-nowrap"
                      >
                        {copiedCode ? <Check size={13} /> : <Copy size={13} />}
                        {copiedCode ? 'Đã sao chép' : 'Sao chép nội dung'}
                      </button>
                    </div>
                  </div>

                </div>
              </div>

            </div>

            {/* FULL WIDTH BOTTOM ACTION BUTTONS */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setStep('SELECT_PLAN')}
                className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
              >
                <ArrowLeft size={15} /> Chọn lại gói cước
              </button>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                {!manualSubmitted && !successMsg && (
                  <button
                    type="button"
                    onClick={handleManualSubmittedClick}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/25 hover:shadow-emerald-600/40 hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                  >
                    <CheckCircle2 size={16} /> Tôi Đã Chuyển Khoản Thành Công
                  </button>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm cursor-pointer whitespace-nowrap"
                >
                  Đóng
                </button>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>,
    document.body
  );
};
