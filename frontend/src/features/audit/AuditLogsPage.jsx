import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { History, Shield, Filter } from 'lucide-react';

export const AuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');

  const fetchLogs = async () => {
    try {
      const url = actionFilter ? `/audit-logs?action=${actionFilter}` : '/audit-logs';
      const res = await api.get(url);
      setLogs(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800' }}>Nhật Ký Hệ Thống (Audit Logs)</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
            Truy vết toàn bộ thao tác quan trọng & Break-Glass Security Access (Append-Only Log)
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <Filter size={18} color="var(--text-muted)" />
        <select 
          className="glass-input"
          style={{ width: '250px', height: '38px', fontSize: '13px' }}
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
        >
          <option value="">-- Tất cả hành động --</option>
          <option value="LOGIN_SUCCESS">Đăng nhập thành công</option>
          <option value="ORGANIZATION_CREATED">Tạo tổ chức</option>
          <option value="USER_CREATED">Tạo người dùng</option>
          <option value="TEMPLATE_PUBLISHED">Publish Template</option>
          <option value="CONTRACT_CREATED">Sinh hợp đồng</option>
          <option value="CONTRACT_DOWNLOADED_PDF">Tải hợp đồng PDF</option>
        </select>
      </div>

      <div className="glass-panel" style={{ padding: '24px', background: '#ffffff' }}>
        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Đang tải nhật ký audit log...</p>
        ) : logs.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>Chưa có bản ghi nhật ký nào.</p>
        ) : (
          <table className="custom-table">
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
              {logs.map(log => (
                <tr key={log._id}>
                  <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                    {new Date(log.timestamp).toLocaleString('vi-VN')}
                  </td>
                  <td style={{ fontWeight: '700', color: '#0f172a' }}>
                    {log.userId?.fullName || 'System'} ({log.userId?.email || '---'})
                  </td>
                  <td style={{ color: '#334155' }}>{log.organizationId?.name || '--- Global ---'}</td>
                  <td>
                    <span className="badge badge-role" style={{ fontSize: '11px' }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ color: '#0284c7', fontWeight: '700' }}>{log.resource}</td>
                  <td style={{ color: '#64748b', fontSize: '12px' }}>{log.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
