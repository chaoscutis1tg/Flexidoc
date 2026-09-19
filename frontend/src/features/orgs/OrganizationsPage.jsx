import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import api from '../../services/api';
import { useAuth } from '../../app/AuthContext';
import { useConfirm } from '../../app/ConfirmContext';
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
  Check,
  UserCheck,
  UserX,
  Loader2,
  X
} from 'lucide-react';

export const OrganizationsPage = () => {
  const { user, refreshUser } = useAuth();
  const { confirm } = useConfirm();
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

  // Manager Autocomplete Search State with 300ms Debounce
  const [managerQuery, setManagerQuery] = useState('');
  const [debouncedManagerQuery, setDebouncedManagerQuery] = useState('');
  const [lastSearchedQuery, setLastSearchedQuery] = useState('');
  const [allCandidatesList, setAllCandidatesList] = useState([]);
  const [managerSuggestions, setManagerSuggestions] = useState([]);
  const [isSearchingManager, setIsSearchingManager] = useState(false);
  const [showManagerDropdown, setShowManagerDropdown] = useState(false);
  const [selectedManagerObj, setSelectedManagerObj] = useState(null);

  // Edit Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    _id: '',
    name: '',
    code: '',
    parentOrganizationId: '',
    managerName: '',
    managerEmail: '',
    status: 'ACTIVE',
  });

  // Child Subscription Renewal Modal State
  const [showChildRenewalModal, setShowChildRenewalModal] = useState(false);
  const [selectedChildForRenewal, setSelectedChildForRenewal] = useState(null);
  const [childPlan, setChildPlan] = useState('PRO');

  const [error, setError] = useState('');

  // Helper for unaccent Vietnamese search matching
  const removeVietnameseTones = (str) => {
    if (!str) return '';
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase();
  };

  // Debounce manager search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedManagerQuery(managerQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [managerQuery]);

  // Load all candidates from Master Data & System Users (strictly scoped to target organization)
  const loadAllCandidates = async (searchKeyword = '', overrideOrgId = null) => {
    setIsSearchingManager(true);
    try {
      const q = searchKeyword ? `?search=${encodeURIComponent(searchKeyword.trim())}` : '';
      const [masterRes, usersRes] = await Promise.allSettled([
        api.get(`/master-data${q}`),
        api.get('/users')
      ]);

      const userOrgId = user?.organizationId ? (user.organizationId._id || user.organizationId).toString() : null;
      
      let targetOrgId = overrideOrgId;
      if (!targetOrgId && editForm?._id) {
        targetOrgId = editForm._id.toString();
      }
      if (!targetOrgId && createForm?.parentOrganizationId) {
        targetOrgId = createForm.parentOrganizationId.toString();
      }
      if (!targetOrgId) {
        targetOrgId = userOrgId;
      }

      // Allowed organization scope: includes user org, target org, and parent/ancestors of target org
      const allowedOrgIds = new Set();
      if (userOrgId) allowedOrgIds.add(userOrgId);
      if (targetOrgId) allowedOrgIds.add(targetOrgId);

      const targetOrgObj = allOrgsList.find(o => o._id === targetOrgId);
      if (targetOrgObj) {
        if (targetOrgObj.parentOrganizationId) {
          allowedOrgIds.add((targetOrgObj.parentOrganizationId._id || targetOrgObj.parentOrganizationId).toString());
        }
        if (targetOrgObj.ancestors && Array.isArray(targetOrgObj.ancestors)) {
          targetOrgObj.ancestors.forEach(a => allowedOrgIds.add((a._id || a).toString()));
        }
      }

      let candidates = [];

      const matchesOrg = (itemOrgField) => {
        if (allowedOrgIds.size === 0) return true; // Super Admin with no org context
        if (!itemOrgField) return false;
        const idStr = (itemOrgField._id || itemOrgField).toString();
        return allowedOrgIds.has(idStr);
      };

      // 1. Master Data Candidates (Filtered strictly by targetOrgId)
      if (masterRes.status === 'fulfilled' && masterRes.value?.data) {
        const mdList = (masterRes.value.data || [])
          .filter(item => matchesOrg(item.organizationId))
          .map(item => {
            const d = item.data || {};
            const name = item.type === 'EMPLOYEE' 
              ? (d.fullName || d.companyName || 'N/A') 
              : (d.companyName || d.fullName || d.representative || 'N/A');
            const email = d.email || (item.code ? `${item.code.toLowerCase()}@organization.com` : '');
            const orgObj = item.organizationId || {};
            const orgName = typeof orgObj === 'object' ? (orgObj.name || '') : '';
            const orgCode = typeof orgObj === 'object' ? (orgObj.code || '') : '';

            return {
              id: `md_${item._id}`,
              name,
              email,
              position: d.position || d.repPosition || (item.type === 'EMPLOYEE' ? 'Nhân viên' : 'Đại diện'),
              department: d.department || 'Ban Quản Lý',
              phone: d.phone || '',
              type: item.type,
              code: item.code || '',
              orgName,
              orgCode
            };
          });
        candidates.push(...mdList);
      }

      // 2. System Users Candidates (Filtered strictly by targetOrgId)
      if (usersRes.status === 'fulfilled' && usersRes.value?.data) {
        const userList = (usersRes.value.data || [])
          .filter(u => matchesOrg(u.organizationId))
          .map(u => {
            const orgObj = u.organizationId || {};
            const orgName = typeof orgObj === 'object' ? (orgObj.name || '') : '';
            const orgCode = typeof orgObj === 'object' ? (orgObj.code || '') : '';
            return {
              id: `usr_${u._id}`,
              name: u.fullName || u.username || u.email,
              email: u.email || '',
              position: u.role || 'Tài khoản hệ thống',
              department: u.department || 'Tổ chức',
              phone: u.phone || '',
              type: 'EMPLOYEE',
              code: u.username || '',
              orgName,
              orgCode
            };
          });

        userList.forEach(u => {
          if (u.email && !candidates.some(c => c.email && c.email.toLowerCase() === u.email.toLowerCase())) {
            candidates.push(u);
          }
        });
      }

      setAllCandidatesList(candidates);

      // Filter with Vietnamese unaccent
      if (searchKeyword) {
        const cleanQuery = removeVietnameseTones(searchKeyword.trim());
        const filtered = candidates.filter(item => {
          const n = removeVietnameseTones(item.name);
          const e = removeVietnameseTones(item.email);
          const c = removeVietnameseTones(item.code);
          const d = removeVietnameseTones(item.department);
          return n.includes(cleanQuery) || e.includes(cleanQuery) || c.includes(cleanQuery) || d.includes(cleanQuery);
        });
        setManagerSuggestions(filtered);
      } else {
        setManagerSuggestions(candidates);
      }
    } catch (err) {
      console.error('Error searching manager candidates:', err);
    } finally {
      setIsSearchingManager(false);
    }
  };

  // Search manager from Master Data / Users when debounced query changes
  useEffect(() => {
    if (!showCreateModal && !showEditModal) return;

    const rawQuery = (debouncedManagerQuery || '').trim();

    if (!rawQuery) {
      setManagerSuggestions(allCandidatesList);
      return;
    }

    const cleanQuery = removeVietnameseTones(rawQuery);

    const filtered = allCandidatesList.filter(item => {
      const n = removeVietnameseTones(item.name);
      const e = removeVietnameseTones(item.email);
      const c = removeVietnameseTones(item.code);
      const d = removeVietnameseTones(item.department);
      return n.includes(cleanQuery) || e.includes(cleanQuery) || c.includes(cleanQuery) || d.includes(cleanQuery);
    });

    setManagerSuggestions(filtered);

    // Perform API search ONLY if local list has no match AND we haven't already searched this exact query
    if (filtered.length === 0 && lastSearchedQuery !== rawQuery && !isSearchingManager) {
      setLastSearchedQuery(rawQuery);
      const targetOrg = showEditModal ? editForm?._id : (showCreateModal ? createForm?.parentOrganizationId : null);
      loadAllCandidates(rawQuery, targetOrg);
    }
  }, [debouncedManagerQuery, showCreateModal, showEditModal, allCandidatesList, lastSearchedQuery, isSearchingManager]);

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
    setManagerQuery('');
    setLastSearchedQuery('');
    setSelectedManagerObj(null);
    setShowManagerDropdown(false);
    setError('');
    setShowCreateModal(true);
    loadAllCandidates('', parentOrgId);
  };

  const handleSelectManagerCandidate = (candidate) => {
    if (showEditModal) {
      setEditForm(prev => ({
        ...prev,
        managerName: candidate.name,
        managerEmail: candidate.email
      }));
    } else {
      setCreateForm(prev => ({
        ...prev,
        managerName: candidate.name,
        managerEmail: candidate.email
      }));
    }
    setManagerQuery(candidate.name);
    setSelectedManagerObj(candidate);
    setShowManagerDropdown(false);
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
      await refreshUser();
      fetchTree();
      alert(`Đã xác nhận chấp nhận quyền quản lý & kích hoạt chi nhánh '${node.name}' thành công! Role của bạn đã được nâng cấp lên Quản Lý Tổ Chức.`);
    } catch (err) {
      alert('Kích hoạt chi nhánh thất bại: ' + (err.message || 'Lỗi hệ thống'));
    }
  };

  const handleRejectOrg = async (node) => {
    const reason = window.prompt(
      `Từ chối nhận quyền quản lý chi nhánh "${node.name}". Vui lòng nhập lý do từ chối:`,
      'Tôi không thể nhận quản lý chi nhánh này vào lúc này.'
    );
    if (reason === null) return;

    try {
      await api.post(`/organizations/${node._id}/reject`, { reason });
      fetchTree();
      alert(`Đã phản hồi TỪ CHỐI nhận quyền quản lý chi nhánh '${node.name}'. Thông báo đã được gửi tới người tạo chi nhánh để chỉ định quản lý mới.`);
    } catch (err) {
      alert('Từ chối thất bại: ' + (err.message || 'Lỗi hệ thống'));
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

  const [resendingOrgId, setResendingOrgId] = useState(null);

  const handleResendInvitation = async (node) => {
    if (resendingOrgId) return;
    setResendingOrgId(node._id);
    try {
      let parentId = node.parentOrganizationId 
        ? String(node.parentOrganizationId._id || node.parentOrganizationId) 
        : null;

      if (parentId && parentId === String(node._id)) {
        parentId = null;
      }

      await api.patch(`/organizations/${node._id}`, {
        parentOrganizationId: parentId,
        managerEmail: node.managerEmail,
        managerName: node.managerName,
        status: 'PENDING_APPROVAL'
      });
      await fetchTree();
      alert(`✓ Đã gửi lại lời mời nhận quyền quản lý chi nhánh '${node.name}' tới email ${node.managerEmail} thành công!`);
    } catch (err) {
      alert('Gửi lại lời mời thất bại: ' + (err.message || 'Lỗi hệ thống'));
    } finally {
      setResendingOrgId(null);
    }
  };

  const handleOpenEdit = (node) => {
    let parentId = node.parentOrganizationId 
      ? String(node.parentOrganizationId._id || node.parentOrganizationId) 
      : '';
    // Safeguard: never let parentId equal node._id
    if (parentId && parentId === String(node._id)) {
      parentId = '';
    }
    setEditForm({
      _id: String(node._id),
      name: node.name,
      code: node.code,
      parentOrganizationId: parentId,
      managerName: node.managerName || '',
      managerEmail: node.managerEmail || '',
      status: node.status || 'ACTIVE',
    });
    setManagerQuery(node.managerName || '');
    setLastSearchedQuery('');
    setSelectedManagerObj(null);
    setShowManagerDropdown(false);
    setError('');
    setShowEditModal(true);
    loadAllCandidates('', node._id);
  };

  const handleUpdateOrg = async (e) => {
    e.preventDefault();
    setError('');
    try {
      let parentId = editForm.parentOrganizationId
        ? String(editForm.parentOrganizationId._id || editForm.parentOrganizationId)
        : null;

      // Anti-loop safeguard: If parentId mistakenly matches _id, reset to null/current parent
      if (parentId && String(parentId) === String(editForm._id)) {
        const currentOrg = allOrgsList.find(o => String(o._id) === String(editForm._id));
        parentId = currentOrg?.parentOrganizationId
          ? String(currentOrg.parentOrganizationId._id || currentOrg.parentOrganizationId)
          : null;
      }

      await api.patch(`/organizations/${editForm._id}`, {
        name: editForm.name,
        code: editForm.code,
        parentOrganizationId: parentId,
        managerName: editForm.managerName,
        managerEmail: editForm.managerEmail,
        status: editForm.status === 'REJECTED_BY_MANAGER' ? 'PENDING_APPROVAL' : editForm.status,
      });
      setShowEditModal(false);
      fetchTree();
    } catch (err) {
      setError(err.message || 'Cập nhật thất bại.');
    }
  };

  const handleDeleteOrg = async (node) => {
    const isConfirmed = await confirm({
      title: 'Xóa Chi Nhánh / Tổ Chức',
      message: `Bạn có chắc chắn muốn xóa tổ chức '${node.name}' (Mã: ${node.code})?`,
      subMessage: 'Lưu ý: Không thể xóa tổ chức nếu đang chứa các chi nhánh con phía dưới.',
      confirmText: 'Xóa Tổ Chức',
      cancelText: 'Hủy Bỏ',
      variant: 'danger',
    });

    if (!isConfirmed) return;

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

    const iconBg = isRoot ? 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)' : isSub ? '#dcfce7' : '#fef3c7';
    const iconColor = isRoot ? '#0284c7' : isSub ? '#16a34a' : '#d97706';

    return (
      <div className="animate-fade-in my-2">

        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 space-y-3 hover:border-sky-300 transition-all">
          
          {/* Row 1: Main Header & Primary Action Controls */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            
            {/* Left Info: Expand + Icon + Title + Badges */}
            <div className="flex items-center gap-3 min-w-0">
              {hasChildren ? (
                <button
                  onClick={() => toggleExpand(node._id)}
                  className="w-7 h-7 rounded-lg border border-slate-300 bg-white text-slate-700 flex items-center justify-center hover:bg-slate-50 cursor-pointer shadow-2xs transition-all shrink-0"
                  title={isExpanded ? 'Thu gọn chi nhánh con' : 'Mở rộng chi nhánh con'}
                >
                  {isExpanded ? <ChevronDown size={17} /> : <ChevronRight size={17} />}
                </button>
              ) : (
                <div className="w-7 flex justify-center shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                </div>
              )}

              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs"
                style={{ background: iconBg, color: iconColor }}
              >
                {isRoot ? <Building2 size={20} /> : isSub ? <Building size={18} /> : <Layers size={18} />}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-extrabold text-sm text-slate-900 truncate">{node.name}</span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                    Mã: <strong>{node.code}</strong>
                  </span>
                  {isRoot ? (
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-sky-600 text-white uppercase tracking-wider">
                      ROOT
                    </span>
                  ) : (
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Cấp {node.level} • Chi Nhánh
                    </span>
                  )}

                  {/* Status Indicator */}
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${
                    node.status === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : node.status === 'PENDING_APPROVAL'
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : node.status === 'REJECTED_BY_MANAGER'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-red-50 text-red-700 border-red-200'
                  }`}>
                    {node.status === 'ACTIVE' ? (
                      <><CheckCircle2 size={13} className="text-emerald-600" /> HOẠT ĐỘNG</>
                    ) : node.status === 'PENDING_APPROVAL' ? (
                      <><Clock size={13} className="text-amber-600" /> CHỜ QUẢN LÝ XÁC NHẬN</>
                    ) : node.status === 'REJECTED_BY_MANAGER' ? (
                      <><XCircle size={13} className="text-rose-600" /> QUẢN LÝ TỪ CHỐI</>
                    ) : (
                      <><XCircle size={13} className="text-red-600" /> TẠM KHÓA</>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Standard Actions */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => handleOpenChildRenewal(node)}
                className="px-2.5 py-1.5 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                title="Gói Dịch Vụ"
              >
                <Crown size={14} /> Gói Dịch Vụ
              </button>

              <button
                onClick={() => handleOpenAddChild(node._id)}
                className="px-2.5 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                title="Thêm chi nhánh con"
              >
                <Plus size={14} /> Thêm Con
              </button>

              <button
                onClick={() => handleOpenEdit(node)}
                className="px-2.5 py-1.5 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                title="Sửa"
              >
                <Edit size={14} /> Sửa
              </button>

              <button
                onClick={() => handleDeleteOrg(node)}
                className="px-2.5 py-1.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                title="Xóa"
              >
                <Trash2 size={14} /> Xóa
              </button>
            </div>
          </div>

          {/* Row 2: Manager Info & Manager Approval Actions Bar */}
          {(node.managerEmail || node.status === 'PENDING_APPROVAL' || node.status === 'REJECTED_BY_MANAGER') && (
            <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-2 text-slate-600 font-medium min-w-0">
                {node.managerEmail && (
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100/80 border border-slate-200 text-slate-700 text-[11.5px] font-semibold truncate">
                    Quản Lý Chi Nhánh: <strong className="text-slate-900">{node.managerName || 'Chưa đặt tên'}</strong> ({node.managerEmail})
                  </span>
                )}
                {hasChildren ? (
                  <span className="text-sky-700 font-bold">• {node.children.length} chi nhánh trực thuộc</span>
                ) : (
                  <span className="text-slate-400">• Chi nhánh độc lập</span>
                )}
              </div>

              {/* Approval Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {node.status === 'PENDING_APPROVAL' && (
                  user?.email && node.managerEmail && (user.email.toLowerCase().trim() === node.managerEmail.toLowerCase().trim()) ? (
                    <>
                      <button
                        onClick={() => handleApproveOrg(node)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-2xs cursor-pointer transition-all flex items-center gap-1"
                      >
                        <CheckCircle2 size={14} /> Xác Nhận & Kích Hoạt
                      </button>
                      <button
                        onClick={() => handleRejectOrg(node)}
                        className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold cursor-pointer transition-all flex items-center gap-1"
                      >
                        <UserX size={14} /> Từ Chối
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-[11.5px] font-bold">
                        Đang chờ {node.managerEmail || 'quản lý'} xác nhận
                      </span>
                      <button
                        onClick={() => handleResendInvitation(node)}
                        disabled={resendingOrgId === node._id}
                        className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold cursor-pointer transition-all flex items-center gap-1"
                        title="Gửi lại lời mời cho người quản lý"
                      >
                        {resendingOrgId === node._id ? (
                          <><Loader2 size={13} className="animate-spin" /> Đang Gửi...</>
                        ) : (
                          <><UserCheck size={13} /> Gửi Lại Lời Mời</>
                        )}
                      </button>
                    </div>
                  )
                )}

                {node.status === 'REJECTED_BY_MANAGER' && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleResendInvitation(node)}
                      disabled={resendingOrgId === node._id}
                      className={`px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-2xs cursor-pointer transition-all flex items-center gap-1.5 ${resendingOrgId === node._id ? 'opacity-70 cursor-wait' : ''}`}
                      title={`Bấm để gửi lại lời mời nhận quyền quản lý tới ${node.managerEmail}`}
                    >
                      {resendingOrgId === node._id ? (
                        <><Loader2 size={14} className="animate-spin" /> Đang Gửi Lời Mời...</>
                      ) : (
                        <><UserCheck size={14} /> Gửi Lại Cho Quản Lý Cũ</>
                      )}
                    </button>
                    <button
                      onClick={() => handleOpenEdit(node)}
                      disabled={resendingOrgId === node._id}
                      className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold cursor-pointer transition-all flex items-center gap-1"
                      title="Đổi email/người quản lý mới cho chi nhánh này"
                    >
                      <Edit size={14} /> Đổi Quản Lý Mới
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Render Children Recursively with Connector */}
        {hasChildren && isExpanded && (
          <div className="border-l-2 border-dashed border-slate-300 ml-6 pl-4 mt-1">
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

      {/* Header Acceptance Notification Card for Pending Approvals (Only visible to assigned manager) */}
      {allOrgsList.filter(o => o.status === 'PENDING_APPROVAL' && user?.email && o.managerEmail && o.managerEmail.toLowerCase().trim() === user.email.toLowerCase().trim()).length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
          border: '1px solid #fde68a',
          borderRadius: '16px',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
          boxShadow: '0 4px 12px rgba(217, 119, 6, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#d97706', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Clock size={22} />
            </div>
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#92400e', margin: 0 }}>
                Bạn có {allOrgsList.filter(o => o.status === 'PENDING_APPROVAL' && user?.email && o.managerEmail && o.managerEmail.toLowerCase().trim() === user.email.toLowerCase().trim()).length} chi nhánh đang chờ bạn Chấp Nhận Tiếp Nhận
              </h4>
              <p style={{ fontSize: '12px', color: '#b45309', margin: '2px 0 0 0' }}>
                Vui lòng bấm chấp nhận bên dưới để chính thức kích hoạt chi nhánh và tiếp nhận quyền quản lý.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {allOrgsList.filter(o => o.status === 'PENDING_APPROVAL' && user?.email && o.managerEmail && o.managerEmail.toLowerCase().trim() === user.email.toLowerCase().trim()).map(org => (
              <div key={org._id} style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => handleApproveOrg(org)}
                  style={{
                    background: '#d97706',
                    color: '#ffffff',
                    border: 'none',
                    padding: '8px 14px',
                    borderRadius: '10px',
                    fontSize: '12px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 6px rgba(217, 119, 6, 0.25)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <CheckCircle2 size={15} /> Chấp Nhận: {org.name}
                </button>
                <button
                  onClick={() => handleRejectOrg(org)}
                  style={{
                    background: '#ffffff',
                    color: '#b45309',
                    border: '1px solid #fde68a',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <UserX size={14} /> Từ Chối
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Header Notification Card for Manager Rejections */}
      {allOrgsList.filter(o => o.status === 'REJECTED_BY_MANAGER').length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #fef2f2 0%, #ffe4e6 100%)',
          border: '1px solid #fecdd3',
          borderRadius: '16px',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
          boxShadow: '0 4px 12px rgba(225, 29, 72, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#e11d48', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <XCircle size={22} />
            </div>
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#9f1239', margin: 0 }}>
                Có {allOrgsList.filter(o => o.status === 'REJECTED_BY_MANAGER').length} chi nhánh bị Người Quản Lý TỪ CHỐI tiếp nhận
              </h4>
              <p style={{ fontSize: '12px', color: '#be123c', margin: '2px 0 0 0' }}>
                Người quản lý được chỉ định đã từ chối. Bạn có thể bấm bên dưới để <strong>gửi lại lời mời cho người đó</strong> hoặc <strong>gán cho người mới</strong>.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {allOrgsList.filter(o => o.status === 'REJECTED_BY_MANAGER').map(org => (
              <div key={org._id} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <button
                  onClick={() => handleResendInvitation(org)}
                  disabled={resendingOrgId === org._id}
                  style={{
                    background: '#059669',
                    color: '#ffffff',
                    border: 'none',
                    padding: '8px 14px',
                    borderRadius: '10px',
                    fontSize: '12px',
                    fontWeight: '800',
                    cursor: resendingOrgId === org._id ? 'wait' : 'pointer',
                    opacity: resendingOrgId === org._id ? 0.7 : 1,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)',
                    transition: 'all 0.15s ease'
                  }}
                  title={`Gửi lại lời mời cho ${org.managerEmail}`}
                >
                  {resendingOrgId === org._id ? (
                    <><Loader2 size={15} className="animate-spin" /> Đang Gửi...</>
                  ) : (
                    <><UserCheck size={15} /> Gửi Lại ({org.name})</>
                  )}
                </button>
                <button
                  onClick={() => handleOpenEdit(org)}
                  style={{
                    background: '#ffffff',
                    color: '#be123c',
                    border: '1px solid #fecdd3',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    fontSize: '12px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    transition: 'all 0.15s ease'
                  }}
                  title="Đổi người quản lý mới"
                >
                  <Edit size={14} /> Đổi Người Mới
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

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

      {/* Modal 1: Create Organization (Redesigned Enterprise Modal) */}
      {showCreateModal && createPortal(
        <div className="modal-overlay animate-fade-in" style={{ zIndex: 10000 }}>
          <div 
            className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto p-6 sm:p-8 space-y-6"
            style={{ width: '95vw', maxWidth: '780px' }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs">
                  <Plus size={22} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">Tạo Tổ Chức / Chi Nhánh Mới</h2>
                  <p className="text-xs font-semibold text-slate-500">Khởi tạo công ty gốc hoặc chi nhánh con thuộc tập đoàn</p>
                </div>
              </div>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                title="Đóng"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
                <XCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateOrg} className="space-y-4">
              {/* 2-Column Grid: Name & Code */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tên Tổ Chức / Chi Nhánh <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    required 
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all" 
                    placeholder="Ví dụ: Chi Nhánh Đà Nẵng"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mã Viết Tắt (Code) <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    required 
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-emerald-800 uppercase focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all" 
                    placeholder="ABC-DN"
                    value={createForm.code}
                    onChange={(e) => setCreateForm({ ...createForm, code: e.target.value.toUpperCase() })}
                  />
                </div>
              </div>

              {/* Parent Org Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tổ Chức Cấp Trên (Parent Organization)
                </label>
                <select 
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:border-emerald-500 cursor-pointer"
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

              {/* Manager Assignment Section - Structured Container */}
              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/90 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sky-800 font-extrabold text-xs">
                    <ShieldCheck size={18} className="text-sky-600" />
                    <span>Người Giữ & Quản Lý Chi Nhánh</span>
                  </div>
                  {createForm.parentOrganizationId ? (
                    <span className="text-[10px] font-extrabold bg-red-100 text-red-700 px-2.5 py-0.5 rounded-full border border-red-200">
                      Bắt buộc cho chi nhánh con
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
                      Tùy chọn cho tổ chức gốc
                    </span>
                  )}
                </div>

                <p className="text-[11.5px] text-slate-500 leading-relaxed">
                  Chọn người giữ quyền từ danh sách Master Data. Hệ thống sẽ gửi yêu cầu xin <strong>Chấp nhận Quản lý (Accept)</strong> trước khi chi nhánh chính thức hoạt động.
                </p>

                {/* Autocomplete Input */}
                <div className="relative">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tìm kiếm & Chọn Người Quản Lý {createForm.parentOrganizationId && <span className="text-red-500">*</span>}
                  </label>
                  
                  <div className="relative">
                    <input 
                      type="text" 
                      required={!!createForm.parentOrganizationId}
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-white focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all" 
                      placeholder="Gõ tên hoặc bấm mũi tên để xem toàn bộ danh sách..."
                      value={createForm.managerName}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCreateForm({ ...createForm, managerName: val });
                        setManagerQuery(val);
                        setShowManagerDropdown(true);
                      }}
                      onFocus={() => {
                        setShowManagerDropdown(true);
                        if (allCandidatesList.length === 0) loadAllCandidates();
                      }}
                    />

                    <button
                      type="button"
                      onClick={() => {
                        setShowManagerDropdown(!showManagerDropdown);
                        if (!showManagerDropdown && allCandidatesList.length === 0) loadAllCandidates();
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-sky-600 p-1 rounded-md cursor-pointer transition-colors"
                      title="Mở/đóng danh sách nhân sự"
                    >
                      {isSearchingManager ? (
                        <div className="w-4 h-4 border-2 border-sky-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <ChevronDown size={18} />
                      )}
                    </button>
                  </div>

                  {/* Floating Dropdown Suggestion List */}
                  {showManagerDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-2xl border border-slate-200 shadow-xl max-h-56 overflow-y-auto z-[9999]">
                      <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                        <span>Gợi ý nhân sự trong tổ chức ({managerSuggestions.length})</span>
                        <button 
                          type="button" 
                          onClick={() => setShowManagerDropdown(false)}
                          className="text-sky-600 hover:text-sky-800 text-xs font-bold cursor-pointer"
                        >
                          Đóng ✕
                        </button>
                      </div>

                      {managerSuggestions.length > 0 ? (
                        managerSuggestions.map((candidate) => (
                          <div
                            key={candidate.id}
                            onClick={() => handleSelectManagerCandidate(candidate)}
                            className="p-3 border-b border-slate-50 hover:bg-sky-50/70 cursor-pointer flex items-center justify-between transition-colors group"
                          >
                            <div className="min-w-0 pr-2">
                              <div className="font-extrabold text-xs text-slate-900 group-hover:text-sky-700 transition-colors truncate">
                                {candidate.name}
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                                {candidate.orgName && (
                                  <span className="font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                                    {candidate.orgName} ({candidate.orgCode})
                                  </span>
                                )}
                                <span>Chức vụ: {candidate.position}</span>
                                <span>•</span>
                                <span>Phòng: {candidate.department}</span>
                                <span>•</span>
                                <strong className="text-sky-700">{candidate.email}</strong>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${
                                candidate.type === 'EMPLOYEE'
                                  ? 'bg-sky-50 text-sky-700 border-sky-200'
                                  : candidate.type === 'CUSTOMER'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-purple-50 text-purple-700 border-purple-200'
                              }`}>
                                {candidate.type === 'EMPLOYEE' ? 'NHÂN VIÊN' : candidate.type === 'CUSTOMER' ? 'KHÁCH HÀNG' : 'ĐỐI TÁC'}
                              </span>

                              <button
                                type="button"
                                className="px-2.5 py-1 rounded-lg bg-sky-600 group-hover:bg-sky-700 text-white text-[11px] font-bold shadow-2xs transition-all cursor-pointer"
                              >
                                Chọn
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center space-y-2">
                          <p className="text-xs text-slate-500 font-medium">
                            {createForm.managerName ? (
                              <>Không có kết quả khớp với <strong>"{createForm.managerName}"</strong></>
                            ) : (
                              'Chưa có dữ liệu Master Data.'
                            )}
                          </p>
                          {createForm.managerName && (
                            <button
                              type="button"
                              onClick={() => setShowManagerDropdown(false)}
                              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                            >
                              Sử dụng tên "{createForm.managerName}" & Tự nhập Email
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Email Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Nhận Quyền Quản Lý {createForm.parentOrganizationId && <span className="text-red-500">*</span>}
                  </label>
                  <input 
                    type="email" 
                    required={!!createForm.parentOrganizationId}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-white focus:outline-none focus:border-sky-500 transition-all" 
                    placeholder="manager@chinhanh.com"
                    value={createForm.managerEmail}
                    onChange={(e) => setCreateForm({ ...createForm, managerEmail: e.target.value })}
                  />
                </div>

                {/* Acceptance Preview Card */}
                {createForm.managerName && createForm.managerEmail && (
                  <div className="p-3 bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-200 rounded-2xl flex items-center justify-between gap-3 shadow-2xs animate-fade-in">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-xl bg-sky-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                        ✓
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-extrabold text-sky-900 truncate">
                          Đã chọn Người Quản Lý: {createForm.managerName}
                        </div>
                        <div className="text-[11px] text-slate-600 truncate">
                          Yêu cầu xác nhận sẽ được gửi tới: <strong>{createForm.managerEmail}</strong>
                        </div>
                      </div>
                    </div>

                    <span className="text-[10px] font-extrabold bg-sky-600 text-white px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0 shadow-2xs">
                      YÊU CẦU ACCEPT
                    </span>
                  </div>
                )}
              </div>

              {/* Form Action Footer */}
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
                  className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md shadow-emerald-200 hover:-translate-y-0.5 active:scale-[0.98] transition-all cursor-pointer"
                >
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
        <div className="modal-overlay animate-fade-in" style={{ zIndex: 10000 }}>
          <div 
            className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto p-6 sm:p-8 space-y-6"
            style={{ width: '95vw', maxWidth: '780px' }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-xs">
                  <Edit size={22} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">Chỉnh Sửa Tổ Chức</h2>
                  <p className="text-xs font-semibold text-slate-500">Cập nhật thông tin chi tiết và trạng thái hoạt động</p>
                </div>
              </div>
              <button 
                onClick={() => setShowEditModal(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                title="Đóng"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
                <XCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleUpdateOrg} className="space-y-4">
              {/* 2-Column Grid: Name & Code */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tên Tổ Chức / Chi Nhánh <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mã Viết Tắt (Code) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-amber-800 uppercase focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                    value={editForm.code}
                    onChange={(e) => setEditForm({ ...editForm, code: e.target.value.toUpperCase() })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tổ Chức Cấp Trên (Parent Organization)
                </label>
                <select
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:border-amber-500 cursor-pointer"
                  value={editForm.parentOrganizationId}
                  onChange={(e) => setEditForm({ ...editForm, parentOrganizationId: e.target.value })}
                >
                  <option value="">-- Không có (Tổ chức gốc Root) --</option>
                  {allOrgsList
                    .filter(o => String(o._id) !== String(editForm._id))
                    .map(org => (
                      <option key={String(org._id)} value={String(org._id)}>
                        {org.name} ({org.code})
                      </option>
                    ))}
                </select>
              </div>

              {/* Manager Assignment Fields */}
              <div className="p-5 bg-slate-50/90 rounded-2xl border border-slate-200/90 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 text-slate-900 font-black text-sm">
                    <ShieldCheck size={18} className="text-amber-600" />
                    <span>Phân Quyền Người Quản Lý Chi Nhánh</span>
                  </div>
                  <span className="text-[11px] font-extrabold text-amber-700 bg-amber-100/80 px-2.5 py-1 rounded-full">
                    Giao quyền quản trị chi nhánh
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Search Manager Field */}
                  <div className="relative">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Họ & Tên Người Quản Lý Mới
                    </label>
                    <div className="relative flex items-center">
                      <Search size={17} className="absolute left-3.5 text-slate-400 pointer-events-none" />
                      <input
                        type="text"
                        className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                        placeholder="Nhập tên, email để tìm người quản lý..."
                        value={editForm.managerName}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditForm(prev => ({ ...prev, managerName: val }));
                          setManagerQuery(val);
                          setShowManagerDropdown(true);
                        }}
                        onFocus={() => {
                          setShowManagerDropdown(true);
                          if (allCandidatesList.length === 0) loadAllCandidates('');
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setShowManagerDropdown(!showManagerDropdown);
                          if (allCandidatesList.length === 0) loadAllCandidates('');
                        }}
                        className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors cursor-pointer"
                      >
                        {isSearchingManager ? (
                          <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <ChevronDown size={18} />
                        )}
                      </button>
                    </div>

                    {/* Floating Dropdown Suggestion List */}
                    {showManagerDropdown && showEditModal && (
                      <div className="absolute top-full left-0 mt-1 bg-white rounded-2xl border border-slate-200 shadow-2xl max-h-64 overflow-y-auto z-[9999] w-[140%] sm:w-[170%] min-w-[320px] max-w-[560px]">
                        <div className="px-3.5 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] font-black text-slate-500 uppercase tracking-wider">
                          <span>Gợi ý nhân sự trong tổ chức ({managerSuggestions.length})</span>
                          <button 
                            type="button" 
                            onClick={() => setShowManagerDropdown(false)}
                            className="text-amber-600 hover:text-amber-800 text-xs font-bold cursor-pointer"
                          >
                            Đóng ✕
                          </button>
                        </div>

                        {managerSuggestions.length > 0 ? (
                          managerSuggestions.map((candidate) => (
                            <div
                              key={candidate.id}
                              onClick={() => handleSelectManagerCandidate(candidate)}
                              className="p-3.5 border-b border-slate-100 hover:bg-amber-50/80 cursor-pointer flex items-center justify-between gap-3 transition-colors group"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="font-extrabold text-xs text-slate-900 group-hover:text-amber-700 transition-colors flex items-center gap-2">
                                  <span>{candidate.name}</span>
                                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${
                                    candidate.type === 'EMPLOYEE'
                                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                                      : candidate.type === 'CUSTOMER'
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : 'bg-purple-50 text-purple-700 border-purple-200'
                                  }`}>
                                    {candidate.type === 'EMPLOYEE' ? 'NHÂN VIÊN' : candidate.type === 'CUSTOMER' ? 'KHÁCH HÀNG' : 'ĐỐI TÁC'}
                                  </span>
                                </div>
                                <div className="text-[11.5px] text-slate-600 mt-1 flex flex-wrap items-center gap-x-2">
                                  {candidate.orgName && (
                                    <span className="font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[10.5px]">
                                      {candidate.orgName} ({candidate.orgCode})
                                    </span>
                                  )}
                                  <span>Chức vụ: {candidate.position}</span>
                                  <span>•</span>
                                  <span>Phòng: {candidate.department}</span>
                                  <span>•</span>
                                  <strong className="text-amber-700">{candidate.email}</strong>
                                </div>
                              </div>

                              <button
                                type="button"
                                className="px-3 py-1.5 rounded-xl bg-amber-500 group-hover:bg-amber-600 text-white text-xs font-extrabold shadow-sm transition-all cursor-pointer shrink-0"
                              >
                                Chọn
                              </button>
                            </div>
                          ))
                        ) : (
                          <div className="p-4 text-center space-y-2">
                            <p className="text-xs text-slate-500 font-medium">
                              {editForm.managerName ? (
                                <>Không tìm thấy nhân sự nào khớp với <strong>"{editForm.managerName}"</strong></>
                              ) : (
                                'Chưa có dữ liệu nhân sự.'
                              )}
                            </p>
                            {editForm.managerName && (
                              <button
                                type="button"
                                onClick={() => setShowManagerDropdown(false)}
                                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                              >
                                Sử dụng tên "{editForm.managerName}" & Tự nhập Email
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Email Input */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Email Nhận Quyền Quản Lý
                    </label>
                    <input
                      type="email"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                      placeholder="manager@chinhanh.com"
                      value={editForm.managerEmail}
                      onChange={(e) => setEditForm({ ...editForm, managerEmail: e.target.value })}
                    />
                  </div>
                </div>

                {editForm.status === 'REJECTED_BY_MANAGER' && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-start gap-2.5">
                    <XCircle size={18} className="shrink-0 mt-0.5 text-rose-600" />
                    <div>
                      <div className="font-extrabold text-rose-950">Chi nhánh đang bị từ chối tiếp nhận:</div>
                      <span>Bạn có thể giữ nguyên email để <strong>gửi lại lời mời cho người đã từ chối</strong>, hoặc thay đổi email để <strong>chọn quản lý mới</strong>. Bấm <strong>"Lưu Thay Đổi"</strong> để kích hoạt lại yêu cầu xác nhận.</span>
                    </div>
                  </div>
                )}

                {editForm.managerName && editForm.managerEmail && (
                  <div className="p-3.5 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-3 shadow-2xs animate-fade-in">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
                        ✓
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-black text-amber-900 truncate">
                          Đã chọn Người Quản Lý Mới: {editForm.managerName}
                        </div>
                        <div className="text-[11.5px] font-semibold text-slate-700 truncate mt-0.5">
                          Lời mời xác nhận quản lý chi nhánh sẽ gửi đến email: <strong className="text-amber-800">{editForm.managerEmail}</strong>
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-black bg-amber-500 text-white px-3 py-1 rounded-full uppercase tracking-wider shrink-0 shadow-xs">
                      Sẽ Gửi Lời Mời
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Trạng Thái Hoạt Động
                </label>
                <select
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:border-amber-500 cursor-pointer"
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                >
                  <option value="ACTIVE">HOẠT ĐỘNG (ACTIVE)</option>
                  <option value="PENDING_APPROVAL">CHỜ QUẢN LÝ XÁC NHẬN (PENDING)</option>
                  <option value="REJECTED_BY_MANAGER">QUẢN LÝ TỪ CHỐI (REJECTED)</option>
                  <option value="INACTIVE">TẠM KHÓA (INACTIVE)</option>
                </select>
              </div>

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
                  className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black shadow-md shadow-amber-200 hover:-translate-y-0.5 active:scale-[0.98] transition-all cursor-pointer"
                >
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
