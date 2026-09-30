import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import api from '../../services/api';
import { useConfirm } from '../../app/ConfirmContext';
import {
  Users,
  UserPlus,
  Shield,
  Edit,
  Trash2,
  Search,
  User,
  Mail,
  Building2,
  Lock,
  UserCog,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertCircle,
  KeyRound,
  X
} from 'lucide-react';
import { getRoleInfo } from '../../utils/roleFormatter';

export const UsersPage = () => {
  const { confirm } = useConfirm();
  const [users, setUsers] = useState([]);
  const [orgsList, setOrgsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Create modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    fullName: '',
    email: '',
    passwordHash: '123456',
    organizationId: '',
    role: 'STAFF',
  });

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    _id: '',
    fullName: '',
    email: '',
    organizationId: '',
    role: 'STAFF',
    status: 'ACTIVE',
    authProvider: 'LOCAL'
  });

  const [error, setError] = useState('');

  const flattenOrgs = (nodes, list = [], depth = 0) => {
    nodes.forEach(n => {
      list.push({ _id: n._id, name: n.name, code: n.code, depth });
      if (n.children && n.children.length > 0) {
        flattenOrgs(n.children, list, depth + 1);
      }
    });
    return list;
  };

  const fetchUsersAndOrgs = async () => {
    try {
      const [usersRes, orgsRes] = await Promise.allSettled([
        api.get('/users'),
        api.get('/organizations/tree')
      ]);

      if (usersRes.status === 'fulfilled') {
        setUsers(usersRes.value.data || []);
      }
      if (orgsRes.status === 'fulfilled') {
        const flat = flattenOrgs(orgsRes.value.data || []);
        setOrgsList(flat);
      }
    } catch (err) {
      console.error('Error fetching users and orgs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersAndOrgs();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/users', {
        ...createForm,
        organizationId: createForm.organizationId || null
      });
      setShowCreateModal(false);
      setCreateForm({ fullName: '', email: '', passwordHash: '123456', organizationId: '', role: 'STAFF' });
      fetchUsersAndOrgs();
    } catch (err) {
      setError(err.message || 'Không thể tạo người dùng mới.');
    }
  };

  const handleOpenEdit = (user) => {
    setEditForm({
      _id: user._id,
      fullName: user.fullName || '',
      email: user.email || '',
      organizationId: user.organizationId ? (user.organizationId._id || user.organizationId) : '',
      role: user.role || 'STAFF',
      status: user.status || 'ACTIVE',
      authProvider: user.authProvider || 'LOCAL'
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
        organizationId: editForm.organizationId || null,
        role: editForm.role,
        status: editForm.status,
      });
      setShowEditModal(false);
      fetchUsersAndOrgs();
    } catch (err) {
      setError(err.message || 'Đã có lỗi xảy ra khi cập nhật.');
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

    const isConfirmed = await confirm({
      title: 'Xóa Tài Khoản Nhân Sự',
      message: `Bạn có chắc chắn muốn xóa tài khoản '${u.fullName}' (${u.email}) khỏi tổ chức?`,
      subMessage: 'Tài khoản sau khi xóa sẽ không thể đăng nhập vào hệ thống.',
      confirmText: 'Xóa Tài Khoản',
      cancelText: 'Hủy Bỏ',
      type: 'danger'
    });
    if (!isConfirmed) return;
    try {
      await api.delete(`/users/${u._id}`);
      fetchUsersAndOrgs();
    } catch (err) {
      alert('Không thể xóa: ' + (err.message || 'Lỗi hệ thống'));
    }
  };

  const filteredUsers = users.filter(u => 
    !search || 
    (u.fullName && u.fullName.toLowerCase().includes(search.toLowerCase())) || 
    (u.email && u.email.toLowerCase().includes(search.toLowerCase())) ||
    (u.role && u.role.toLowerCase().includes(search.toLowerCase())) ||
    (u.organizationId?.name && u.organizationId.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2.5 break-words">
            <Users size={26} color="#0284c7" /> Quản Lý Người Dùng & Phân Quyền
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
            Quản trị tài khoản nhân sự trong tổ chức và phân quyền truy cập (RBAC Model)
          </p>
        </div>
        <button className="btn-action btn-create" onClick={() => { setError(''); setShowCreateModal(true); }} style={{ padding: '10px 18px', fontSize: '14px' }}>
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
        <div className="overflow-x-auto">
          <table className="custom-table w-full min-w-[800px]">
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
                  <td style={{ color: '#334155' }}>{u.organizationId?.name ? `${u.organizationId.name} (${u.organizationId.code || ''})` : '--- Global ---'}</td>
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
        </div>
        )}
      </div>

      {/* Modal 1: Create User */}
      {showCreateModal && createPortal(
        <div className="fixed inset-0 z-[99999] bg-slate-950/70 backdrop-blur-sm p-4 flex items-center justify-center animate-backdrop">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto custom-scrollbar p-6 sm:p-8 space-y-6 animate-modal-pop">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shadow-xs">
                  <UserPlus size={22} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">Thêm Tài Khoản Nhân Sự Mới</h2>
                  <p className="text-xs font-semibold text-slate-500">Tạo tài khoản và phân quyền truy cập hệ thống</p>
                </div>
              </div>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                title="Đóng"
              >
                <X size={18} />
              </button>
            </div>

            {error && (
              <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
                <XCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Họ & Tên <span className="text-red-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <User size={16} className="absolute left-3.5 text-slate-400 pointer-events-none" />
                  <input 
                    type="text" 
                    required 
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all" 
                    placeholder="Ví dụ: Nguyễn Văn A"
                    value={createForm.fullName}
                    onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Email Công Việc <span className="text-red-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <Mail size={16} className="absolute left-3.5 text-slate-400 pointer-events-none" />
                  <input 
                    type="email" 
                    required 
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all" 
                    placeholder="user@organization.com"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Mật Khẩu Khởi Tạo <span className="text-red-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <KeyRound size={16} className="absolute left-3.5 text-slate-400 pointer-events-none" />
                  <input 
                    type="password" 
                    required 
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all" 
                    placeholder="Mật khẩu"
                    value={createForm.passwordHash}
                    onChange={(e) => setCreateForm({ ...createForm, passwordHash: e.target.value })}
                  />
                </div>
              </div>

              {/* Organization Select */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Tổ Chức / Chi Nhánh Thuộc Về
                </label>
                <div className="relative flex items-center">
                  <Building2 size={16} className="absolute left-3.5 text-slate-400 pointer-events-none z-10" />
                  <select 
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-white focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all cursor-pointer"
                    value={createForm.organizationId}
                    onChange={(e) => setCreateForm({ ...createForm, organizationId: e.target.value })}
                  >
                    <option value="">-- Mặc định Tổ chức của bạn --</option>
                    {orgsList.map(org => (
                      <option key={org._id} value={org._id}>
                        {'\u00A0'.repeat(org.depth * 3)} {org.depth > 0 ? '↳ ' : ''}{org.name} ({org.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Role Select */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Vai Trò Hệ Thống (Role)
                </label>
                <div className="relative flex items-center">
                  <Shield size={16} className="absolute left-3.5 text-slate-400 pointer-events-none z-10" />
                  <select 
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-white focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all cursor-pointer"
                    value={createForm.role}
                    onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                  >
                    <option value="STAFF">STAFF (Nhân viên nghiệp vụ)</option>
                    <option value="ORGANIZATION_ADMIN">ORGANIZATION_ADMIN (Quản trị tổ chức)</option>
                    <option value="VIEWER">VIEWER (Chỉ xem)</option>
                  </select>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end items-center gap-3 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setShowCreateModal(false)}
                  className="px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold transition-all cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white text-xs font-black shadow-md shadow-sky-600/25 hover:shadow-sky-600/40 active:scale-95 transition-all cursor-pointer"
                >
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
        <div className="fixed inset-0 z-[99999] bg-slate-950/70 backdrop-blur-sm p-4 flex items-center justify-center animate-backdrop">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto custom-scrollbar p-6 sm:p-8 space-y-6 animate-modal-pop">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-xs">
                  <UserCog size={22} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">Chỉnh Sửa Tài Khoản Người Dùng</h2>
                  <p className="text-xs font-semibold text-slate-500">Cập nhật thông tin chi tiết, tổ chức và phân quyền vai trò</p>
                </div>
              </div>
              <button 
                onClick={() => setShowEditModal(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                title="Đóng"
              >
                <X size={18} />
              </button>
            </div>

            {error && (
              <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
                <XCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleUpdateUser} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Họ và Tên <span className="text-red-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <User size={16} className="absolute left-3.5 text-slate-400 pointer-events-none" />
                  <input 
                    type="text" 
                    required 
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all" 
                    value={editForm.fullName}
                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  />
                </div>
              </div>

              {/* Email (Fixed) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Email Công Việc (Cố định)
                  </label>
                  {editForm.authProvider === 'GOOGLE' ? (
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                      Google OAuth
                    </span>
                  ) : (
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                      Mật khẩu Hệ thống
                    </span>
                  )}
                </div>
                <div className="relative flex items-center">
                  <Mail size={16} className="absolute left-3.5 text-slate-400 pointer-events-none" />
                  <input 
                    type="email" 
                    disabled
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 bg-slate-50 cursor-not-allowed" 
                    value={editForm.email}
                  />
                </div>
              </div>

              {/* Organization Select */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Tổ Chức / Chi Nhánh Trực Thuộc
                </label>
                <div className="relative flex items-center">
                  <Building2 size={16} className="absolute left-3.5 text-slate-400 pointer-events-none z-10" />
                  <select 
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all cursor-pointer"
                    value={editForm.organizationId}
                    onChange={(e) => setEditForm({ ...editForm, organizationId: e.target.value })}
                  >
                    <option value="">-- Không chọn (Mặc định Tổ chức hiện tại) --</option>
                    {orgsList.map(org => (
                      <option key={org._id} value={org._id}>
                        {'\u00A0'.repeat(org.depth * 3)} {org.depth > 0 ? '↳ ' : ''}{org.name} ({org.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Role Select */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Vai Trò Hệ Thống (Role)
                </label>
                <div className="relative flex items-center">
                  <Shield size={16} className="absolute left-3.5 text-slate-400 pointer-events-none z-10" />
                  <select 
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all cursor-pointer"
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  >
                    <option value="STAFF">STAFF (Nhân viên nghiệp vụ)</option>
                    <option value="ORGANIZATION_ADMIN">ORGANIZATION_ADMIN (Quản trị tổ chức)</option>
                    <option value="VIEWER">VIEWER (Chỉ xem)</option>
                  </select>
                </div>
              </div>

              {/* Account Status Select */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Trạng Thái Tài Khoản
                </label>
                <select 
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all cursor-pointer"
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                >
                  <option value="ACTIVE">HOẠT ĐỘNG (ACTIVE)</option>
                  <option value="INACTIVE">TẠM KHÓA (INACTIVE)</option>
                </select>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end items-center gap-3 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setShowEditModal(false)}
                  className="px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold transition-all cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs font-black shadow-md shadow-amber-500/25 hover:shadow-amber-500/40 active:scale-95 transition-all cursor-pointer"
                >
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
