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
  Zap,
  Printer,
  BarChart3,
  PieChart,
  UserCheck,
  Sparkles
} from 'lucide-react';
import { VIETNAM_BANKS } from '../../utils/banks';

export const AdminOrdersRevenuePage = () => {
  const { confirm } = useConfirm();
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'settings'

  // Report Modal & Analytics State
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportTimeframe, setReportTimeframe] = useState('THIS_MONTH'); // TODAY | THIS_WEEK | THIS_MONTH | THIS_YEAR | ALL | CUSTOM
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');
  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

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
    orderPrefix: 'FDDH',
    sepayApiKey: 'sepay_secret_key_flexidoc_2026',
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

  const fetchReportData = async () => {
    setReportLoading(true);
    try {
      let url = `/orders/admin/report?timeframe=${reportTimeframe}`;
      if (reportTimeframe === 'CUSTOM') {
        if (reportStartDate) url += `&startDate=${reportStartDate}`;
        if (reportEndDate) url += `&endDate=${reportEndDate}`;
      }
      const res = await api.get(url);
      if (res.success && res.data) {
        setReportData(res.data);
      }
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu báo cáo:', err);
    } finally {
      setReportLoading(false);
    }
  };

  useEffect(() => {
    if (reportModalOpen) {
      fetchReportData();
    }
  }, [reportModalOpen, reportTimeframe, reportStartDate, reportEndDate]);

  const handlePrintReport = () => {
    if (!reportData) return;

    const { summary, packageBreakdown = [], buyersList = [], timeframe, startDate, endDate } = reportData;
    const { totalRevenue = 0, successOrdersCount = 0, mostPopularPlan, topBuyer } = summary || {};

    const timeframeTextMap = {
      TODAY: 'Hôm nay',
      THIS_WEEK: 'Tuần này',
      THIS_MONTH: `Tháng ${new Date().getMonth() + 1}/${new Date().getFullYear()}`,
      THIS_YEAR: `Năm ${new Date().getFullYear()}`,
      ALL: 'Tất cả thời gian',
      CUSTOM: `Từ ${startDate ? new Date(startDate).toLocaleDateString('vi-VN') : '...'} đến ${endDate ? new Date(endDate).toLocaleDateString('vi-VN') : '...'}`
    };

    const timeframeTitle = timeframeTextMap[timeframe] || 'Tất cả thời gian';
    const exportedAt = new Date().toLocaleString('vi-VN');

    const printWindow = window.open('', '_blank', 'width=1100,height=900');
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <title>Báo Cáo Doanh Thu FlexiDoc</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 12mm;
          }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #0f172a;
            margin: 0;
            padding: 0;
            background: #ffffff;
            font-size: 12px;
            line-height: 1.5;
          }
          .header-banner {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 3px solid #0284c7;
            padding-bottom: 10px;
            margin-bottom: 16px;
          }
          .brand-title {
            font-size: 22px;
            font-weight: 900;
            color: #0f172a;
            margin: 0;
          }
          .report-subtitle {
            font-size: 13px;
            font-weight: 800;
            color: #0284c7;
            margin-top: 2px;
          }
          .meta-info {
            text-align: right;
            font-size: 11px;
            color: #64748b;
          }
          .meta-badge {
            display: inline-block;
            background: #e0f2fe;
            color: #0369a1;
            font-weight: 800;
            padding: 3px 10px;
            border-radius: 12px;
            margin-bottom: 4px;
          }
          .kpi-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            margin-bottom: 20px;
          }
          .kpi-card {
            border: 1px solid #cbd5e1;
            border-radius: 10px;
            padding: 10px 12px;
            background: #f8fafc;
          }
          .kpi-title {
            font-size: 10.5px;
            font-weight: 700;
            color: #64748b;
            text-transform: uppercase;
          }
          .kpi-value {
            font-size: 17px;
            font-weight: 900;
            margin-top: 2px;
          }
          .section-heading {
            font-size: 13px;
            font-weight: 800;
            color: #0f172a;
            border-left: 4px solid #0284c7;
            padding-left: 8px;
            margin-top: 18px;
            margin-bottom: 10px;
            text-transform: uppercase;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16px;
            font-size: 11.5px;
          }
          th {
            background-color: #0f172a;
            color: #ffffff;
            font-weight: 800;
            text-align: left;
            padding: 8px 10px;
            text-transform: uppercase;
            font-size: 10.5px;
          }
          td {
            padding: 8px 10px;
            border-bottom: 1px solid #e2e8f0;
          }
          tr:nth-child(even) td {
            background-color: #f8fafc;
          }
          .badge-plan {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 10px;
            font-weight: 800;
            font-size: 10px;
          }
          .plan-vip { background: #f3e8ff; color: #7e22ce; border: 1px solid #d8b4fe; }
          .plan-pro { background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; }
          .plan-basic { background: #dcfce7; color: #15803d; border: 1px solid #86efac; }
          .plan-free { background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; }
          .page-break {
            page-break-before: always;
            break-before: page;
            margin-top: 20px;
          }
          .footer-sign {
            display: flex;
            justify-content: space-between;
            margin-top: 35px;
            text-align: center;
          }
          .sign-box {
            width: 40%;
          }
        </style>
      </head>
      <body>
        <!-- PAGE 1: EXECUTIVE OVERVIEW & PLAN BREAKDOWN -->
        <div class="header-banner">
          <div>
            <h1 class="brand-title">FlexiDoc Enterprise</h1>
            <div class="report-subtitle">BÁO CÁO DOANH THU & PHÂN TÍCH GÓI CƯỚC DỊCH VỤ</div>
          </div>
          <div class="meta-info">
            <div class="meta-badge">Khung thời gian: ${timeframeTitle}</div>
            <div>Ngày xuất báo cáo: ${exportedAt}</div>
            <div>Người xuất: Super Admin</div>
          </div>
        </div>

        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-title">Tổng Doanh Thu</div>
            <div class="kpi-value" style="color: #16a34a;">${totalRevenue.toLocaleString('vi-VN')} đ</div>
            <div style="font-size: 10px; color: #64748b;">Đơn đã thanh toán</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-title">Đơn Thành Công</div>
            <div class="kpi-value" style="color: #0284c7;">${successOrdersCount} đơn</div>
            <div style="font-size: 10px; color: #64748b;">Kích hoạt gói dịch vụ</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-title">Gói Mua Nhiều Nhất</div>
            <div class="kpi-value" style="color: #9333ea;">${mostPopularPlan ? mostPopularPlan.plan : 'N/A'}</div>
            <div style="font-size: 10px; color: #64748b;">${mostPopularPlan ? `${mostPopularPlan.count} lượt mua` : 'Chưa có'}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-title">Khách Chi Nhiều Nhất</div>
            <div class="kpi-value" style="font-size: 13px; color: #d97706; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              ${topBuyer ? topBuyer.orgName : 'N/A'}
            </div>
            <div style="font-size: 10px; color: #64748b;">${topBuyer ? `${topBuyer.totalSpent.toLocaleString('vi-VN')} đ` : 'Chưa có'}</div>
          </div>
        </div>

        <div class="section-heading">Bảng 1: Phân Tích Doanh Thu & Lượt Mua Theo Gói Cước</div>
        <table>
          <thead>
            <tr>
              <th style="width: 8%;">STT</th>
              <th style="width: 20%;">Gói Cước</th>
              <th style="width: 22%;">Số Lần Đặt Mua</th>
              <th style="width: 25%;">Tỷ Lệ % Doanh Thu</th>
              <th style="width: 25%; text-align: right;">Tổng Doanh Thu (VNĐ)</th>
            </tr>
          </thead>
          <tbody>
            ${packageBreakdown.length === 0 ? `
              <tr>
                <td colspan="5" style="text-align: center; color: #94a3b8; padding: 15px;">Chưa có dữ liệu giao dịch trong khoảng thời gian này.</td>
              </tr>
            ` : packageBreakdown.map((p, idx) => `
              <tr>
                <td style="font-weight: bold; color: #64748b;">#${idx + 1}</td>
                <td>
                  <span class="badge-plan ${p.plan === 'VIP' ? 'plan-vip' : p.plan === 'PRO' ? 'plan-pro' : p.plan === 'BASIC' ? 'plan-basic' : 'plan-free'}">
                    ${p.plan}
                  </span>
                </td>
                <td style="font-weight: bold;">${p.count} lượt mua</td>
                <td>
                  <div style="display: flex; align-items: center; gap: 6px;">
                    <div style="width: 50px; height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden;">
                      <div style="width: ${p.percentage}%; height: 100%; background: #0284c7;"></div>
                    </div>
                    <span>${p.percentage}%</span>
                  </div>
                </td>
                <td style="font-weight: 900; text-align: right; color: #16a34a;">${p.totalRevenue.toLocaleString('vi-VN')} đ</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer-sign">
          <div class="sign-box">
            <div style="font-weight: 800; font-size: 11px;">NGƯỜI LẬP BÁO CÁO</div>
            <div style="font-size: 10px; color: #64748b; font-style: italic; margin-bottom: 45px;">(Ký & ghi rõ họ tên)</div>
            <div style="font-weight: bold;">Quản Trị Viên Hệ Thống</div>
          </div>
          <div class="sign-box">
            <div style="font-weight: 800; font-size: 11px;">ĐẠI DIỆN PHÊ DUYỆT</div>
            <div style="font-size: 10px; color: #64748b; font-style: italic; margin-bottom: 45px;">(Ký & đóng dấu)</div>
            <div style="font-weight: bold;">FlexiDoc Management</div>
          </div>
        </div>

        <!-- PAGE BREAK TO PAGE 2 FOR DETAILED BUYERS LIST -->
        <div class="page-break"></div>

        <!-- PAGE 2: DETAILED BUYERS LIST TABLE -->
        <div class="header-banner">
          <div>
            <h1 class="brand-title">FlexiDoc Enterprise - Trang 2</h1>
            <div class="report-subtitle">DANH SÁCH CHI TIẾT KHÁCH HÀNG & TỔ CHỨC CHI TIÊU</div>
          </div>
          <div class="meta-info">
            <div class="meta-badge">Thời gian: ${timeframeTitle}</div>
            <div>Tổng số khách hàng: ${buyersList.length} tổ chức</div>
          </div>
        </div>

        <div class="section-heading">Bảng 2: Danh Sách Chi Tiết Khách Hàng / Tổ Chức Đã Mua Gói Cước</div>
        <table>
          <thead>
            <tr>
              <th style="width: 5%;">STT</th>
              <th style="width: 28%;">Tên Tổ Chức (Mã Org)</th>
              <th style="width: 27%;">Người Đại Diện (Email / SĐT)</th>
              <th style="width: 15%;">Gói Đã Mua</th>
              <th style="width: 8%; text-align: center;">Số Đơn</th>
              <th style="width: 17%; text-align: right;">Tổng Tiền Chi (VNĐ)</th>
            </tr>
          </thead>
          <tbody>
            ${buyersList.length === 0 ? `
              <tr>
                <td colspan="6" style="text-align: center; color: #94a3b8; padding: 15px;">Không có dữ liệu người mua trong khoảng thời gian được chọn.</td>
              </tr>
            ` : buyersList.map((b, idx) => `
              <tr>
                <td style="font-weight: bold; color: #64748b;">#${idx + 1}</td>
                <td>
                  <div style="font-weight: 800; color: #0f172a;">${b.orgName}</div>
                  <div style="font-size: 10px; color: #0284c7; font-family: monospace;">Mã: ${b.orgCode}</div>
                </td>
                <td>
                  <div style="font-weight: bold;">${b.userFullName}</div>
                  <div style="font-size: 10px; color: #64748b;">${b.userEmail} ${b.userPhone ? ' | ' + b.userPhone : ''}</div>
                </td>
                <td>
                  ${b.plansPurchased.map(plan => `
                    <span class="badge-plan ${plan === 'VIP' ? 'plan-vip' : plan === 'PRO' ? 'plan-pro' : plan === 'BASIC' ? 'plan-basic' : 'plan-free'}" style="margin-right: 2px;">
                      ${plan}
                    </span>
                  `).join('')}
                </td>
                <td style="font-weight: bold; text-align: center;">${b.ordersCount} đơn</td>
                <td style="font-weight: 900; text-align: right; color: #16a34a; font-size: 12.5px;">
                  ${b.totalSpent.toLocaleString('vi-VN')} đ
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div style="background: #f1f5f9; padding: 10px 14px; border-radius: 8px; border: 1px solid #cbd5e1; display: flex; justify-content: space-between; align-items: center; font-weight: bold; margin-top: 15px;">
          <span>TỔNG CỘNG TOÀN BỘ DOANH THU KHÁCH HÀNG:</span>
          <span style="font-size: 15px; font-weight: 900; color: #16a34a;">${totalRevenue.toLocaleString('vi-VN')} VNĐ</span>
        </div>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 400);
  };

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
      confirm({
        title: 'Lỗi',
        message: err.message || 'Lỗi khi duyệt đơn',
        hideCancel: true,
        confirmText: 'Đóng',
        variant: 'danger'
      });
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
      confirm({
        title: 'Lỗi',
        message: err.message || 'Lỗi khi từ chối đơn',
        hideCancel: true,
        confirmText: 'Đóng',
        variant: 'danger'
      });
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

          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5 break-words">
              <DollarSign size={26} className="text-emerald-600 shrink-0" />
              <span>Quản Lý Đơn Hàng & Doanh Thu Hệ Thống</span>
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi tất cả đơn hàng nâng cấp gói cước, duyệt đơn bằng tay hoặc tự động qua SePay Webhook.
          </p>
        </div>

        {/* Header Action Buttons & Tab Switcher */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setReportModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 hover:shadow-emerald-600/35 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
          >
            <Printer size={15} /> Xuất Báo Cáo Doanh Thu
          </button>

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
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs min-w-[1000px]">
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
                    placeholder="FDDH"
                    value={paymentConfig.orderPrefix}
                    onChange={(e) => setPaymentConfig({ ...paymentConfig, orderPrefix: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono font-bold focus:ring-2 focus:ring-sky-500 outline-none uppercase"
                  />
                  <span className="text-[10.5px] text-slate-400 mt-1 block">Khách hàng sẽ chuyển với nội dung: <code>FDDH DH88910</code></span>
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
                  {paymentConfig.orderPrefix || 'FDDH'} {selectedOrderDetails.orderCode}
                </span>
                <button
                  onClick={() => handleCopyTransferCode(`${paymentConfig.orderPrefix || 'FDDH'} ${selectedOrderDetails.orderCode}`)}
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
                  <div>Hình thức: <strong>{selectedOrderDetails.paymentMethod === 'SEPAY_WEBHOOK' ? 'SePay Webhook (Tự Động)' : 'Duyệt Thủ Công'}</strong></div>
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
            className="bg-white rounded-3xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl border border-slate-200 text-slate-900 animate-modal-pop relative z-10"
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

      {/* 7. MODAL: XUẤT BÁO CÁO DOANH THU & PHÂN TÍCH (Rendered via Portal) */}
      {reportModalOpen && createPortal(
        <div
          onClick={() => setReportModalOpen(false)}
          className="fixed inset-0 z-[100000] bg-slate-950/80 backdrop-blur-md p-4 flex items-center justify-center animate-fade-in select-none"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-6 md:p-8 max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 text-slate-900 animate-modal-pop relative z-10"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <BarChart3 size={13} /> Báo Cáo Doanh Thu Hệ Thống
                  </span>
                </div>
                <h2 className="text-xl font-black text-slate-900">Báo Cáo Doanh Thu & Phân Tích Gói Dịch Vụ</h2>
              </div>

              <button
                onClick={() => setReportModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Timeframe Filter Bar */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-6 flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
                <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                  <Calendar size={14} /> Khung thời gian:
                </span>
                {[
                  { id: 'THIS_MONTH', label: 'Tháng này' },
                  { id: 'TODAY', label: 'Hôm nay' },
                  { id: 'THIS_WEEK', label: 'Tuần này' },
                  { id: 'THIS_YEAR', label: 'Năm nay' },
                  { id: 'ALL', label: 'Tất cả' },
                  { id: 'CUSTOM', label: 'Tùy chọn' }
                ].map((tf) => (
                  <button
                    key={tf.id}
                    onClick={() => setReportTimeframe(tf.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      reportTimeframe === tf.id
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>

              {reportTimeframe === 'CUSTOM' && (
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <input
                    type="date"
                    value={reportStartDate}
                    onChange={(e) => setReportStartDate(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-sky-500 outline-none bg-white"
                  />
                  <span className="text-xs text-slate-400">đến</span>
                  <input
                    type="date"
                    value={reportEndDate}
                    onChange={(e) => setReportEndDate(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-sky-500 outline-none bg-white"
                  />
                </div>
              )}
            </div>

            {reportLoading ? (
              <div className="py-16 text-center text-xs text-slate-400 font-bold flex items-center justify-center gap-2">
                <Loader2 size={20} className="animate-spin text-sky-600" /> Đang tổng hợp dữ liệu báo cáo...
              </div>
            ) : !reportData ? (
              <div className="py-12 text-center text-xs text-slate-400">Chưa có dữ liệu báo cáo.</div>
            ) : (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="bg-emerald-50/60 border border-emerald-200 p-4 rounded-2xl">
                    <span className="text-[11px] font-bold text-emerald-800 uppercase block mb-1">Tổng Doanh Thu</span>
                    <div className="text-xl font-black text-emerald-700">
                      {reportData.summary.totalRevenue.toLocaleString('vi-VN')} đ
                    </div>
                    <span className="text-[10px] text-emerald-600 font-medium">Trong khung thời gian đã chọn</span>
                  </div>

                  <div className="bg-sky-50/60 border border-sky-200 p-4 rounded-2xl">
                    <span className="text-[11px] font-bold text-sky-800 uppercase block mb-1">Đơn Hàng Thành Công</span>
                    <div className="text-xl font-black text-sky-700">
                      {reportData.summary.successOrdersCount} đơn
                    </div>
                    <span className="text-[10px] text-sky-600 font-medium">Đã thanh toán & kích hoạt</span>
                  </div>

                  <div className="bg-purple-50/60 border border-purple-200 p-4 rounded-2xl">
                    <span className="text-[11px] font-bold text-purple-800 uppercase block mb-1">Gói Mua Nhiều Nhất</span>
                    <div className="text-xl font-black text-purple-700">
                      {reportData.summary.mostPopularPlan ? reportData.summary.mostPopularPlan.plan : 'N/A'}
                    </div>
                    <span className="text-[10px] text-purple-600 font-medium">
                      {reportData.summary.mostPopularPlan ? `${reportData.summary.mostPopularPlan.count} lượt mua (${reportData.summary.mostPopularPlan.totalRevenue.toLocaleString('vi-VN')}đ)` : 'Chưa có lượt mua nào'}
                    </span>
                  </div>

                  <div className="bg-amber-50/60 border border-amber-200 p-4 rounded-2xl">
                    <span className="text-[11px] font-bold text-amber-900 uppercase block mb-1">Khách Chi Nhiều Nhất</span>
                    <div className="text-sm font-black text-amber-800 truncate" title={reportData.summary.topBuyer?.orgName}>
                      {reportData.summary.topBuyer ? reportData.summary.topBuyer.orgName : 'N/A'}
                    </div>
                    <span className="text-[10px] text-amber-700 font-bold block mt-0.5">
                      {reportData.summary.topBuyer ? `${reportData.summary.topBuyer.totalSpent.toLocaleString('vi-VN')} đ` : 'Chưa có'}
                    </span>
                  </div>
                </div>

                {/* PAGE 1 PREVIEW: Package Breakdown Table */}
                <div className="border border-slate-200 rounded-2xl p-5 bg-white shadow-2xs">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                      <PieChart size={16} className="text-sky-600" /> Bảng 1: Doanh Thu & Lượt Mua Theo Gói Cước (Trang 1)
                    </h4>
                    <span className="text-[11px] font-extrabold bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 rounded-full">
                      Trang 1 / Executive Overview
                    </span>
                  </div>

                  <div className="w-full overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs min-w-[600px]">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-extrabold text-slate-500 uppercase">
                          <th className="py-2.5 px-3">STT</th>
                          <th className="py-2.5 px-3">Gói Cước</th>
                          <th className="py-2.5 px-3">Số Lần Đặt Mua</th>
                          <th className="py-2.5 px-3">Tỷ Lệ % Doanh Thu</th>
                          <th className="py-2.5 px-3 text-right">Tổng Doanh Thu (VNĐ)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {reportData.packageBreakdown.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-6 text-center text-slate-400 font-normal">Chưa có giao dịch trong thời gian này.</td>
                          </tr>
                        ) : (
                          reportData.packageBreakdown.map((p, idx) => (
                            <tr key={p.plan} className="hover:bg-slate-50/80">
                              <td className="py-2.5 px-3 font-bold text-slate-400">#{idx + 1}</td>
                              <td className="py-2.5 px-3 font-extrabold">
                                <span className={`px-2 py-0.5 rounded-md text-[11px] font-extrabold border ${
                                  p.plan === 'VIP' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                  p.plan === 'PRO' ? 'bg-sky-50 text-sky-700 border-sky-200' :
                                  p.plan === 'BASIC' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                  'bg-slate-100 text-slate-700 border-slate-200'
                                }`}>
                                  {p.plan}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 font-bold text-slate-900">{p.count} lượt</td>
                              <td className="py-2.5 px-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-sky-500 rounded-full" style={{ width: `${p.percentage}%` }} />
                                  </div>
                                  <span className="font-bold text-slate-700 text-[11px]">{p.percentage}%</span>
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-right font-black text-emerald-600 text-sm">
                                {p.totalRevenue.toLocaleString('vi-VN')}đ
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* PAGE BREAK INDICATOR */}
                <div className="relative py-2 text-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t-2 border-dashed border-sky-300" />
                  </div>
                  <div className="relative inline-flex items-center gap-1.5 bg-sky-600 text-white font-black text-[11px] px-4 py-1 rounded-full uppercase shadow-xs">
                    <Sparkles size={12} /> Tự Động Ngắt Trang Khi Xuất Báo Cáo (Page Break &rarr; Trang 2)
                  </div>
                </div>

                {/* PAGE 2 PREVIEW: Detailed Buyers List Table */}
                <div className="border border-slate-200 rounded-2xl p-5 bg-white shadow-2xs">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                      <UserCheck size={16} className="text-emerald-600" /> Bảng 2: Danh Sách Chi Tiết Khách Hàng & Tổ Chức (Trang 2)
                    </h4>
                    <span className="text-[11px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                      Trang 2 / Detailed Buyers List
                    </span>
                  </div>

                  <div className="w-full overflow-x-auto max-h-60 overflow-y-auto">
                    <table className="w-full text-left border-collapse text-xs min-w-[600px]">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-extrabold text-slate-500 uppercase sticky top-0 bg-slate-50 z-10">
                          <th className="py-2.5 px-3">STT</th>
                          <th className="py-2.5 px-3">Tổ Chức</th>
                          <th className="py-2.5 px-3">Người Đại Diện</th>
                          <th className="py-2.5 px-3">Gói Mua</th>
                          <th className="py-2.5 px-3 text-center">Số Đơn</th>
                          <th className="py-2.5 px-3 text-right">Tổng Tiền Chi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {reportData.buyersList.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-6 text-center text-slate-400 font-normal">Chưa có khách hàng giao dịch.</td>
                          </tr>
                        ) : (
                          reportData.buyersList.map((b, idx) => (
                            <tr key={b.orgId} className="hover:bg-slate-50/80">
                              <td className="py-2.5 px-3 font-bold text-slate-400">#{idx + 1}</td>
                              <td className="py-2.5 px-3">
                                <div className="font-extrabold text-slate-900">{b.orgName}</div>
                                <span className="text-[10px] text-sky-700 font-mono">Mã: {b.orgCode}</span>
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="font-bold text-slate-800">{b.userFullName}</div>
                                <span className="text-[10px] text-slate-400">{b.userEmail}</span>
                              </td>
                              <td className="py-2.5 px-3">
                                {b.plansPurchased.map(p => (
                                  <span key={p} className="inline-block px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-slate-100 text-slate-700 mr-1 border border-slate-200">
                                    {p}
                                  </span>
                                ))}
                              </td>
                              <td className="py-2.5 px-3 text-center font-bold text-slate-700">{b.ordersCount} đơn</td>
                              <td className="py-2.5 px-3 text-right font-black text-emerald-600 text-sm">
                                {b.totalSpent.toLocaleString('vi-VN')}đ
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Modal Action Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <span className="text-xs text-slate-400 font-medium">
                    Báo cáo sẽ được xuất dưới dạng HTML/PDF 2 trang sẵn sàng để in trực tiếp.
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setReportModalOpen(false)}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                    >
                      Hủy Bỏ
                    </button>
                    <button
                      onClick={handlePrintReport}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/25 hover:shadow-emerald-600/40 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
                    >
                      <Printer size={16} /> In / Xuất PDF Báo Cáo
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};
