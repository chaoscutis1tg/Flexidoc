import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import api from '../../services/api';
import { Users, UserPlus, Shield, Edit, Trash2, Search } from 'lucide-react';
import { getRoleInfo } from '../../utils/roleFormatter';

export const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Create modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    fullName: '',
    email: '',
    passwordHash: '123456',
    role: 'STAFF',
  });

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    _id: '',
    fullName: '',
    email: '',
    role: 'STAFF',
    status: 'ACTIVE',
  });

  const [error, setError] = useState('');

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/users', createForm);
      setShowCreateModal(false);
      setCreateForm({ fullName: '', email: '', passwordHash: '123456', role: 'STAFF' });
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleOpenEdit = (user) => {
    setEditForm({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      status: user.status || 'ACTIVE',
    });
    setError('');
    setShowEditModal(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setError('');

    const targetUser = users.find(u => u._id === editForm._id);
    if (targetUser && targetUser.role === 'ORGANIZATION_ADMIN') {
      const activeAdmins = users.filter(u => u.role === 'ORGANIZATION_ADMIN' && u.status === 'ACTIVE');
      const isDemoting = editForm.role !== 'ORGANIZATION_ADMIN';
      const isLocking = editForm.status !== 'ACTIVE';
      if ((isDemoting || isLocking) && activeAdmins.length <= 1) {
        setError('Tổ chức phải có ít nhất 1 Quản trị viên (ORGANIZATION_ADMIN). Vui lòng thăng cấp thành viên khác làm Admin trước khi đổi vai trò hoặc tạm khóa!');
        return;
      }
    }

    try {
      await api.patch(`/users/${editForm._id}`, {
        fullName: editForm.fullName,
        role: editForm.role,
        status: editForm.status,
      });
      setShowEditModal(false);
      fetchUsers();
    } catch (err) {
      setError(err.message || 'Đã có lỗi xảy ra.');
    }
  };

  const handleDeleteUser = async (u) => {
    if (u.role === 'ORGANIZATION_ADMIN') {
      const activeAdmins = users.filter(usr => usr.role === 'ORGANIZATION_ADMIN' && usr.status === 'ACTIVE');
      if (activeAdmins.length <= 1) {
        alert('Không thể xóa: Tổ chức phải có ít nhất 1 Quản trị viên (ORGANIZATION_ADMIN). Vui lòng thăng cấp thành viên khác thành Admin trước!');
        return;
      }
    }

    if (!window.confirm(`Bạn có chắc chắn muốn xóa tài khoản '${u.fullName}' (${u.email})?`)) {
      return;
    }
    try {
      await api.delete(`/users/${u._id}`);
      fetchUsers();
    } catch (err) {
      alert('Không thể xóa: ' + (err.message || 'Lỗi hệ thống'));
    }
  };

  const filteredUsers = users.filter(u => 
    !search || 
    u.fullName.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={26} color="#0284c7" /> Quản Lý Người Dùng & Phân Quyền
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
            Quản trị tài khoản nhân sự trong tổ chức và phân quyền truy cập (RBAC Model)
          </p>
        </div>
        <button className="btn-action btn-create" onClick={() => setShowCreateModal(true)} style={{ padding: '10px 18px', fontSize: '14px' }}>
          <UserPlus size={18} /> + Thêm Người Dùng Mới
        </button>
      </div>

      {/* Filter & Search */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '360px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input 
            type="text" 
            className="glass-input" 
            style={{ paddingLeft: '38px', height: '40px', fontSize: '13px', background: '#ffffff' }}
            placeholder="Tìm kiếm tài khoản theo tên, email hoặc vai trò..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '24px', background: '#ffffff' }}>
        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Đang tải danh sách tài khoản...</p>
        ) : filteredUsers.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>Không tìm thấy tài khoản nào.</p>
        ) : (
          <table className="custom-table">
            <thead>
              <tr>
                <th>Họ Và Tên</th>
                <th>Email Công Việc</th>
                <th>Tổ Chức Quản Lý</th>
                <th>Phương Thức</th>
                <th>Vai Trò (Role)</th>
                <th>Trạng Thái</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(u => (
                <tr key={u._id}>
                  <td style={{ fontWeight: '700', color: '#0f172a' }}>{u.fullName}</td>
                  <td style={{ color: '#475569', fontWeight: '500' }}>{u.email}</td>
                  <td style={{ color: '#334155' }}>{u.organizationId?.name || '--- Global ---'}</td>
                  <td>
                    {u.authProvider === 'GOOGLE' ? (
                      <span className="badge" style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }}>
                        Google OAuth
                      </span>
                    ) : (
                      <span className="badge" style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' }}>
                        Mật khẩu
                      </span>
                    )}
                  </td>
                  <td>
                    {(() => {
                      const rInfo = getRoleInfo(u.role);
                      const RIcon = rInfo.Icon;
                      return (
                        <span 
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '700',
                            background: rInfo.badgeBg,
                            color: rInfo.badgeColor,
                            border: `1px solid ${rInfo.border}`
                          }}
                        >
                          <RIcon size={12} /> {rInfo.label}
                        </span>
                      );
                    })()}
                  </td>
                  <td>
                    <span className={`badge badge-${u.status === 'ACTIVE' ? 'active' : 'archived'}`}>
                      {u.status === 'ACTIVE' ? 'HOẠT ĐỘNG' : 'TẠM KHÓA'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button 
                        onClick={() => handleOpenEdit(u)}
                        className="btn-action btn-warning" 
                        style={{ padding: '5px 9px', fontSize: '11px' }}
                        title="Sửa tài khoản"
                      >
                        <Edit size={13} /> Sửa
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(u)}
                        className="btn-action btn-danger" 
                        style={{ padding: '5px 9px', fontSize: '11px' }}
                        title="Xóa tài khoản"
                      >
                        <Trash2 size={13} /> Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal 1: Create User */}
      {showCreateModal && createPortal(
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in" style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>Thêm Tài Khoản Nhân Sự Mới</h2>
              <button 
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {error && (
              <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#991b1b', padding: '10px', borderRadius: 'var(--radius-md)', marginBottom: '16px', fontSize: '13px' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Họ và tên
                </label>
                <input 
                  type="text" 
                  required 
                  className="glass-input" 
                  placeholder="Ví dụ: Nguyễn Văn A"
                  value={createForm.fullName}
                  onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Email công việc
                </label>
                <input 
                  type="email" 
                  required 
                  className="glass-input" 
                  placeholder="user@organization.com"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Mật khẩu khởi tạo
                </label>
                <input 
                  type="password" 
                  required 
                  className="glass-input" 
                  value={createForm.passwordHash}
                  onChange={(e) => setCreateForm({ ...createForm, passwordHash: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Vai trò hệ thống (Role)
                </label>
                <select 
                  className="glass-input"
                  value={createForm.role}
                  onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                >
                  <option value="STAFF">STAFF (Nhân viên nghiệp vụ)</option>
                  <option value="ORGANIZATION_ADMIN">ORGANIZATION_ADMIN (Quản trị tổ chức)</option>
                  <option value="VIEWER">VIEWER (Chỉ xem)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button type="button" className="btn-action btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn-action btn-create">
                  Lưu Tài Khoản
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal 2: Edit User */}
      {showEditModal && createPortal(
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in" style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>Chỉnh Sửa Tài Khoản</h2>
              <button 
                onClick={() => setShowEditModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {error && (
              <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#991b1b', padding: '10px', borderRadius: 'var(--radius-md)', marginBottom: '16px', fontSize: '13px' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleUpdateUser} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Họ và tên
                </label>
                <input 
                  type="text" 
                  required 
                  className="glass-input" 
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Email công việc (Cố định)
                </label>
                <input 
                  type="email" 
                  disabled
                  className="glass-input" 
                  style={{ background: '#f1f5f9', color: '#64748b' }}
                  value={editForm.email}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Vai trò hệ thống (Role)
                </label>
                <select 
                  className="glass-input"
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                >
                  <option value="STAFF">STAFF (Nhân viên nghiệp vụ)</option>
                  <option value="ORGANIZATION_ADMIN">ORGANIZATION_ADMIN (Quản trị tổ chức)</option>
                  <option value="VIEWER">VIEWER (Chỉ xem)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Trạng thái tài khoản
                </label>
                <select 
                  className="glass-input"
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                >
                  <option value="ACTIVE">HOẠT ĐỘNG (ACTIVE)</option>
                  <option value="INACTIVE">TẠM KHÓA (INACTIVE)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button type="button" className="btn-action btn-secondary" onClick={() => setShowEditModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn-action btn-warning">
                  Lưu Thay Đổi
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
