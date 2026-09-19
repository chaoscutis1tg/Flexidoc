import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import api from '../../services/api';
import { fetchDynamicPlans, DEFAULT_PLANS_DATA } from '../../utils/planData';
import { 
  Building2, 
  Plus, 
  ChevronRight, 
  ChevronDown, 
  Edit, 
  Trash2, 
  GitBranch, 
  Search, 
  ShieldCheck, 
  LayoutGrid, 
  ListTree, 
  ChevronsDown, 
  ChevronsUp,
  Building,
  Layers,
  Sparkles,
  CheckCircle2,
  XCircle,
  FolderTree,
  Crown,
  Clock,
  Zap,
  Check
} from 'lucide-react';

export const OrganizationsPage = () => {
  const [tree, setTree] = useState([]);
  const [allOrgsList, setAllOrgsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('tree'); // 'tree' | 'table'
  const [expandedNodes, setExpandedNodes] = useState({});
  const [availablePlans, setAvailablePlans] = useState(DEFAULT_PLANS_DATA);

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    code: '',
    parentOrganizationId: '',
    managerName: '',
    managerEmail: '',
  });

  // Edit Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    _id: '',
    name: '',
    code: '',
    parentOrganizationId: '',
    status: 'ACTIVE',
  });

  // Child Subscription Renewal Modal State
  const [showChildRenewalModal, setShowChildRenewalModal] = useState(false);
  const [selectedChildForRenewal, setSelectedChildForRenewal] = useState(null);
  const [childPlan, setChildPlan] = useState('PRO');

  const [error, setError] = useState('');

  useEffect(() => {
    fetchDynamicPlans().then(data => {
      if (data && data.length > 0) {
        const commercial = data.filter(p => p.code !== 'FREE');
        if (commercial.length > 0) setAvailablePlans(commercial);
      }
    });
  }, []);

  const flattenTree = (nodes, list = [], depth = 0) => {
    nodes.forEach(n => {
      list.push({ ...n, depth });
      if (n.children && n.children.length > 0) {
        flattenTree(n.children, list, depth + 1);
      }
    });
    return list;
  };

  const fetchTree = async () => {
    try {
      const res = await api.get('/organizations/tree');
      const data = res.data || [];
      setTree(data);
      const flat = flattenTree(data);
      setAllOrgsList(flat);

      const initialExpanded = {};
      flat.forEach(item => {
        if (item.children && item.children.length > 0) {
          initialExpanded[item._id] = true;
        }
      });
      setExpandedNodes(initialExpanded);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTree();
  }, []);

  const toggleExpand = (id) => {
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleExpandAll = () => {
    const allExpanded = {};
    allOrgsList.forEach(item => {
      if (item.children && item.children.length > 0) {
        allExpanded[item._id] = true;
      }
    });
    setExpandedNodes(allExpanded);
  };

  const handleCollapseAll = () => {
    setExpandedNodes({});
  };

  const handleOpenAddChild = (parentOrgId) => {
    setCreateForm({
      name: '',
      code: '',
      parentOrganizationId: parentOrgId || '',
      managerName: '',
      managerEmail: '',
    });
    setError('');
    setShowCreateModal(true);
  };

  const handleCreateOrg = async (e) => {
    e.preventDefault();
    setError('');

    if (createForm.parentOrganizationId && (!createForm.managerName || !createForm.managerEmail)) {
      setError('Tạo Chi Nhánh Con bắt buộc phải chỉ định Họ & tên và Email của Người Quản Lý!');
      return;
    }

    try {
      await api.post('/organizations', createForm);
      setShowCreateModal(false);
      setCreateForm({ name: '', code: '', parentOrganizationId: '', managerName: '', managerEmail: '' });
      fetchTree();
    } catch (err) {
      setError(err.message || 'Tạo tổ chức thất bại.');
    }
  };

  const handleApproveOrg = async (node) => {
    try {
      await api.post(`/organizations/${node._id}/approve`);
      fetchTree();
      alert(`Đã xác nhận chấp nhận quản lý & kích hoạt chi nhánh '${node.name}' thành công!`);
    } catch (err) {
      alert('Kích hoạt chi nhánh thất bại: ' + (err.message || 'Lỗi hệ thống'));
    }
  };

  const handleOpenChildRenewal = (node) => {
    setSelectedChildForRenewal(node);
    setChildPlan('PRO');
    setShowChildRenewalModal(true);
  };

  const handleConfirmChildRenew = async () => {
    if (!selectedChildForRenewal) return;
    try {
      await api.post('/organizations/renew-subscription', {
        orgId: selectedChildForRenewal._id,
        planName: childPlan
      });
      setShowChildRenewalModal(false);
      fetchTree();
      alert(`Đã gia hạn/nâng cấp gói ${childPlan} thành công cho chi nhánh '${selectedChildForRenewal.name}'!`);
    } catch (err) {
      alert('Gia hạn gói cước cho chi nhánh con thất bại: ' + (err.message || 'Lỗi hệ thống'));
    }
  };

  const handleOpenEdit = (node) => {
    setEditForm({
      _id: node._id,
      name: node.name,
      code: node.code,
      parentOrganizationId: node.parentOrganizationId || '',
      status: node.status || 'ACTIVE',
    });
    setError('');
    setShowEditModal(true);
  };

  const handleUpdateOrg = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.patch(`/organizations/${editForm._id}`, {
        name: editForm.name,
        code: editForm.code,
        parentOrganizationId: editForm.parentOrganizationId || null,
        status: editForm.status,
      });
      setShowEditModal(false);
      fetchTree();
    } catch (err) {
      setError(err.message || 'Cập nhật thất bại.');
    }
  };

  const handleDeleteOrg = async (node) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tổ chức '${node.name}' (${node.code})?`)) {
      return;
    }
    try {
      await api.delete(`/organizations/${node._id}`);
      fetchTree();
    } catch (err) {
      alert('Không thể xóa: ' + (err.message || 'Lỗi hệ thống'));
    }
  };

  // Filtered List for search
  const filteredFlatList = allOrgsList.filter(item => {
    if (!search) return true;
    const term = search.toLowerCase();
    return item.name.toLowerCase().includes(term) || item.code.toLowerCase().includes(term);
  });

  const rootOrgsCount = tree.length;
  const subBranchesCount = allOrgsList.length - rootOrgsCount;
  const activeCount = allOrgsList.filter(o => o.status === 'ACTIVE').length;

  // Tree Card Renderer Component
  const TreeNodeCard = ({ node }) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = !!expandedNodes[node._id];

    // Search filter logic
    const matchesSearch = !search || 
      node.name.toLowerCase().includes(search.toLowerCase()) || 
      node.code.toLowerCase().includes(search.toLowerCase());

    const hasMatchingChild = node.children && node.children.some(c => 
      c.name.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase())
    );

    if (search && !matchesSearch && !hasMatchingChild) {
      return null;
    }

    const isRoot = node.level === 0;
    const isSub = node.level === 1;

    // Vibrant theme markers per level
    const cardBg = isRoot ? 'linear-gradient(135deg, #f0f9ff 0%, #ffffff 100%)' : '#ffffff';
    const borderColor = isRoot ? '#7dd3fc' : isSub ? '#a7f3d0' : '#fde68a';
    const leftAccent = isRoot ? '#0284c7' : isSub ? '#059669' : '#d97706';
    const iconBg = isRoot ? '#0284c7' : isSub ? '#e6f4ea' : '#fef3c7';
    const iconColor = isRoot ? '#ffffff' : isSub ? '#059669' : '#d97706';

    return (
      <div style={{ position: 'relative', marginTop: '12px' }}>
        
        {/* Main Node Card */}
        <div 
          style={{
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: cardBg,
            borderRadius: '14px',
            border: `1px solid ${borderColor}`,
            borderLeft: `6px solid ${leftAccent}`,
            boxShadow: isRoot ? '0 4px 16px rgba(2, 132, 199, 0.08)' : '0 2px 8px rgba(0,0,0,0.03)',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            gap: '16px'
          }}
        >
          {/* Left Info Section */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
            
            {/* Expand / Collapse Button */}
            {hasChildren ? (
              <button 
                onClick={() => toggleExpand(node._id)}
                style={{ 
                  background: '#ffffff', 
                  border: '1px solid #cbd5e1', 
                  borderRadius: '8px', 
                  color: '#334155', 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  width: '28px',
                  height: '28px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                  transition: 'all 0.15s ease'
                }}
                title={isExpanded ? 'Thu gọn chi nhánh con' : 'Mở rộng chi nhánh con'}
              >
                {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              </button>
            ) : (
              <div style={{ width: '28px', display: 'flex', justifyContent: 'center' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#cbd5e1' }}></span>
              </div>
            )}

            {/* Icon Avatar */}
            <div style={{ 
              width: '44px', 
              height: '44px', 
              borderRadius: '12px', 
              background: iconBg, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              color: iconColor,
              flexShrink: 0,
              boxShadow: isRoot ? '0 4px 12px rgba(2, 132, 199, 0.25)' : 'none'
            }}>
              {isRoot ? <Building2 size={22} /> : isSub ? <Building size={20} /> : <Layers size={20} />}
            </div>

            {/* Title & Metadata */}
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: '800', fontSize: '15px', color: '#0f172a' }}>{node.name}</span>
                
                {/* Code Pill */}
                <span className="badge" style={{ fontSize: '11px', background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' }}>
                  Mã: <strong>{node.code}</strong>
                </span>

                {/* Level Badge */}
                {isRoot ? (
                  <span style={{ fontSize: '10px', fontWeight: '800', background: '#0284c7', color: '#ffffff', padding: '3px 10px', borderRadius: '12px', letterSpacing: '0.03em' }}>
                    TỔ CHỨC GỐC (ROOT)
                  </span>
                ) : (
                  <span style={{ fontSize: '10px', fontWeight: '700', background: isSub ? '#e6f4ea' : '#fef3c7', color: isSub ? '#137333' : '#b45309', padding: '3px 9px', borderRadius: '10px', border: `1px solid ${isSub ? '#ceead6' : '#fde68a'}` }}>
                    Cấp {node.level} • Chi Nhánh
                  </span>
                )}
              </div>

              {/* Description line */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '4px', fontSize: '12px', color: '#64748b', flexWrap: 'wrap' }}>
                <span>
                  {hasChildren ? (
                    <strong style={{ color: '#0284c7' }}>{node.children.length} chi nhánh trực thuộc</strong>
                  ) : (
                    'Chi nhánh độc lập'
                  )}
                </span>
                {node.managerEmail && (
                  <span style={{ color: '#475569', background: '#f1f5f9', padding: '2px 8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    👤 Người Quản Lý: <strong>{node.managerName || 'Chưa đặt tên'}</strong> ({node.managerEmail})
                  </span>
                )}
                {node.parentOrganizationId && (
                  <span style={{ color: '#94a3b8' }}>• Thuộc cấp thượng tầng</span>
                )}
              </div>
            </div>

          </div>

          {/* Right Section: Status Badge & Action Pill Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
            
            {/* Status Indicator */}
            <span style={{ 
              fontSize: '11px', 
              fontWeight: '700', 
              padding: '5px 12px', 
              borderRadius: '20px',
              background: node.status === 'ACTIVE' ? '#dcfce7' : node.status === 'PENDING_APPROVAL' ? '#fef3c7' : '#fee2e2',
              color: node.status === 'ACTIVE' ? '#15803d' : node.status === 'PENDING_APPROVAL' ? '#b45309' : '#b91c1c',
              border: `1px solid ${node.status === 'ACTIVE' ? '#bbf7d0' : node.status === 'PENDING_APPROVAL' ? '#fde68a' : '#fca5a5'}`,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px'
            }}>
              {node.status === 'ACTIVE' ? (
                <>
                  <CheckCircle2 size={13} color="#16a34a" /> HOẠT ĐỘNG
                </>
              ) : node.status === 'PENDING_APPROVAL' ? (
                <>
                  <Clock size={13} color="#d97706" /> CHỜ QUẢN LÝ XÁC NHẬN
                </>
              ) : (
                <>
                  <XCircle size={13} color="#dc2626" /> TẠM KHÓA
                </>
              )}
            </span>

            {/* Color-Coded Pill Action Group */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              
              {node.status === 'PENDING_APPROVAL' && (
                <button 
                  onClick={() => handleApproveOrg(node)}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '4px', 
                    padding: '6px 12px', 
                    borderRadius: '8px', 
                    border: '1px solid #7dd3fc', 
                    background: '#e0f2fe', 
                    color: '#0369a1', 
                    fontSize: '12px', 
                    fontWeight: '800', 
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                  }}
                  title="Xác nhận chấp nhận nhận quyền quản lý & kích hoạt chi nhánh con này"
                >
                  <CheckCircle2 size={14} /> Xác Nhận & Kích Hoạt
                </button>
              )}

              <button 
                onClick={() => handleOpenChildRenewal(node)}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '4px', 
                  padding: '6px 12px', 
                  borderRadius: '8px', 
                  border: '1px solid #e9d5ff', 
                  background: '#faf5ff', 
                  color: '#9333ea', 
                  fontSize: '12px', 
                  fontWeight: '700', 
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                }}
                title="Mua / Nâng cấp gói dịch vụ cho chi nhánh con này"
              >
                <Crown size={14} /> Gói Dịch Vụ
              </button>

              <button 
                onClick={() => handleOpenAddChild(node._id)}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '4px', 
                  padding: '6px 12px', 
                  borderRadius: '8px', 
                  border: '1px solid #bbf7d0', 
                  background: '#dcfce7', 
                  color: '#15803d', 
                  fontSize: '12px', 
                  fontWeight: '700', 
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                }}
                title="Thêm chi nhánh con trực thuộc tổ chức này"
              >
                <Plus size={14} /> Thêm Con
              </button>

              <button 
                onClick={() => handleOpenEdit(node)}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '4px', 
                  padding: '6px 12px', 
                  borderRadius: '8px', 
                  border: '1px solid #fde68a', 
                  background: '#fef3c7', 
                  color: '#b45309', 
                  fontSize: '12px', 
                  fontWeight: '700', 
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                }}
                title="Chỉnh sửa tên, mã hoặc trạng thái tổ chức"
              >
                <Edit size={14} /> Sửa
              </button>

              <button 
                onClick={() => handleDeleteOrg(node)}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '4px', 
                  padding: '6px 12px', 
                  borderRadius: '8px', 
                  border: '1px solid #fca5a5', 
                  background: '#fee2e2', 
                  color: '#b91c1c', 
                  fontSize: '12px', 
                  fontWeight: '700', 
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                }}
                title="Xóa tổ chức khỏi hệ thống"
              >
                <Trash2 size={14} /> Xóa
              </button>

            </div>

          </div>

        </div>

        {/* Render Children Recursively with Tree Connector Line */}
        {hasChildren && isExpanded && (
          <div style={{ 
            borderLeft: '2px dashed #94a3b8', 
            marginLeft: '26px', 
            paddingLeft: '16px',
            marginTop: '4px'
          }}>
            {node.children.map(child => (
              <TreeNodeCard key={child._id} node={child} />
            ))}
          </div>
        )}

      </div>
    );
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FolderTree size={28} color="#0284c7" /> Quản Lý Sơ Đồ Tổ Chức Phân Cấp
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
            Mô hình đa tổ chức Multi-Tenant (Công ty Cha - Tập đoàn - Chi nhánh con)
          </p>
        </div>

        <button className="btn-action btn-create" onClick={() => handleOpenAddChild('')} style={{ padding: '10px 20px', fontSize: '14px', borderRadius: '10px', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)' }}>
          <Plus size={18} /> Tạo Tổ Chức Gốc Mới
        </button>
      </div>

      {/* Modern KPI Summary Widget Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px' }}>
        
        <div className="glass-panel" style={{ padding: '18px 22px', background: '#ffffff', display: 'flex', alignItems: 'center', gap: '16px', borderLeft: '4px solid #0284c7' }}>
          <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Building2 size={24} />
          </div>
          <div>
            <span style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>{allOrgsList.length}</span>
            <p style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Tổng Tổ Chức & Chi Nhánh</p>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px 22px', background: '#ffffff', display: 'flex', alignItems: 'center', gap: '16px', borderLeft: '4px solid #059669' }}>
          <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: '#dcfce7', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GitBranch size={24} />
          </div>
          <div>
            <span style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>{rootOrgsCount}</span>
            <p style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Tập Đoàn / Công Ty Gốc</p>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px 22px', background: '#ffffff', display: 'flex', alignItems: 'center', gap: '16px', borderLeft: '4px solid #d97706' }}>
          <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Building size={24} />
          </div>
          <div>
            <span style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>{subBranchesCount}</span>
            <p style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Chi Nhánh Trực Thuộc</p>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px 22px', background: '#ffffff', display: 'flex', alignItems: 'center', gap: '16px', borderLeft: '4px solid #16a34a' }}>
          <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={24} />
          </div>
          <div>
            <span style={{ fontSize: '24px', fontWeight: '800', color: '#16a34a' }}>{activeCount}/{allOrgsList.length}</span>
            <p style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Đang Hoạt Động</p>
          </div>
        </div>

      </div>

      {/* Control Bar: Search & Tree Controls & View Switcher */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', background: '#ffffff', padding: '14px 20px', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
        
        {/* Search input */}
        <div style={{ position: 'relative', flex: 1, minWidth: '260px', maxWidth: '400px' }}>
          <Search size={17} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input 
            type="text" 
            className="glass-input" 
            style={{ paddingLeft: '40px', height: '42px', fontSize: '13px', background: '#f8fafc' }}
            placeholder="Tìm kiếm tổ chức theo tên hoặc mã..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          
          {/* Tree expand / collapse quick buttons */}
          {viewMode === 'tree' && (
            <div style={{ display: 'flex', gap: '6px' }}>
              <button 
                onClick={handleExpandAll}
                className="btn-action btn-secondary"
                style={{ padding: '7px 12px', fontSize: '12px', height: '38px' }}
                title="Mở rộng tất cả chi nhánh"
              >
                <ChevronsDown size={15} /> Mở Tất Cả
              </button>
              <button 
                onClick={handleCollapseAll}
                className="btn-action btn-secondary"
                style={{ padding: '7px 12px', fontSize: '12px', height: '38px' }}
                title="Thu gọn tất cả chi nhánh"
              >
                <ChevronsUp size={15} /> Thu Gọn
              </button>
            </div>
          )}

          {/* View Mode Toggle Switcher */}
          <div style={{ display: 'flex', background: '#f1f5f9', padding: '3px', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
            <button 
              onClick={() => setViewMode('tree')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '8px',
                border: 'none',
                background: viewMode === 'tree' ? '#ffffff' : 'transparent',
                color: viewMode === 'tree' ? '#0284c7' : '#64748b',
                fontWeight: '700',
                fontSize: '12px',
                cursor: 'pointer',
                boxShadow: viewMode === 'tree' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <ListTree size={16} /> Sơ Đồ Cây
            </button>
            <button 
              onClick={() => setViewMode('table')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '8px',
                border: 'none',
                background: viewMode === 'table' ? '#ffffff' : 'transparent',
                color: viewMode === 'table' ? '#0284c7' : '#64748b',
                fontWeight: '700',
                fontSize: '12px',
                cursor: 'pointer',
                boxShadow: viewMode === 'table' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <LayoutGrid size={16} /> Bảng Danh Sách
            </button>
          </div>

        </div>

      </div>

      {/* Main Content View Area */}
      {viewMode === 'tree' ? (
        <div className="glass-panel" style={{ padding: '24px', minHeight: '420px', background: '#ffffff' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b', fontSize: '13.5px' }}>
              Đang tải sơ đồ cây tổ chức...
            </div>
          ) : tree.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '50px 24px', 
              background: 'linear-gradient(135deg, #f8fafc 0%, #f0f9ff 100%)', 
              borderRadius: '16px', 
              border: '1px dashed #7dd3fc',
              margin: '10px 0',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px'
            }}>
              <div style={{ 
                width: '68px', 
                height: '68px', 
                borderRadius: '18px', 
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', 
                color: '#ffffff', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                boxShadow: '0 8px 24px rgba(2, 132, 199, 0.25)' 
              }}>
                <FolderTree size={36} />
              </div>
              
              <div>
                <h3 style={{ fontSize: '19px', fontWeight: '800', color: '#0f172a' }}>
                  Khởi Tạo Sơ Đồ Tổ Chức Phân Cấp Multi-Tenant
                </h3>
                <p style={{ fontSize: '13.5px', color: '#64748b', marginTop: '6px', maxWidth: '540px', lineHeight: '1.6' }}>
                  Xây dựng mô hình cây tổ chức thượng tầng cho doanh nghiệp. Quản lý Tập đoàn - Công ty Con - Chi nhánh trực thuộc và cách ly dữ liệu nhân sự an toàn.
                </p>
              </div>

              {/* Feature Pills */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <span style={{ fontSize: '12px', color: '#0369a1', background: '#ffffff', padding: '7px 16px', borderRadius: '20px', border: '1px solid #bae6fd', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: '700', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                  <Building2 size={14} color="#0284c7" /> Công Ty Gốc (Root Level)
                </span>
                <span style={{ fontSize: '12px', color: '#059669', background: '#ffffff', padding: '7px 16px', borderRadius: '20px', border: '1px solid #a7f3d0', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: '700', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                  <GitBranch size={14} color="#059669" /> Chi Nhánh Con Phân Cấp
                </span>
                <span style={{ fontSize: '12px', color: '#d97706', background: '#ffffff', padding: '7px 16px', borderRadius: '20px', border: '1px solid #fde68a', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: '700', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                  <ShieldCheck size={14} color="#d97706" /> Cách Ly Dữ Liệu Tuyệt Đối
                </span>
              </div>

              <button 
                className="btn-action btn-create" 
                onClick={() => handleOpenAddChild('')} 
                style={{ padding: '12px 26px', fontSize: '14px', borderRadius: '12px', marginTop: '6px', boxShadow: '0 4px 16px rgba(16, 185, 129, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <Plus size={18} /> Khởi Tạo Tổ Chức Gốc Mới Ngay
              </button>
            </div>
          ) : (
            tree.map(node => <TreeNodeCard key={node._id} node={node} />)
          )}
        </div>
      ) : (
        /* Table Grid View */
        <div className="glass-panel" style={{ overflow: 'hidden', background: '#ffffff' }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th>Tên Tổ Chức & Mã</th>
                <th>Cấp Phân Cấp</th>
                <th>Chi Nhánh Trực Thuộc</th>
                <th>Trạng Thái</th>
                <th style={{ textAlign: 'right' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '30px' }}>Đang tải danh sách...</td>
                </tr>
              ) : filteredFlatList.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Không tìm thấy tổ chức nào</td>
                </tr>
              ) : (
                filteredFlatList.map(item => (
                  <tr key={item._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: `${item.depth * 24}px` }}>
                        <div style={{ 
                          width: '34px', 
                          height: '34px', 
                          borderRadius: '8px', 
                          background: item.depth === 0 ? '#0284c7' : '#e0f2fe', 
                          color: item.depth === 0 ? '#ffffff' : '#0284c7', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center' 
                        }}>
                          <Building2 size={18} />
                        </div>
                        <div>
                          <span style={{ fontWeight: '800', color: '#0f172a', fontSize: '14px' }}>{item.name}</span>
                          <span className="badge badge-role" style={{ fontSize: '11px', marginLeft: '8px' }}>{item.code}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      {item.depth === 0 ? (
                        <span className="badge badge-super" style={{ fontSize: '11px' }}>TỔ CHỨC GỐC</span>
                      ) : (
                        <span className="badge badge-role" style={{ fontSize: '11px' }}>Cấp {item.depth}</span>
                      )}
                    </td>

                    <td style={{ color: '#64748b', fontSize: '13px' }}>
                      {item.children && item.children.length > 0 ? (
                        <strong style={{ color: '#0284c7' }}>{item.children.length} chi nhánh</strong>
                      ) : (
                        '--'
                      )}
                    </td>

                    <td>
                      <span className={`badge ${item.status === 'ACTIVE' ? 'badge-active' : 'badge-archived'}`}>
                        {item.status === 'ACTIVE' ? 'HOẠT ĐỘNG' : 'TẠM KHÓA'}
                      </span>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                        <button 
                          onClick={() => handleOpenAddChild(item._id)}
                          style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #bbf7d0', background: '#dcfce7', color: '#15803d', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                        >
                          + Thêm Con
                        </button>
                        <button 
                          onClick={() => handleOpenEdit(item)}
                          style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #fde68a', background: '#fef3c7', color: '#b45309', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                        >
                          Sửa
                        </button>
                        <button 
                          onClick={() => handleDeleteOrg(item)}
                          style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #fca5a5', background: '#fee2e2', color: '#b91c1c', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal 1: Create Organization */}
      {showCreateModal && createPortal(
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in" style={{ maxWidth: '520px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={22} color="#059669" /> Tạo Tổ Chức / Chi Nhánh Mới
              </h2>
              <button 
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '22px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {error && (
              <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#991b1b', padding: '12px', borderRadius: 'var(--radius-md)', marginBottom: '16px', fontSize: '13px' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleCreateOrg} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Tên tổ chức / Chi nhánh <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input 
                  type="text" 
                  required 
                  className="glass-input" 
                  placeholder="Ví dụ: Chi Nhánh Đà Nẵng"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Mã viết tắt (Unique Code) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input 
                  type="text" 
                  required 
                  className="glass-input" 
                  placeholder="Ví dụ: ABC-DN"
                  value={createForm.code}
                  onChange={(e) => setCreateForm({ ...createForm, code: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Tổ chức cấp trên (Parent Org)
                </label>
                <select 
                  className="glass-input"
                  value={createForm.parentOrganizationId}
                  onChange={(e) => setCreateForm({ ...createForm, parentOrganizationId: e.target.value })}
                >
                  <option value="">-- Không có (Khởi tạo làm Tổ chức Gốc Root) --</option>
                  {allOrgsList.map(org => (
                    <option key={org._id} value={org._id}>
                      {org.name} ({org.code}) - Cấp {org.depth}
                    </option>
                  ))}
                </select>
              </div>

              {/* Manager Assignment Section - Required for Child Orgs */}
              <div style={{ 
                background: '#f8fafc', 
                border: '1px solid #cbd5e1', 
                borderRadius: '12px', 
                padding: '14px', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '12px' 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0369a1', fontWeight: '700', fontSize: '13.5px' }}>
                  <ShieldCheck size={18} /> Người Giữ & Quản Lý Chi Nhánh {createForm.parentOrganizationId && <span style={{ color: '#ef4444' }}>(Bắt buộc)</span>}
                </div>
                <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                  Theo quy định, tổ chức con phải có 1 người giữ & quản lý. Khi khởi tạo, hệ thống sẽ gửi thông tin xin chấp nhận quản lý tới email này.
                </p>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                    Họ và Tên Người Quản Lý {createForm.parentOrganizationId && <span style={{ color: '#ef4444' }}>*</span>}
                  </label>
                  <input 
                    type="text" 
                    required={!!createForm.parentOrganizationId}
                    className="glass-input" 
                    placeholder="Ví dụ: Nguyễn Văn A"
                    value={createForm.managerName}
                    onChange={(e) => setCreateForm({ ...createForm, managerName: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                    Email Nhận Quyền Quản Lý {createForm.parentOrganizationId && <span style={{ color: '#ef4444' }}>*</span>}
                  </label>
                  <input 
                    type="email" 
                    required={!!createForm.parentOrganizationId}
                    className="glass-input" 
                    placeholder="Ví dụ: manager@chinhanh.com"
                    value={createForm.managerEmail}
                    onChange={(e) => setCreateForm({ ...createForm, managerEmail: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '14px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                <button type="button" className="btn-action btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn-action btn-create">
                  Gửi Thông Tin & Tạo Chi Nhánh
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal 2: Edit Organization */}
      {showEditModal && createPortal(
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in" style={{ maxWidth: '520px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit size={22} color="#f59e0b" /> Chỉnh Sửa Tổ Chức
              </h2>
              <button 
                onClick={() => setShowEditModal(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '22px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {error && (
              <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#991b1b', padding: '12px', borderRadius: 'var(--radius-md)', marginBottom: '16px', fontSize: '13px' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleUpdateOrg} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Tên tổ chức / Chi nhánh
                </label>
                <input 
                  type="text" 
                  required 
                  className="glass-input" 
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Mã viết tắt (Unique Code)
                </label>
                <input 
                  type="text" 
                  required 
                  className="glass-input" 
                  value={editForm.code}
                  onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Tổ chức cấp trên (Parent Org)
                </label>
                <select 
                  className="glass-input"
                  value={editForm.parentOrganizationId}
                  onChange={(e) => setEditForm({ ...editForm, parentOrganizationId: e.target.value })}
                >
                  <option value="">-- Không có (Tổ chức gốc Root) --</option>
                  {allOrgsList.filter(o => o._id !== editForm._id).map(org => (
                    <option key={org._id} value={org._id}>
                      {org.name} ({org.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Trạng thái hoạt động
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '14px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
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

      {/* Modal 3: Child Organization Subscription Purchase / Renewal Modal (Clean Enterprise Style) */}
      {showChildRenewalModal && selectedChildForRenewal && createPortal(
        <div className="modal-overlay animate-backdrop" style={{ zIndex: 10000 }}>
          <div 
            className="modal-content animate-modal-pop" 
            style={{ 
              maxWidth: '820px', 
              width: '94vw', 
              padding: '28px 32px', 
              borderRadius: '20px',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              boxShadow: '0 20px 45px rgba(15, 23, 42, 0.15)',
              overflow: 'hidden'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Crown size={22} className="text-sky-600" /> Mua & Gia Hạn Gói Dịch Vụ Chi Nhánh Con
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', fontSize: '13px', color: '#64748b' }}>
                  <span>Tổ chức cha gia hạn cho:</span>
                  <span style={{ fontWeight: '700', color: '#0369a1', background: '#f0f9ff', padding: '3px 10px', borderRadius: '8px', border: '1px solid #bae6fd', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <Building size={14} /> {selectedChildForRenewal.name} ({selectedChildForRenewal.code})
                  </span>
                </div>
              </div>

              <button 
                onClick={() => setShowChildRenewalModal(false)}
                style={{ 
                  background: '#f8fafc', 
                  border: '1px solid #cbd5e1', 
                  color: '#64748b', 
                  width: '32px', 
                  height: '32px', 
                  borderRadius: '8px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                title="Đóng"
              >
                ✕
              </button>
            </div>

            {/* Dynamic Pricing Selection Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
              {availablePlans.map((p) => {
                const isSelected = childPlan === p.code;
                const isPro = p.code === 'PRO';
                const isVip = p.code === 'VIP';

                return (
                  <div 
                    key={p.code}
                    onClick={() => setChildPlan(p.code)}
                    style={{ 
                      borderRadius: '16px', 
                      padding: '22px 18px', 
                      cursor: 'pointer',
                      position: 'relative',
                      background: isSelected 
                        ? (isVip ? '#faf5ff' : isPro ? '#f0f9ff' : '#f8fafc') 
                        : '#ffffff',
                      border: isSelected 
                        ? `2px solid ${isVip ? '#9333ea' : isPro ? '#0284c7' : '#0284c7'}` 
                        : '1px solid #e2e8f0',
                      boxShadow: isSelected ? '0 8px 20px rgba(2, 132, 199, 0.12)' : '0 2px 6px rgba(0,0,0,0.02)',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                  >
                    {/* Popular Tag */}
                    {p.popular && (
                      <div style={{ position: 'absolute', top: '-11px', right: '16px', background: '#0284c7', color: '#ffffff', fontSize: '10px', fontWeight: '800', padding: '2px 10px', borderRadius: '10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {p.popularBadgeText || 'Phổ Biến Nhất'}
                      </div>
                    )}

                    <div>
                      <div style={{ fontSize: '11px', fontWeight: '800', color: isVip ? '#7e22ce' : '#0369a1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {p.subtitle || p.badge}
                      </div>
                      <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', marginTop: '4px' }}>
                        {p.title}
                      </h3>

                      <div style={{ marginTop: '12px', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                        <span style={{ fontSize: '24px', fontWeight: '900', color: isVip ? '#7e22ce' : '#0284c7' }}>
                          {p.formattedPrice}
                        </span>
                        <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                          {p.billingCycle}
                        </span>
                      </div>
                    </div>

                    <div style={{ marginTop: '18px', borderTop: '1px solid #f1f5f9', paddingTop: '14px' }}>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: '#334155' }}>
                        {p.features && p.features.map((feat, idx) => (
                          <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', lineHeight: '1.4' }}>
                            <Check size={16} style={{ color: isVip ? '#9333ea' : '#10b981', flexShrink: 0, marginTop: '1px' }} />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                  </div>
                );
              })}
            </div>

            {/* Modal Actions Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '18px', flexWrap: 'nowrap' }}>
              <div style={{ fontSize: '12.5px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
                <ShieldCheck size={16} color="#0284c7" style={{ flexShrink: 0 }} />
                <span>Thời hạn sẽ được <strong>tự động cộng dồn +30 ngày</strong> cho chi nhánh con.</span>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexShrink: 0 }}>
                <button 
                  type="button" 
                  className="btn-action btn-secondary" 
                  onClick={() => setShowChildRenewalModal(false)}
                  style={{ padding: '10px 20px', borderRadius: '10px', whiteSpace: 'nowrap', flexShrink: 0, fontWeight: '600' }}
                >
                  Hủy Bỏ
                </button>
                <button 
                  type="button" 
                  className="btn-action"
                  onClick={handleConfirmChildRenew}
                  style={{ 
                    background: childPlan === 'VIP' ? '#9333ea' : '#0284c7', 
                    color: '#ffffff',
                    padding: '10px 22px', 
                    borderRadius: '10px',
                    fontWeight: '800',
                    fontSize: '13.5px',
                    boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                  }}
                >
                  <Crown size={16} /> Xác Nhận & Kích Hoạt Gói {childPlan}
                </button>
              </div>
            </div>

          </div>
        </div>,
        document.body
      )}

    </div>
  );
};
