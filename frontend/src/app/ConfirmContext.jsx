import React, { createContext, useContext, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  AlertTriangle, 
  Trash2, 
  Info, 
  CheckCircle2, 
  X, 
  HelpCircle 
} from 'lucide-react';

const ConfirmContext = createContext(null);

export const ConfirmProvider = ({ children }) => {
  const [confirmState, setConfirmState] = useState(null);

  const confirm = useCallback((options = {}) => {
    return new Promise((resolve) => {
      const variant = options.variant || options.type || 'info';
      setConfirmState({
        title: options.title || 'Xác Nhận Thao Tác',
        message: options.message || 'Bạn có chắc chắn muốn thực hiện thao tác này?',
        subMessage: options.subMessage || '',
        confirmText: options.confirmText || 'Xác Nhận',
        cancelText: options.cancelText || 'Hủy Bỏ',
        variant,
        hideCancel: options.hideCancel || false,
        resolve,
      });
    });
  }, []);

  const handleClose = (value) => {
    if (confirmState && confirmState.resolve) {
      confirmState.resolve(value);
    }
    setConfirmState(null);
  };

  const getVariantStyles = (variant) => {
    switch (variant) {
      case 'danger':
        return {
          iconBg: 'bg-red-50 text-red-600 border-red-200',
          badgeBg: 'bg-red-100 text-red-700',
          badgeText: 'Thao tác nguy hiểm',
          headerBg: 'bg-red-50/50',
          buttonBg: 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-md shadow-red-200',
          Icon: Trash2,
        };
      case 'warning':
        return {
          iconBg: 'bg-amber-50 text-amber-600 border-amber-200',
          badgeBg: 'bg-amber-100 text-amber-800',
          badgeText: 'Cảnh báo',
          headerBg: 'bg-amber-50/50',
          buttonBg: 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-md shadow-amber-200',
          Icon: AlertTriangle,
        };
      case 'success':
        return {
          iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
          badgeBg: 'bg-emerald-100 text-emerald-800',
          badgeText: 'Xác nhận',
          headerBg: 'bg-emerald-50/50',
          buttonBg: 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-md shadow-emerald-200',
          Icon: CheckCircle2,
        };
      case 'info':
      default:
        return {
          iconBg: 'bg-sky-50 text-sky-600 border-sky-200',
          badgeBg: 'bg-sky-100 text-sky-800',
          badgeText: 'Thông báo',
          headerBg: 'bg-sky-50/50',
          buttonBg: 'bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800 text-white shadow-md shadow-sky-200',
          Icon: Info,
        };
    }
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      {/* Global Confirmation Modal Backdrop */}
      {confirmState && createPortal(
        (() => {
          const styles = getVariantStyles(confirmState.variant);
          const { Icon } = styles;

          return (
            <div 
              className="fixed inset-0 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in select-none"
              style={{ zIndex: 2147483647, isolation: 'isolate' }}
              onClick={() => handleClose(false)}
            >
              <div 
                className="bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200 w-full max-w-md max-h-[90vh] overflow-y-auto custom-scrollbar animate-scale-in relative z-50 pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className={`p-6 border-b border-slate-100 ${styles.headerBg} flex items-start justify-between gap-4`}>
                  <div className="flex items-center gap-3.5">
                    <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 shadow-xs ${styles.iconBg}`}>
                      <Icon size={24} />
                    </div>
                    <div>
                      <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md tracking-wider ${styles.badgeBg}`}>
                        {styles.badgeText}
                      </span>
                      <h3 className="text-base font-black text-slate-900 mt-1 leading-snug">
                        {confirmState.title}
                      </h3>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleClose(false)}
                    className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center border border-slate-200 transition-all cursor-pointer shrink-0"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Message Body */}
                <div className="p-6 space-y-2">
                  <p className="text-sm font-bold text-slate-800 leading-relaxed">
                    {confirmState.message}
                  </p>
                  {confirmState.subMessage && (
                    <p className="text-xs font-semibold text-slate-500 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                      {confirmState.subMessage}
                    </p>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-3">
                  {!confirmState.hideCancel && (
                    <button
                      type="button"
                      onClick={() => handleClose(false)}
                      className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-extrabold text-xs transition-all cursor-pointer"
                    >
                      {confirmState.cancelText}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleClose(true)}
                    className={`px-5 py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer ${styles.buttonBg}`}
                  >
                    {confirmState.confirmText}
                  </button>
                </div>
              </div>
            </div>
          );
        })(),
        document.body
      )}
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
};
