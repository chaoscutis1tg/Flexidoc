import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
  FileText,
  FilePlus,
  Plus,
  Download,
  CheckCircle2,
  Sparkles,
  UserCheck,
  ArrowRight,
  ArrowLeft,
  Info,
  Check,
  Eye,
  Printer,
  FolderPlus,
  AlertTriangle,
  X,
  Sliders,
  ShieldCheck,
  Database,
  Search,
  Copy,
  Filter,
  Users,
  Building2,
  Wand2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard
} from 'lucide-react';

export const ContractsPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [contracts, setContracts] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Wizard state
  const [showModal, setShowModal] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [viewingContract, setViewingContract] = useState(null);

  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    code: '',
    templateId: '',
    inputData: {},
  });

  // Master Data Reference State for Step 2
  const [mdType, setMdType] = useState('EMPLOYEE');
  const [mdSearch, setMdSearch] = useState('');
  const [mdDebouncedSearch, setMdDebouncedSearch] = useState('');
  const [mdDepartment, setMdDepartment] = useState('ALL');
  const [mdItems, setMdItems] = useState([]);
  const [mdLoading, setMdLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const departmentsList = [
    'ALL',
    'Phòng Nhân sự',
    'Phòng Kế toán',
    'Phòng Kinh doanh',
    'Phòng Kỹ thuật',
    'Phòng Hành chính',
    'Ban Giám đốc',
  ];

  // Debounce search input for Step 2 Master Data panel
  useEffect(() => {
    const timer = setTimeout(() => {
      setMdDebouncedSearch(mdSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [mdSearch]);

  // Fetch Master Data records when wizard is on Step 2
  const fetchStep2MasterData = async () => {
    if (wizardStep !== 2) return;
    setMdLoading(true);
    try {
      const deptQuery = mdDepartment !== 'ALL' ? `&department=${encodeURIComponent(mdDepartment)}` : '';
      const res = await api.get(`/master-data?type=${mdType}&search=${encodeURIComponent(mdDebouncedSearch)}${deptQuery}`);
      setMdItems(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setMdLoading(false);
    }
  };

  useEffect(() => {
    fetchStep2MasterData();
  }, [wizardStep, mdType, mdDebouncedSearch, mdDepartment]);

  const fetchData = async () => {
    try {
      const [ctrRes, tplRes, empRes] = await Promise.all([
        api.get('/contracts'),
        api.get('/templates'),
        api.get('/master-data?type=EMPLOYEE'),
      ]);

      setContracts(ctrRes.data || []);
      const activeTpls = (tplRes.data || []).filter(t => t.status === 'ACTIVE');
      setTemplates(activeTpls);
      setEmployees(empRes.data || []);

      if (activeTpls.length > 0 && !selectedTemplate) {
        handleSelectTemplate(activeTpls[0]._id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSelectTemplate = async (templateId) => {
    if (!templateId) return;

    try {
      const res = await api.get(`/templates/${templateId}`);
      const tplDetails = res.data;
      setSelectedTemplate(tplDetails);

      const initialInputs = {};
      if (tplDetails.currentVersionData && tplDetails.currentVersionData.fields) {
        tplDetails.currentVersionData.fields.forEach(f => {
          initialInputs[f.key] = f.defaultValue || '';
        });
      }

      setFormData({
        title: `Hợp đồng ${tplDetails.template.name}`,
        code: `HD-${Date.now().toString().slice(-6)}`,
        templateId,
        inputData: initialInputs,
      });
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCopyText = (text, keyName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setToastMessage(`Đã chép: ${text}`);
    setTimeout(() => setCopiedKey(null), 1800);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleAutoFillRecord = (item) => {
    if (!item || !item.data) return;
    const d = item.data;
    const updatedInputs = { ...formData.inputData };

    // Intelligent mapping for various placeholder formats
    Object.keys(updatedInputs).forEach(fieldKey => {
      const keyLower = fieldKey.toLowerCase();
      if (keyLower.includes('fullname') || keyLower.includes('hoten') || keyLower.includes('tennhanvien') || keyLower.includes('khachhang')) {
        if (d.fullName || d.companyName) updatedInputs[fieldKey] = d.fullName || d.companyName;
      } else if (keyLower.includes('position') || keyLower.includes('chucvu')) {
        if (d.position || d.repPosition) updatedInputs[fieldKey] = d.position || d.repPosition;
      } else if (keyLower.includes('idnumber') || keyLower.includes('cccd') || keyLower.includes('cmnd')) {
        if (d.idNumber || d.taxCode) updatedInputs[fieldKey] = d.idNumber || d.taxCode;
      } else if (keyLower.includes('idissuedate') || keyLower.includes('ngaycap')) {
        if (d.idIssueDate) updatedInputs[fieldKey] = d.idIssueDate;
      } else if (keyLower.includes('idissueplace') || keyLower.includes('noicap')) {
        if (d.idIssuePlace) updatedInputs[fieldKey] = d.idIssuePlace;
      } else if (keyLower.includes('dob') || keyLower.includes('ngaysinh')) {
        if (d.dob) updatedInputs[fieldKey] = d.dob;
      } else if (keyLower.includes('phone') || keyLower.includes('sdt') || keyLower.includes('dienthoai')) {
        if (d.phone) updatedInputs[fieldKey] = d.phone;
      } else if (keyLower.includes('email')) {
        if (d.email) updatedInputs[fieldKey] = d.email;
      } else if (keyLower.includes('address') || keyLower.includes('diachi')) {
        if (d.address) updatedInputs[fieldKey] = d.address;
      } else if (keyLower.includes('company') || keyLower.includes('tencongty')) {
        if (d.companyName) updatedInputs[fieldKey] = d.companyName;
      } else if (keyLower.includes('tax') || keyLower.includes('masothue')) {
        if (d.taxCode) updatedInputs[fieldKey] = d.taxCode;
      } else if (keyLower.includes('representative') || keyLower.includes('daidien')) {
        if (d.representative) updatedInputs[fieldKey] = d.representative;
      }
    });

    setFormData({ ...formData, inputData: updatedInputs });
    setToastMessage(`Đã điền tự động dữ liệu của ${d.fullName || d.companyName}`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleInputChange = (fieldKey, value) => {
    setFormData({
      ...formData,
      inputData: {
        ...formData.inputData,
        [fieldKey]: value,
      }
    });
  };

  const handleViewContract = async (contractId) => {
    try {
      const res = await api.get(`/contracts/${contractId}`);
      setViewingContract(res.data);
    } catch (err) {
      alert('Lỗi lấy chi tiết hợp đồng: ' + err.message);
    }
  };

  const handlePrintContract = (contractDetails) => {
    const details = contractDetails || viewingContract;
    if (!details || !details.currentVersionData) return;
    const contentHtml = details.currentVersionData.renderedContent || '';

    const printWindow = window.open('', '_blank', 'width=900,height=900');
    if (!printWindow) {
      alert('Vui lòng cho phép trình duyệt bật Cửa sổ Popup để in Hợp Đồng!');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>In Hợp Đồng - MT-CTMS</title>
          <style>
            @page { size: A4; margin: 20mm; }
            body { font-family: 'Times New Roman', Times, serif; font-size: 13pt; line-height: 1.5; color: #000; margin: 0; padding: 0; }
            p { margin: 6px 0; text-indent: 24pt; text-align: justify; }
            table { width: 100%; border-collapse: collapse; margin: 12px 0; }
          </style>
        </head>
        <body>
          <div>${contentHtml}</div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleCreateContract = async () => {
    try {
      const res = await api.post('/contracts', formData);
      setShowModal(false);
      setWizardStep(1);

      const newContractId = res.data?.contract?._id;
      if (newContractId) {
        handleViewContract(newContractId);
      }

      setFormData({ title: '', code: '', templateId: '', inputData: {} });
      setSelectedTemplate(null);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDownloadPdf = async (contractId, code) => {
    try {
      const res = await api.get(`/contracts/${contractId}/download-pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `HD_${code}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Không thể tải PDF: ' + err.message);
    }
  };

  const renderViewContractModal = () => {
    if (!viewingContract) return null;
    const { contract, currentVersionData } = viewingContract;

    return (
      <div className="modal-overlay">
        <div className="modal-content animate-fade-in" style={{ maxWidth: '1000px', width: '94vw', maxHeight: '92vh', padding: '24px' }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={22} color="#0284c7" /> Chi Tiết Hợp Đồng: {contract?.code}
              </h2>
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                {contract?.title} (Bản Snapshot Version v{currentVersionData?.version})
              </p>
            </div>
            <button onClick={() => setViewingContract(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '24px', cursor: 'pointer' }}>
              ✕
            </button>
          </div>

          {/* Authentic Word A4 Document Paper Sheet Render Canvas */}
          <div className="word-paper-canvas">
            <div className="word-paper-sheet">
              <div dangerouslySetInnerHTML={{ __html: currentVersionData?.renderedContent || '' }} />
            </div>
          </div>

          {/* Modal Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '14px' }}>
            <span style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Info size={14} color="#0284c7" /> Bản in chuẩn theo đúng định dạng file Word gốc (Font Times New Roman A4)
            </span>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" className="btn-action btn-secondary" onClick={() => setViewingContract(null)}>
                Đóng
              </button>
              <button
                type="button"
                className="btn-action btn-info"
                onClick={() => handleDownloadPdf(contract._id, contract.code)}
              >
                <Download size={16} /> Tải Về PDF
              </button>
              <button
                type="button"
                className="btn-action btn-create"
                onClick={() => handlePrintContract(viewingContract)}
                style={{ padding: '8px 18px' }}
              >
                <Printer size={16} /> In Hợp Đồng
              </button>
            </div>
          </div>

        </div>
      </div>
    );
  };

  const renderModalContent = () => (
    <div className="modal-overlay">
      <div className={`modal-content animate-fade-in w-full p-0 rounded-3xl overflow-hidden shadow-2xl border border-slate-200 bg-white transition-all ${
        wizardStep === 2 ? 'max-w-5xl' : 'max-w-2xl'
      }`}>

        {/* Floating Toast Notification */}
        {toastMessage && (
          <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xl border border-slate-700 animate-bounce flex items-center gap-2">
            <Check size={14} className="text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Clean Corporate Header */}
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-sky-50 text-sky-600 border border-sky-200 flex items-center justify-center shrink-0 shadow-sm">
                <FilePlus size={22} />
              </div>
              <div>
                <h2 className="text-lg font-black tracking-tight text-slate-900 flex items-center gap-2">
                  Quy Trình Sinh Hợp Đồng Tự Động
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Số hóa & xuất tài liệu hợp đồng PDF chuẩn A4 theo mẫu đã duyệt
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowModal(false)}
              className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-all cursor-pointer border border-slate-200"
              title="Đóng cửa sổ"
            >
              <X size={16} />
            </button>
          </div>

          {/* Clean Stepper Tabs */}
          <div className="grid grid-cols-3 gap-2 mt-5 bg-slate-200/60 p-1.5 rounded-2xl">
            <div className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl transition-all ${wizardStep === 1
              ? 'bg-white text-sky-700 font-black shadow-sm'
              : wizardStep > 1
                ? 'bg-emerald-50 text-emerald-700 font-bold'
                : 'text-slate-500 font-semibold'
              }`}>
              <div className={`w-5 h-5 rounded-full text-[11px] flex items-center justify-center font-black ${wizardStep === 1
                ? 'bg-sky-600 text-white'
                : wizardStep > 1
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-300 text-slate-600'
                }`}>
                {wizardStep > 1 ? <Check size={12} /> : '1'}
              </div>
              <span className="text-xs truncate">Chọn Mẫu</span>
            </div>

            <div className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl transition-all ${wizardStep === 2
              ? 'bg-white text-sky-700 font-black shadow-sm'
              : wizardStep > 2
                ? 'bg-emerald-50 text-emerald-700 font-bold'
                : 'text-slate-500 font-semibold'
              }`}>
              <div className={`w-5 h-5 rounded-full text-[11px] flex items-center justify-center font-black ${wizardStep === 2
                ? 'bg-sky-600 text-white'
                : wizardStep > 2
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-300 text-slate-600'
                }`}>
                {wizardStep > 2 ? <Check size={12} /> : '2'}
              </div>
              <span className="text-xs truncate"> Điền Dữ Liệu</span>
            </div>

            <div className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl transition-all ${wizardStep === 3
              ? 'bg-white text-sky-700 font-black shadow-sm'
              : 'text-slate-500 font-semibold'
              }`}>
              <div className={`w-5 h-5 rounded-full text-[11px] flex items-center justify-center font-black ${wizardStep === 3
                ? 'bg-sky-600 text-white'
                : 'bg-slate-300 text-slate-600'
                }`}>
                3
              </div>
              <span className="text-xs truncate">Sinh File</span>
            </div>
          </div>
        </div>

        {/* Modal Body Content */}
        <div className="p-6 space-y-5">

          {/* STEP 1: Select Template */}
          {wizardStep === 1 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText size={15} className="text-sky-600" />
                  <span>Chọn Mẫu Hợp Đồng Đã Phê Duyệt</span>
                </h3>
                <span className="text-xs font-bold text-slate-400">
                  {templates.length} mẫu có sẵn
                </span>
              </div>

              {templates.length === 0 ? (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center flex flex-col items-center justify-center my-2">
                  <div className="w-14 h-14 rounded-2xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center mb-3 shadow-sm">
                    <FolderPlus size={26} />
                  </div>
                  <h4 className="text-sm font-black text-slate-900">Chưa Có Mẫu Hợp Đồng Nào Đã Duyệt</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-md">
                    Hiện tại chưa có mẫu hợp đồng nào ở trạng thái <strong>ACTIVE</strong>. Vui lòng chuyển sang mục Quản Lý Mẫu Hợp Đồng để duyệt mẫu trước khi sinh file!
                  </p>
                  <button
                    type="button"
                    onClick={() => { setShowModal(false); navigate('/templates'); }}
                    className="mt-4 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs shadow-sm transition-all cursor-pointer flex items-center gap-2"
                  >
                    <FolderPlus size={16} /> Đến Trang Quản Lý Mẫu Hợp Đồng <ArrowRight size={14} />
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[340px] overflow-y-auto pr-1">
                  {templates.map(tpl => {
                    const isSelected = selectedTemplate?.template?._id === tpl._id;
                    return (
                      <div
                        key={tpl._id}
                        onClick={() => handleSelectTemplate(tpl._id)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${isSelected
                          ? 'border-2 border-sky-600 bg-sky-50/50 shadow-sm ring-2 ring-sky-100'
                          : 'border-slate-200 bg-white hover:border-sky-300 hover:shadow-sm'
                          }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2.5 py-0.5 rounded-md uppercase">
                              {tpl.category || 'Mẫu chuẩn'}
                            </span>
                            {isSelected && (
                              <div className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center">
                                <Check size={12} />
                              </div>
                            )}
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 leading-snug">{tpl.name}</h4>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                            {tpl.description || 'Mẫu chuẩn hợp đồng đã số hóa tích hợp biến tự động'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={!selectedTemplate}
                  onClick={() => setWizardStep(2)}
                  className={`px-5 py-2.5 rounded-xl font-extrabold text-xs md:text-sm transition-all flex items-center gap-2 ${selectedTemplate
                    ? 'bg-sky-600 hover:bg-sky-700 text-white shadow-sm cursor-pointer'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                >
                  Nhập Thông Tin <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Input Data Form & Side Master Data Reference Panel */}
          {wizardStep === 2 && selectedTemplate && (
            <div className="space-y-4">
              {/* Selected Template Header Badge */}
              <div className="bg-sky-50/60 border border-sky-200 p-3 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-sky-600 uppercase block">Mẫu Đã Chọn:</span>
                  <h4 className="text-xs font-black text-sky-950">{selectedTemplate.template.name}</h4>
                </div>
                <span className="text-[11px] font-bold text-slate-500 bg-white px-2.5 py-1 rounded-xl border border-sky-100">
                  {selectedTemplate.currentVersionData?.fields?.length || 0} Trường Động
                </span>
              </div>

              {/* Split 2-Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                
                {/* LEFT COLUMN: Contract Form Inputs (7 cols) */}
                <div className="lg:col-span-7 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Mã Số Hợp Đồng *
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold text-sky-900 focus:outline-none focus:border-sky-500 transition-all"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Tên / Tiêu Đề Hợp Đồng *
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-sky-500 transition-all"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Dynamic Fields Form */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 max-h-[360px] overflow-y-auto space-y-3">
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 pb-2 border-b border-slate-100">
                      <Sliders size={14} className="text-sky-600" /> Các trường thông tin thay đổi tự động:
                    </h4>

                    {(!selectedTemplate.currentVersionData?.fields || selectedTemplate.currentVersionData.fields.length === 0) ? (
                      <p className="text-slate-400 text-xs text-center py-6">Mẫu này không có trường động nào cần nhập.</p>
                    ) : (
                      <div className="grid grid-cols-1 gap-3">
                        {selectedTemplate.currentVersionData.fields.map(field => (
                          <div key={field.key} className="bg-slate-50/60 p-2.5 rounded-xl border border-slate-100">
                            <div className="flex justify-between items-center mb-1">
                              <label className="block text-[11.5px] font-bold text-slate-700">
                                {field.label} {field.required && <span className="text-red-500">*</span>}
                              </label>
                              <span className="text-[10px] font-mono text-slate-400">Key: {field.key}</span>
                            </div>
                            <input
                              type={field.type === 'DATE' ? 'date' : field.type === 'NUMBER' || field.type === 'CURRENCY' ? 'number' : 'text'}
                              required={field.required}
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium bg-white text-slate-900 focus:outline-none focus:border-sky-500 transition-all"
                              placeholder={`Nhập ${field.label.toLowerCase()}...`}
                              value={formData.inputData[field.key] || ''}
                              onChange={(e) => handleInputChange(field.key, e.target.value)}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* RIGHT COLUMN: Master Data Reference & Quick Copy Panel (5 cols) */}
                <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex flex-col h-[450px]">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <Database size={15} className="text-sky-600" /> Tra Cứu & Sao Chép Master Data
                    </h4>
                    <span className="text-[10px] text-slate-500 font-semibold">1-Click Copy</span>
                  </div>

                  {/* Type Tabs */}
                  <div className="flex bg-slate-200/70 p-1 rounded-xl mb-2.5">
                    {[
                      { id: 'EMPLOYEE', label: 'Nhân Viên' },
                      { id: 'CUSTOMER', label: 'Khách Hàng' },
                      { id: 'PARTNER', label: 'Đối Tác' },
                    ].map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setMdType(t.id)}
                        className={`flex-1 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                          mdType === t.id ? 'bg-white text-sky-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  {/* Search & Department Filter */}
                  <div className="space-y-2 mb-2">
                    <div className="relative">
                      <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-sky-500"
                        placeholder="Tìm tên, CCCD... trong tổ chức"
                        value={mdSearch}
                        onChange={(e) => setMdSearch(e.target.value)}
                      />
                    </div>

                    {mdType === 'EMPLOYEE' && (
                      <select
                        className="w-full px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 outline-none"
                        value={mdDepartment}
                        onChange={(e) => setMdDepartment(e.target.value)}
                      >
                        {departmentsList.map(d => (
                          <option key={d} value={d}>{d === 'ALL' ? 'Tất cả phòng ban' : d}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Records List */}
                  <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                    {mdLoading ? (
                      <p className="text-[11px] text-slate-400 text-center py-8">Đang tải Master Data...</p>
                    ) : mdItems.length === 0 ? (
                      <p className="text-[11px] text-slate-400 text-center py-8">Không tìm thấy hồ sơ nào.</p>
                    ) : (
                      mdItems.map(item => {
                        const d = item.data || {};
                        const name = mdType === 'EMPLOYEE' ? d.fullName : (d.companyName || d.fullName);
                        const idVal = mdType === 'EMPLOYEE' ? d.idNumber : d.taxCode;

                        return (
                          <div key={item._id} className="bg-white border border-slate-200 rounded-xl p-2.5 text-xs shadow-2xs space-y-2">
                            {/* Card Header */}
                            <div className="flex items-start justify-between gap-1 border-b border-slate-100 pb-1.5">
                              <div>
                                <h5 className="font-extrabold text-slate-900 text-xs flex items-center gap-1">
                                  <span>{name || '---'}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyText(name, `${item._id}-name`)}
                                    title="Copy tên"
                                    className="p-0.5 text-slate-400 hover:text-sky-600 cursor-pointer"
                                  >
                                    {copiedKey === `${item._id}-name` ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                                  </button>
                                </h5>
                                <span className="text-[10px] text-slate-400 font-mono">{item.code} {d.position ? `• ${d.position}` : ''}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleAutoFillRecord(item)}
                                className="px-2 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-[10px] border border-sky-200 flex items-center gap-1 cursor-pointer shrink-0"
                                title="Điền tự động vào các ô tương ứng"
                              >
                                <Wand2 size={11} /> Tự điền
                              </button>
                            </div>

                            {/* Detail Fields Quick Copy Rows */}
                            <div className="grid grid-cols-1 gap-1 text-[11px]">
                              {idVal && (
                                <div className="flex justify-between items-center bg-slate-50 px-2 py-0.5 rounded-md">
                                  <span className="text-slate-500 font-medium">{mdType === 'EMPLOYEE' ? 'CCCD' : 'MST'}: <strong className="text-slate-800">{idVal}</strong></span>
                                  <button type="button" onClick={() => handleCopyText(idVal, `${item._id}-id`)} className="p-0.5 text-slate-400 hover:text-sky-600 cursor-pointer">
                                    {copiedKey === `${item._id}-id` ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                                  </button>
                                </div>
                              )}

                              {d.dob && (
                                <div className="flex justify-between items-center bg-slate-50 px-2 py-0.5 rounded-md">
                                  <span className="text-slate-500 font-medium">Ngày sinh: <strong className="text-slate-800">{d.dob}</strong></span>
                                  <button type="button" onClick={() => handleCopyText(d.dob, `${item._id}-dob`)} className="p-0.5 text-slate-400 hover:text-sky-600 cursor-pointer">
                                    {copiedKey === `${item._id}-dob` ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                                  </button>
                                </div>
                              )}

                              {d.phone && (
                                <div className="flex justify-between items-center bg-slate-50 px-2 py-0.5 rounded-md">
                                  <span className="text-slate-500 font-medium">SĐT: <strong className="text-slate-800">{d.phone}</strong></span>
                                  <button type="button" onClick={() => handleCopyText(d.phone, `${item._id}-phone`)} className="p-0.5 text-slate-400 hover:text-sky-600 cursor-pointer">
                                    {copiedKey === `${item._id}-phone` ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                                  </button>
                                </div>
                              )}

                              {d.address && (
                                <div className="flex justify-between items-center bg-slate-50 px-2 py-0.5 rounded-md">
                                  <span className="text-slate-500 font-medium truncate max-w-[200px]">Địa chỉ: <strong className="text-slate-800">{d.address}</strong></span>
                                  <button type="button" onClick={() => handleCopyText(d.address, `${item._id}-addr`)} className="p-0.5 text-slate-400 hover:text-sky-600 cursor-pointer">
                                    {copiedKey === `${item._id}-addr` ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

              </div>

              {/* Wizard Step Navigation Footer */}
              <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setWizardStep(1)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <ArrowLeft size={16} /> Quay Lại
                </button>
                <button
                  type="button"
                  onClick={() => setWizardStep(3)}
                  className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs md:text-sm transition-all cursor-pointer flex items-center gap-2 shadow-sm"
                >
                  Xem Trước & Sinh Hợp Đồng <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Preview & Confirm Contract */}
          {wizardStep === 3 && (
            <div className="space-y-4">
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                    Xác Nhận Dữ Liệu Khởi Tạo Hợp Đồng
                  </h4>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    Hệ thống sẽ lưu <strong>Snapshot bất biến</strong> cho hợp đồng này. Dữ liệu sẽ giữ nguyên vẹn tính pháp lý.
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <h4 className="text-xs font-bold text-slate-900 mb-2">Dữ liệu đã điền vào mẫu:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto">
                  {Object.entries(formData.inputData).map(([key, val]) => (
                    <div key={key} className="text-xs p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                      <span className="font-bold text-slate-600">{key}:</span>
                      <span className="font-black text-sky-900">{val || '(Bỏ trống)'}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setWizardStep(2)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <ArrowLeft size={16} /> Chỉnh Sửa Dữ Liệu
                </button>
                <button
                  type="button"
                  onClick={handleCreateContract}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs md:text-sm transition-all cursor-pointer flex items-center gap-2 shadow-md shadow-emerald-200"
                >
                  <CheckCircle2 size={18} /> Khởi Tạo Hợp Đồng Ngay
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in space-y-6">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600">
              <FileText size={18} />
            </div>
            <h1 className="text-xl font-black text-slate-900">Quản Lý Hợp Đồng</h1>
          </div>
          <p className="text-xs font-semibold text-slate-500">
            Quản lý danh sách hợp đồng đã khởi tạo, xem bản snapshot văn bản pháp lý và xuất PDF
          </p>
        </div>

        <button
          onClick={() => {
            setShowModal(true);
            setWizardStep(1);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md shadow-sky-200 transition-all cursor-pointer shrink-0"
        >
          <Plus size={16} /> + Tạo Hợp Đồng Theo Mẫu
        </button>
      </div>

      {/* Contracts Table List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs font-bold text-slate-400">
            Đang tải danh sách hợp đồng...
          </div>
        ) : contracts.length === 0 ? (
          <div className="p-12 text-center text-xs font-bold text-slate-400 space-y-2">
            <FileText size={32} className="mx-auto text-slate-300" />
            <p>Chưa có hợp đồng nào được khởi tạo.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Mã Hợp Đồng</th>
                  <th className="py-3 px-4">Tiêu Đề / Tên</th>
                  <th className="py-3 px-4">Mẫu Số Hóa</th>
                  <th className="py-3 px-4">Phiên Bản</th>
                  <th className="py-3 px-4">Trạng Thái</th>
                  <th className="py-3 px-4">Ngày Tạo</th>
                  <th className="py-3 px-4 text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {contracts.map(c => (
                  <tr key={c._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-sky-800">
                      {c.code}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {c.title}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {c.templateId?.name || 'Mẫu tiêu chuẩn'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono text-[10px] font-bold border border-slate-200">
                        v{c.templateVersion}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-extrabold text-[10px] border border-emerald-200 inline-flex items-center gap-1">
                        <CheckCircle2 size={12} /> Đã Khởi Tạo
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-medium">
                      {new Date(c.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleViewContract(c._id)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1"
                          title="Xem chi tiết & in"
                        >
                          <Eye size={13} /> Xem
                        </button>
                        <button
                          onClick={() => handleDownloadPdf(c._id, c.code)}
                          className="px-2.5 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1 border border-sky-200"
                          title="Tải PDF"
                        >
                          <Download size={13} /> PDF
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

      {/* Modals */}
      {showModal && createPortal(renderModalContent(), document.body)}
      {viewingContract && createPortal(renderViewContractModal(), document.body)}

    </div>
  );
};
