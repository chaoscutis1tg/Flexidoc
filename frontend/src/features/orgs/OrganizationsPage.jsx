import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import api from '../../services/api';
import { useAuth } from '../../app/AuthContext';
import { useConfirm } from '../../app/ConfirmContext';
import { fetchDynamicPlans, DEFAULT_PLANS_DATA } from '../../utils/planData';
import { RenewalModal } from '../subscription/RenewalModal';
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
  const [debouncedSearch, setDebouncedSearch] = useState('');
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

  // Debounce manager search input (500ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedManagerQuery(managerQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [managerQuery]);

  // Debounce main search input (500ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Load all candidates strictly from real System Users in organization (excluding Master Data)
  const loadAllCandidates = async (searchKeyword = '', overrideOrgId = null) => {
    setIsSearchingManager(true);
    try {
      const usersRes = await api.get('/users');

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

      const matchesOrg = (itemOrgField) => {
        if (allowedOrgIds.size === 0) return true; // Super Admin with no org context
        if (!itemOrgField) return false;
        const idStr = (itemOrgField._id || itemOrgField).toString();
        return allowedOrgIds.has(idStr);
      };

      // Only real System Users in Organization
      const rawUserList = Array.isArray(usersRes.data) ? usersRes.data : [];
      const candidates = rawUserList
        .filter(u => matchesOrg(u.organizationId))
        .map(u => {
          const orgObj = u.organizationId || {};
          const orgName = typeof orgObj === 'object' ? (orgObj.name || '') : '';
          const orgCode = typeof orgObj === 'object' ? (orgObj.code || '') : '';
          const roleLabel = u.role === 'ORGANIZATION_ADMIN' ? 'Quản trị viên' : (u.role === 'STAFF' ? 'Nhân viên' : (u.role || 'Người dùng'));
          return {
            id: `usr_${u._id}`,
            name: u.fullName || u.username || u.email,
            email: u.email || '',
            position: roleLabel,
            department: u.department || 'Tổ chức',
            phone: u.phone || '',
            type: 'USER',
            code: u.username || '',
            orgName,
            orgCode
          };
        });

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

  const [rootOrgs, setRootOrgs] = useState([]);
  const [childrenMap, setChildrenMap] = useState({});
  const [loadingChildren, setLoadingChildren] = useState({});
  const [page, setPage] = useState(1);
  const [totalRoots, setTotalRoots] = useState(0);
  const [hasMoreRoots, setHasMoreRoots] = useState(false);
  const [loadingRoots, setLoadingRoots] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadMoreRef = React.useRef(null);

  const flattenTree = (nodes, list = [], depth = 0) => {
    nodes.forEach(n => {
      list.push({ ...n, depth });
      if (n.children && n.children.length > 0) {
        flattenTree(n.children, list, depth + 1);
      }
    });
    return list;
  };

  const fetchRootOrgs = async (pageNum = 1, append = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoadingRoots(true);
    }
    try {
      const res = await api.get(`/organizations/paginated-roots?page=${pageNum}&limit=20&search=${encodeURIComponent(debouncedSearch)}`);
      const { roots = [], totalRoots = 0, hasMore = false } = res.data || {};

      if (append) {
        setRootOrgs(prev => {
          const existingIds = new Set(prev.map(r => r._id));
          const newRoots = roots.filter(r => !existingIds.has(r._id));
          return [...prev, ...newRoots];
        });
      } else {
        setRootOrgs(roots);
        setChildrenMap({});
      }
      setPage(pageNum);
      setTotalRoots(totalRoots);
      setHasMoreRoots(hasMore);

      // Also update allOrgsList for table view fallback
      const fullTreeRes = await api.get('/organizations/tree').catch(() => ({ data: [] }));
      const flat = flattenTree(fullTreeRes.data || []);
      setAllOrgsList(flat);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRoots(false);
      setLoadingMore(false);
      setLoading(false);
    }
  };

  const fetchTree = async () => {
    return fetchRootOrgs(1, false);
  };

  useEffect(() => {
    fetchRootOrgs(1, false);
  }, [debouncedSearch]);

  const fetchMoreRoots = () => {
    if (hasMoreRoots && !loadingRoots && !loadingMore) {
      fetchRootOrgs(page + 1, true);
    }
  };

  // IntersectionObserver for Infinite Scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreRoots && !loadingRoots && !loadingMore) {
          fetchMoreRoots();
        }
      },
      { threshold: 0.1 }
    );
    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }
    return () => observer.disconnect();
  }, [hasMoreRoots, loadingRoots, loadingMore, page]);

  const toggleExpand = async (node) => {
    const nodeObj = typeof node === 'object' ? node : { _id: node };
    const orgId = nodeObj._id;
    const isCurrentlyExpanded = !!expandedNodes[orgId];

    if (isCurrentlyExpanded) {
      setExpandedNodes(prev => ({ ...prev, [orgId]: false }));
      return;
    }

    setExpandedNodes(prev => ({ ...prev, [orgId]: true }));

    // Fetch children lazily on demand if not cached
    const hasCachedChildren = Array.isArray(childrenMap[orgId]);
    if (!hasCachedChildren) {
      setLoadingChildren(prev => ({ ...prev, [orgId]: true }));
      try {
        const res = await api.get(`/organizations/${orgId}/children`);
        setChildrenMap(prev => ({ ...prev, [orgId]: res.data || [] }));
      } catch (err) {
        console.error('Lỗi khi tải chi nhánh con:', err);
      } finally {
        setLoadingChildren(prev => ({ ...prev, [orgId]: false }));
      }
    }
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
      confirm({
        title: 'Thông báo',
        message: `Đã xác nhận chấp nhận quyền quản lý & kích hoạt chi nhánh '${node.name}' thành công! Role của bạn đã được nâng cấp lên Quản Lý Tổ Chức.`,
        hideCancel: true,
        confirmText: 'Đóng',
        variant: 'success'
      });
    } catch (err) {
      confirm({
        title: 'Lỗi',
        message: 'Kích hoạt chi nhánh thất bại: ' + (err.message || 'Lỗi hệ thống'),
        hideCancel: true,
        confirmText: 'Đóng',
        variant: 'danger'
      });
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
      confirm({
        title: 'Thông báo',
        message: `Đã phản hồi TỪ CHỐI nhận quyền quản lý chi nhánh '${node.name}'. Thông báo đã được gửi tới người tạo chi nhánh để chỉ định quản lý mới.`,
        hideCancel: true,
        confirmText: 'Đóng',
        variant: 'info'
      });
    } catch (err) {
      confirm({
        title: 'Lỗi',
        message: 'Từ chối thất bại: ' + (err.message || 'Lỗi hệ thống'),
        hideCancel: true,
        confirmText: 'Đóng',
        variant: 'danger'
      });
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
      confirm({
        title: 'Thông báo',
        message: `Đã gia hạn/nâng cấp gói ${childPlan} thành công cho chi nhánh '${selectedChildForRenewal.name}'!`,
        hideCancel: true,
        confirmText: 'Đóng',
        variant: 'success'
      });
    } catch (err) {
      confirm({
        title: 'Lỗi',
        message: 'Gia hạn gói cước cho chi nhánh con thất bại: ' + (err.message || 'Lỗi hệ thống'),
        hideCancel: true,
        confirmText: 'Đóng',
        variant: 'danger'
      });
    }
  };

  // Super Admin Ban / Unban Organization
  const handleToggleBanOrg = async (node) => {
    const isBanned = node.status === 'SUSPENDED';
    let reason = '';
    if (!isBanned) {
      reason = window.prompt(`Khóa (Ban) hoạt động của tổ chức "${node.name}". Vui lòng nhập lý do khóa:`, 'Vi phạm điều khoản dịch vụ');
      if (reason === null) return;
    }

    try {
      await api.patch(`/organizations/${node._id}/ban-status`, {
        banStatus: isBanned ? 'ACTIVE' : 'BANNED',
        reason
      });
      fetchTree();
      confirm({
        title: 'Thông báo',
        message: `Đã ${isBanned ? 'mở khóa (ACTIVE)' : 'khóa (BAN/SUSPENDED)'} tổ chức "${node.name}" thành công!`,
        hideCancel: true,
        confirmText: 'Đóng',
        variant: 'success'
      });
    } catch (err) {
      confirm({
        title: 'Lỗi',
        message: 'Thay đổi trạng thái thất bại: ' + (err.message || 'Lỗi hệ thống'),
        hideCancel: true,
        confirmText: 'Đóng',
        variant: 'danger'
      });
    }
  };

  // Super Admin Grant Custom Dynamic Plan
  const [showGrantPlanModal, setShowGrantPlanModal] = useState(false);
  const [selectedOrgForGrant, setSelectedOrgForGrant] = useState(null);
  const [grantPlanName, setGrantPlanName] = useState('PRO');
  const [grantDurationMonths, setGrantDurationMonths] = useState(1);

  const handleOpenGrantPlanModal = (node) => {
    setSelectedOrgForGrant(node);
    setGrantPlanName(node.plan || 'PRO');
    setGrantDurationMonths(1);
    setShowGrantPlanModal(true);
  };

  const handleConfirmGrantPlan = async () => {
    if (!selectedOrgForGrant) return;
    try {
      await api.patch(`/organizations/${selectedOrgForGrant._id}/grant-plan`, {
        planName: grantPlanName,
        durationMonths: grantDurationMonths
      });
      setShowGrantPlanModal(false);
      fetchTree();
      confirm({
        title: 'Thông báo',
        message: `Super Admin đã cấp thành công gói ${grantPlanName} (${grantDurationMonths} tháng) cho tổ chức "${selectedOrgForGrant.name}"!`,
        hideCancel: true,
        confirmText: 'Đóng',
        variant: 'success'
      });
    } catch (err) {
      confirm({
        title: 'Lỗi',
        message: 'Cấp gói cước thất bại: ' + (err.message || 'Lỗi hệ thống'),
        hideCancel: true,
        confirmText: 'Đóng',
        variant: 'danger'
      });
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
      confirm({
        title: 'Thông báo',
        message: `Đã gửi lại lời mời nhận quyền quản lý chi nhánh '${node.name}' tới email ${node.managerEmail} thành công!`,
        hideCancel: true,
        confirmText: 'Đóng',
        variant: 'success'
      });
    } catch (err) {
      confirm({
        title: 'Lỗi',
        message: 'Gửi lại lời mời thất bại: ' + (err.message || 'Lỗi hệ thống'),
        hideCancel: true,
        confirmText: 'Đóng',
        variant: 'danger'
      });
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
      confirm({
        title: 'Lỗi',
        message: 'Không thể xóa: ' + (err.message || 'Lỗi hệ thống'),
        hideCancel: true,
        confirmText: 'Đóng',
        variant: 'danger'
      });
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
    const nodeChildren = childrenMap[node._id] || node.children || [];
    const hasChildren = (nodeChildren && nodeChildren.length > 0) || node.hasChildren || node.childCount > 0;
    const isExpanded = !!expandedNodes[node._id];
    const isChildrenLoading = !!loadingChildren[node._id];

    // Search filter logic
    const matchesSearch = !search ||
      node.name.toLowerCase().includes(search.toLowerCase()) ||
      node.code.toLowerCase().includes(search.toLowerCase());

    const hasMatchingChild = nodeChildren && nodeChildren.some(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase())
    );

    if (search && !matchesSearch && !hasMatchingChild) {
      return null;
    }

    const isRoot = node.level === 0 || !node.parentOrganizationId;
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
                  onClick={() => toggleExpand(node)}
                  className="w-7 h-7 rounded-lg border border-slate-300 bg-white text-slate-700 flex items-center justify-center hover:bg-slate-50 cursor-pointer shadow-2xs transition-all shrink-0"
                  title={isExpanded ? 'Thu gọn chi nhánh con' : 'Mở rộng (Tải chi nhánh con)'}
                >
                  {isChildrenLoading ? (
                    <Loader2 size={15} className="animate-spin text-sky-600" />
                  ) : isExpanded ? (
                    <ChevronDown size={17} />
                  ) : (
                    <ChevronRight size={17} />
                  )}
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
            <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto mt-2 sm:mt-0">
              {user?.role === 'SUPER_ADMIN' && (
                <>
                  <button
                    onClick={() => handleToggleBanOrg(node)}
                    className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 cursor-pointer transition-all ${
                      node.status === 'SUSPENDED'
                        ? 'border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                        : 'border-red-200 bg-red-50 hover:bg-red-100 text-red-700'
                    }`}
                    title={node.status === 'SUSPENDED' ? 'Mở Khóa Hoạt Động Tổ Chức' : 'Khóa (Ban) Hoạt Động Tổ Chức'}
                  >
                    {node.status === 'SUSPENDED' ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                    {node.status === 'SUSPENDED' ? 'Mở Khóa' : 'Ban (Khóa)'}
                  </button>

                  <button
                    onClick={() => handleOpenGrantPlanModal(node)}
                    className="px-2.5 py-1.5 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                    title="Super Admin Cấp Gói Động"
                  >
                    <Sparkles size={14} /> Cấp Gói
                  </button>
                </>
              )}

              <button
                onClick={() => handleOpenChildRenewal(node)}
                className="px-2.5 py-1.5 rounded-xl border border-sky-200 bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                title="Gói Dịch Vụ Chi Nhánh"
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
            <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex flex-wrap items-center gap-2 text-slate-600 font-medium min-w-0 w-full sm:w-auto">
                {node.managerEmail && (
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100/80 border border-slate-200 text-slate-700 text-[11.5px] font-semibold truncate">
                    Quản Lý Chi Nhánh: <strong className="text-slate-900">{node.managerName || 'Chưa đặt tên'}</strong> ({node.managerEmail})
                  </span>
                )}
                {hasChildren ? (
                  <span className="text-sky-700 font-bold">• {node.childCount || nodeChildren.length || 0} chi nhánh trực thuộc</span>
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
          <div className="border-l-2 border-dashed border-slate-300 ml-6 pl-4 mt-1 space-y-2">
            {isChildrenLoading ? (
              <div className="py-2.5 px-4 text-xs font-bold text-sky-700 bg-sky-50 rounded-xl border border-sky-200 flex items-center gap-2 w-fit animate-pulse my-2">
                <Loader2 size={15} className="animate-spin text-sky-600" />
                <span>Đang tải danh sách chi nhánh con từ máy chủ...</span>
              </div>
            ) : nodeChildren.length > 0 ? (
              nodeChildren.map(child => (
                <TreeNodeCard key={child._id} node={child} />
              ))
            ) : (
              <div className="py-2 text-[11.5px] text-slate-400 italic">
                Chưa có chi nhánh con trực thuộc.
              </div>
            )}
          </div>
        )}

      </div>
    );
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>

      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2.5 break-words">
            <FolderTree size={28} className="text-sky-600 shrink-0" /> Quản Lý Sơ Đồ Tổ Chức Phân Cấp
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
          {loadingRoots ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b', fontSize: '13.5px' }}>
              <Loader2 size={24} className="animate-spin mx-auto text-sky-600 mb-2" />
              Đang tải danh sách 20 tổ chức cha đầu tiên...
            </div>
          ) : rootOrgs.length === 0 ? (
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
            <div className="space-y-3">
              {rootOrgs.map(node => <TreeNodeCard key={node._id} node={node} />)}

              {/* Load More & Infinite Scroll Trigger */}
              {hasMoreRoots && (
                <div ref={loadMoreRef} className="pt-6 pb-2 flex flex-col items-center justify-center gap-2">
                  <button
                    onClick={fetchMoreRoots}
                    disabled={loadingMore}
                    className="px-6 py-3 rounded-2xl bg-white border border-sky-300 text-sky-700 font-black text-xs sm:text-sm hover:bg-sky-50 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center gap-2"
                  >
                    {loadingMore ? (
                      <><Loader2 size={16} className="animate-spin text-sky-600" /> Đang tải 20 tổ chức cha tiếp theo...</>
                    ) : (
                      <><ChevronsDown size={18} className="text-sky-600 animate-bounce" /> Tải Thêm 20 Tổ Chức Cha (Còn {totalRoots - rootOrgs.length} tổ chức)</>
                    )}
                  </button>
                  <span className="text-[11.5px] text-slate-400 font-bold">
                    Đã hiển thị {rootOrgs.length} / {totalRoots} tổ chức cha (Trang {page})
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Table Grid View */
        <div className="glass-panel" style={{ overflow: 'hidden', background: '#ffffff' }}>
        <div className="overflow-x-auto">
          <table className="custom-table w-full min-w-[800px]">
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
                <X size={18} />
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
                  Chọn người giữ quyền từ danh sách Người Dùng Thật trong tổ chức. Hệ thống sẽ gửi yêu cầu xin <strong>Chấp nhận Quản lý (Accept)</strong> trước khi chi nhánh chính thức hoạt động.
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
                        <span>Gợi ý người dùng trong tổ chức ({managerSuggestions.length})</span>
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
                                <span>Vai trò: {candidate.position}</span>
                                <span>•</span>
                                <span>Phòng: {candidate.department}</span>
                                <span>•</span>
                                <strong className="text-sky-700">{candidate.email}</strong>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md border bg-sky-50 text-sky-700 border-sky-200">
                                {candidate.position || 'NGƯỜI DÙNG'}
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
                              'Chưa có dữ liệu người dùng trong hệ thống.'
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
                        <Check size={16} strokeWidth={3} />
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
                <X size={18} />
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
                          <span>Gợi ý người dùng trong tổ chức ({managerSuggestions.length})</span>
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
                                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md border bg-amber-50 text-amber-700 border-amber-200">
                                    {candidate.position || 'NGƯỜI DÙNG'}
                                  </span>
                                </div>
                                <div className="text-[11.5px] text-slate-600 mt-1 flex flex-wrap items-center gap-x-2">
                                  {candidate.orgName && (
                                    <span className="font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[10.5px]">
                                      {candidate.orgName} ({candidate.orgCode})
                                    </span>
                                  )}
                                  <span>Vai trò: {candidate.position}</span>
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
                                <>Không tìm thấy người dùng nào khớp với <strong>"{editForm.managerName}"</strong></>
                              ) : (
                                'Chưa có dữ liệu người dùng trong hệ thống.'
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
                        <Check size={18} strokeWidth={3} />
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

      {/* Modal 3: Child Organization Subscription Purchase / Renewal Modal (Enforces Payment Flow) */}
      <RenewalModal
        isOpen={showChildRenewalModal}
        onClose={() => {
          setShowChildRenewalModal(false);
          fetchTree();
        }}
        targetOrg={selectedChildForRenewal}
      />

      {/* SUPER ADMIN DYNAMIC GRANT PLAN MODAL */}
      {showGrantPlanModal && selectedOrgForGrant && createPortal(
        <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-md p-4 flex items-center justify-center animate-backdrop select-none">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-[94vw] max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl border border-slate-200 animate-modal-pop text-slate-900">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Sparkles size={20} className="text-purple-600" /> Super Admin Cấp Gói Động
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Cấp gói cước và thời hạn sử dụng cho tổ chức <strong>"{selectedOrgForGrant.name}"</strong>
                </p>
              </div>
              <button
                onClick={() => setShowGrantPlanModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4 text-xs font-medium">
              
              {/* Current Organization Plan Info Box */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-bold">Gói dịch vụ hiện tại:</span>
                  <span className="font-black text-sky-800 bg-sky-50 px-2.5 py-0.5 rounded-md border border-sky-200">
                    {selectedOrgForGrant.plan || 'FREE'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-bold">Trạng thái hạn sử dụng:</span>
                  {selectedOrgForGrant.plan === 'FREE' || !selectedOrgForGrant.planExpiresAt ? (
                    <span className="text-slate-600 font-extrabold bg-slate-100 px-2 py-0.5 rounded-md">
                      ⚪ Chưa đăng ký (Gói FREE vĩnh viễn)
                    </span>
                  ) : new Date(selectedOrgForGrant.planExpiresAt) < new Date() ? (
                    <span className="text-rose-700 font-extrabold bg-rose-50 px-2.5 py-0.5 rounded-md border border-rose-200">
                      🔴 Đã hết hạn (Ngày hết: {new Date(selectedOrgForGrant.planExpiresAt).toLocaleDateString('vi-VN')})
                    </span>
                  ) : (
                    <span className="text-emerald-700 font-extrabold bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                      🟢 Còn hạn đến {new Date(selectedOrgForGrant.planExpiresAt).toLocaleDateString('vi-VN')}
                    </span>
                  )}
                </div>

                {grantPlanName !== 'FREE' && (
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11.5px]">
                    <span className="text-purple-900 font-bold">Mốc tính cấp mới:</span>
                    <span className="text-purple-950 font-black">
                      {(!selectedOrgForGrant.planExpiresAt || new Date(selectedOrgForGrant.planExpiresAt) < new Date())
                        ? `Mốc tính từ HÔM NAY (${new Date().toLocaleDateString('vi-VN')}) +${grantDurationMonths} tháng`
                        : `Cộng dồn từ mốc cũ (${new Date(selectedOrgForGrant.planExpiresAt).toLocaleDateString('vi-VN')}) +${grantDurationMonths} tháng`
                      }
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Chọn Gói Cước Cấp Trực Tiếp:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {['FREE', 'BASIC', 'PRO', 'VIP'].map((pName) => (
                    <button
                      key={pName}
                      type="button"
                      onClick={() => setGrantPlanName(pName)}
                      className={`py-2 px-2.5 rounded-xl font-extrabold border transition-all cursor-pointer text-center ${
                        grantPlanName === pName
                          ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {pName}
                    </button>
                  ))}
                </div>
              </div>

              {grantPlanName !== 'FREE' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Số Tháng Cấp Hạn Sử Dụng (+Số Tháng):
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 3, 6, 12].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setGrantDurationMonths(m)}
                        className={`py-2 px-2.5 rounded-xl font-extrabold border transition-all cursor-pointer text-center ${
                          grantDurationMonths === m
                            ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        +{m} Tháng
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-3.5 bg-purple-50/70 border border-purple-200 rounded-xl text-purple-900 text-[11.5px] leading-relaxed">
                💡 <strong>Quy tắc gia hạn:</strong> Nếu tổ chức đã hết hạn, thời hạn mới sẽ được <strong>tự động tính bắt đầu từ HÔM NAY</strong>. Nếu tổ chức vẫn còn hạn, thời hạn mới sẽ được <strong>cộng dồn tiếp nối</strong> từ ngày hết hạn cũ.
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-5">
              <button
                type="button"
                onClick={() => setShowGrantPlanModal(false)}
                className="px-4 py-2 rounded-full border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-all cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmGrantPlan}
                className="px-5 py-2 rounded-full bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-md shadow-purple-600/25 cursor-pointer transition-all flex items-center gap-1.5"
              >
                <Sparkles size={15} /> Xác Nhận Cấp Gói {grantPlanName}
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

