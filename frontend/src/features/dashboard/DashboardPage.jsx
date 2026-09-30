import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../app/AuthContext';
import { 
  FileText, 
  Building2, 
  Users, 
  FileCheck, 
  Shield, 
  Download, 
  Plus, 
  FilePlus, 
  Briefcase, 
  Clock, 
  ExternalLink, 
  Crown,
  ArrowRight,
  FolderPlus,
  UserPlus,
  DollarSign,
  CreditCard,
  Building,
  CheckCircle2,
  TrendingUp,
  Activity,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { formatAuditAction, formatAuditDetail } from '../../utils/auditFormatter';

export const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isAdmin = ['ORGANIZATION_ADMIN', 'SUPER_ADMIN'].includes(user?.role);

  const [stats, setStats] = useState({
    templatesCount: 0,
    contractsCount: 0,
    usersCount: 0,
    masterDataCount: 0,
    orgsCount: 0,
    totalRevenue: 0,
    totalOrders: 0,
  });

  const [recentContracts, setRecentContracts] = useState([]);
  const [staffLogs, setStaffLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      if (isSuperAdmin) {
        // Fetch System-wide statistics for Super Admin
        const [orgsRes, usersRes, ctrRes, orderRes, logRes] = await Promise.all([
          api.get('/organizations/tree').catch(() => ({ data: [] })),
          api.get('/users').catch(() => ({ data: [] })),
          api.get('/contracts').catch(() => ({ data: [] })),
          api.get('/orders/admin/all').catch(() => ({ data: { stats: {} } })),
          api.get('/audit-logs').catch(() => ({ data: [] })),
        ]);

        const orgs = Array.isArray(orgsRes.data) ? orgsRes.data : [];
        const users = Array.isArray(usersRes.data) ? usersRes.data : [];
        const contracts = Array.isArray(ctrRes.data) ? ctrRes.data : [];
        const logs = Array.isArray(logRes.data) ? logRes.data : [];

        const orderStats = orderRes.data?.stats || {};
        const totalRev = orderStats.totalRevenue || 0;
        const totalOrd = orderStats.totalOrders || 0;

        setStats({
          orgsCount: orgs.length,
          usersCount: users.length,
          contractsCount: contracts.length,
          totalRevenue: totalRev,
          totalOrders: totalOrd,
          templatesCount: 0,
          masterDataCount: 0,
        });

        setRecentContracts(contracts.slice(0, 7));
        setStaffLogs(logs.slice(0, 7));
      } else {
        // Fetch Tenant Organization statistics for Org Admin / Staff
        const [tplRes, ctrRes, mdRes, logRes, usersRes] = await Promise.all([
          api.get('/templates').catch(() => ({ data: [] })),
          api.get('/contracts').catch(() => ({ data: [] })),
          api.get('/master-data').catch(() => ({ data: [] })),
          isAdmin ? api.get('/audit-logs').catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
          api.get('/users').catch(() => ({ data: [] })),
        ]);

        const templates = Array.isArray(tplRes.data) ? tplRes.data : [];
        const contracts = Array.isArray(ctrRes.data) ? ctrRes.data : [];
        const masterData = Array.isArray(mdRes.data) ? mdRes.data : [];
        const logs = Array.isArray(logRes.data) ? logRes.data : [];
        const users = Array.isArray(usersRes.data) ? usersRes.data : [];

        setStats({
          templatesCount: templates.length,
          contractsCount: contracts.length,
          usersCount: users.length,
          masterDataCount: masterData.length,
          orgsCount: 0,
          totalRevenue: 0,
          totalOrders: 0,
        });

        setRecentContracts(contracts.slice(0, 5));
        setStaffLogs(logs.slice(0, 5));
      }
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu Dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const handleExportReportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    if (isSuperAdmin) {
      csvContent += "Chi_So_He_Thong,Gia_Tri_Thuc_Te\n"
        + `Tong_So_To_Chuc,${stats.orgsCount}\n`
        + `Tong_Nguoi_Dung_He_Thong,${stats.usersCount}\n`
        + `Tong_Doanh_Thu_VND,${stats.totalRevenue}\n`
        + `Tong_Don_Hang,${stats.totalOrders}\n`
        + `Tong_Hop_Dong_Da_Sinh,${stats.contractsCount}\n`
        + `Thoi_Gian_Xuat,${new Date().toISOString()}`;
    } else {
      csvContent += "Chi_So_To_Chuc,Gia_Tri_Thuc_Te\n"
        + `Nhan_Su_Trong_To_Chuc,${stats.usersCount}\n`
        + `Mau_Template_So_Hoa,${stats.templatesCount}\n`
        + `Hop_Dong_Da_Sinh,${stats.contractsCount}\n`
        + `Ho_So_Master_Data,${stats.masterDataCount}\n`
        + `Thoi_Gian_Xuat,${new Date().toISOString()}`;
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Bao_Cao_${isSuperAdmin ? 'He_Thong' : 'To_Chuc'}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const orgName = user?.organizationId?.name || 'Tổ Chức Của Bạn';
  const orgCode = user?.organizationId?.code || 'ORG-SYSTEM';
  const orgPlan = user?.organizationId?.plan || 'FREE';

  // =========================================================================
  // VIEW 1: SUPER ADMIN DASHBOARD (SYSTEM GOVERNANCE)
  // =========================================================================
  if (isSuperAdmin) {
    return (
      <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-10">
        
        {/* 1. Super Admin Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-sky-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-700/60">
          <div className="absolute right-0 top-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="bg-sky-500/20 text-sky-300 border border-sky-400/30 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 backdrop-blur-md">
                  <Shield size={14} className="text-sky-400" />
                  Quản Trị Hệ Thống Tối Cao (Super Admin)
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-extrabold px-3 py-1 rounded-full flex items-center gap-1">
                  <Activity size={14} /> Toàn Hệ Thống
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
                <Building2 size={32} className="text-sky-400" />
                <span>Bảng Điều Khiển Hệ Thống FlexiDoc</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
                Quản trị toàn bộ tổ chức, kiểm soát đơn hàng & doanh thu gói cước, phân quyền người dùng và theo dõi tất cả hợp đồng được sinh ra trên toàn hệ thống.
              </p>
            </div>

            {/* Quick Admin Actions */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button 
                onClick={() => navigate('/admin/orders')}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-emerald-500/25 transition-all cursor-pointer flex items-center gap-2 hover:-translate-y-0.5"
              >
                <DollarSign size={18} /> Quản Lý Đơn Hàng & Doanh Thu
              </button>
              <button 
                onClick={() => navigate('/organizations')}
                className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm backdrop-blur-md transition-all cursor-pointer flex items-center gap-2 border border-white/20"
              >
                <Building size={16} /> Cây Tổ Chức
              </button>
              <button 
                onClick={handleExportReportCSV}
                className="px-3.5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border border-slate-600"
                title="Xuất Báo Cáo CSV Hệ Thống"
              >
                <Download size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* 2. 4 System Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Total Organizations */}
          <div 
            onClick={() => navigate('/organizations')}
            className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:border-sky-400 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Tổng Số Tổ Chức
                </span>
                <div className="text-3xl font-black text-slate-900 my-1">
                  {loading ? '...' : stats.orgsCount} <span className="text-xs font-semibold text-slate-400">tổ chức</span>
                </div>
                <span className="text-[11.5px] font-extrabold text-sky-600 flex items-center gap-1 group-hover:underline">
                  Quản lý tổ chức <ArrowRight size={13} />
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center shrink-0">
                <Building size={24} />
              </div>
            </div>
          </div>

          {/* System Revenue */}
          <div 
            onClick={() => navigate('/admin/orders')}
            className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Doanh Thu Hệ Thống
                </span>
                <div className="text-2xl font-black text-emerald-700 my-1">
                  {loading ? '...' : `${stats.totalRevenue.toLocaleString('vi-VN')}đ`}
                </div>
                <span className="text-[11.5px] font-extrabold text-emerald-600 flex items-center gap-1 group-hover:underline">
                  {stats.totalOrders} đơn hàng thành công <ArrowRight size={13} />
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                <TrendingUp size={24} />
              </div>
            </div>
          </div>

          {/* Total System Users */}
          <div 
            onClick={() => navigate('/users')}
            className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:border-purple-400 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Tổng Người Dùng
                </span>
                <div className="text-3xl font-black text-slate-900 my-1">
                  {loading ? '...' : stats.usersCount} <span className="text-xs font-semibold text-slate-400">tài khoản</span>
                </div>
                <span className="text-[11.5px] font-extrabold text-purple-600 flex items-center gap-1 group-hover:underline">
                  Quản lý tài khoản <ArrowRight size={13} />
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0">
                <Users size={24} />
              </div>
            </div>
          </div>

          {/* Total System Contracts */}
          <div 
            onClick={() => navigate('/contracts')}
            className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:border-amber-400 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Hợp Đồng Đã Sinh (Hệ Thống)
                </span>
                <div className="text-3xl font-black text-slate-900 my-1">
                  {loading ? '...' : stats.contractsCount} <span className="text-xs font-semibold text-slate-400">bản ghi</span>
                </div>
                <span className="text-[11.5px] font-extrabold text-amber-600 flex items-center gap-1 group-hover:underline">
                  Xem tất cả hợp đồng <ArrowRight size={13} />
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0">
                <FileCheck size={24} />
              </div>
            </div>
          </div>

        </div>

        {/* 3. Quick Admin Operations Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          <div 
            onClick={() => navigate('/admin/orders')}
            className="bg-emerald-50/70 hover:bg-emerald-50 border border-emerald-200 rounded-2xl p-4 cursor-pointer transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <CreditCard size={20} />
              </div>
              <div>
                <h4 className="text-xs font-black text-emerald-950">Đơn Hàng & Doanh Thu</h4>
                <p className="text-[11px] text-emerald-700 font-medium">Webhook SePay & Duyệt tay</p>
              </div>
            </div>
            <ArrowRight size={18} className="text-emerald-700 group-hover:translate-x-1 transition-transform" />
          </div>

          <div 
            onClick={() => navigate('/organizations')}
            className="bg-sky-50/70 hover:bg-sky-50 border border-sky-200 rounded-2xl p-4 cursor-pointer transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Building size={20} />
              </div>
              <div>
                <h4 className="text-xs font-black text-sky-950">Quản Lý Cây Tổ Chức</h4>
                <p className="text-[11px] text-sky-700 font-medium">Khóa / Mở khóa & Cấp gói VIP</p>
              </div>
            </div>
            <ArrowRight size={18} className="text-sky-700 group-hover:translate-x-1 transition-transform" />
          </div>

          <div 
            onClick={() => navigate('/users')}
            className="bg-purple-50/70 hover:bg-purple-50 border border-purple-200 rounded-2xl p-4 cursor-pointer transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <UserCheck size={20} />
              </div>
              <div>
                <h4 className="text-xs font-black text-purple-950">Tài Khoản & Nhân Sự</h4>
                <p className="text-[11px] text-purple-700 font-medium">Toàn bộ người dùng hệ thống</p>
              </div>
            </div>
            <ArrowRight size={18} className="text-purple-700 group-hover:translate-x-1 transition-transform" />
          </div>

          <div 
            onClick={() => navigate('/audit-logs')}
            className="bg-slate-100/90 hover:bg-slate-200/80 border border-slate-300 rounded-2xl p-4 cursor-pointer transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Clock size={20} />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900">Nhật Ký Audit Log</h4>
                <p className="text-[11px] text-slate-600 font-medium">Lịch sử hoạt động bảo mật</p>
              </div>
            </div>
            <ArrowRight size={18} className="text-slate-800 group-hover:translate-x-1 transition-transform" />
          </div>

        </div>

        {/* 4. Table: All System Contracts Created by Users */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <FileCheck size={18} className="text-sky-600" /> Toàn Bộ Hợp Đồng Đã Sinh Trên Toàn Hệ Thống
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Admin xem được tất cả các hợp đồng do người dùng tạo ra từ các tổ chức khác nhau
              </p>
            </div>
            <Link to="/contracts" className="text-xs font-extrabold text-sky-600 hover:underline flex items-center gap-1">
              Xem tất cả ({stats.contractsCount}) <ChevronRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div className="py-6 text-center text-xs text-slate-400 font-bold">
              Đang tải danh sách hợp đồng hệ thống...
            </div>
          ) : recentContracts.length === 0 ? (
            <div className="py-10 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <FileText size={36} className="mx-auto text-slate-300 mb-2" />
              <h4 className="text-xs font-bold text-slate-600">Chưa có hợp đồng nào trong toàn bộ hệ thống</h4>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                    <th className="py-3 px-3">Mã Hợp Đồng</th>
                    <th className="py-3 px-3">Tên / Tiêu Đề</th>
                    <th className="py-3 px-3">Tổ Chức Thực Hiện</th>
                    <th className="py-3 px-3">Người Tạo</th>
                    <th className="py-3 px-3">Trạng Thái</th>
                    <th className="py-3 px-3">Ngày Tạo</th>
                    <th className="py-3 px-3 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium">
                  {recentContracts.map(c => (
                    <tr key={c._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-3 font-mono font-bold text-sky-800">{c.code}</td>
                      <td className="py-3.5 px-3 font-bold text-slate-900">{c.title}</td>
                      <td className="py-3.5 px-3">
                        {c.organizationId?.name ? (
                          <span className="bg-sky-50 text-sky-700 px-2.5 py-1 rounded-lg border border-sky-200 text-[11px] font-extrabold flex items-center gap-1 w-fit">
                            <Building size={12} /> {c.organizationId.name} ({c.organizationId.code || 'MAIN'})
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Hệ thống</span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 font-extrabold text-slate-700">
                        {c.createdBy?.fullName || c.createdBy?.email || 'N/A'}
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10.5px] font-extrabold px-2.5 py-1 rounded-full border border-emerald-200">
                          <CheckCircle2 size={12} className="text-emerald-600" /> {c.status || 'Hoàn thành'}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-slate-500 font-medium">
                        {c.createdAt ? new Date(c.createdAt).toLocaleDateString('vi-VN') : 'Mới đây'}
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <button 
                          onClick={() => navigate('/contracts')}
                          className="px-3 py-1.5 rounded-xl bg-sky-50 text-sky-700 border border-sky-200 text-xs font-bold hover:bg-sky-100 transition-all cursor-pointer inline-flex items-center gap-1"
                        >
                          <ExternalLink size={12} /> Xem
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 5. Table: System Audit Logs */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Clock size={18} className="text-slate-700" /> Nhật Ký Thao Tác Hệ Thống (Audit Logs)
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Toàn bộ lịch sử thao tác quan trọng từ tất cả người dùng và admin trên hệ thống
              </p>
            </div>
            <Link to="/audit-logs" className="text-xs font-bold text-slate-600 hover:underline">
              Xem nhật ký đầy đủ →
            </Link>
          </div>

          {loading ? (
            <div className="py-6 text-center text-xs text-slate-400 font-bold">
              Đang tải nhật ký...
            </div>
          ) : staffLogs.length === 0 ? (
            <div className="py-8 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50 text-xs text-slate-400">
              Chưa có nhật ký hoạt động nào phát sinh.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                    <th className="py-3 px-3">Thời Gian</th>
                    <th className="py-3 px-3">Người Thao Tác</th>
                    <th className="py-3 px-3">Hành Động</th>
                    <th className="py-3 px-3">Chi Tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium">
                  {staffLogs.map((log, index) => (
                    <tr key={log._id || index} className="hover:bg-slate-50/80">
                      <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                        {log.timestamp ? new Date(log.timestamp).toLocaleString('vi-VN') : 'Vừa xong'}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-800">
                        {log.userId?.fullName || log.userId?.email || 'Hệ thống'}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2.5 py-1 rounded-full text-[10.5px] font-extrabold bg-sky-50 text-sky-700 border border-sky-200">
                          {formatAuditAction(log.action)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-800 font-semibold">
                        {formatAuditDetail(log)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    );
  }

  // =========================================================================
  // VIEW 2: TENANT ORGANIZATION DASHBOARD (FOR ORG ADMIN & STAFF)
  // =========================================================================
  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-10">
      
      {/* 1. Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="bg-sky-50 text-sky-700 border border-sky-200 text-xs font-bold px-2.5 py-0.5 rounded-md flex items-center gap-1">
              <Shield size={13} />
              {user?.role === 'ORGANIZATION_ADMIN' ? 'Quản Trị Viên Tổ Chức' : 'Nhân Viên'}
            </span>
            <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-0.5 rounded-md">
              Mã: <strong className="text-slate-900 font-mono">{orgCode}</strong>
            </span>
            <span className="bg-amber-50 text-amber-700 border border-amber-200 text-xs font-extrabold px-2.5 py-0.5 rounded-md flex items-center gap-1">
              <Crown size={13} /> Gói {orgPlan}
            </span>
          </div>

          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Building2 size={26} className="text-sky-600" />
            <span>{orgName}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Tổng quan dữ liệu thực tế thuộc tổ chức của bạn trong hệ thống.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 mt-1 sm:mt-0">
          <button 
            onClick={() => navigate('/contracts?action=create')}
            className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs md:text-sm shadow-sm transition-all cursor-pointer flex items-center gap-2"
          >
            <FilePlus size={16} /> + Sinh Hợp Đồng
          </button>
          {isAdmin && (
            <button 
              onClick={() => navigate('/templates')}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs md:text-sm transition-all cursor-pointer flex items-center gap-2"
            >
              <Plus size={16} /> + Tạo Template
            </button>
          )}
          {isAdmin && (
            <button 
              onClick={handleExportReportCSV}
              className="px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              title="Xuất Báo Cáo CSV"
            >
              <Download size={16} />
              <span>Xuất CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* User Count */}
        <div 
          onClick={() => navigate('/users')}
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:border-purple-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Số Người Trong Tổ Chức
              </span>
              <div className="text-3xl font-black text-slate-900 my-1">
                {loading ? '...' : stats.usersCount} <span className="text-xs font-medium text-slate-400">người</span>
              </div>
              <span className="text-[11.5px] font-bold text-purple-600 flex items-center gap-1 group-hover:underline">
                Xem nhân sự <ArrowRight size={13} />
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Users size={22} />
            </div>
          </div>
        </div>

        {/* Template Count */}
        <div 
          onClick={() => navigate('/templates')}
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:border-sky-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Mẫu Hợp Đồng Đang Dùng
              </span>
              <div className="text-3xl font-black text-slate-900 my-1">
                {loading ? '...' : stats.templatesCount} <span className="text-xs font-medium text-slate-400">mẫu</span>
              </div>
              <span className="text-[11.5px] font-bold text-sky-600 flex items-center gap-1 group-hover:underline">
                Xem danh sách mẫu <ArrowRight size={13} />
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
              <FileText size={22} />
            </div>
          </div>
        </div>

        {/* Contract Count */}
        <div 
          onClick={() => navigate('/contracts')}
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:border-emerald-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Hợp Đồng Đã Sinh PDF
              </span>
              <div className="text-3xl font-black text-slate-900 my-1">
                {loading ? '...' : stats.contractsCount} <span className="text-xs font-medium text-slate-400">hợp đồng</span>
              </div>
              <span className="text-[11.5px] font-bold text-emerald-600 flex items-center gap-1 group-hover:underline">
                Xem hợp đồng <ArrowRight size={13} />
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <FileCheck size={22} />
            </div>
          </div>
        </div>

        {/* Master Data Count */}
        <div 
          onClick={() => navigate('/master-data')}
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:border-amber-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Hồ Sơ Master Data
              </span>
              <div className="text-3xl font-black text-slate-900 my-1">
                {loading ? '...' : stats.masterDataCount} <span className="text-xs font-medium text-slate-400">bản ghi</span>
              </div>
              <span className="text-[11.5px] font-bold text-amber-600 flex items-center gap-1 group-hover:underline">
                Xem dữ liệu mẫu <ArrowRight size={13} />
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Briefcase size={22} />
            </div>
          </div>
        </div>

      </div>

      {/* 3. Quick Action Cards */}
      <div className={`grid grid-cols-1 ${isAdmin ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-4`}>
        
        <div 
          onClick={() => navigate('/contracts?action=create')}
          className="bg-emerald-50/60 hover:bg-emerald-50 border border-emerald-200/80 rounded-2xl p-4 cursor-pointer transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <FilePlus size={20} />
            </div>
            <div>
              <h4 className="text-xs font-black text-emerald-950">Sinh Hợp Đồng Nhanh</h4>
              <p className="text-[11px] text-emerald-700">Điền dữ liệu & xuất PDF chuẩn A4</p>
            </div>
          </div>
          <ArrowRight size={18} className="text-emerald-700" />
        </div>

        <div 
          onClick={() => navigate('/templates')}
          className="bg-sky-50/60 hover:bg-sky-50 border border-sky-200/80 rounded-2xl p-4 cursor-pointer transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0">
              <FolderPlus size={20} />
            </div>
            <div>
              <h4 className="text-xs font-black text-sky-950">Quản Lý Template Số Hóa</h4>
              <p className="text-[11px] text-sky-700">Tải file .Docx & khai báo biến</p>
            </div>
          </div>
          <ArrowRight size={18} className="text-sky-700" />
        </div>

        {isAdmin && (
          <div 
            onClick={() => navigate('/users')}
            className="bg-purple-50/60 hover:bg-purple-50 border border-purple-200/80 rounded-2xl p-4 cursor-pointer transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0">
                <UserPlus size={20} />
              </div>
              <div>
                <h4 className="text-xs font-black text-purple-950">Thành Viên Tổ Chức</h4>
                <p className="text-[11px] text-purple-700">Quản lý mã gia nhập & tài khoản</p>
              </div>
            </div>
            <ArrowRight size={18} className="text-purple-700" />
          </div>
        )}

      </div>

      {/* 4. Recent Contracts Table */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <FileCheck size={18} className="text-emerald-600" /> Hợp Đồng Vừa Sinh Gần Đây
            </h3>
            <p className="text-xs text-slate-500">
              Danh sách các bản ghi hợp đồng được tạo thực tế trong cơ sở dữ liệu
            </p>
          </div>
          <Link to="/contracts" className="text-xs font-bold text-sky-600 hover:underline">
            Xem tất cả ({stats.contractsCount}) →
          </Link>
        </div>

        {loading ? (
          <div className="py-6 text-center text-xs text-slate-400 font-bold">
            Đang tải hợp đồng...
          </div>
        ) : recentContracts.length === 0 ? (
          <div className="py-10 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            <FileText size={36} className="mx-auto text-slate-300 mb-2" />
            <h4 className="text-xs font-bold text-slate-600">Chưa có hợp đồng nào được sinh</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">Bấm nút "+ Sinh Hợp Đồng" để bắt đầu chọn mẫu và tự động tạo file.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Mã Hợp Đồng</th>
                  <th className="py-2.5 px-3">Tên Hợp Đồng</th>
                  <th className="py-2.5 px-3">Người Tạo</th>
                  <th className="py-2.5 px-3">Phiên Bản</th>
                  <th className="py-2.5 px-3">Trạng Thái</th>
                  <th className="py-2.5 px-3">Ngày Tạo</th>
                  <th className="py-2.5 px-3 text-right">Xem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {recentContracts.map(c => (
                  <tr key={c._id} className="hover:bg-slate-50">
                    <td className="py-3 px-3 font-mono font-bold text-sky-700">{c.code}</td>
                    <td className="py-3 px-3 font-bold text-slate-800">{c.title}</td>
                    <td className="py-3 px-3 font-extrabold text-slate-700">
                      {c.createdBy?.fullName || c.createdBy?.email || 'N/A'}
                    </td>
                    <td className="py-3 px-3">
                      <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded">v{c.currentVersion || '1.0'}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10.5px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 size={11} className="text-emerald-600" /> {c.status || 'Hoàn thành'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-500">
                      {c.createdAt ? new Date(c.createdAt).toLocaleDateString('vi-VN') : 'Mới đây'}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button 
                        onClick={() => navigate('/contracts')}
                        className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 border border-sky-200 text-xs font-bold hover:bg-sky-100 cursor-pointer"
                      >
                        <ExternalLink size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Audit Logs Table */}
      {isAdmin && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Clock size={18} className="text-slate-700" /> Nhật Ký Hoạt Động Mới Nhất
              </h3>
              <p className="text-xs text-slate-500">
                Lịch sử thao tác thực tế từ các tài khoản nhân sự trong hệ thống
              </p>
            </div>
            <Link to="/audit-logs" className="text-xs font-bold text-slate-600 hover:underline">
              Xem nhật ký đầy đủ →
            </Link>
          </div>

          {loading ? (
            <div className="py-6 text-center text-xs text-slate-400 font-bold">
              Đang tải nhật ký...
            </div>
          ) : staffLogs.length === 0 ? (
            <div className="py-8 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50 text-xs text-slate-400">
              Chưa có nhật ký hoạt động nào phát sinh.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                    <th className="py-2.5 px-3">Thời Gian</th>
                    <th className="py-2.5 px-3">Người Thao Tác</th>
                    <th className="py-2.5 px-3">Hành Động</th>
                    <th className="py-2.5 px-3">Chi Tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium">
                  {staffLogs.map((log, index) => (
                    <tr key={log._id || index} className="hover:bg-slate-50">
                      <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                        {log.timestamp ? new Date(log.timestamp).toLocaleString('vi-VN') : 'Vừa xong'}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-800">
                        {log.userId?.fullName || log.userId?.email || 'Hệ thống'}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2.5 py-1 rounded-full text-[10.5px] font-extrabold bg-sky-50 text-sky-700 border border-sky-200">
                          {formatAuditAction(log.action)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-800 font-semibold">
                        {formatAuditDetail(log)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
