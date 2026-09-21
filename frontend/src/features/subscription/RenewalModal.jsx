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
  Clock
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

  if (!isOpen) return null;

  const currentOrg = targetOrg || user?.organizationId || {};
  const currentPlanObj = plans.find((p) => p.code === selectedPlan) || plans[0];
  const unitPrice = currentPlanObj ? (currentPlanObj.price || 199000) : 199000;
  const totalPrice = unitPrice * durationMonths;

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

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-md p-4 flex items-center justify-center animate-backdrop select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl p-6 sm:p-8 max-w-4xl w-[95vw] max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 animate-modal-pop text-slate-900 relative z-10"
      >

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-5">
          <div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Crown className="text-sky-600 shrink-0" size={24} />
              <span>Nâng Cấp Gói Dịch Vụ Cho Tổ Chức</span>
            </h2>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 font-medium">
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {plans.map((p) => {
                const isSelected = selectedPlan === p.code;
                const isVip = p.code === 'VIP';

                return (
                  <div
                    key={p.code}
                    onClick={() => setSelectedPlan(p.code)}
                    className={`rounded-2xl p-5 cursor-pointer relative border transition-all flex flex-col justify-between ${isSelected
                      ? isVip
                        ? 'bg-purple-50/60 border-purple-500 shadow-md shadow-purple-500/10'
                        : 'bg-sky-50/60 border-sky-500 shadow-md shadow-sky-500/10'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                  >
                    {p.popular && (
                      <div className="absolute -top-2.5 right-4 bg-sky-600 text-white text-[9.5px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-2xs">
                        Phổ biến nhất
                      </div>
                    )}

                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                        {p.subtitle || p.badge}
                      </span>
                      <h3 className="text-xl font-black text-slate-900 mt-0.5">{p.title}</h3>
                      <div className="my-3 flex items-baseline gap-1">
                        <span className="text-2xl font-black text-sky-600">
                          {p.formattedPrice}
                        </span>
                        <span className="text-xs text-slate-500 font-bold">{p.billingCycle}</span>
                      </div>
                    </div>

                    <ul className="space-y-2 pt-3 border-t border-slate-100 text-xs text-slate-600 font-medium">
                      {p.features?.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <Check size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>

            {/* Duration Selector */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-6">
              <label className="text-xs font-bold text-slate-700 block mb-2">
                Chọn Thời Gian Gia Hạn / Đăng Ký:
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { months: 1, label: '1 Tháng' },
                  { months: 3, label: '3 Tháng' },
                  { months: 6, label: '6 Tháng' },
                  { months: 12, label: '12 Tháng' },
                ].map((opt) => (
                  <button
                    key={opt.months}
                    type="button"
                    onClick={() => setDurationMonths(opt.months)}
                    className={`py-2 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer border ${durationMonths === opt.months
                      ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Total Calculation */}
              <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs font-extrabold text-slate-800">
                <span>Tổng Tiền Thanh Toán ({durationMonths} tháng):</span>
                <span className="text-lg font-black text-sky-700">
                  {totalPrice.toLocaleString('vi-VN')} VNĐ
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                <ShieldCheck size={18} className="text-emerald-500 shrink-0" /> Kích hoạt tự động 24/7 qua SePay Webhook
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
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-extrabold text-xs md:text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <QrCode size={16} />}
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
