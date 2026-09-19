import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '../../services/api';
import { useConfirm } from '../../app/ConfirmContext';
import {
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Building2,
  User,
  ShieldCheck,
  Building,
  Key,
  Copy,
  Check,
  Save,
  Loader2,
  AlertCircle,
  Calendar,
  ExternalLink,
  Crown,
  Settings,
  Eye,
  X,
  Phone,
  Mail,
  FileText,
  Zap
} from 'lucide-react';
import { VIETNAM_BANKS } from './AdminSettingsPage';

export const AdminOrdersRevenuePage = () => {
  const { confirm } = useConfirm();
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'settings'

  // Orders & Stats state
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalOrdersCount: 0,
    successOrdersCount: 0,
    pendingOrdersCount: 0,
  });
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // System Payment Settings state
  const [configLoading, setConfigLoading] = useState(false);
  const [configSaving, setConfigSaving] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [paymentConfig, setPaymentConfig] = useState({
    bankName: 'MB BANK',
    bankCode: 'MB',
    accountNumber: '5408092006',
    accountName: 'DO VAN KHOA',
    orderPrefix: 'MTCTMS',
    sepayApiKey: 'sepay_secret_key_mtctms_2026',
  });
  const [configMessage, setConfigMessage] = useState({ type: '', text: '' });

  // Action states
  const [processingOrderId, setProcessingOrderId] = useState(null);

  // Modal states: Details & Rejection
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [rejectingOrder, setRejectingOrder] = useState(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [copiedTransferCode, setCopiedTransferCode] = useState(false);

  const handleBankCodeChange = (e) => {
    const selectedCode = e.target.value;
    const foundBank = VIETNAM_BANKS.find(b => b.code === selectedCode);
    setPaymentConfig(prev => ({
      ...prev,
      bankCode: selectedCode,
      bankName: foundBank ? foundBank.name : prev.bankName
    }));
  };

  const fetchOrdersAndStats = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/orders/admin/all?status=${statusFilter}&search=${encodeURIComponent(searchQuery)}&page=${page}&limit=20`);
      if (res.success && res.data) {
        setOrders(res.data.orders?.items || []);
        setTotalPages(res.data.orders?.totalPages || 1);
        setStats(res.data.stats || {
          totalRevenue: 0,
          monthlyRevenue: 0,
          totalOrdersCount: 0,
          successOrdersCount: 0,
          pendingOrdersCount: 0,
        });
      }
    } catch (err) {
      console.error('Lỗi khi tải đơn hàng:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentConfig = async () => {
    setConfigLoading(true);
    try {
      const res = await api.get('/system-settings/payment');
      if (res.success && res.data) {
        setPaymentConfig(res.data);
      }
    } catch (err) {
      console.error('Lỗi khi tải cấu hình thanh toán:', err);
    } finally {
      setConfigLoading(false);
    }
  };

  useEffect(() => {
    fetchOrdersAndStats();
  }, [statusFilter, searchQuery, page]);

  useEffect(() => {
    fetchPaymentConfig();
  }, []);

  // Lock body scroll when any modal is open
  useEffect(() => {
    if (selectedOrderDetails || rejectingOrder) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedOrderDetails, rejectingOrder]);

  const handleSavePaymentConfig = async (e) => {
    e.preventDefault();
    setConfigSaving(true);
    setConfigMessage({ type: '', text: '' });
    try {
      const res = await api.put('/system-settings/payment', paymentConfig);
      if (res.success) {
        setConfigMessage({ type: 'success', text: 'Cập nhật Cấu hình Thanh toán & Webhook thành công!' });
        setPaymentConfig(res.data);
      }
    } catch (err) {
      setConfigMessage({ type: 'error', text: err.message || 'Cập nhật cấu hình thất bại.' });
    } finally {
      setConfigSaving(false);
    }
  };

  const handleManualApprove = async (order) => {
    const isOk = await confirm({
      title: 'Xác Nhận Duyệt Đơn Bằng Tay',
      message: `Bạn có chắc chắn muốn kích hoạt gói ${order.plan} (${order.durationMonths} tháng) cho tổ chức "${order.organizationId?.name || 'Tổ chức'}"?`,
      confirmText: 'Đồng Ý Duyệt',
      cancelText: 'Hủy Bỏ',
      variant: 'success'
    });

    if (!isOk) return;

    setProcessingOrderId(order._id);
    try {
      const res = await api.patch(`/orders/${order._id}/approve`, { notes: 'Admin duyệt bằng tay' });
      if (res.success) {
        if (selectedOrderDetails?._id === order._id) {
          setSelectedOrderDetails(null);
        }
        fetchOrdersAndStats();
      }
    } catch (err) {
      alert(err.message || 'Lỗi khi duyệt đơn');
    } finally {
      setProcessingOrderId(null);
    }
  };

  const handleOpenRejectModal = (order) => {
    setRejectingOrder(order);
    setRejectionReasonInput('Giao dịch chưa được nhận tiền');
  };

  const handleConfirmReject = async (e) => {
    if (e) e.preventDefault();
    if (!rejectingOrder) return;

    setProcessingOrderId(rejectingOrder._id);
    try {
      const res = await api.patch(`/orders/${rejectingOrder._id}/reject`, {
        rejectionReason: rejectionReasonInput.trim() || 'Admin từ chối đơn hàng'
      });
      if (res.success) {
        setRejectingOrder(null);
        if (selectedOrderDetails?._id === rejectingOrder._id) {
          setSelectedOrderDetails(null);
        }
        fetchOrdersAndStats();
      }
    } catch (err) {
      alert(err.message || 'Lỗi khi từ chối đơn');
    } finally {
      setProcessingOrderId(null);
    }
  };

  const handleCopyTransferCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedTransferCode(true);
    setTimeout(() => setCopiedTransferCode(false), 2000);
  };

  const webhookUrl = `${window.location.origin}/api/v1/payments/sepay-webhook`;

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-12">
      {/* 1. Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold px-2.5 py-0.5 rounded-md flex items-center gap-1">
              <ShieldCheck size={13} />
              Quản Trị Tối Cao (Super Admin)
            </span>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-extrabold px-2.5 py-0.5 rounded-md flex items-center gap-1">
              <TrendingUp size={13} />
              Tự Động SePay Webhook
            </span>
          </div>

          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <DollarSign size={26} className="text-emerald-600" />
            <span>Quản Lý Đơn Hàng & Doanh Thu Hệ Thống</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi tất cả đơn hàng nâng cấp gói cước, duyệt đơn bằng tay hoặc tự động qua SePay Webhook.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === 'orders'
              ? 'bg-white text-sky-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            <Clock size={15} /> Danh Sách Đơn Hàng ({stats.totalOrdersCount || 0})
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === 'settings'
              ? 'bg-white text-sky-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            <Settings size={15} /> Cấu Hình Thanh Toán & Webhook
          </button>
        </div>
      </div>

      {activeTab === 'orders' ? (
        <>
          {/* 2. Revenue Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

            {/* Total Revenue */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Tổng Doanh Thu Hệ Thống
                  </span>
                  <div className="text-2xl font-black text-emerald-600 my-1">
                    {stats.totalRevenue.toLocaleString('vi-VN')} <span className="text-xs font-bold text-emerald-700">VNĐ</span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                    Đã thanh toán thành công
                  </span>
                </div>
                <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <DollarSign size={22} />
                </div>
              </div>
            </div>

            {/* Monthly Revenue */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Doanh Thu Tháng Này
                  </span>
                  <div className="text-2xl font-black text-sky-600 my-1">
                    {stats.monthlyRevenue.toLocaleString('vi-VN')} <span className="text-xs font-bold text-sky-700">VNĐ</span>
                  </div>
                  <span className="text-[11px] font-bold text-sky-600 flex items-center gap-1">
                    <Calendar size={13} /> Tháng {new Date().getMonth() + 1}/{new Date().getFullYear()}
                  </span>
                </div>
                <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                  <TrendingUp size={22} />
                </div>
              </div>
            </div>

            {/* Successful Orders */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Đơn Đã Hoàn Thành
                  </span>
                  <div className="text-2xl font-black text-slate-900 my-1">
                    {stats.successOrdersCount} <span className="text-xs font-medium text-slate-400">đơn</span>
                  </div>
                  <span className="text-[11px] font-extrabold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 size={13} /> Đã kích hoạt gói
                  </span>
                </div>
                <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={22} />
                </div>
              </div>
            </div>

            {/* Pending Orders */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Đơn Chờ Thanh Toán
                  </span>
                  <div className="text-2xl font-black text-amber-600 my-1">
                    {stats.pendingOrdersCount} <span className="text-xs font-medium text-amber-700">đơn</span>
                  </div>
                  <span className="text-[11px] font-bold text-amber-600 flex items-center gap-1">
                    <Clock size={13} /> Đang chờ chuyển khoản
                  </span>
                </div>
                <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Clock size={22} />
                </div>
              </div>
            </div>

          </div>

          {/* 3. Search & Filter Controls */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search size={18} className="absolute left-3.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm mã đơn DH..., ghi chú..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs md:text-sm focus:ring-2 focus:ring-sky-500 outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                <Filter size={14} /> Lọc trạng thái:
              </span>
              {['ALL', 'PENDING', 'SUCCESS', 'REJECTED'].map((st) => (
                <button
                  key={st}
                  onClick={() => { setStatusFilter(st); setPage(1); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${statusFilter === st
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                >
                  {st === 'ALL' ? 'Tất cả' : st === 'PENDING' ? 'Chờ thanh toán' : st === 'SUCCESS' ? 'Thành công' : 'Từ chối'}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Orders Table */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Clock size={18} className="text-sky-600" /> Danh Sách Đơn Hàng Dịch Vụ
                </h3>
                <p className="text-xs text-slate-500">
                  Tất cả các giao dịch nâng cấp gói cước từ các tổ chức trong hệ thống
                </p>
              </div>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-slate-400 font-bold flex items-center justify-center gap-2">
                <Loader2 size={18} className="animate-spin text-sky-600" /> Đang tải danh sách đơn hàng...
              </div>
            ) : orders.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <Clock size={36} className="mx-auto text-slate-300 mb-2" />
                <h4 className="text-xs font-bold text-slate-600">Chưa có đơn hàng nào phù hợp</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Không tìm thấy bản ghi đơn hàng nào với bộ lọc hiện tại.</p>
              </div>
            ) : (
              <div className="w-full overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-2">Mã Đơn</th>
                      <th className="py-3 px-2">Tổ Chức</th>
                      <th className="py-3 px-2">Người Đặt</th>
                      <th className="py-3 px-2">Gói Cước</th>
                      <th className="py-3 px-2">Số Tiền</th>
                      <th className="py-3 px-2">Hình Thức</th>
                      <th className="py-3 px-2">Trạng Thái</th>
                      <th className="py-3 px-2">Ngày Tạo</th>
                      <th className="py-3 px-2 text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {orders.map((o) => (
                      <tr key={o._id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Order Code */}
                        <td className="py-3 px-2 font-mono font-black text-sky-700">
                          <button
                            onClick={() => setSelectedOrderDetails(o)}
                            className="hover:underline cursor-pointer text-left"
                            title="Xem chi tiết đơn hàng"
                          >
                            {o.orderCode}
                          </button>
                        </td>

                        {/* Organization */}
                        <td className="py-3 px-2">
                          <div className="font-bold text-slate-900 truncate max-w-[130px]" title={o.organizationId?.name}>
                            {o.organizationId?.name || 'N/A'}
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono block">
                            Mã: {o.organizationId?.code || '---'}
                          </span>
                        </td>

                        {/* User */}
                        <td className="py-3 px-2">
                          <div className="font-bold text-slate-800 truncate max-w-[130px]" title={o.userId?.fullName}>
                            {o.userId?.fullName || 'N/A'}
                          </div>
                          <span className="text-[10px] text-slate-400 block truncate max-w-[130px]" title={o.userId?.email}>
                            {o.userId?.email}
                          </span>
                        </td>

                        {/* Plan & Duration */}
                        <td className="py-3 px-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-extrabold border ${
                            o.plan === 'VIP'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : o.plan === 'PRO'
                                ? 'bg-sky-50 text-sky-700 border-sky-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            <Crown size={11} /> {o.plan} ({o.durationMonths}th)
                          </span>
                        </td>

                        {/* Amount */}
                        <td className="py-3 px-2 font-black text-slate-900 text-[11.5px]">
                          {o.amount ? o.amount.toLocaleString('vi-VN') : 0}đ
                        </td>

                        {/* Payment Method */}
                        <td className="py-3 px-2 text-slate-600 font-semibold">
                          {o.paymentMethod === 'SEPAY_WEBHOOK' ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10.5px]">
                              <Zap size={11} /> SePay
                            </span>
                          ) : o.paymentMethod === 'MANUAL_ADMIN' ? (
                            <span className="inline-flex items-center gap-1 text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded border border-purple-200 text-[10.5px]">
                              <User size={11} /> Duyệt tay
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[10.5px]">Miễn phí</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-2">
                          {o.status === 'SUCCESS' ? (
                            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 text-[10.5px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-300">
                              <CheckCircle2 size={11} className="text-emerald-600" /> Thành công
                            </span>
                          ) : o.status === 'PENDING' ? (
                            <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 text-[10.5px] font-extrabold px-2 py-0.5 rounded-full border border-amber-300">
                              <Clock size={11} className="text-amber-600" /> Chờ thanh toán
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-red-50 text-red-800 text-[10.5px] font-extrabold px-2 py-0.5 rounded-full border border-red-300" title={o.rejectionReason}>
                              <XCircle size={11} className="text-red-600" /> Từ chối
                            </span>
                          )}
                        </td>

                        {/* Created Date */}
                        <td className="py-3 px-2 text-slate-500 text-[11px] font-medium">
                          {o.createdAt ? (
                            <div>
                              <div>{new Date(o.createdAt).toLocaleDateString('vi-VN')}</div>
                              <div className="text-[10px] text-slate-400">{new Date(o.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</div>
                            </div>
                          ) : 'N/A'}
                        </td>

                        {/* Admin Action Buttons */}
                        <td className="py-3 px-2 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* Chi Tiết */}
                            <button
                              onClick={() => setSelectedOrderDetails(o)}
                              className="p-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 transition-all cursor-pointer flex items-center justify-center"
                              title="Xem chi tiết đơn hàng & mã chuyển khoản"
                            >
                              <Eye size={14} />
                            </button>

                            {o.status === 'PENDING' && (
                              <>
                                {/* Duyệt Đơn (Icon) */}
                                <button
                                  onClick={() => handleManualApprove(o)}
                                  disabled={processingOrderId === o._id}
                                  className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                                  title="Duyệt đơn bằng tay & kích hoạt gói cước ngay"
                                >
                                  {processingOrderId === o._id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                                </button>

                                {/* Từ Chối (Icon) */}
                                <button
                                  onClick={() => handleOpenRejectModal(o)}
                                  disabled={processingOrderId === o._id}
                                  className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 cursor-pointer flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                                  title="Từ chối đơn hàng này"
                                >
                                  {processingOrderId === o._id ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs font-bold text-slate-600 mt-2">
                <span>Trang {page} / {totalPages}</span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage(p => p - 1)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                  >
                    ← Trang Trước
                  </button>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => p + 1)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                  >
                    Trang Sau →
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        /* TAB 2: SYSTEM PAYMENT SETTINGS & WEBHOOK SEPAY */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left 2 Cols: Form Config Settings */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-7 border border-slate-200 shadow-sm">
            <div className="mb-6 border-b border-slate-100 pb-4">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Building size={20} className="text-sky-600" /> Cài Đặt Ngân Hàng & Thanh Toán Dynamic
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Thay đổi số tài khoản MB Bank 5408092006, chủ tài khoản và tiền tố đơn hàng. Modal thanh toán của khách hàng sẽ cập nhật tự động.
              </p>
            </div>

            {configMessage.text && (
              <div className={`p-4 rounded-xl text-xs font-bold mb-5 flex items-center gap-2 ${configMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                {configMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                {configMessage.text}
              </div>
            )}

            <form onSubmit={handleSavePaymentConfig} className="space-y-4">

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
                  <span className="text-[10.5px] text-slate-400 mt-1 block">Tên ngân hàng bên cạnh sẽ tự động cập nhật khi chọn.</span>
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
                  <span className="text-[10.5px] text-slate-400 mt-1 block">Có thể tùy chỉnh lại tên nếu muốn.</span>
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
                    placeholder="MTCTMS"
                    value={paymentConfig.orderPrefix}
                    onChange={(e) => setPaymentConfig({ ...paymentConfig, orderPrefix: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono font-bold focus:ring-2 focus:ring-sky-500 outline-none uppercase"
                  />
                  <span className="text-[10.5px] text-slate-400 mt-1 block">Khách hàng sẽ chuyển với nội dung: <code>MTCTMS DH88910</code></span>
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
                  <span className="text-[10.5px] text-slate-400 mt-1 block">Khóa bí mật xác minh request từ SePay (gửi qua Header <code>Authorization: Apikey ...</code>).</span>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={configSaving}
                  className="px-6 py-3 rounded-full bg-gradient-to-r from-sky-600 to-blue-600 text-white font-extrabold text-sm flex items-center gap-2 shadow-md shadow-sky-600/25 hover:shadow-sky-600/40 hover:-translate-y-0.5 transition-all cursor-pointer"
                >
                  {configSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Lưu Cấu Hình Thanh Toán
                </button>
              </div>

            </form>
          </div>

          {/* Right 1 Col: SePay Webhook Guide */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 flex flex-col justify-between shadow-xl">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold">

                </div>
                <h4 className="text-base font-black text-white">Hướng Dẫn Kết Nối SePay Webhook</h4>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                SePay sẽ gửi dữ liệu thông báo biến động số dư ngân hàng về server của bạn để tự động kích hoạt gói dịch vụ cho khách hàng ngay lập tức.
              </p>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    1. Đăng ký Webhook URL tại SePay.vn:
                  </span>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-sky-300 break-all flex items-center justify-between gap-2">
                    <span>{webhookUrl}</span>
                    <button
                      onClick={handleCopyWebhook}
                      className="text-slate-400 hover:text-white p-1"
                      title="Sao chép Webhook URL"
                    >
                      {copiedWebhook ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    2. Cấu hình Kiểu Xác Thực (Authentication):
                  </span>
                  <p className="text-slate-300 text-[11.5px] leading-relaxed">
                    Chọn loại <strong>API Key</strong> trong SePay và dán mã API Key: <code className="text-amber-400 bg-slate-950 px-1.5 py-0.5 rounded font-mono">{paymentConfig.sepayApiKey}</code>.
                  </p>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    3. Header Tự Động SePay Gửi:
                  </span>
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-[11px] text-emerald-400 font-mono">
                    "Authorization": "Apikey {paymentConfig.sepayApiKey}"
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-400">
              <strong>Lưu ý:</strong> Đơn hàng sẽ được tự động khớp khi nội dung chuyển khoản chứa mã <strong>{paymentConfig.orderPrefix} DHxxxxx</strong>.
            </div>
          </div>

        </div>
      )}

      {/* 5. MODAL: CHI TIẾT ĐƠN HÀNG (Order Details Modal - Rendered via Portal for full viewport coverage) */}
      {selectedOrderDetails && createPortal(
        <div
          onClick={() => setSelectedOrderDetails(null)}
          className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-md p-4 flex items-center justify-center animate-fade-in select-none"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-6 md:p-8 max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 text-slate-900 animate-modal-pop relative z-10"
          >

            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono font-black text-sky-700 text-sm bg-sky-50 border border-sky-200 px-2.5 py-0.5 rounded-md">
                    {selectedOrderDetails.orderCode}
                  </span>
                  {selectedOrderDetails.status === 'SUCCESS' ? (
                    <span className="bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 size={13} className="text-emerald-600" /> Thành công
                    </span>
                  ) : selectedOrderDetails.status === 'PENDING' ? (
                    <span className="bg-amber-50 text-amber-800 border border-amber-300 text-xs font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <Clock size={13} className="text-amber-600" /> Chờ thanh toán / xác nhận
                    </span>
                  ) : (
                    <span className="bg-red-50 text-red-800 border border-red-300 text-xs font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <XCircle size={13} className="text-red-600" /> Từ chối
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-black text-slate-900">Chi Tiết Đơn Hàng Dịch Vụ</h2>
              </div>

              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Transfer Code Box (Highlighted for Admin Check) */}
            <div className="bg-amber-50 border border-amber-300 p-4 rounded-2xl mb-6 shadow-xs">
              <span className="text-amber-900 text-xs font-black uppercase tracking-wider block mb-1">
                Mã / Nội Dung Chuyển Khoản Người Dùng Cần Chuyển:
              </span>
              <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-amber-300 shadow-2xs">
                <span className="font-mono text-lg font-black text-red-600 tracking-wider">
                  {paymentConfig.orderPrefix || 'MTCTMS'} {selectedOrderDetails.orderCode}
                </span>
                <button
                  onClick={() => handleCopyTransferCode(`${paymentConfig.orderPrefix || 'MTCTMS'} ${selectedOrderDetails.orderCode}`)}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-black text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-95"
                >
                  {copiedTransferCode ? <Check size={14} /> : <Copy size={14} />}
                  {copiedTransferCode ? 'Đã sao chép' : 'Sao chép nội dung'}
                </button>
              </div>
              <p className="text-[11px] text-amber-800 font-medium mt-2">
                Copy mã này và dán vào ô tìm kiếm trên App Ngân hàng (MB, VCB...) để đối soát xem biến động số dư đã nhận đúng số tiền <strong>{selectedOrderDetails.amount?.toLocaleString('vi-VN')} VNĐ</strong> chưa.
              </p>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium mb-6">

              {/* Organization Info */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block mb-2 flex items-center gap-1">
                  <Building2 size={14} className="text-sky-600" /> Thông Tin Tổ Chức
                </span>
                <div className="space-y-1 text-slate-800">
                  <div className="font-bold text-sm text-slate-900">{selectedOrderDetails.organizationId?.name || 'N/A'}</div>
                  <div>Mã tổ chức: <span className="font-mono font-bold text-sky-700">{selectedOrderDetails.organizationId?.code || '---'}</span></div>
                  <div>Gói hiện tại: <span className="font-extrabold text-purple-700">{selectedOrderDetails.organizationId?.plan || 'FREE'}</span></div>
                  {selectedOrderDetails.organizationId?.planExpiresAt && (
                    <div className="text-[11px] text-slate-500">
                      Hạn gói hiện tại: {new Date(selectedOrderDetails.organizationId.planExpiresAt).toLocaleDateString('vi-VN')}
                    </div>
                  )}
                </div>
              </div>

              {/* User Info */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block mb-2 flex items-center gap-1">
                  <User size={14} className="text-sky-600" /> Người Đặt Đơn
                </span>
                <div className="space-y-1 text-slate-800">
                  <div className="font-bold text-sm text-slate-900">{selectedOrderDetails.userId?.fullName || 'N/A'}</div>
                  <div className="flex items-center gap-1 text-slate-600">
                    <Mail size={12} className="text-slate-400" /> {selectedOrderDetails.userId?.email || 'N/A'}
                  </div>
                  {selectedOrderDetails.userId?.phone && (
                    <div className="flex items-center gap-1 text-slate-600">
                      <Phone size={12} className="text-slate-400" /> {selectedOrderDetails.userId?.phone}
                    </div>
                  )}
                </div>
              </div>

              {/* Order Plan & Amount */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block mb-2 flex items-center gap-1">
                  <Crown size={14} className="text-amber-500" /> Gói Đăng Ký & Giá Tiền
                </span>
                <div className="space-y-1 text-slate-800">
                  <div>Gói dịch vụ: <strong className="text-sky-700 font-extrabold">{selectedOrderDetails.plan}</strong></div>
                  <div>Thời hạn: <strong>{selectedOrderDetails.durationMonths} tháng</strong></div>
                  <div>Tổng số tiền: <strong className="text-emerald-600 text-sm font-black">{selectedOrderDetails.amount?.toLocaleString('vi-VN')} VNĐ</strong></div>
                </div>
              </div>

              {/* Payment & Audit Info */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block mb-2 flex items-center gap-1">
                  <ShieldCheck size={14} className="text-emerald-600" /> Hình Thức & Lịch Sử
                </span>
                <div className="space-y-1 text-slate-800">
                  <div>Hình thức: <strong>{selectedOrderDetails.paymentMethod === 'SEPAY_WEBHOOK' ? '⚡ SePay Webhook' : '👤 Duyệt Bằng Tay'}</strong></div>
                  <div>Ngày tạo đơn: {selectedOrderDetails.createdAt ? new Date(selectedOrderDetails.createdAt).toLocaleString('vi-VN') : 'N/A'}</div>
                  {selectedOrderDetails.approvedAt && (
                    <div>Ngày duyệt: {new Date(selectedOrderDetails.approvedAt).toLocaleString('vi-VN')}</div>
                  )}
                  {selectedOrderDetails.approvedBy && (
                    <div>Người duyệt: <strong>{selectedOrderDetails.approvedBy?.fullName || selectedOrderDetails.approvedBy?.email}</strong></div>
                  )}
                  {selectedOrderDetails.rejectionReason && (
                    <div className="text-red-600 font-bold bg-red-50 p-2 rounded border border-red-200 mt-1">
                      Lý do từ chối: {selectedOrderDetails.rejectionReason}
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* SePay Webhook Saved Transfer Details Box */}
            {selectedOrderDetails.paymentDetails && (selectedOrderDetails.paymentDetails.content || selectedOrderDetails.paymentDetails.referenceCode || selectedOrderDetails.paymentDetails.sepayId) && (
              <div className="bg-sky-50 border border-sky-200 p-4 rounded-2xl mb-6 shadow-2xs space-y-2">
                <span className="text-sky-900 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                  <Zap size={15} className="text-amber-500" /> Thông Tin Giao Dịch Lưu Tự Động Từ SePay Webhook:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-white p-2.5 rounded-xl border border-sky-100">
                    <span className="text-[10.5px] font-bold text-slate-400 block uppercase">Mã Giao Dịch / SePay ID:</span>
                    <span className="font-mono font-black text-slate-800">{selectedOrderDetails.paymentDetails.sepayId || selectedOrderDetails.paymentRef || 'N/A'}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-sky-100">
                    <span className="text-[10.5px] font-bold text-slate-400 block uppercase">Cổng Ngân Hàng (Gateway):</span>
                    <span className="font-bold text-sky-700">{selectedOrderDetails.paymentDetails.gateway || 'MBBank'}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-sky-100">
                    <span className="text-[10.5px] font-bold text-slate-400 block uppercase">Số Tiền Thực Nhận:</span>
                    <span className="font-extrabold text-emerald-600">{selectedOrderDetails.paymentDetails.transferAmount ? selectedOrderDetails.paymentDetails.transferAmount.toLocaleString('vi-VN') + ' VNĐ' : `${selectedOrderDetails.amount?.toLocaleString('vi-VN')} VNĐ`}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-sky-100">
                    <span className="text-[10.5px] font-bold text-slate-400 block uppercase">Mã Tham Chiếu Ngân Hàng:</span>
                    <span className="font-mono font-bold text-slate-700">{selectedOrderDetails.paymentDetails.referenceCode || 'N/A'}</span>
                  </div>
                </div>
                {selectedOrderDetails.paymentDetails.content && (
                  <div className="bg-white p-2.5 rounded-xl border border-sky-100 text-xs">
                    <span className="text-[10.5px] font-bold text-slate-400 block uppercase mb-0.5">Nội Dung Chuyển Khoản Thực Tế Từ Ngân Hàng:</span>
                    <code className="font-mono font-extrabold text-red-600 break-all">{selectedOrderDetails.paymentDetails.content}</code>
                  </div>
                )}
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2">
                {selectedOrderDetails.status === 'PENDING' && (
                  <>
                    <button
                      onClick={() => handleManualApprove(selectedOrderDetails)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md cursor-pointer flex items-center gap-1.5 transition-all"
                    >
                      <CheckCircle2 size={15} /> Duyệt Đơn Bằng Tay
                    </button>

                    <button
                      onClick={() => handleOpenRejectModal(selectedOrderDetails)}
                      className="px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-extrabold text-xs cursor-pointer flex items-center gap-1.5 transition-all"
                    >
                      <XCircle size={15} /> Từ Chối Đơn
                    </button>
                  </>
                )}
              </div>

              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer"
              >
                Đóng Modal
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

      {/* 6. MODAL: TỪ CHỐI ĐƠN HÀNG (Rejection Modal - Rendered via Portal) */}
      {rejectingOrder && createPortal(
        <div
          onClick={() => setRejectingOrder(null)}
          className="fixed inset-0 z-[100000] bg-slate-950/80 backdrop-blur-md p-4 flex items-center justify-center animate-fade-in select-none"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 text-slate-900 animate-modal-pop relative z-10"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-black text-red-700 flex items-center gap-2">
                <XCircle size={20} /> Từ Chối Đơn Hàng {rejectingOrder.orderCode}
              </h3>
              <button
                onClick={() => setRejectingOrder(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleConfirmReject} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Lý do từ chối đơn hàng (sẽ hiển thị cho người dùng):
                </label>
                <textarea
                  rows={3}
                  required
                  value={rejectionReasonInput}
                  onChange={(e) => setRejectionReasonInput(e.target.value)}
                  placeholder="Nhập lý do từ chối..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-red-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingOrder(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={processingOrderId === rejectingOrder._id}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs shadow-md shadow-red-600/20 cursor-pointer flex items-center gap-1.5"
                >
                  {processingOrderId === rejectingOrder._id ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                  Xác Nhận Từ Chối
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};
