import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../app/AuthContext';
import { RenewalModal } from '../features/subscription/RenewalModal';
import { PendingInvitationsBanner } from '../components/PendingInvitationsBanner';
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
  Settings
} from 'lucide-react';
import { getRoleInfo } from '../utils/roleFormatter';

export const DashboardLayout = () => {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showRenewalModal, setShowRenewalModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

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
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>

      {/* Fixed Sidebar */}
      <aside style={{
        width: '260px',
        background: '#ffffff',
        borderRight: '1px solid #e2e8f0',
        padding: '20px 14px',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        bottom: 0,
        left: 0,
        zIndex: 100,
        boxShadow: 'var(--shadow-sm)'
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0 8px 16px', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 10px rgba(2,132,199,0.3)'
          }}>
            <Briefcase size={20} color="#fff" />
          </div>
          <div>
            <h2 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a' }}>
              MT-CTMS
            </h2>
            <span style={{ fontSize: '11px', color: '#64748b', display: 'block', fontWeight: '500' }}>
              Quản Lý Hợp Đồng
            </span>
          </div>
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
          <button
            onClick={handleLogout}
            className="btn-action btn-secondary"
            style={{ width: '100%', marginTop: '10px', justifyContent: 'center', padding: '7px', fontSize: '12px' }}
          >
            <LogOut size={14} /> Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div style={{ marginLeft: '260px', flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* Sleek High-End Top Header Bar */}
        {/* Sleek High-End Top Header Bar */}
        <header style={{
          height: '68px',
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
          padding: '0 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 90,
          boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.04)'
        }}>
          {/* Left: Active System Branding & Operational Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              padding: '4px 10px',
              background: '#ecfdf5',
              borderRadius: '20px',
              border: '1px solid #a7f3d0'
            }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#10b981',
                boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.25)'
              }} />
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#047857', letterSpacing: '0.02em' }}>
                Hệ thống sẵn sàng
              </span>
            </div>

            <div style={{ width: '1px', height: '18px', background: '#cbd5e1' }} />

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
                  MT-CTMS
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
                    ? 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)'
                    : plan === 'FREE'
                      ? 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)'
                      : 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)',
                  color: isExpired ? '#991b1b' : plan === 'FREE' ? '#0f172a' : '#581c87',
                  padding: '5px 6px 5px 14px',
                  borderRadius: '28px',
                  fontSize: '12.5px',
                  fontWeight: '700',
                  border: isExpired
                    ? '1px solid #fca5a5'
                    : plan === 'FREE'
                      ? '1px solid #7dd3fc'
                      : '1px solid #d8b4fe',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(2, 132, 199, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)';
                }}
                title={`Quản lý / gia hạn gói dịch vụ cho tổ chức '${user?.organizationId?.name || 'hiện tại'}'`}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {isExpired ? (
                    <AlertTriangle size={15} color="#dc2626" />
                  ) : (
                    <Crown size={15} color={plan === 'FREE' ? '#0284c7' : '#9333ea'} />
                  )}
                  <span>
                    Gói: <strong style={{ fontWeight: '800', color: plan === 'FREE' ? '#0284c7' : '#9333ea' }}>{plan}</strong>
                    {isExpired ? (
                      <span style={{ color: '#dc2626', fontWeight: '800', marginLeft: '4px' }}>(Hết hạn)</span>
                    ) : plan !== 'FREE' && daysRemaining > 0 ? (
                      <span style={{ color: '#64748b', fontWeight: '600', marginLeft: '4px' }}>(Còn {daysRemaining} ngày)</span>
                    ) : ''}
                  </span>
                </div>

                {/* Compact Action Chip: "Gia Hạn" / "Nâng Cấp" */}
                <span style={{
                  fontSize: '11px',
                  fontWeight: '800',
                  background: isExpired
                    ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                    : plan === 'FREE'
                      ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)'
                      : 'linear-gradient(135deg, #9333ea 0%, #7e22ce 100%)',
                  color: '#ffffff',
                  padding: '4px 10px',
                  borderRadius: '16px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.12)',
                  letterSpacing: '0.01em'
                }}>
                  <Sparkles size={11} color="#ffffff" />
                  {isExpired ? 'Gia Hạn Ngay' : plan === 'FREE' ? 'Nâng Cấp' : 'Gia Hạn'}
                </span>
              </button>
            )}
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main style={{ padding: '28px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <PendingInvitationsBanner onStatusChange={refreshUser} />
          <Outlet />
        </main>
      </div>

      {/* Subscription Renewal Modal */}
      <RenewalModal isOpen={showRenewalModal} onClose={() => setShowRenewalModal(false)} />

    </div>
  );
};
