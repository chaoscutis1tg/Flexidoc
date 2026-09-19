import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import api from '../../services/api';
import { useConfirm } from '../../app/ConfirmContext';
import {
  Database,
  Plus,
  Search,
  UserCheck,
  Briefcase,
  Copy,
  Check,
  Filter,
  Users,
  Building,
  Building2,
  Trash2,
  X,
  CreditCard,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Tag,
  LayoutGrid,
  List,
  Eye,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  User,
  Layers
} from 'lucide-react';

export const MasterDataPage = () => {
  const { confirm } = useConfirm();
  const [items, setItems] = useState([]);
  const [allCounts, setAllCounts] = useState({ ALL: 0, EMPLOYEE: 0, CUSTOMER: 0, PARTNER: 0 });
  const [type, setType] = useState('EMPLOYEE');
  const [modalType, setModalType] = useState('EMPLOYEE');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [department, setDepartment] = useState('ALL');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [viewingItem, setViewingItem] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);

  const departmentsList = [
    'ALL',
    'Phòng Nhân sự',
    'Phòng Kế toán',
    'Phòng Kinh doanh',
    'Phòng Kỹ thuật',
    'Phòng Hành chính',
    'Ban Giám đốc',
  ];

  const initialFormData = {
    code: '',
    fullName: '',
    dob: '',
    idNumber: '',
    idIssueDate: '',
    idIssuePlace: '',
    phone: '',
    email: '',
    position: '',
    department: 'Phòng Nhân sự',
    address: '',
    companyName: '',
    taxCode: '',
    representative: '',
    repPosition: '',
  };

  const [codeError, setCodeError] = useState('');
  const [formData, setFormData] = useState(initialFormData);

  const validateCode = (codeToCheck) => {
    if (!codeToCheck || !codeToCheck.trim()) {
      setCodeError('Mã định danh không được để trống.');
      return false;
    }
    const isDuplicate = items.some(
      item => item.code && item.code.trim().toLowerCase() === codeToCheck.trim().toLowerCase()
    );
    if (isDuplicate) {
      setCodeError(`Mã định danh "${codeToCheck.trim()}" đã tồn tại! Vui lòng nhập mã khác.`);
      return false;
    }
    setCodeError('');
    return true;
  };

  const generateUniqueCode = (targetType) => {
    const prefix = targetType === 'EMPLOYEE' ? 'NV' : targetType === 'CUSTOMER' ? 'KH' : 'DT';
    let randomNum = Math.floor(100 + Math.random() * 900);
    let candidate = `${prefix}-${randomNum}`;
    let attempts = 0;
    while (items.some(i => i.code?.toLowerCase() === candidate.toLowerCase()) && attempts < 100) {
      randomNum = Math.floor(100 + Math.random() * 900);
      candidate = `${prefix}-${randomNum}`;
      attempts++;
    }
    return candidate;
  };

  const handleModalTypeChange = (newType) => {
    setModalType(newType);
    const newCode = generateUniqueCode(newType);
    setFormData(prev => ({
      ...prev,
      code: newCode
    }));
    setCodeError('');
  };

  const openCreateModal = (forcedType) => {
    const target = forcedType || (type === 'ALL' ? 'EMPLOYEE' : type);
    setModalType(target);
    const newCode = generateUniqueCode(target);
    setFormData({
      ...initialFormData,
      code: newCode
    });
    setCodeError('');
    setShowModal(true);
  };

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch overall counts for metrics header
  const fetchCounts = async () => {
    try {
      const res = await api.get('/master-data');
      const data = res.data || [];
      const counts = { ALL: data.length, EMPLOYEE: 0, CUSTOMER: 0, PARTNER: 0 };
      data.forEach(item => {
        if (counts[item.type] !== undefined) {
          counts[item.type]++;
        }
      });
      setAllCounts(counts);
    } catch (err) {
      console.error('Error fetching master data counts:', err);
    }
  };

  const fetchMasterData = async () => {
    setLoading(true);
    try {
      const deptQuery = (type === 'EMPLOYEE' && department !== 'ALL') ? `&department=${encodeURIComponent(department)}` : '';
      const typeQuery = type !== 'ALL' ? `type=${type}&` : '';
      const res = await api.get(`/master-data?${typeQuery}search=${encodeURIComponent(debouncedSearch)}${deptQuery}`);
      setItems(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCounts();
  }, []);

  useEffect(() => {
    fetchMasterData();
  }, [type, debouncedSearch, department]);

  const handleCopyText = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const handleDelete = async (idOrItem) => {
    const targetItem = typeof idOrItem === 'object' ? idOrItem : items.find(i => i._id === idOrItem);
    const id = targetItem?._id || idOrItem;
    const itemName = targetItem?.data?.fullName || targetItem?.data?.companyName || targetItem?.code || 'hồ sơ này';

    const isConfirmed = await confirm({
      title: 'Xóa Hồ Sơ Master Data',
      message: `Bạn có chắc chắn muốn xóa hồ sơ "${itemName}"?`,
      subMessage: 'Hành động này sẽ xóa hoàn toàn hồ sơ khỏi hệ thống và không thể hoàn tác.',
      confirmText: 'Xóa Hồ Sơ',
      cancelText: 'Hủy Bỏ',
      variant: 'danger'
    });

    if (!isConfirmed) return;

    try {
      await api.delete(`/master-data/${id}`);
      fetchMasterData();
      fetchCounts();
    } catch (err) {
      alert('Lỗi xóa bản ghi: ' + err.message);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const cleanCode = formData.code?.trim();
    if (!validateCode(cleanCode)) {
      return;
    }

    try {
      const targetType = modalType;
      const payloadData = targetType === 'EMPLOYEE' ? {
        fullName: formData.fullName,
        dob: formData.dob,
        idNumber: formData.idNumber,
        idIssueDate: formData.idIssueDate,
        idIssuePlace: formData.idIssuePlace,
        phone: formData.phone,
        email: formData.email,
        position: formData.position,
        department: formData.department,
        address: formData.address,
      } : {
        companyName: formData.companyName || formData.fullName,
        taxCode: formData.taxCode || formData.idNumber,
        representative: formData.representative,
        repPosition: formData.repPosition,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
      };

      const payload = {
        type: targetType,
        code: cleanCode,
        data: payloadData
      };

      await api.post('/master-data', payload);
      setShowModal(false);
      setFormData(initialFormData);
      setCodeError('');
      fetchMasterData();
      fetchCounts();
    } catch (err) {
      const serverMsg = err.response?.data?.message || err.message;
      setCodeError(`Lỗi: ${serverMsg}`);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'MD';
    const words = name.trim().split(' ');
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  };

  const getTypeBadge = (itemType) => {
    switch (itemType) {
      case 'EMPLOYEE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 font-extrabold text-[10.5px] border border-sky-200 shadow-2xs">
            <Users size={11} /> NHÂN VIÊN
          </span>
        );
      case 'CUSTOMER':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-extrabold text-[10.5px] border border-emerald-200 shadow-2xs">
            <UserCheck size={11} /> KHÁCH HÀNG
          </span>
        );
      case 'PARTNER':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 font-extrabold text-[10.5px] border border-purple-200 shadow-2xs">
            <Building2 size={11} /> ĐỐI TÁC
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="animate-fade-in space-y-6">

      {/* 1. Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-500 to-sky-600 text-white flex items-center justify-center shadow-md shadow-sky-200">
              <Database size={20} />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">Quản Lý Dữ Liệu Master Data</h1>
              <p className="text-xs font-semibold text-slate-500">
                Lưu trữ danh sách <strong>Nhân viên</strong>, <strong>Khách hàng</strong> và <strong>Đối tác</strong>. Phân loại bằng nhãn màu trực quan.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            const defaultType = type === 'ALL' ? 'EMPLOYEE' : type;
            setFormData({
              ...initialFormData,
              code: `${defaultType === 'EMPLOYEE' ? 'NV' : defaultType === 'CUSTOMER' ? 'KH' : 'DT'}-${Math.floor(100 + Math.random() * 900)}`
            });
            setShowModal(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800 text-white font-extrabold text-xs shadow-md shadow-sky-200 hover:-translate-y-0.5 active:scale-[0.98] transition-all cursor-pointer shrink-0"
        >
          <Plus size={18} /> + Thêm Hồ Sơ Mới
        </button>
      </div>

      {/* 2. Top Summary Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* All Records Metric Card */}
        <div
          onClick={() => setType('ALL')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${type === 'ALL'
            ? 'bg-gradient-to-br from-slate-100 to-slate-200/60 border-slate-400 shadow-sm ring-2 ring-slate-200'
            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
            }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${type === 'ALL' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700 border border-slate-200'
              }`}>
              <Layers size={20} />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Tất Cả</span>
              <div className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">
                {allCounts.ALL} <span className="text-xs font-semibold text-slate-400">hồ sơ</span>
              </div>
            </div>
          </div>
        </div>

        {/* Employee Metric Card */}
        <div
          onClick={() => setType('EMPLOYEE')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${type === 'EMPLOYEE'
            ? 'bg-gradient-to-br from-sky-50 to-sky-100/40 border-sky-300 shadow-sm ring-2 ring-sky-100'
            : 'bg-white border-slate-200 hover:border-sky-200 hover:bg-slate-50/60'
            }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${type === 'EMPLOYEE' ? 'bg-sky-600 text-white' : 'bg-sky-50 text-sky-600 border border-sky-100'
              }`}>
              <Users size={20} />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Nhân Viên</span>
              <div className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">
                {allCounts.EMPLOYEE} <span className="text-xs font-semibold text-slate-400">hồ sơ</span>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Metric Card */}
        <div
          onClick={() => setType('CUSTOMER')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${type === 'CUSTOMER'
            ? 'bg-gradient-to-br from-emerald-50 to-emerald-100/40 border-emerald-300 shadow-sm ring-2 ring-emerald-100'
            : 'bg-white border-slate-200 hover:border-emerald-200 hover:bg-slate-50/60'
            }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${type === 'CUSTOMER' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
              }`}>
              <UserCheck size={20} />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Khách Hàng</span>
              <div className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">
                {allCounts.CUSTOMER} <span className="text-xs font-semibold text-slate-400">hồ sơ</span>
              </div>
            </div>
          </div>
        </div>

        {/* Partner Metric Card */}
        <div
          onClick={() => setType('PARTNER')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${type === 'PARTNER'
            ? 'bg-gradient-to-br from-purple-50 to-purple-100/40 border-purple-300 shadow-sm ring-2 ring-purple-100'
            : 'bg-white border-slate-200 hover:border-purple-200 hover:bg-slate-50/60'
            }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${type === 'PARTNER' ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-600 border border-purple-100'
              }`}>
              <Building2 size={20} />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Đối Tác</span>
              <div className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">
                {allCounts.PARTNER} <span className="text-xs font-semibold text-slate-400">hồ sơ</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Toolbar Section: Type Tabs, View Mode, Department Filter & Search */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs">
        {/* Navigation Category Tabs */}
        <div className="flex flex-wrap bg-slate-100/80 p-1.5 rounded-2xl shrink-0 gap-1">
          {[
            { id: 'ALL', label: 'Tất Cả Hồ Sơ', count: allCounts.ALL, icon: Layers },
            { id: 'EMPLOYEE', label: 'Nhân Viên', count: allCounts.EMPLOYEE, icon: Users },
            { id: 'CUSTOMER', label: 'Khách Hàng', count: allCounts.CUSTOMER, icon: UserCheck },
            { id: 'PARTNER', label: 'Đối Tác', count: allCounts.PARTNER, icon: Building2 },
          ].map(t => {
            const Icon = t.icon;
            const isSelected = type === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setType(t.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-extrabold text-xs transition-all cursor-pointer ${isSelected
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
              >
                <Icon size={14} />
                <span>{t.label}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-3 flex-1 justify-end">
          {/* View Mode Switcher (Grid vs Table) */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${viewMode === 'grid' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              title="Chế độ Lưới (Smart Cards)"
            >
              <LayoutGrid size={15} />
              <span className="hidden sm:inline">Lưới</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${viewMode === 'table' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              title="Chế độ Bảng"
            >
              <List size={15} />
              <span className="hidden sm:inline">Bảng</span>
            </button>
          </div>

          {/* Department Filter Dropdown (For EMPLOYEE or ALL) */}
          {(type === 'EMPLOYEE' || type === 'ALL') && (
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl">
              <Filter size={14} className="text-slate-400" />
              <span className="text-xs font-bold text-slate-500">Phòng ban:</span>
              <select
                className="text-xs font-bold text-slate-800 bg-transparent outline-none cursor-pointer"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              >
                {departmentsList.map(d => (
                  <option key={d} value={d}>
                    {d === 'ALL' ? 'Tất cả phòng ban' : d}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all"
              placeholder="Tìm theo tên, CCCD, mã... trong tổ chức"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. Main Records Content View */}
      {loading ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center space-y-3 shadow-xs">
          <div className="w-10 h-10 rounded-full border-4 border-sky-600 border-t-transparent animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-500">Đang tải danh sách dữ liệu Master Data...</p>
        </div>
      ) : items.length === 0 ? (
        /* Rich Styled Empty State Card */
        <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-12 text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-3xl bg-slate-50 border border-slate-200 text-slate-400 flex items-center justify-center mx-auto shadow-inner">
            <Database size={32} />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">
              {type === 'EMPLOYEE' ? 'Chưa Có Hồ Sơ Nhân Viên Nào' : type === 'CUSTOMER' ? 'Chưa Có Hồ Sơ Khách Hàng Nào' : type === 'PARTNER' ? 'Chưa Có Hồ Sơ Đối Tác Nào' : 'Chưa Có Hồ Sơ Master Data Nào'}
            </h3>
            <p className="text-xs font-medium text-slate-500 mt-1 max-w-md mx-auto">
              {search || department !== 'ALL'
                ? 'Không tìm thấy kết quả phù hợp với từ khóa hoặc bộ lọc đã chọn. Vui lòng thử tìm từ khóa khác!'
                : `Tổ chức hiện chưa khởi tạo danh sách ${type === 'EMPLOYEE' ? 'Nhân viên' : type === 'CUSTOMER' ? 'Khách hàng' : type === 'PARTNER' ? 'Đối tác' : 'Master Data'}. Bạn có thể thêm ngay hồ sơ đầu tiên bên dưới!`}
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => openCreateModal()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs shadow-md shadow-sky-200 transition-all cursor-pointer"
            >
              <Plus size={16} /> + Thêm {type === 'EMPLOYEE' ? 'Nhân Viên' : type === 'CUSTOMER' ? 'Khách Hàng' : type === 'PARTNER' ? 'Đối Tác' : 'Hồ Sơ'} Đầu Tiên
            </button>
          </div>
        </div>
      ) : viewMode === 'grid' ? (

        /* GRID VIEW (Smart Cards Layout) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(item => {
            const d = item.data || {};
            const isEmp = item.type === 'EMPLOYEE';
            const titleName = isEmp ? d.fullName : (d.companyName || d.fullName);
            const idVal = isEmp ? d.idNumber : d.taxCode;
            const initials = getInitials(titleName);

            return (
              <div
                key={item._id}
                className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:border-sky-200 transition-all flex flex-col justify-between space-y-4 group relative overflow-hidden"
              >
                {/* Card Top Header */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-50 to-sky-100 text-sky-700 border border-sky-200 flex items-center justify-center font-black text-sm shadow-xs shrink-0">
                        {initials}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-extrabold text-slate-900 text-sm leading-snug group-hover:text-sky-700 transition-colors">
                            {titleName || '---'}
                          </h4>
                          <button
                            onClick={() => handleCopyText(titleName, `${item._id}-name`)}
                            title="Sao chép tên"
                            className="p-1 text-slate-400 hover:text-sky-600 rounded cursor-pointer transition-colors"
                          >
                            {copiedKey === `${item._id}-name` ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                          </button>
                        </div>
                        <span className="text-[11px] font-mono font-bold text-sky-800 block mt-0.5">
                          {item.code} {d.dob ? `• Sinh: ${d.dob}` : ''}
                        </span>
                      </div>
                    </div>

                    {/* Category Type Badge (NHÂN VIÊN / KHÁCH HÀNG / ĐỐI TÁC) */}
                    <div>
                      {getTypeBadge(item.type)}
                    </div>
                  </div>

                  {/* Sub-Badge Row */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {isEmp ? (
                      <>
                        <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 text-[10.5px] font-bold">
                          {d.position || 'Chức vụ chưa cập nhật'}
                        </span>
                        {d.department && (
                          <span className="px-2.5 py-1 rounded-xl bg-sky-50 text-sky-700 text-[10.5px] font-bold border border-sky-100">
                            {d.department}
                          </span>
                        )}
                      </>
                    ) : (
                      <>
                        <span className="px-2.5 py-1 rounded-xl bg-purple-50 text-purple-700 text-[10.5px] font-bold border border-purple-100">
                          ĐĐ: {d.representative || '---'} {d.repPosition ? `(${d.repPosition})` : ''}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Detail Field Chips */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                    {idVal && (
                      <div className="flex items-center justify-between bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                        <span className="text-slate-500 font-medium">
                          {isEmp ? 'CCCD' : 'Mã thuế'}: <strong className="text-slate-800 font-bold">{idVal}</strong>
                        </span>
                        <button
                          onClick={() => handleCopyText(idVal, `${item._id}-id`)}
                          className="p-1 text-slate-400 hover:text-sky-600 cursor-pointer"
                          title="Sao chép"
                        >
                          {copiedKey === `${item._id}-id` ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                        </button>
                      </div>
                    )}

                    {d.phone && (
                      <div className="flex items-center justify-between bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                        <span className="text-slate-500 font-medium flex items-center gap-1">
                          <Phone size={12} className="text-slate-400" /> <strong className="text-slate-800 font-bold">{d.phone}</strong>
                        </span>
                        <button
                          onClick={() => handleCopyText(d.phone, `${item._id}-phone`)}
                          className="p-1 text-slate-400 hover:text-sky-600 cursor-pointer"
                          title="Sao chép SĐT"
                        >
                          {copiedKey === `${item._id}-phone` ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                        </button>
                      </div>
                    )}

                    {d.address && (
                      <div className="flex items-center justify-between bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                        <span className="text-slate-500 font-medium truncate max-w-[210px]" title={d.address}>
                          <MapPin size={12} className="inline text-slate-400 mr-1" /> {d.address}
                        </span>
                        <button
                          onClick={() => handleCopyText(d.address, `${item._id}-address`)}
                          className="p-1 text-slate-400 hover:text-sky-600 cursor-pointer shrink-0"
                          title="Sao chép Địa chỉ"
                        >
                          {copiedKey === `${item._id}-address` ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-2">
                  <button
                    onClick={() => setViewingItem(item)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-sky-50 hover:text-sky-700 text-slate-700 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Eye size={14} /> Chi tiết
                  </button>

                  <button
                    onClick={() => handleDelete(item._id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                    title="Xóa hồ sơ"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      ) : (

        /* TABLE VIEW */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Loại Hồ Sơ</th>
                  <th className="py-3.5 px-4">Mã Hồ Sơ</th>
                  <th className="py-3.5 px-4">Họ Tên / Đơn Vị</th>
                  <th className="py-3.5 px-4">Giấy Tờ / Mã Thuế</th>
                  <th className="py-3.5 px-4">Liên Hệ (SĐT / Email)</th>
                  <th className="py-3.5 px-4">Chức Vụ / Phòng Ban</th>
                  <th className="py-3.5 px-4">Địa Chỉ</th>
                  <th className="py-3.5 px-4 text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map(item => {
                  const d = item.data || {};
                  const isEmp = item.type === 'EMPLOYEE';
                  const titleName = isEmp ? d.fullName : (d.companyName || d.fullName);
                  const idDoc = isEmp ? (d.idNumber ? `CCCD: ${d.idNumber}` : '---') : (d.taxCode ? `MST: ${d.taxCode}` : '---');

                  return (
                    <tr key={item._id} className="hover:bg-sky-50/40 transition-colors">
                      <td className="py-3.5 px-4">
                        {getTypeBadge(item.type)}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-sky-800">
                        {item.code || '---'}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <span>{titleName || '---'}</span>
                          <button
                            onClick={() => handleCopyText(titleName, `${item._id}-name`)}
                            title="Sao chép tên"
                            className="p-1 text-slate-400 hover:text-sky-600 rounded cursor-pointer transition-colors"
                          >
                            {copiedKey === `${item._id}-name` ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                          </button>
                        </div>
                        {d.dob && <span className="text-[10px] font-normal text-slate-400 block">Sinh: {d.dob}</span>}
                      </td>

                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        <div className="flex items-center gap-1.5">
                          <span>{idDoc}</span>
                          {(d.idNumber || d.taxCode) && (
                            <button
                              onClick={() => handleCopyText(d.idNumber || d.taxCode, `${item._id}-id`)}
                              title="Sao chép CCCD/MST"
                              className="p-1 text-slate-400 hover:text-sky-600 rounded cursor-pointer transition-colors"
                            >
                              {copiedKey === `${item._id}-id` ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                            </button>
                          )}
                        </div>
                        {d.idIssueDate && <span className="text-[10px] text-slate-400 block">Cấp ngày: {d.idIssueDate}</span>}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">
                        {d.phone && (
                          <div className="flex items-center gap-1">
                            <Phone size={12} className="text-slate-400" />
                            <span>{d.phone}</span>
                            <button
                              onClick={() => handleCopyText(d.phone, `${item._id}-phone`)}
                              title="Sao chép SĐT"
                              className="p-0.5 text-slate-400 hover:text-sky-600 cursor-pointer"
                            >
                              {copiedKey === `${item._id}-phone` ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                            </button>
                          </div>
                        )}
                        {d.email && <div className="text-[11px] text-slate-400">{d.email}</div>}
                      </td>

                      <td className="py-3.5 px-4">
                        {isEmp ? (
                          <>
                            <span className="font-bold text-slate-800 block">{d.position || '---'}</span>
                            {d.department && (
                              <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 text-[10px] font-bold border border-sky-100">
                                {d.department}
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            <span className="font-bold text-slate-800 block">ĐĐ: {d.representative || '---'}</span>
                            {d.repPosition && <span className="text-[10px] text-slate-400">{d.repPosition}</span>}
                          </>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate" title={d.address}>
                        {d.address || '---'}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setViewingItem(item)}
                            className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
                            title="Xem chi tiết"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(item._id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Xóa hồ sơ"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Modal Xem Chi Tiết Hồ Sơ (Full Screen Dark Overlay) */}
      {viewingItem && createPortal(
        <div className="modal-overlay animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                  <Database size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-slate-900">Chi Tiết Hồ Sơ Master Data</h3>
                    {getTypeBadge(viewingItem.type)}
                  </div>
                  <span className="text-[10px] font-mono text-sky-800 font-bold">{viewingItem.code}</span>
                </div>
              </div>
              <button
                onClick={() => setViewingItem(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Lines */}
            <div className="space-y-2.5 text-xs">
              {Object.entries(viewingItem.data || {}).map(([k, v]) => {
                if (!v) return null;
                const labelMap = {
                  fullName: 'Họ và tên',
                  dob: 'Ngày sinh',
                  idNumber: 'Số CCCD / CMND',
                  idIssueDate: 'Ngày cấp',
                  idIssuePlace: 'Nơi cấp',
                  phone: 'Số điện thoại',
                  email: 'Email',
                  position: 'Chức vụ',
                  department: 'Phòng ban',
                  address: 'Địa chỉ',
                  companyName: 'Tên Công Ty',
                  taxCode: 'Mã số thuế',
                  representative: 'Người đại diện',
                  repPosition: 'Chức vụ đại diện'
                };

                const label = labelMap[k] || k;

                return (
                  <div key={k} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-xl">
                    <span className="text-slate-500 font-bold">{label}:</span>
                    <div className="flex items-center gap-2">
                      <strong className="text-slate-900 font-extrabold">{v}</strong>
                      <button
                        onClick={() => handleCopyText(v, `view-${k}`)}
                        className="p-1 text-slate-400 hover:text-sky-600 cursor-pointer rounded"
                        title="Sao chép"
                      >
                        {copiedKey === `view-${k}` ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setViewingItem(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 6. Modal Thêm Hồ Sơ Mới (Full Screen Dark Overlay with Type Selector) */}
      {showModal && createPortal(
        <div className="modal-overlay animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Database size={18} className="text-sky-600" />
                <span>Thêm Hồ Sơ Master Data Mới</span>
                <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${modalType === 'EMPLOYEE'
                    ? 'bg-sky-50 text-sky-700 border-sky-200'
                    : modalType === 'CUSTOMER'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-purple-50 text-purple-700 border-purple-200'
                  }`}>
                  {modalType === 'EMPLOYEE' ? ' Nhân Viên' : modalType === 'CUSTOMER' ? 'Khách Hàng' : 'Đối Tác'}
                </span>
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              {/* Type Switcher Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Loại Hồ Sơ Master Data </label>
                <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200/80">
                  <button
                    type="button"
                    onClick={() => handleModalTypeChange('EMPLOYEE')}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${modalType === 'EMPLOYEE'
                      ? 'bg-white text-sky-700 shadow-xs border border-sky-200/80 ring-2 ring-sky-500/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                      }`}
                  >
                    <Users size={14} className={modalType === 'EMPLOYEE' ? 'text-sky-600' : 'text-slate-400'} />
                    Nhân Viên
                  </button>

                  <button
                    type="button"
                    onClick={() => handleModalTypeChange('CUSTOMER')}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${modalType === 'CUSTOMER'
                      ? 'bg-white text-emerald-700 shadow-xs border border-emerald-200/80 ring-2 ring-emerald-500/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                      }`}
                  >
                    <UserCheck size={14} className={modalType === 'CUSTOMER' ? 'text-emerald-600' : 'text-slate-400'} />
                    Khách Hàng
                  </button>

                  <button
                    type="button"
                    onClick={() => handleModalTypeChange('PARTNER')}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${modalType === 'PARTNER'
                      ? 'bg-white text-purple-700 shadow-xs border border-purple-200/80 ring-2 ring-purple-500/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                      }`}
                  >
                    <Building2 size={14} className={modalType === 'PARTNER' ? 'text-purple-600' : 'text-slate-400'} />
                    Đối Tác
                  </button>
                </div>
              </div>

              {/* Code */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">Mã Định Danh Hồ Sơ *</label>
                  {codeError ? (
                    <span className="text-[11px] font-bold text-red-600 animate-fade-in">{codeError}</span>
                  ) : (
                    <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                      <ShieldCheck size={12} /> Mã hợp lệ (duy nhất)
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  required
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-bold transition-all ${codeError
                    ? 'border-red-400 bg-red-50/50 text-red-900 focus:outline-none focus:ring-2 focus:ring-red-400/20'
                    : 'border-slate-200 text-sky-900 focus:outline-none focus:border-sky-500'
                    }`}
                  placeholder={modalType === 'CUSTOMER' ? 'KH-001' : modalType === 'PARTNER' ? 'DT-001' : 'NV-001'}
                  value={formData.code}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData({ ...formData, code: val });
                    validateCode(val);
                  }}
                />
              </div>

              {modalType === 'EMPLOYEE' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Họ Và Tên *</label>
                      <input type="text" required className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-sky-500" placeholder="Nguyễn Văn A" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Ngày Sinh</label>
                      <input type="date" className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-sky-500" value={formData.dob} onChange={(e) => setFormData({ ...formData, dob: e.target.value })} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Số CCCD / CMND *</label>
                      <input type="text" required className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-sky-500" placeholder="001098765432" value={formData.idNumber} onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Ngày Cấp</label>
                      <input type="date" className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-sky-500" value={formData.idIssueDate} onChange={(e) => setFormData({ ...formData, idIssueDate: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Nơi Cấp</label>
                      <input type="text" className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-sky-500" placeholder="Cục QLHC về TTXH" value={formData.idIssuePlace} onChange={(e) => setFormData({ ...formData, idIssuePlace: e.target.value })} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Chức Vụ *</label>
                      <input type="text" required className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-sky-500" placeholder="Chuyên viên Nhân sự" value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Phòng Ban *</label>
                      <select className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-sky-500" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })}>
                        {departmentsList.filter(d => d !== 'ALL').map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}

              {modalType === 'CUSTOMER' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Họ Tên / Tên Khách Hàng *</label>
                      <input type="text" required className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-emerald-500" placeholder="Nguyễn Văn B / Công Ty ABC" value={formData.companyName || formData.fullName} onChange={(e) => setFormData({ ...formData, companyName: e.target.value, fullName: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Mã Số Thuế / CCCD *</label>
                      <input type="text" required className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-emerald-500" placeholder="0109998877 hoặc 001098..." value={formData.taxCode || formData.idNumber} onChange={(e) => setFormData({ ...formData, taxCode: e.target.value, idNumber: e.target.value })} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Người Đại Diện (Nếu là Tổ Chức)</label>
                      <input type="text" className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-emerald-500" placeholder="Nguyễn Văn C" value={formData.representative} onChange={(e) => setFormData({ ...formData, representative: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Chức Vụ Đại Diện</label>
                      <input type="text" className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-emerald-500" placeholder="Giám Đốc / Đại Diện Mua Hàng" value={formData.repPosition} onChange={(e) => setFormData({ ...formData, repPosition: e.target.value })} />
                    </div>
                  </div>
                </>
              )}

              {modalType === 'PARTNER' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Tên Công Ty / Đơn Vị Đối Tác *</label>
                      <input type="text" required className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-purple-500" placeholder="Công Ty TNHH Đối Tác XYZ" value={formData.companyName} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Mã Số Thuế / Mã ĐKKD *</label>
                      <input type="text" required className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-purple-500" placeholder="0109998877" value={formData.taxCode} onChange={(e) => setFormData({ ...formData, taxCode: e.target.value })} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Người Đại Diện Pháp Luật</label>
                      <input type="text" className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-purple-500" placeholder="Trần Văn D" value={formData.representative} onChange={(e) => setFormData({ ...formData, representative: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Chức Vụ Đại Diện</label>
                      <input type="text" className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-purple-500" placeholder="Tổng Giám Đốc" value={formData.repPosition} onChange={(e) => setFormData({ ...formData, repPosition: e.target.value })} />
                    </div>
                  </div>
                </>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Số Điện Thoại</label>
                  <input type="text" className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-sky-500" placeholder="0987654321" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Liên Hệ</label>
                  <input type="email" className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-sky-500" placeholder="contact@domain.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Địa Chỉ Thường Trú / Trụ Sở</label>
                <input type="text" className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-sky-500" placeholder="Số 123 Đường ABC, Hà Nội..." value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer">Hủy</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md shadow-sky-200 transition-all cursor-pointer">Lưu Hồ Sơ</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};
