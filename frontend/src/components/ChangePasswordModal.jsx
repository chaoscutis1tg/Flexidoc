import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Lock, KeyRound, Eye, EyeOff, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../app/AuthContext';

export const ChangePasswordModal = ({ isOpen, onClose }) => {
  const { changePassword, user } = useAuth();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!oldPassword || !newPassword || !confirmPassword) {
      setErrorMessage('Vui lòng điền đầy đủ tất cả các trường.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Mật khẩu mới và Nhập lại mật khẩu không trùng khớp.');
      return;
    }

    if (oldPassword === newPassword) {
      setErrorMessage('Mật khẩu mới không được trùng với mật khẩu hiện tại.');
      return;
    }

    setLoading(true);
    try {
      const res = await changePassword(oldPassword, newPassword);
      if (res && res.success) {
        setSuccessMessage('Đổi mật khẩu tài khoản thành công!');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          setSuccessMessage('');
          onClose();
        }, 1500);
      } else {
        setErrorMessage(res?.message || 'Đổi mật khẩu thất bại.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Mật khẩu hiện tại không chính xác.');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-md p-4 flex items-center justify-center animate-fade-in select-none">
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-w-md w-full max-h-[90vh] overflow-y-auto custom-scrollbar bg-white rounded-3xl p-6 md:p-7 shadow-2xl border border-slate-200 relative animate-modal-pop select-text"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-500 border border-red-100 flex items-center justify-center">
              <KeyRound size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Đổi Mật Khẩu</h3>
              <p className="text-xs text-slate-500 font-medium">Tài khoản: <strong className="text-slate-800">{user?.email}</strong></p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-700 flex items-center justify-center transition-all cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Feedback Banners */}
        {errorMessage && (
          <div className="animate-fade-in bg-red-50 border border-red-200 p-3 rounded-2xl text-xs text-red-700 mb-4 flex items-center gap-2 font-semibold">
            <AlertCircle size={16} className="shrink-0 text-red-500" /> {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="animate-fade-in bg-emerald-50 border border-emerald-200 p-3 rounded-2xl text-xs text-emerald-800 mb-4 flex items-center gap-2 font-bold">
            <CheckCircle2 size={16} className="shrink-0 text-emerald-600" /> {successMessage}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Mật khẩu hiện tại:
            </label>
            <div className="relative">
              <input
                type={showOld ? 'text' : 'password'}
                required
                placeholder="Nhập mật khẩu cũ"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full px-4 py-2.5 pr-10 rounded-2xl border border-slate-200 text-xs md:text-sm font-medium placeholder:text-xs placeholder:font-normal placeholder:text-slate-400 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowOld(!showOld)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-1"
              >
                {showOld ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Mật khẩu mới (tối thiểu 6 ký tự):
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                required
                placeholder="Nhập mật khẩu mới"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2.5 pr-10 rounded-2xl border border-slate-200 text-xs md:text-sm font-medium placeholder:text-xs placeholder:font-normal placeholder:text-slate-400 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-1"
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Nhập lại mật khẩu mới:
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                required
                placeholder="Xác nhận mật khẩu mới"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2.5 pr-10 rounded-2xl border border-slate-200 text-xs md:text-sm font-medium placeholder:text-xs placeholder:font-normal placeholder:text-slate-400 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-1"
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs transition-all cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-2xl bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-extrabold text-xs shadow-md shadow-red-500/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              {loading ? 'Đang Lưu...' : 'Xác Nhận Đổi Mật Khẩu'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
