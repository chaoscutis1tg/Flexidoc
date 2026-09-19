import React, { useEffect, useState, useRef } from 'react';
import api from '../../services/api';
import { History, Shield, Filter, Loader2, RefreshCw, Activity, ArrowDown, CheckCircle2 } from 'lucide-react';

export const AuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');

  const isFetchingRef = useRef(false);
  const PAGE_SIZE = 20;

  // Initial fetch when page loads or filter changes
  const fetchInitialLogs = async () => {
    try {
      setLoading(true);
      setPage(1);
      setHasMore(true);
      isFetchingRef.current = true;

      const params = new URLSearchParams({
        page: '1',
        limit: String(PAGE_SIZE)
      });
      if (actionFilter) params.append('action', actionFilter);

      const res = await api.get(`/audit-logs?${params.toString()}`);
      const newLogs = Array.isArray(res.data) ? res.data : [];

      setLogs(newLogs);
      if (newLogs.length < PAGE_SIZE) {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Lỗi khi tải nhật ký audit log:', err);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  // Load next page of logs
  const fetchMoreLogs = async (nextPage) => {
    if (isFetchingRef.current || !hasMore) return;

    try {
      isFetchingRef.current = true;
      setLoadingMore(true);

      const params = new URLSearchParams({
        page: String(nextPage),
        limit: String(PAGE_SIZE)
      });
      if (actionFilter) params.append('action', actionFilter);

      const res = await api.get(`/audit-logs?${params.toString()}`);
      const newLogs = Array.isArray(res.data) ? res.data : [];

      if (newLogs.length === 0) {
        setHasMore(false);
      } else {
        setLogs(prev => [...prev, ...newLogs]);
        setPage(nextPage);
        if (newLogs.length < PAGE_SIZE) {
          setHasMore(false);
        }
      }
    } catch (err) {
      console.error('Lỗi khi tải thêm audit log:', err);
    } finally {
      setLoadingMore(false);
      isFetchingRef.current = false;
    }
  };

  // Trigger initial fetch when action filter changes
  useEffect(() => {
    fetchInitialLogs();
  }, [actionFilter]);

  // Infinite Scroll Event Listener (Scroll down to load next 20 items)
  useEffect(() => {
    const handleScroll = () => {
      if (isFetchingRef.current || !hasMore || loading || loadingMore) return;

      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;

      // When user scrolls to within 250px from the bottom, trigger next page load
      if (scrollTop + windowHeight >= docHeight - 250) {
        fetchMoreLogs(page + 1);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [page, hasMore, loading, loadingMore, actionFilter]);

  // Render stylized action badge
  const renderActionBadge = (action) => {
    let colorStyle = 'bg-slate-100 text-slate-700 border-slate-200';
    if (action.includes('LOGIN')) colorStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    else if (action.includes('CREATED')) colorStyle = 'bg-sky-50 text-sky-700 border-sky-200';
    else if (action.includes('REJECTED') || action.includes('DELETED')) colorStyle = 'bg-rose-50 text-rose-700 border-rose-200';
    else if (action.includes('PUBLISHED') || action.includes('APPROVED')) colorStyle = 'bg-indigo-50 text-indigo-700 border-indigo-200';
    else if (action.includes('UPDATED')) colorStyle = 'bg-amber-50 text-amber-800 border-amber-200';

    return (
      <span className={`px-2.5 py-1 rounded-lg border text-[11px] font-black uppercase tracking-wider ${colorStyle}`}>
        {action}
      </span>
    );
  };

  return (
    <div className="animate-fade-in space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <History className="text-sky-600" size={26} /> Nhật Ký Hệ Thống (Audit Logs)
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Truy vết toàn bộ thao tác quan trọng & Break-Glass Security Access (Append-Only Log)
          </p>
        </div>

        {/* Counter Badge */}
        <div className="px-3.5 py-2 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center gap-2 text-xs font-bold text-slate-700">
          <Activity size={16} className="text-sky-600" />
          <span>Đã tải <strong className="text-sky-600 text-sm">{logs.length}</strong> bản ghi</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Filter size={18} className="text-slate-400 shrink-0" />
          <select 
            className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-sky-500 transition-all cursor-pointer w-full sm:w-64"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
          >
            <option value="">-- Tất cả hành động --</option>
            <option value="LOGIN_SUCCESS">Đăng nhập thành công</option>
            <option value="ORGANIZATION_CREATED">Tạo tổ chức</option>
            <option value="ORGANIZATION_REJECTED">Từ chối chi nhánh</option>
            <option value="USER_CREATED">Tạo người dùng</option>
            <option value="TEMPLATE_PUBLISHED">Publish Template</option>
            <option value="CONTRACT_CREATED">Sinh hợp đồng</option>
            <option value="CONTRACT_DOWNLOADED_PDF">Tải hợp đồng PDF</option>
          </select>
        </div>

        <button
          onClick={fetchInitialLogs}
          className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          title="Tải lại"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Làm mới
        </button>
      </div>

      {/* Audit Logs Table Panel */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <Loader2 className="animate-spin text-sky-600 mx-auto" size={28} />
            <p className="text-xs font-bold">Đang tải 20 bản ghi nhật ký đầu tiên...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <p className="text-sm font-bold text-slate-600">Chưa có bản ghi nhật ký nào.</p>
            <p className="text-xs text-slate-400 mt-1">Các thao tác quan trọng sẽ được lưu tự động tại đây.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="custom-table w-full">
              <thead>
                <tr>
                  <th>Thời Gian</th>
                  <th>Người Thực Hiện</th>
                  <th>Tổ Chức</th>
                  <th>Hành Động (Action)</th>
                  <th>Tài Nguyên (Resource)</th>
                  <th>IP Address</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, index) => (
                  <tr key={log._id || index} className="hover:bg-slate-50/80 transition-colors">
                    <td className="text-slate-500 text-xs font-medium whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('vi-VN')}
                    </td>
                    <td className="font-bold text-slate-900 text-xs">
                      <div>{log.userId?.fullName || 'Hệ Thống (System)'}</div>
                      <div className="text-[11px] font-normal text-slate-500">{log.userId?.email || '---'}</div>
                    </td>
                    <td className="text-slate-700 text-xs font-semibold whitespace-nowrap">
                      {log.organizationId?.name || '--- Global ---'}
                    </td>
                    <td>
                      {renderActionBadge(log.action || 'UNKNOWN')}
                    </td>
                    <td className="text-sky-700 font-bold text-xs">
                      {log.resource}
                    </td>
                    <td className="text-slate-500 text-xs font-mono">
                      {log.ip}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Load More Indicator / Scroll Bottom Footer */}
        {!loading && (
          <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex flex-col items-center justify-center gap-3">
            {loadingMore ? (
              <div className="flex items-center gap-2 text-sky-600 text-xs font-extrabold animate-pulse">
                <Loader2 className="animate-spin" size={18} />
                <span>Đang tải thêm 20 bản ghi tiếp theo...</span>
              </div>
            ) : hasMore ? (
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={() => fetchMoreLogs(page + 1)}
                  className="px-5 py-2.5 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-black shadow-md shadow-sky-200 transition-all cursor-pointer flex items-center gap-2 hover:-translate-y-0.5 active:scale-95"
                >
                  <ArrowDown size={15} /> Kéo xuống hoặc bấm để tải thêm 20 bản ghi
                </button>
                <span className="text-[11px] text-slate-400 font-medium">
                  Tự động tải thêm khi cuộn trang tới cuối danh sách
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold">
                <CheckCircle2 size={16} className="text-emerald-500" />
                <span>Đã hiển thị toàn bộ <strong>{logs.length}</strong> bản ghi nhật ký (không còn bản ghi cũ hơn).</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
