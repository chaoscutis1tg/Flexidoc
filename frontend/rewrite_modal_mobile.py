import re

with open("src/features/subscription/RenewalModal.jsx", "r", encoding="utf-8") as f:
    content = f.read()

start_idx = content.find("  return createPortal(")

if start_idx == -1:
    print("Cannot find markers")
    exit(1)

new_ui = """  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[99999] bg-slate-900/40 backdrop-blur-sm p-0 sm:p-4 flex items-center justify-center animate-fade-in select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white sm:rounded-2xl w-full h-full sm:h-auto max-w-[1000px] sm:max-h-[95vh] flex flex-col shadow-xl border-0 sm:border sm:border-slate-100 text-slate-900 relative overflow-hidden"
      >
        {/* Header - Fixed at top */}
        <div className="flex-none p-4 sm:p-5 pb-3 sm:pb-4 flex items-center justify-between border-b border-slate-100 bg-white z-20">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2">
              <Crown className="text-blue-600 shrink-0" size={20} />
              Nâng Cấp Gói Dịch Vụ
            </h2>
            <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1">
                <Building size={13} className="text-slate-400 shrink-0" />
                <span className="font-semibold text-slate-700">{currentOrg.name || 'Tổ chức của tôi'}</span>
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
                        src={paymentConfig.qrUrl}
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
"""

new_content = content[:start_idx] + new_ui

with open("src/features/subscription/RenewalModal.jsx", "w", encoding="utf-8") as f:
    f.write(new_content)

print("done")
