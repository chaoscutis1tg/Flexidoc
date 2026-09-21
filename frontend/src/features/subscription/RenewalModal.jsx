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
    orderPrefix: 'MTCTMS',
  });

  const [loading, setLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedAcc, setCopiedAcc] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [manualSubmitted, setManualSubmitted] = useState(false);

  // Fetch commercial plans and payment config on modal open
  useEffect(() => {
    if (isOpen) {
      setStep('SELECT_PLAN');
      setCreatedOrder(null);
      setSuccessMsg('');
      setErrorMsg('');
      setManualSubmitted(false);

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

  const DURATION_OPTIONS = [
    { months: 1, label: '1 Tháng', discountPercent: 0, tag: null },
    { months: 3, label: '3 Tháng', discountPercent: 5, tag: 'Giảm 5%' },
    { months: 6, label: '6 Tháng', discountPercent: 10, tag: 'Giảm 10%' },
    { months: 12, label: '12 Tháng', discountPercent: 20, tag: 'Giảm 20%' },
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
        className="bg-white rounded-3xl p-5 sm:p-7 max-w-5xl w-[96vw] max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 animate-modal-pop text-slate-900 relative z-10"
      >

        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 mb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
              <Crown className="text-purple-600 shrink-0" size={22} />
              <span>Nâng Cấp Gói Dịch Vụ Cho Tổ Chức</span>
            </h2>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 font-medium">
              <span>Đơn vị:</span>
              <span className="font-extrabold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-md border border-sky-200 flex items-center gap-1">
                <Building size={13} /> {currentOrg.name || 'Tổ chức của tôi'} ({currentOrg.code || 'MAIN'})
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
          <div className="bg-red-50 border border-red-200 p-3.5 rounded-xl text-xs text-red-800 font-bold mb-4 flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" /> {errorMsg}
          </div>
        )}

        {/* STEP 3: INSTANT SUCCESS CELEBRATION SCREEN */}
        {step === 'SUCCESS' ? (
          <div className="py-8 px-4 flex flex-col items-center justify-center text-center animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-emerald-100 border-4 border-emerald-500/20 flex items-center justify-center text-emerald-600 mb-5 shadow-lg shadow-emerald-500/20 animate-bounce">
              <CheckCircle2 size={48} />
            </div>

            <span className="text-xs font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 mb-2">
              SePay Webhook 24/7 • Đã Xác Nhận Thanh Toán
            </span>

            <h3 className="text-2xl md:text-3xl font-black text-slate-900 mb-2">
              🎉 Kích Hoạt Gói {createdOrder?.plan || selectedPlan} Thành Công!
            </h3>

            <p className="text-xs md:text-sm text-slate-600 font-medium max-w-lg mb-6 leading-relaxed">
              Hệ thống đã nhận được tiền chuyển khoản cho đơn hàng <strong className="font-mono text-slate-900">{createdOrder?.orderCode}</strong>. Gói dịch vụ đã được tự động kích hoạt & cộng dồn thời hạn cho tổ chức <strong className="text-sky-700">{currentOrg.name}</strong>.
            </p>

            {/* Receipt Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 w-full max-w-md text-xs space-y-3 mb-6 shadow-sm">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-bold">Tổ chức nâng cấp:</span>
                <strong className="text-slate-900 font-black">{currentOrg.name} ({currentOrg.code})</strong>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-bold">Gói cước đã chọn:</span>
                <span className="font-black text-sky-700 bg-sky-100 px-2.5 py-0.5 rounded-md border border-sky-200">
                  Gói {createdOrder?.plan || selectedPlan}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-bold">Thời gian cộng dồn:</span>
                <strong className="text-emerald-700 font-black">+{createdOrder?.durationMonths || durationMonths} Tháng</strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-bold">Số tiền đã thanh toán:</span>
                <strong className="text-slate-900 font-black text-sm">{(createdOrder?.amount || totalPrice).toLocaleString('vi-VN')} VNĐ</strong>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                refreshUser();
              }}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-sm md:text-base shadow-xl shadow-emerald-600/30 hover:shadow-emerald-600/40 hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
            >
              <Sparkles size={18} /> Bắt Đầu Sử Dụng Ngay
            </button>
          </div>
        ) : step === 'SELECT_PLAN' ? (
          <div>
            {/* Plan Selector Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
              {plans.map((p) => {
                const isSelected = selectedPlan === p.code;
                const theme = getPlanTheme(p.code);
                const PlanIcon = theme.Icon;

                return (
                  <div
                    key={p.code}
                    onClick={() => setSelectedPlan(p.code)}
                    className={`rounded-2xl p-4 sm:p-5 cursor-pointer relative border transition-all duration-300 flex flex-col justify-between group ${
                      isSelected ? theme.cardSelected : theme.cardUnselected
                    }`}
                  >
                    {/* Top Accent Gradient Bar when Selected */}
                    {isSelected && (
                      <div className={`absolute top-0 left-0 right-0 h-1.5 rounded-t-2xl bg-gradient-to-r ${theme.topAccent}`} />
                    )}

                    <div>
                      {/* Header Icon + Subtitle + Badge */}
                      <div className="flex items-center justify-between gap-2 mb-2 mt-0.5">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${theme.iconBg} shadow-2xs`}>
                            <PlanIcon size={15} />
                          </div>
                          <span className="text-[10px] sm:text-[10.5px] font-extrabold text-slate-400 uppercase tracking-wider block">
                            {p.subtitle || p.badge}
                          </span>
                        </div>

                        {(p.popular || p.code === 'PRO' || p.code === 'VIP') && (
                          <span className={`${theme.badgeClass} text-[9.5px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap`}>
                            {p.code === 'PRO' ? 'Phổ Biến Nhất' : p.code === 'VIP' ? 'Đẳng Cấp Nhất' : theme.badgeText}
                          </span>
                        )}
                      </div>

                      <h3 className={`text-lg sm:text-xl font-black ${theme.titleColor} mt-1 mb-2 flex items-center justify-between`}>
                        <span>{p.title}</span>
                        {isSelected && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1 whitespace-nowrap">
                            <CheckCircle2 size={11} /> Đã Chọn
                          </span>
                        )}
                      </h3>

                      {/* Pricing Box */}
                      <div className="my-2.5 py-2 px-3 rounded-xl bg-slate-50/90 border border-slate-200/80 flex items-baseline gap-1">
                        <span className={`text-xl sm:text-2xl ${theme.priceColor}`}>
                          {p.formattedPrice}
                        </span>
                        <span className="text-xs text-slate-500 font-bold">{p.billingCycle}</span>
                      </div>
                    </div>

                    {/* Features List */}
                    <ul className="space-y-2 pt-3 border-t border-slate-200/60 text-xs text-slate-700 font-medium">
                      {p.features?.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${theme.checkBg}`}>
                            <Check size={10} strokeWidth={3} />
                          </div>
                          <span className="leading-snug font-medium text-slate-700">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>

            {/* Duration Selector */}
            <div className="bg-gradient-to-r from-slate-50 to-slate-100/70 p-4 rounded-2xl border border-slate-200 mb-5 shadow-2xs">
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                  <Clock size={15} className="text-sky-600" />
                  <span>Chọn Thời Gian Gia Hạn / Đăng Ký:</span>
                </label>
                <span className="text-[11px] text-slate-500 font-semibold hidden sm:inline">
                  Đăng ký nhiều tháng để nhận chiết khấu tiết kiệm
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {DURATION_OPTIONS.map((opt) => {
                  const isSelected = durationMonths === opt.months;

                  return (
                    <button
                      key={opt.months}
                      type="button"
                      onClick={() => setDurationMonths(opt.months)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer border flex items-center justify-between relative ${
                        isSelected
                          ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white border-transparent shadow-md shadow-sky-600/25 scale-[1.01]'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {opt.tag && (
                        <span className={`text-[9.5px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
                          isSelected ? 'bg-amber-400 text-slate-950 shadow-2xs' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}>
                          {opt.tag}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Total Calculation */}
              <div className="mt-3.5 pt-3 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs font-extrabold text-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-slate-600">Tổng Tiền Thanh Toán ({durationMonths} tháng):</span>
                  {discountPercent > 0 && (
                    <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
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
                  <span className="text-lg sm:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-700">
                    {totalPrice.toLocaleString('vi-VN')} VNĐ
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <span className="text-xs text-slate-600 font-medium flex items-center gap-2 bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-xl border border-emerald-200/80">
                <ShieldCheck size={18} className="text-emerald-600 shrink-0" /> Kích hoạt tự động 24/7 qua SePay Webhook
              </span>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleCreateOrder}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-600 to-emerald-600 text-white font-extrabold text-xs md:text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/45 hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <QrCode size={18} />}
                  Thanh Toán Ngay ({totalPrice.toLocaleString('vi-VN')}đ)
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* STEP 2: VIETQR PAYMENT MODAL */
          <div className="space-y-5 animate-fade-in">
            {successMsg && (
              <div className="bg-emerald-50 border border-emerald-300 p-4 rounded-2xl text-xs text-emerald-900 font-bold flex items-center gap-3">
                <CheckCircle2 size={24} className="text-emerald-600 shrink-0" />
                <div>
                  <div className="text-sm font-black text-emerald-800">Thanh Toán Hoàn Tất!</div>
                  <div>{successMsg}</div>
                </div>
              </div>
            )}

            {manualSubmitted && !successMsg && (
              <div className="bg-sky-50 border border-sky-300 p-4 rounded-2xl text-xs text-sky-900 font-bold flex items-center gap-3 animate-fade-in">
                <CheckCircle2 size={24} className="text-sky-600 shrink-0" />
                <div>
                  <div className="text-sm font-black text-sky-900">Đã Ghi Nhận Thông Báo Chuyển Khoản!</div>
                  <div>Đơn hàng <span className="font-mono text-sky-700">{createdOrder?.orderCode}</span> đã hiển thị trên Danh Sách Đơn Hàng Dịch Vụ (Trạng thái: <strong>Chờ thanh toán / xác nhận</strong>). Admin sẽ kiểm tra nội dung <code className="font-mono bg-sky-100 px-1 py-0.5 rounded text-sky-800">{createdOrder?.transferContent}</code> và xác nhận cho bạn.</div>
                </div>
              </div>
            )}

            {/* Notification Banner */}
            {!successMsg && !manualSubmitted && (
              <div className="bg-amber-50/90 border border-amber-200/90 p-3.5 rounded-2xl text-xs text-amber-900 font-medium flex items-center gap-3 shadow-2xs">
                <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0 text-amber-600">
                  <Clock size={18} />
                </div>
                <div className="flex-1">
                  <strong className="font-bold text-amber-950 block text-xs">Hệ thống đang tự động kiểm tra giao dịch...</strong>
                </div>
              </div>
            )}

            {/* Grid Container for VietQR & Bank Info */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-slate-50/80 p-5 rounded-2xl border border-slate-200">

              {/* Left Column: VietQR Image (5 cols) */}
              <div className="md:col-span-5 flex flex-col items-center justify-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
                <div className="text-xs font-black text-slate-800 mb-2 flex items-center gap-1.5">
                  <QrCode size={18} className="text-sky-600" />
                  <span>Mã VietQR Quét Nhanh Ngân Hàng</span>
                </div>

                <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-inner my-1">
                  <img
                    src={vietQrUrl}
                    alt="VietQR Payment"
                    className="w-52 h-52 object-contain rounded-lg"
                  />
                </div>
              </div>

              {/* Right Column: Bank Details (7 cols) */}
              <div className="md:col-span-7 flex flex-col justify-between space-y-3">
                <span className="text-xs font-black text-sky-700 uppercase tracking-wider block">
                  Thông Tin Chuyển Khoản Thủ Công
                </span>

                <div className="space-y-2.5 text-xs">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                      <span className="text-slate-400 block text-[10.5px] font-bold">Ngân Hàng:</span>
                      <strong className="text-slate-900 font-black text-sm">{paymentConfig.bankName}</strong>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                      <span className="text-slate-400 block text-[10.5px] font-bold">Chủ Tài Khoản:</span>
                      <strong className="text-slate-900 font-black text-sm uppercase">{paymentConfig.accountName}</strong>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-slate-400 block text-[10.5px] font-bold">Số Tài Khoản:</span>
                      <strong className="text-sky-700 font-mono font-black text-base">{paymentConfig.accountNumber}</strong>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyAcc}
                      className="px-3 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-xs flex items-center gap-1 border border-sky-200 cursor-pointer transition-all active:scale-95"
                    >
                      {copiedAcc ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                      {copiedAcc ? 'Đã sao chép' : 'Sao chép STK'}
                    </button>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-slate-400 block text-[10.5px] font-bold">Số Tiền Cần Chuyển:</span>
                      <strong className="text-emerald-700 font-black text-base">{createdOrder?.amount?.toLocaleString('vi-VN')} VNĐ</strong>
                    </div>
                  </div>

                  {/* Important Transfer Content */}
                  <div className="bg-amber-100/80 p-3.5 rounded-xl border border-amber-300 shadow-2xs">
                    <span className="text-amber-900 block text-[11px] font-black uppercase mb-1 flex items-center gap-1">
                      <AlertCircle size={14} className="text-amber-600" /> Nội Dung Chuyển Khoản (Bắt buộc):
                    </span>
                    <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-amber-300">
                      <span className="font-mono text-base font-black text-red-600 tracking-wider">
                        {createdOrder?.transferContent}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyContent}
                        className="px-3 py-1.5 rounded-md bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-95 whitespace-nowrap"
                      >
                        {copiedCode ? <Check size={14} /> : <Copy size={14} />}
                        {copiedCode ? 'Đã sao chép' : 'Sao chép nội dung'}
                      </button>
                    </div>
                  </div>

                </div>
              </div>

            </div>

            {/* FULL WIDTH BOTTOM ACTION BUTTONS */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setStep('SELECT_PLAN')}
                className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap"
              >
                <ArrowLeft size={16} /> Chọn lại gói cước
              </button>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                {!manualSubmitted && !successMsg && (
                  <button
                    type="button"
                    onClick={handleManualSubmittedClick}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs md:text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/25 hover:shadow-emerald-600/40 hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                  >
                    <CheckCircle2 size={18} /> Tôi Đã Chuyển Khoản Thành Công
                  </button>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs md:text-sm shadow-sm cursor-pointer whitespace-nowrap"
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
