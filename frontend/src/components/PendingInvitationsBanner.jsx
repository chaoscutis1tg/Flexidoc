import React, { useState, useEffect } from 'react';
import { useAuth } from '../app/AuthContext';
import { useConfirm } from '../app/ConfirmContext';
import api from '../services/api';
import { Building2, CheckCircle2, XCircle, AlertTriangle, Sparkles, Mail } from 'lucide-react';

export const PendingInvitationsBanner = ({ onStatusChange }) => {
  const { user, refreshUser } = useAuth();
  const { confirm } = useConfirm();
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchPendingInvitations = async () => {
    if (!user?.email) return;
    try {
      setLoading(true);
      const res = await api.get('/organizations/my-pending-invitations');
      if (res.success && Array.isArray(res.data)) {
        setInvitations(res.data);
      }
    } catch (err) {
      console.error('Lỗi khi tải danh sách lời mời quản lý:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingInvitations();
  }, [user?.email]);

  const handleApprove = async (inv) => {
    const isConfirmed = await confirm({
      title: 'Xác Nhận Quản Lý Chi Nhánh',
      message: `Bạn có chắc chắn muốn tiếp nhận quyền Quản lý Chi nhánh '${inv.name}' (Mã: ${inv.code})?`,
      subMessage: 'Khi xác nhận, vai trò của bạn sẽ được nâng thành QUẢN LÝ TỔ CHỨC và tài khoản sẽ chuyển sang chi nhánh này.',
      confirmText: 'Đồng Ý Tiếp Nhận',
      cancelText: 'Hủy Bỏ',
      variant: 'success',
    });

    if (!isConfirmed) return;

    try {
      setActionLoadingId(inv._id);
      setErrorMsg('');
      const res = await api.post(`/organizations/${inv._id}/approve`);
      if (res.success) {
        setSuccessMsg(`🎉 Chúc mừng ${user?.fullName || ''}! Bạn đã xác nhận thành công và được nâng quyền lên Quản Lý Tổ Chức '${inv.name}' (Mã: ${inv.code}).`);
        await refreshUser();
        if (onStatusChange) onStatusChange();
        fetchPendingInvitations();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Có lỗi xảy ra khi xác nhận quản lý chi nhánh.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (inv) => {
    const isConfirmed = await confirm({
      title: 'Từ Chối Lời Mời Quản Lý',
      message: `Bạn có chắc chắn muốn từ chối lời mời quản lý chi nhánh '${inv.name}' (Mã: ${inv.code})?`,
      subMessage: 'Thông báo từ chối sẽ được phản hồi lại người tạo tổ chức con này để chọn người quản lý mới.',
      confirmText: 'Từ Chối Quản Lý',
      cancelText: 'Hủy Bỏ',
      variant: 'warning',
    });

    if (!isConfirmed) return;

    try {
      setActionLoadingId(inv._id);
      setErrorMsg('');
      const res = await api.post(`/organizations/${inv._id}/reject`, { reason: 'Người dùng từ chối tiếp nhận quyền quản lý chi nhánh.' });
      if (res.success) {
        setSuccessMsg(`Đã từ chối quyền quản lý chi nhánh '${inv.name}'.`);
        if (onStatusChange) onStatusChange();
        fetchPendingInvitations();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Có lỗi xảy ra khi từ chối chi nhánh.');
    } finally {
      setActionLoadingId(null);
    }
  };

  if (!invitations || invitations.length === 0) {
    return null;
  }

  return (
    <div style={{ marginBottom: '24px' }}>
      {successMsg && (
        <div style={{ 
          background: '#f0fdf4', 
          border: '1px solid #86efac', 
          color: '#15803d', 
          padding: '12px 16px', 
          borderRadius: '12px', 
          fontSize: '13.5px', 
          fontWeight: '700',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <Sparkles size={18} color="#16a34a" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div style={{ 
          background: '#fef2f2', 
          border: '1px solid #fca5a5', 
          color: '#b91c1c', 
          padding: '12px 16px', 
          borderRadius: '12px', 
          fontSize: '13.5px', 
          fontWeight: '700',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <AlertTriangle size={18} color="#dc2626" />
          <span>{errorMsg}</span>
        </div>
      )}

      {invitations.map((inv) => (
        <div 
          key={inv._id}
          style={{
            background: 'linear-gradient(135deg, #eff6ff 0%, #e0f2fe 100%)',
            border: '2px solid #38bdf8',
            borderRadius: '16px',
            padding: '20px 24px',
            boxShadow: '0 8px 24px rgba(2, 132, 199, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            position: 'relative'
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                Lời Mời Xác Nhận Quản Lý Chi Nhánh / Tổ Chức Con
                <span style={{ fontSize: '11px', background: '#3b82f6', color: '#fff', padding: '2px 8px', borderRadius: '12px', fontWeight: '800' }}>
                  Yêu Cầu Xác Nhận
                </span>
              </h3>
              <p style={{ fontSize: '13px', color: '#475569', margin: '4px 0 0 0', fontWeight: '600' }}>
                Bạn được chỉ định tiếp nhận vai trò Người Quản Lý Chi Nhánh cho tổ chức mới dưới đây:
              </p>
            </div>
          </div>

          {/* Org Card Details */}
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '16px 20px',
            border: '1px solid #cbd5e1',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '14px'
          }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Tên Chi Nhánh Mới:</div>
              <div style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Building2 size={16} color="#0284c7" />
                {inv.name}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Mã Tổ Chức Mới:</div>
              <div style={{ fontSize: '14px', fontWeight: '800', color: '#0284c7', marginTop: '2px' }}>
                <code style={{ background: '#e0f2fe', padding: '3px 8px', borderRadius: '6px' }}>{inv.code}</code>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Trực Thuộc Tổ Chức Cha:</div>
              <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#334155', marginTop: '2px' }}>
                {inv.parentOrganizationId?.name ? `${inv.parentOrganizationId.name} (${inv.parentOrganizationId.code})` : 'Cấp Cao Nhất'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Người Được Chỉ Định:</div>
              <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#0f172a', marginTop: '2px' }}>
                {inv.managerName} ({inv.managerEmail})
              </div>
            </div>
          </div>

          {/* Important Impact Note & Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', paddingTop: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#0369a1', fontWeight: '700' }}>
              <Sparkles size={16} color="#0284c7" />
              <span>Khi xác nhận: Tài khoản của bạn sẽ được nâng quyền thành <strong>QUẢN LÝ TỔ CHỨC (ORGANIZATION_ADMIN)</strong> và chuyển mã tổ chức sang chi nhánh <strong>'{inv.code}'</strong>.</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={() => handleReject(inv)}
                disabled={actionLoadingId === inv._id}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 18px',
                  borderRadius: '10px',
                  background: '#ffffff',
                  color: '#dc2626',
                  border: '1.5px solid #fca5a5',
                  fontWeight: '800',
                  fontSize: '13px',
                  cursor: actionLoadingId === inv._id ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <XCircle size={16} />
                {actionLoadingId === inv._id ? 'Đang xử lý...' : 'Từ Chối'}
              </button>

              <button
                onClick={() => handleApprove(inv)}
                disabled={actionLoadingId === inv._id}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 22px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: '800',
                  fontSize: '13.5px',
                  cursor: actionLoadingId === inv._id ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                  transition: 'all 0.15s ease'
                }}
              >
                <CheckCircle2 size={18} />
                {actionLoadingId === inv._id ? 'Đang xác nhận...' : 'Đồng Ý Tiếp Nhận Quản Lý'}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
