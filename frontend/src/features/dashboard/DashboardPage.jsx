import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../app/AuthContext';
import { 
  FileText, 
  Building2, 
  Users, 
  FileCheck, 
  UserCheck, 
  CheckCircle2, 
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
  UserPlus
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { formatAuditAction, formatAuditDetail } from '../../utils/auditFormatter';


export const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    templatesCount: 0,
    contractsCount: 0,
    usersCount: 0,
    masterDataCount: 0,
  });

  const [recentContracts, setRecentContracts] = useState([]);
  const [staffLogs, setStaffLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const isAdmin = ['ORGANIZATION_ADMIN', 'SUPER_ADMIN'].includes(user?.role);

  const fetchRealDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch 100% Real Data from MongoDB API endpoints
      const isAdminUser = ['ORGANIZATION_ADMIN', 'SUPER_ADMIN'].includes(user?.role);

      const [tplRes, ctrRes, mdRes, logRes, usersRes] = await Promise.all([
        api.get('/templates').catch(() => ({ data: [] })),
        api.get('/contracts').catch(() => ({ data: [] })),
        api.get('/master-data').catch(() => ({ data: [] })),
        isAdminUser ? api.get('/audit-logs').catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
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
      });

      setRecentContracts(contracts.slice(0, 5));
      setStaffLogs(logs.slice(0, 5));
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu thực tế:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRealDashboardData();
  }, [user]);

  const handleExportReportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Chi_So,Gia_Tri_Thuc_Te\n"
      + `Nhan_Su_Trong_To_Chuc,${stats.usersCount}\n`
      + `Mau_Template_So_Hoa,${stats.templatesCount}\n`
      + `Hop_Dong_Da_Sinh,${stats.contractsCount}\n`
      + `Ho_So_Master_Data,${stats.masterDataCount}\n`
      + `Thoi_Gian_Xuat,${new Date().toISOString()}`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Thong_Ke_Tiet_Kiem_To_Chuc_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const orgName = user?.organizationId?.name || 'Tổ Chức Của Bạn';
  const orgCode = user?.organizationId?.code || 'ORG-SYSTEM';
  const orgPlan = user?.organizationId?.plan || 'FREE';

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-10">
      
      {/* 1. Simple Clean Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-sky-50 text-sky-700 border border-sky-200 text-xs font-bold px-2.5 py-0.5 rounded-md flex items-center gap-1">
              <Shield size={13} />
              {user?.role === 'SUPER_ADMIN' ? 'Super Admin' : user?.role === 'ORGANIZATION_ADMIN' ? 'Quản Trị Viên' : 'Nhân Viên'}
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

        <div className="flex items-center gap-2.5">
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

      {/* 2. 4 Clean Stat Cards (REAL DATA ONLY) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Real User Count */}
        {isAdmin ? (
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
        ) : (
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Số Người Trong Tổ Chức
                </span>
                <div className="text-3xl font-black text-slate-900 my-1">
                  {loading ? '...' : stats.usersCount} <span className="text-xs font-medium text-slate-400">người</span>
                </div>
                <span className="text-[11.5px] font-medium text-slate-400 flex items-center gap-1">
                  Thành viên hệ thống
                </span>
              </div>
              <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <Users size={22} />
              </div>
            </div>
          </div>
        )}

        {/* Real Template Count */}
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

        {/* Real Contract Count */}
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

        {/* Real Master Data Count */}
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

      {/* 4. Real Recent Contracts Table */}
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
      {/* 5. Real Audit Logs Table (Admin only) */}
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
