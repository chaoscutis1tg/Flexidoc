import React, { useEffect, useState, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useConfirm } from '../../app/ConfirmContext';
import { DocxPreviewRenderer } from '../templates/editor/DocxPreviewRenderer.jsx';
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
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  Loader2
} from 'lucide-react';

export const ContractsPage = () => {
  const { confirm } = useConfirm();
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
  const [docxPreviewBlob, setDocxPreviewBlob] = useState(null);
  const [modalError, setModalError] = useState('');

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

  const validateStep2Form = () => {
    setModalError('');
    if (!formData.code || !formData.code.trim()) {
      setModalError('Vui lòng nhập Mã Số Hợp Đồng.');
      return false;
    }
    if (!formData.title || !formData.title.trim()) {
      setModalError('Vui lòng nhập Tên / Tiêu Đề Hợp Đồng.');
      return false;
    }

    const fields = selectedTemplate?.currentVersionData?.fields || [];
    const missingFields = [];

    fields.forEach(field => {
      const val = formData.inputData[field.key];
      if (field.required && (val === undefined || val === null || String(val).trim() === '')) {
        missingFields.push(`'${field.label}'`);
      }
    });

    if (missingFields.length > 0) {
      setModalError(`Thiếu thông tin bắt buộc: Vui lòng nhập ${missingFields.join(', ')} trước khi tiếp tục.`);
      return false;
    }

    return true;
  };

  const handleGoToStep3 = () => {
    if (!validateStep2Form()) return;
    setWizardStep(3);
  };

  const handleSelectTemplate = async (templateId) => {
    if (!templateId) return;
    setModalError('');

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
      setModalError(err.message || 'Lỗi tải chi tiết mẫu hợp đồng.');
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

  const handleInputChange = (fieldKey, value) => {
    setModalError('');
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
      setDocxPreviewBlob(null); // Clear previous preview to avoid showing stale data
      const res = await api.get(`/contracts/${contractId}`);
      setViewingContract(res.data);

      // Fetch filled DOCX blob for high-fidelity preview
      try {
        const docxRes = await api.get(`/contracts/${contractId}/download-docx`, { responseType: 'blob' });
        if (docxRes && !(docxRes instanceof Blob && docxRes.type.includes('json'))) {
          const blob = docxRes instanceof Blob ? docxRes : new Blob([docxRes], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
          setDocxPreviewBlob(blob);
        }
      } catch (docxErr) {
        console.warn('Could not fetch DOCX for preview, falling back to HTML:', docxErr.message);
        setDocxPreviewBlob(null);
      }
    } catch (err) {
      confirm({
        title: 'Lỗi',
        message: 'Lỗi lấy chi tiết hợp đồng: ' + err.message,
        hideCancel: true,
        confirmText: 'Đóng',
        variant: 'danger'
      });
    }
  };

  const handlePrintContract = async (contractDetails) => {
    const details = contractDetails || viewingContract;
    if (!details) return;
    const contractId = details.contract?._id;
    if (!contractId) return;

    try {
      // Download the LibreOffice-generated PDF (pixel-perfect format)
      const res = await api.get(`/contracts/${contractId}/download-pdf`, { responseType: 'blob' });
      const blob = res instanceof Blob ? res : new Blob([res], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);

      // Open PDF in new tab and trigger print
      const printWindow = window.open(url, '_blank');
      if (!printWindow) {
        // If popup blocked, fall back to download
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `HD_${details.contract?.code || contractId}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        confirm({
          title: 'Thông báo',
          message: 'Vui lòng cho phép trình duyệt bật Popup để in trực tiếp. File PDF đã được tải về.',
          hideCancel: true,
          confirmText: 'Đóng',
          variant: 'warning'
        });
      } else {
        printWindow.onload = () => {
          printWindow.focus();
          printWindow.print();
        };
      }
    } catch (err) {
      console.error('Print error:', err);
      confirm({
        title: 'Lỗi',
        message: 'Lỗi khi tạo bản in: ' + err.message,
        hideCancel: true,
        confirmText: 'Đóng',
        variant: 'danger'
      });
    }
  };

  const handleCreateContract = async () => {
    setModalError('');
    if (!validateStep2Form()) {
      setWizardStep(2);
      return;
    }

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
      setModalError('');
      fetchData();
    } catch (err) {
      setModalError(err.message || 'Khởi tạo hợp đồng thất bại. Vui lòng kiểm tra lại thông tin.');
      setWizardStep(2);
    }
  };

  const handleDownloadPdf = async (contractId, code) => {
    try {
      const res = await api.get(`/contracts/${contractId}/download-pdf`, { responseType: 'blob' });

      // Check if response blob is actually a JSON error payload
      if (res && (res.type === 'application/json' || (res instanceof Blob && res.type.includes('json')))) {
        const text = await res.text();
        let errorMsg = 'Không thể xuất file PDF.';
        try {
          const json = JSON.parse(text);
          errorMsg = json.message || errorMsg;
        } catch (e) {}
        throw new Error(errorMsg);
      }

      const blob = res instanceof Blob ? res : new Blob([res], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `HD_${code || contractId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      confirm({
        title: 'Lỗi',
        message: 'Không thể tải PDF: ' + err.message,
        hideCancel: true,
        confirmText: 'Đóng',
        variant: 'danger'
      });
    }
  };

  const handleDownloadDocx = async (contractId, code) => {
    try {
      const res = await api.get(`/contracts/${contractId}/download-docx`, { responseType: 'blob' });

      if (res && (res.type === 'application/json' || (res instanceof Blob && res.type.includes('json')))) {
        const text = await res.text();
        let errorMsg = 'Không thể xuất file DOCX.';
        try {
          const json = JSON.parse(text);
          errorMsg = json.message || errorMsg;
        } catch (e) {}
        throw new Error(errorMsg);
      }

      const blob = res instanceof Blob ? res : new Blob([res], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `HD_${code || contractId}.docx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      confirm({
        title: 'Lỗi',
        message: 'Không thể tải DOCX: ' + err.message,
        hideCancel: true,
        confirmText: 'Đóng',
        variant: 'danger'
      });
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

          {/* Word A4 Document Preview - Uses docx-preview for pixel-perfect rendering */}
          <div className="word-paper-canvas" style={{ flex: 1, minHeight: '400px', maxHeight: '65vh', overflowY: 'auto' }}>
            {docxPreviewBlob ? (
              <DocxPreviewRenderer file={docxPreviewBlob} zoom={1} />
            ) : (
              <div className="word-paper-sheet">
                <div dangerouslySetInnerHTML={{ __html: currentVersionData?.renderedContent || '' }} />
              </div>
            )}
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
                onClick={() => handleDownloadDocx(contract._id, contract.code)}
                style={{ padding: '8px 18px', background: '#0284c7' }}
              >
                <Download size={16} /> Tải File Word (.DOCX)
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
      <div className={`modal-content animate-fade-in w-full p-0 rounded-3xl overflow-hidden shadow-2xl border border-slate-200 bg-white transition-all flex flex-col max-h-[92vh] ${
        wizardStep === 2 ? 'max-w-[1240px] w-[95vw]' : 'max-w-3xl w-[90vw]'
      }`}>

        {/* Floating Toast Notification */}
        {toastMessage && (
          <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xl border border-slate-700 animate-bounce flex items-center gap-2">
            <Check size={14} className="text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Clean Corporate Header & Stepper (Fixed Top) */}
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 shrink-0">
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
          <div className="grid grid-cols-3 gap-2 mt-4 bg-slate-200/60 p-1.5 rounded-2xl">
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
              <span className="text-xs truncate">Điền Dữ Liệu</span>
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

          {/* Error Alert Box inside Modal */}
          {modalError && (
            <div className="mt-3 bg-red-50 border-2 border-red-200 text-red-800 px-4 py-3 rounded-2xl text-xs font-bold flex items-start justify-between gap-3 animate-fade-in shadow-xs">
              <div className="flex items-start gap-2">
                <AlertTriangle size={18} className="text-red-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-red-950 font-black text-xs mb-0.5">⚠️ Phát hiện thông tin chưa hợp lệ:</strong>
                  <p className="text-red-800 text-[11.5px] leading-relaxed">{modalError}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalError('')}
                className="text-red-400 hover:text-red-700 p-1 rounded-lg hover:bg-red-100 transition-all cursor-pointer"
                title="Đóng thông báo lỗi"
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Modal Body Content (Scrollable Center Area) */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 min-h-0">

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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1">
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
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 overflow-y-auto max-h-[460px] min-h-[320px] space-y-3">
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
                              type={field.type === 'DATE' || field.type === 'DATE_VN' ? 'date' : field.type === 'NUMBER' || field.type === 'CURRENCY' ? 'number' : 'text'}
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
                <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex flex-col h-[460px]">
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
                  <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[280px] overflow-y-auto">
                  {Object.entries(formData.inputData).map(([key, val]) => (
                    <div key={key} className="text-xs p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                      <span className="font-bold text-slate-600">{key}:</span>
                      <span className="font-black text-sky-900">{val || '(Bỏ trống)'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Fixed Modal Footer Navigation */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/80 shrink-0 flex items-center justify-between">
          {wizardStep === 1 && (
            <>
              <div></div>
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
            </>
          )}

          {wizardStep === 2 && (
            <>
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
            </>
          )}

          {wizardStep === 3 && (
            <>
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
            </>
          )}
        </div>

      </div>
    </div>
  );

  const renderedContractsTable = useMemo(() => {
    return (
      <table className="w-full text-left text-xs min-w-[1000px]">
        <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider sticky top-0 z-10">
          <tr>
            <th className="py-3.5 px-4">Mã Hợp Đồng</th>
            <th className="py-3.5 px-4">Tiêu Đề / Tên</th>
            <th className="py-3.5 px-4">Tổ Chức</th>
            <th className="py-3.5 px-4">Người Tạo</th>
            <th className="py-3.5 px-4">Mẫu Số Hóa</th>
            <th className="py-3.5 px-4">Phiên Bản</th>
            <th className="py-3.5 px-4">Trạng Thái</th>
            <th className="py-3.5 px-4">Ngày Tạo</th>
            <th className="py-3.5 px-4 text-center">Thao Tác</th>
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
              <td className="py-3.5 px-4 font-bold text-sky-900">
                {c.organizationId?.name ? (
                  <span className="bg-sky-50 text-sky-700 px-2 py-0.5 rounded border border-sky-200 text-[11px]">
                    {c.organizationId.name} ({c.organizationId.code || 'MAIN'})
                  </span>
                ) : (
                  <span className="text-slate-400 font-normal">Hệ thống</span>
                )}
              </td>
              <td className="py-3.5 px-4 font-extrabold text-slate-800">
                {c.createdBy?.fullName || c.createdBy?.email || 'N/A'}
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
                    onClick={() => handleDownloadDocx(c._id, c.code)}
                    className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1 border border-blue-200"
                    title="Tải file Word (.DOCX)"
                  >
                    <Download size={13} /> DOCX
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
    );
  }, [contracts]);

  return (
    <div className="animate-fade-in flex-1 flex flex-col space-y-5 min-h-[calc(100vh-140px)]">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs shrink-0">
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

      {/* Contracts Table List Container (Full Height Flex) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex-1 flex flex-col min-h-[450px]">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-xs font-bold text-slate-400">
            <Loader2 size={26} className="animate-spin text-sky-600 mb-2" />
            <span>Đang tải danh sách hợp đồng...</span>
          </div>
        ) : contracts.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-xs font-bold text-slate-400 space-y-3">
            <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-300 mb-1 shadow-2xs">
              <FileText size={32} />
            </div>
            <h3 className="text-sm font-black text-slate-700">Chưa có hợp đồng nào được khởi tạo</h3>
            <p className="text-xs text-slate-500 font-normal max-w-sm leading-relaxed">
              Bạn có thể dễ dàng khởi tạo hợp đồng tự động đầu tiên bằng cách sử dụng các mẫu văn bản đã tạo sẵn.
            </p>
            <button
              onClick={() => {
                setShowModal(true);
                setWizardStep(1);
              }}
              className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md shadow-sky-200 transition-all cursor-pointer"
            >
              <Plus size={15} /> Tạo Hợp Đồng Mới Ngay
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto flex-1">
            {renderedContractsTable}
          </div>
        )}
      </div>

      {/* Modals */}
      {showModal && createPortal(renderModalContent(), document.body)}
      {viewingContract && createPortal(renderViewContractModal(), document.body)}

    </div>
  );
};
