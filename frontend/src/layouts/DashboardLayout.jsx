import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../app/AuthContext';
import { RenewalModal } from '../features/subscription/RenewalModal';
import { PendingInvitationsBanner } from '../components/PendingInvitationsBanner';
import { ChangePasswordModal } from '../components/ChangePasswordModal';
import {
  FileText,
  LayoutDashboard,
  Building2,
  Users,
  FilePlus,
  History,
  LogOut,
  Briefcase,
  Database,
  Sparkles,
  ShieldCheck,
  Crown,
  Copy,
  Check,
  AlertTriangle,
  Settings,
  Clock,
  Menu,
  X
} from 'lucide-react';
import { getRoleInfo } from '../utils/roleFormatter';

export const DashboardLayout = () => {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showRenewalModal, setShowRenewalModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    refreshUser();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isItemActive = (itemPath) => {
    return location.pathname === itemPath;
  };

  const currentOrg = (typeof user?.organizationId === 'object' && user?.organizationId !== null) ? user.organizationId : {};
  const orgName = currentOrg.name || 'Tổ Chức Của Bạn';
  const orgCode = currentOrg.code || '---';
  const plan = currentOrg.plan || 'FREE';
  const planExpiresAt = currentOrg.planExpiresAt ? new Date(currentOrg.planExpiresAt) : null;
  const isExpired = plan !== 'FREE' && planExpiresAt && planExpiresAt < new Date();

  let daysRemaining = 0;
  if (planExpiresAt) {
    const diffTime = planExpiresAt - new Date();
    daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  const handleCopyCode = () => {
    if (orgCode && orgCode !== '---') {
      navigator.clipboard.writeText(orgCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const navCategories = user?.role === 'SUPER_ADMIN' ? [
    {
      title: 'QUẢN TRỊ HỆ THỐNG',
      items: [
        { label: 'Tổng Quan Hệ Thống', path: '/dashboard', icon: LayoutDashboard },
        { label: 'Cây Tổ Chức Phân Cấp', path: '/organizations', icon: Building2 },
        { label: 'Quản Lý Nhân Sự & Quyền', path: '/users', icon: Users },
        { label: 'Đơn Hàng & Doanh Thu', path: '/admin/orders', icon: History },
        { label: 'Cài Đặt Hệ Thống', path: '/admin/settings', icon: Settings },
        { label: 'Nhật Ký & Lưu Lượng Log', path: '/audit-logs', icon: History },
      ]
    }
  ] : [
    {
      title: 'TÁC VỤ NỘI BỘ TỔ CHỨC',
      items: [
        { label: 'Tổng Quan Tổ Chức', path: '/dashboard', icon: LayoutDashboard },
        { label: 'Quản Lý & Sinh Hợp Đồng', path: '/contracts', icon: FileText },
      ]
    },
    {
      title: 'QUẢN LÝ DỮ LIỆU & MẪU',
      items: [
        { label: 'Quản Lý Master Data', path: '/master-data', icon: Database, roles: ['ORGANIZATION_ADMIN', 'STAFF'] },
        { label: 'Quản Lý Mẫu Hợp Đồng', path: '/templates', icon: FilePlus, roles: ['ORGANIZATION_ADMIN', 'STAFF'] },
        { label: 'Sơ Đồ Tổ Chức', path: '/organizations', icon: Building2, roles: ['ORGANIZATION_ADMIN'] },
        { label: 'Quản Lý Nhân Sự Tổ Chức', path: '/users', icon: Users, roles: ['ORGANIZATION_ADMIN'] },
        { label: 'Nhật Ký Thao Tác', path: '/audit-logs', icon: History, roles: ['ORGANIZATION_ADMIN'] },
      ]
    }
  ];

  const roleInfo = getRoleInfo(user?.role);
  const RoleIcon = roleInfo.Icon;

  return (
    <div className="flex min-h-screen bg-slate-50">

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[90] lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Fixed Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-[100] w-[260px] bg-white border-r border-slate-200 p-[20px_14px] flex flex-col shadow-sm transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '0 8px 16px', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src="/logo.png" alt="FlexiDoc Logo" style={{ width: '38px', height: '38px', objectFit: 'contain' }} />
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a' }}>
                FlexiDoc
              </h2>
              <span style={{ fontSize: '11px', color: '#64748b', display: 'block', fontWeight: '500' }}>
                Quản Lý Hợp Đồng
              </span>
            </div>
          </div>
          <button 
            className="lg:hidden text-slate-500 hover:text-slate-800"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* Organization Info & Copy Join Code Box */}
        {user?.role !== 'SUPER_ADMIN' && (
          <div style={{ margin: '14px 4px 0', padding: '10px 12px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Tổ Chức Hiện Tại:</div>
            <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', marginTop: '2px' }} title={orgName}>
              {orgName}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px', paddingTop: '6px', borderTop: '1px dashed #cbd5e1' }}>
              <span style={{ fontSize: '11px', color: '#0284c7', fontWeight: '700' }}>
                Mã: <code>{orgCode}</code>
              </span>
              <button
                onClick={handleCopyCode}
                style={{ background: 'none', border: 'none', color: '#0284c7', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10.5px', fontWeight: '700' }}
                title="Sao chép Mã Tổ Chức để cấp cho Nhân viên gia nhập"
              >
                {copiedCode ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                {copiedCode ? 'Đã chép' : 'Sao chép'}
              </button>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '18px', flex: 1, overflowY: 'auto' }}>
          {navCategories.map((cat, idx) => {
            const items = cat.items.filter(item => !item.roles || (user && item.roles.includes(user.role)));
            if (items.length === 0) return null;

            return (
              <div key={idx}>
                <div style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', padding: '0 12px 6px', letterSpacing: '0.05em' }}>
                  {cat.title}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {items.map(item => {
                    const Icon = item.icon;
                    const active = isItemActive(item.path);

                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          textDecoration: 'none',
                          fontSize: '13px',
                          fontWeight: active ? '700' : '600',
                          color: active ? '#0284c7' : '#475569',
                          background: active ? '#e0f2fe' : 'transparent',
                          borderLeft: active ? '4px solid #0284c7' : '4px solid transparent',
                          boxShadow: active ? '0 2px 8px rgba(2,132,199,0.12)' : 'none',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <Icon size={18} color={active ? '#0284c7' : '#64748b'} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* User Profile */}
        <div style={{ paddingTop: '14px', borderTop: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '4px 6px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: roleInfo.badgeBg,
              border: `1px solid ${roleInfo.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: roleInfo.badgeColor,
              fontWeight: '800',
              fontSize: '14px'
            }}>
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {user?.fullName || 'Người dùng'}
              </div>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '10.5px',
                  fontWeight: '800',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  marginTop: '3px',
                  background: roleInfo.badgeBg,
                  color: roleInfo.badgeColor,
                  border: `1px solid ${roleInfo.border}`
                }}
              >
                <RoleIcon size={11} /> {roleInfo.shortLabel}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
            <button
              onClick={() => setShowChangePasswordModal(true)}
              className="btn-action btn-secondary"
              style={{ flex: 1, justifyContent: 'center', padding: '7px 4px', fontSize: '11.5px', gap: '4px' }}
              title="Đổi mật khẩu tài khoản của bạn"
            >
              <KeyRound size={13} className="text-slate-600" /> Đổi mật khẩu
            </button>
            <button
              onClick={handleLogout}
              className="btn-action btn-secondary"
              style={{ flex: 1, justifyContent: 'center', padding: '7px 4px', fontSize: '11.5px', gap: '4px' }}
              title="Đăng xuất khỏi hệ thống"
            >
              <LogOut size={13} /> Đăng xuất
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col lg:ml-[260px] transition-all duration-300 min-w-0">

        {/* Sleek High-End Top Header Bar */}
        <header className="h-[68px] bg-white/85 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-[80] flex items-center justify-between px-4 lg:px-7 shadow-sm">
          {/* Left: Active System Branding & Operational Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={22} />
            </button>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{
                fontSize: '14.5px',
                fontWeight: '800',
                color: '#0f172a',
                letterSpacing: '-0.01em',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                Hệ Thống Quản Lý & Số Hóa Hợp Đồng
                <span style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  color: '#0284c7',
                  background: '#e0f2fe',
                  padding: '1.5px 7px',
                  borderRadius: '6px',
                  border: '1px solid #bae6fd'
                }}>
                  FlexiDoc
                </span>
              </span>
            </div>
          </div>

          {/* Right: Subscription Package Badge with Expiration & Gia Hạn Action */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {user?.role !== 'SUPER_ADMIN' && (
              <button
                onClick={() => setShowRenewalModal(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: isExpired
                    ? 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)'
                    : plan === 'FREE'
                      ? 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)'
                      : 'linear-gradient(135deg, #fbf7ff 0%, #f3e8ff 100%)',
                  color: isExpired ? '#9f1239' : plan === 'FREE' ? '#0369a1' : '#6b21a8',
                  padding: '4px 6px 4px 12px',
                  borderRadius: '30px',
                  fontSize: '12.5px',
                  fontWeight: '600',
                  border: isExpired
                    ? '1px solid #fecdd3'
                    : plan === 'FREE'
                      ? '1px solid #bae6fd'
                      : '1px solid #e9d5ff',
                  cursor: 'pointer',
                  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)',
                  backdropFilter: 'blur(8px)',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1.5px)';
                  e.currentTarget.style.boxShadow = isExpired
                    ? '0 6px 18px rgba(225, 29, 72, 0.18)'
                    : plan === 'FREE'
                      ? '0 6px 18px rgba(2, 132, 199, 0.18)'
                      : '0 6px 18px rgba(147, 51, 234, 0.18)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.04)';
                }}
                title={`Quản lý / gia hạn gói dịch vụ cho tổ chức '${user?.organizationId?.name || 'hiện tại'}'`}
              >
                {/* Icon Container */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: isExpired
                    ? '#ffe4e6'
                    : plan === 'FREE'
                      ? '#e0f2fe'
                      : '#ede9fe',
                  flexShrink: 0
                }}>
                  {isExpired ? (
                    <AlertTriangle size={14} color="#e11d48" />
                  ) : (
                    <Crown size={14} color={plan === 'FREE' ? '#0284c7' : '#8b5cf6'} />
                  )}
                </div>

                {/* Main Content */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>Gói:</span>
                  <span style={{
                    fontWeight: '800',
                    fontSize: '13px',
                    letterSpacing: '0.03em',
                    color: isExpired ? '#be123c' : plan === 'FREE' ? '#0284c7' : '#7e22ce'
                  }}>
                    {plan}
                  </span>

                  {/* Remaining Days Pill */}
                  {isExpired ? (
                    <span style={{
                      background: '#ffe4e6',
                      color: '#e11d48',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '700',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px'
                    }}>
                      Hết hạn
                    </span>
                  ) : plan !== 'FREE' && daysRemaining > 0 ? (
                    <span style={{
                      background: 'rgba(255, 255, 255, 0.85)',
                      color: '#475569',
                      border: '1px solid rgba(203, 213, 225, 0.6)',
                      padding: '2px 9px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '600',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                    }}>
                      <Clock size={11} color="#64748b" />
                      Còn {daysRemaining} ngày
                    </span>
                  ) : null}
                </div>

                {/* Compact Gradient Action Chip: "Gia Hạn" / "Nâng Cấp" */}
                <span style={{
                  fontSize: '11.5px',
                  fontWeight: '700',
                  background: isExpired
                    ? 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)'
                    : plan === 'FREE'
                      ? 'linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)'
                      : 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)',
                  color: '#ffffff',
                  padding: '5px 12px',
                  borderRadius: '20px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: isExpired
                    ? '0 2px 8px rgba(225, 29, 72, 0.35)'
                    : plan === 'FREE'
                      ? '0 2px 8px rgba(2, 132, 199, 0.35)'
                      : '0 2px 8px rgba(126, 34, 206, 0.35)',
                  letterSpacing: '0.01em',
                  marginLeft: '2px'
                }}>
                  <Sparkles size={12} color="#ffffff" />
                  {isExpired ? 'Gia Hạn Ngay' : plan === 'FREE' ? 'Nâng Cấp' : 'Gia Hạn'}
                </span>
              </button>
            )}
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="p-4 lg:p-7 flex-1 flex flex-col min-w-0">
          <PendingInvitationsBanner onStatusChange={refreshUser} />

          {/* Sticky Expiration Banner */}
          {isExpired && (
            <div className="bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 text-white p-4.5 rounded-2xl shadow-lg mb-6 flex flex-col md:flex-row items-center justify-between gap-4 border border-rose-400/30 animate-fade-in">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 shadow-inner">
                  <AlertTriangle size={22} className="text-amber-300" />
                </div>
                <div>
                  <h4 className="text-sm font-black flex items-center gap-2">
                    Gói dịch vụ [{plan}] của tổ chức bạn đã HẾT HẠN!
                    <span className="bg-white/20 text-white text-[10.5px] px-2.5 py-0.5 rounded-full font-bold border border-white/20">
                      🔒 Bảo toàn 100% dữ liệu (Read-Only)
                    </span>
                  </h4>
                  <p className="text-xs text-rose-100 mt-1 leading-relaxed">
                    Tất cả hợp đồng và mẫu cũ được lưu giữ an toàn (cho phép Xem/Tải PDF). Hệ thống tạm khóa tính năng Tạo mới & Sửa/Xóa. Vui lòng gia hạn gói cũ hoặc chọn gói mới để mở khóa tức thì!
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowRenewalModal(true)}
                className="px-5 py-2.5 rounded-xl bg-white text-rose-700 font-black text-xs hover:bg-rose-50 transition-all shadow-md shrink-0 flex items-center gap-1.5 cursor-pointer hover:scale-105"
              >
                <Crown size={15} className="text-amber-500" />
                Gia Hạn Ngay Qua SePay
              </button>
            </div>
          )}

          <Outlet />
        </main>
      </div>

      {/* Subscription Renewal Modal */}
      <RenewalModal isOpen={showRenewalModal} onClose={() => setShowRenewalModal(false)} />

      {/* Change Password Modal */}
      <ChangePasswordModal isOpen={showChangePasswordModal} onClose={() => setShowChangePasswordModal(false)} />

    </div>
  );
};
