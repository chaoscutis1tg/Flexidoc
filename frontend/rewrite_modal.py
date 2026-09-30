import re

with open("src/features/subscription/RenewalModal.jsx", "r", encoding="utf-8") as f:
    content = f.read()

start_idx = content.find("  const getPlanTheme = (code) => {")
end_idx = content.find("          /* STEP 2: VIETQR PAYMENT MODAL */")

if start_idx == -1 or end_idx == -1:
    print("Cannot find markers")
    exit(1)

new_ui = """  const getPlanTheme = (code) => {
    switch (code) {
      case 'BASIC':
        return {
          cardSelected: 'bg-gradient-to-b from-sky-50/80 via-white to-sky-50/40 border-sky-400 ring-4 ring-sky-400/20 shadow-2xl shadow-sky-500/20 scale-100 md:scale-[1.02] z-10',
          cardUnselected: 'bg-white border-slate-200/80 hover:border-sky-300 hover:shadow-xl hover:shadow-sky-500/10 hover:-translate-y-1',
          badgeClass: 'bg-sky-600 text-white shadow-sm shadow-sky-500/30',
          badgeText: 'Doanh Nghiệp Nhỏ',
          iconBg: 'bg-sky-100 text-sky-600 border border-sky-200',
          priceColor: 'text-sky-600',
          checkBg: 'bg-sky-100 text-sky-600',
          topAccent: 'from-sky-400 via-sky-500 to-cyan-500',
          titleColor: 'text-slate-800',
          Icon: Briefcase
        };
      case 'PRO':
        return {
          cardSelected: 'bg-gradient-to-b from-indigo-50/90 via-white to-indigo-50/50 border-indigo-500 ring-4 ring-indigo-500/25 shadow-2xl shadow-indigo-600/25 scale-100 md:scale-[1.05] z-20',
          cardUnselected: 'bg-white border-slate-200/80 hover:border-indigo-400 hover:shadow-xl hover:shadow-indigo-600/15 hover:-translate-y-1',
          badgeClass: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-indigo-500/30 animate-pulse',
          badgeText: 'Phổ Biến Nhất',
          iconBg: 'bg-indigo-100 text-indigo-600 border border-indigo-200',
          priceColor: 'text-indigo-700',
          checkBg: 'bg-indigo-100 text-indigo-600',
          topAccent: 'from-blue-600 via-indigo-600 to-purple-600',
          titleColor: 'text-indigo-950',
          Icon: Zap
        };
      case 'VIP':
      case 'VIP_UNLIMITED':
        return {
          cardSelected: 'bg-gradient-to-b from-purple-50/90 via-white to-amber-50/40 border-purple-500 ring-4 ring-purple-500/30 shadow-2xl shadow-purple-600/30 scale-100 md:scale-[1.02] z-10',
          cardUnselected: 'bg-white border-slate-200/80 hover:border-purple-400 hover:shadow-xl hover:shadow-purple-600/15 hover:-translate-y-1',
          badgeClass: 'bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 text-white shadow-md shadow-purple-500/30',
          badgeText: 'Đẳng Cấp Nhất',
          iconBg: 'bg-gradient-to-br from-purple-100 to-amber-100 text-purple-700 border border-purple-300',
          priceColor: 'text-purple-700',
          checkBg: 'bg-purple-100 text-purple-700',
          topAccent: 'from-purple-600 via-pink-600 to-amber-500',
          titleColor: 'text-slate-900',
          Icon: Crown
        };
      default:
        return {
          cardSelected: 'bg-sky-50 border-sky-500 shadow-md scale-100 md:scale-[1.02]',
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
      className="fixed inset-0 z-[99999] bg-slate-900/60 backdrop-blur-md p-2 sm:p-4 flex items-center justify-center animate-backdrop select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl p-4 sm:p-6 lg:p-8 max-w-[1100px] w-[98vw] sm:w-[95vw] max-h-[92vh] overflow-y-auto custom-scrollbar shadow-2xl border border-white/40 animate-modal-pop text-slate-900 relative z-10"
      >

        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-sky-50/50 to-transparent pointer-events-none rounded-t-3xl" />
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-20 -left-20 w-48 h-48 bg-sky-400/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-200/70 mb-4 sm:mb-6 relative z-20">
          <div>
            <h2 className="text-lg sm:text-2xl font-black text-slate-900 flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-100 to-sky-100 flex items-center justify-center border border-purple-200/50 shadow-inner">
                <Crown className="text-purple-600 shrink-0" size={22} />
              </div>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900">Nâng Cấp Gói Dịch Vụ</span>
            </h2>
            <div className="flex flex-wrap items-center gap-2 mt-2.5 text-[11px] sm:text-[13px] text-slate-500 font-medium">
              <span>Đơn vị:</span>
              <span className="font-extrabold text-sky-800 bg-sky-50 px-2.5 py-1 rounded-md border border-sky-200/60 flex items-center gap-1.5 shadow-sm">
                <Building size={14} /> {currentOrg.name || 'Tổ chức của tôi'}
              </span>
              <span className="ml-1 text-slate-300">|</span>
              <span>Gói hiện tại:</span>
              <span className="font-extrabold text-purple-800 bg-purple-50 px-2.5 py-1 rounded-md border border-purple-200/60 uppercase shadow-sm flex items-center gap-1.5">
                 {currentPlanCode}
              </span>
              {hasTimeLeft && (
                <span className="font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200/60 flex items-center gap-1.5 shadow-sm">
                  <Clock size={14} /> Còn {daysLeft} ngày
                </span>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-100/80 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-all cursor-pointer hover:rotate-90 hover:scale-110"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* Global Messages */}
        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 p-3 sm:p-4 rounded-xl text-sm text-rose-800 font-bold mb-5 flex items-center gap-2.5 shadow-sm animate-fade-in relative z-20">
            <AlertCircle size={18} className="shrink-0 text-rose-600" /> {errorMsg}
          </div>
        )}

        {/* STEP 3: INSTANT SUCCESS CELEBRATION SCREEN */}
        {step === 'SUCCESS' ? (
          <div className="py-8 px-4 flex flex-col items-center text-center animate-fade-in select-none relative z-20">
            {/* Expanding Glow Ripple Wave Effect */}
            <div className="relative flex items-center justify-center my-6">
              <div className="absolute w-32 h-32 rounded-full bg-emerald-500/20 animate-ping duration-1000" />
              <div className="absolute w-24 h-24 rounded-full bg-emerald-400/25 animate-pulse" />
              <div className="absolute w-20 h-20 rounded-full bg-emerald-500/30 blur-md" />
              <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700 text-white flex items-center justify-center shadow-2xl shadow-emerald-600/40 border-2 border-white/80">
                <CheckCircle2 size={36} strokeWidth={2.5} />
              </div>
            </div>

            <span className="text-sm font-black text-emerald-700 uppercase tracking-widest bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-200/90 mb-3 shadow-sm inline-flex items-center gap-2">
              <Zap size={16} className="text-amber-500 shrink-0" /> Giao Dịch Đã Xác Nhận
            </span>

            <h3 className="text-2xl md:text-3xl font-black text-slate-900 mb-2.5 tracking-tight flex items-center justify-center gap-2.5">
              <Sparkles size={28} className="text-amber-500 shrink-0" />
              <span>Kích Hoạt Gói {createdOrder?.plan || selectedPlan} Thành Công!</span>
            </h3>

            <p className="text-sm text-slate-600 font-medium max-w-lg mb-6 leading-relaxed">
              Hệ thống đã nhận được thanh toán cho đơn hàng <strong className="font-mono text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">{createdOrder?.orderCode}</strong>. Gói dịch vụ đã được kích hoạt tự động cho tổ chức <strong className="text-sky-700">{currentOrg.name}</strong>.
            </p>

            {/* Receipt Card */}
            <div className="bg-gradient-to-b from-slate-50 to-white border border-slate-200/90 rounded-2xl p-5 w-full max-w-md text-sm space-y-3.5 mb-8 shadow-md">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <span className="text-slate-500 font-bold">Tổ chức nâng cấp:</span>
                <strong className="text-slate-900 font-black">{currentOrg.name} ({currentOrg.code})</strong>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <span className="text-slate-500 font-bold">Gói cước đã chọn:</span>
                <span className="font-black text-sky-800 bg-sky-50 px-3 py-1 rounded-lg border border-sky-200/80 shadow-sm">
                  Gói {createdOrder?.plan || selectedPlan}
                </span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <span className="text-slate-500 font-bold">Thời gian gia hạn:</span>
                <strong className="text-emerald-700 font-black">+{createdOrder?.durationMonths || durationMonths} Tháng</strong>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-slate-500 font-bold text-base">Tổng thanh toán:</span>
                <strong className="text-slate-900 font-black text-lg md:text-xl">{(createdOrder?.amount || totalPrice).toLocaleString('vi-VN')} VNĐ</strong>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                refreshUser();
              }}
              className="w-full max-w-md py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-sm md:text-base shadow-xl shadow-emerald-600/30 hover:shadow-emerald-600/50 hover:-translate-y-1 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Sparkles size={20} /> Bắt Đầu Trải Nghiệm Ngay
            </button>
          </div>
        ) : step === 'SELECT_PLAN' ? (
          <div className="relative z-20">
            {/* Plan Selector Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 mb-6 sm:mb-8 pt-2">
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
                    className={`rounded-3xl p-5 sm:p-6 relative transition-all duration-300 flex flex-col justify-between group 
                      ${isLowerTier ? 'opacity-40 cursor-not-allowed bg-slate-50/50' : 'cursor-pointer'} 
                      ${isSelected ? theme.cardSelected : isLowerTier ? 'border border-slate-200 grayscale scale-95' : theme.cardUnselected}
                    `}
                  >
                    {isLowerTier && (
                      <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/50 backdrop-blur-[2px] rounded-3xl">
                        <span className="bg-slate-900/90 text-white text-xs font-black px-4 py-2 rounded-xl shadow-xl flex items-center gap-2">
                          <AlertCircle size={16} className="text-rose-400" />
                          Không thể hạ cấp
                        </span>
                      </div>
                    )}
                    
                    {/* Top Accent Gradient Bar when Selected */}
                    {isSelected && (
                      <div className={`absolute top-0 left-0 right-0 h-2 rounded-t-3xl bg-gradient-to-r ${theme.topAccent}`} />
                    )}

                    <div className="relative z-10">
                      {/* Header Icon + Subtitle + Badge */}
                      <div className="flex items-center justify-between gap-2 mb-3 mt-1">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${theme.iconBg} shadow-sm`}>
                            <PlanIcon size={18} strokeWidth={2.5} />
                          </div>
                          <span className="text-[11px] sm:text-xs font-extrabold text-slate-500 uppercase tracking-widest block">
                            {p.subtitle || p.badge}
                          </span>
                        </div>

                        {(p.popular || p.code === 'PRO' || p.code === 'VIP') && (
                          <span className={`${theme.badgeClass} text-[10px] sm:text-[11px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider whitespace-nowrap`}>
                            {p.code === 'PRO' ? 'Phổ Biến Nhất' : p.code === 'VIP' ? 'Đẳng Cấp Nhất' : theme.badgeText}
                          </span>
                        )}
                      </div>

                      <h3 className={`text-xl sm:text-2xl font-black ${theme.titleColor} mt-2 mb-3 flex items-center justify-between`}>
                        <span>{p.title}</span>
                        {isSelected && (
                          <span className="text-[10px] sm:text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5 whitespace-nowrap shadow-sm">
                            <CheckCircle2 size={14} /> Đã Chọn
                          </span>
                        )}
                      </h3>

                      {/* Pricing Box */}
                      <div className={`my-3 py-2.5 px-3.5 rounded-2xl ${isSelected ? 'bg-white/80 shadow-sm border border-slate-100' : 'bg-slate-50/80 border border-slate-200/80'} flex items-baseline gap-1.5`}>
                        <span className={`text-2xl sm:text-3xl font-black ${theme.priceColor}`}>
                          {p.formattedPrice}
                        </span>
                        <span className="text-xs text-slate-500 font-bold">{p.billingCycle}</span>
                      </div>
                    </div>

                    {/* Features List */}
                    <ul className="space-y-2.5 pt-4 mt-2 border-t border-slate-200/70 text-xs sm:text-[13px] text-slate-700 font-medium relative z-10">
                      {p.features?.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2.5">
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${theme.checkBg}`}>
                            <Check size={11} strokeWidth={3.5} />
                          </div>
                          <span className="leading-tight font-semibold text-slate-700">{feat}</span>
                        </li>
                      ))}
                    </ul>
                    
                    {/* Hover Glow Effect */}
                    {!isLowerTier && !isSelected && (
                       <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-transparent to-slate-50/50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Warning Banner when Upgrading */}
            {isUpgrading && hasTimeLeft && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-4 rounded-2xl text-sm text-amber-900 font-bold mb-5 flex flex-col sm:flex-row items-start sm:items-center gap-3.5 shadow-sm animate-fade-in relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <AlertCircle size={64} />
                </div>
                <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200 shadow-inner z-10">
                   <AlertCircle size={22} strokeWidth={2.5} />
                </div>
                <div className="z-10 flex-1">
                  <span className="block mb-1 font-black text-amber-950 text-base">Lưu ý khi Nâng cấp gói cao hơn:</span>
                  <span className="font-medium text-amber-800">Bạn đang còn <strong className="font-black text-emerald-700 bg-emerald-100/50 px-1.5 py-0.5 rounded">{daysLeft} ngày</strong> sử dụng của gói <strong className="uppercase text-purple-700 bg-purple-100/50 px-1.5 py-0.5 rounded">{currentPlanCode}</strong>. Thời gian này sẽ bị thay thế khi bạn thanh toán nâng cấp sang gói mới cao hơn.</span>
                </div>
              </div>
            )}

            {/* Duration Selector */}
            <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 mb-5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3.5 gap-2">
                <label className="text-sm font-black text-slate-800 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center">
                    <Clock size={16} strokeWidth={2.5} />
                  </div>
                  <span>Chọn Thời Gian Đăng Ký:</span>
                </label>
                <span className="text-xs text-sky-700 bg-sky-50 px-3 py-1.5 rounded-lg font-bold border border-sky-100 inline-block w-fit">
                  Đăng ký nhiều tháng để nhận ưu đãi
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
                {DURATION_OPTIONS.map((opt) => {
                  const isSelected = durationMonths === opt.months;

                  return (
                    <button
                      key={opt.months}
                      type="button"
                      onClick={() => setDurationMonths(opt.months)}
                      className={`py-3 px-3 sm:px-4 rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer border flex flex-col sm:flex-row items-center sm:justify-between gap-1.5 sm:gap-2 relative ${isSelected
                        ? 'bg-gradient-to-br from-sky-600 via-blue-600 to-indigo-600 text-white border-transparent shadow-lg shadow-sky-600/30 scale-100 sm:scale-[1.02] z-10'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-sky-300 hover:bg-sky-50/50 hover:-translate-y-0.5'
                        }`}
                    >
                      <span>{opt.label}</span>
                      {opt.tag && (
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap ${isSelected ? 'bg-amber-400 text-slate-900 shadow-sm' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}>
                          {opt.tag}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Total Calculation */}
              <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 text-sm font-extrabold text-slate-800 bg-slate-50/50 p-3 sm:p-4 rounded-2xl border border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <span className="text-slate-600">Tổng Thanh Toán ({durationMonths} tháng):</span>
                  {discountPercent > 0 && (
                    <span className="text-xs text-emerald-700 font-black bg-emerald-100/80 px-2.5 py-1 rounded-md border border-emerald-200 inline-block w-fit">
                      Tiết kiệm {totalSaved.toLocaleString('vi-VN')}đ (-{discountPercent}%)
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-2.5 self-end md:self-auto">
                  {discountPercent > 0 && (
                    <span className="text-sm line-through text-slate-400 font-bold">
                      {rawTotalPrice.toLocaleString('vi-VN')}đ
                    </span>
                  )}
                  <span className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-700">
                    {totalPrice.toLocaleString('vi-VN')} VNĐ
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between pt-4 sm:pt-5 border-t border-slate-200/80 gap-3">
              <span className="text-xs text-slate-600 font-bold flex items-center justify-center w-full sm:w-auto gap-2 bg-emerald-50 text-emerald-800 px-4 py-2.5 rounded-xl border border-emerald-200/80 shadow-sm">
                <ShieldCheck size={18} className="text-emerald-600 shrink-0" /> Kích hoạt tự động 24/7 qua Ngân Hàng
              </span>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-300 text-slate-700 font-black text-sm hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleCreateOrder}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 text-white font-extrabold text-sm flex justify-center items-center gap-2 shadow-lg shadow-emerald-500/30 hover:shadow-emerald-600/40 hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <QrCode size={18} />}
                  Thanh Toán Ngay
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* STEP 2: VIETQR PAYMENT MODAL */"""

new_content = content[:start_idx] + new_ui + content[end_idx:]

with open("src/features/subscription/RenewalModal.jsx", "w", encoding="utf-8") as f:
    f.write(new_content)

print("done")
