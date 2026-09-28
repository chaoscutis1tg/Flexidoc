import React, { useEffect, useState, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import api from '../../services/api';
import { useAuth } from '../../app/AuthContext';
import { useConfirm } from '../../app/ConfirmContext';
import mammoth from 'mammoth';
import {
  FilePlus,
  Plus,
  CheckCircle,
  Archive,

  Sparkles,
  Upload,
  FileText,
  Eye,
  Edit3,
  CheckCircle2,
  Info,
  Sliders,
  BookOpen,

  Zap,
  HelpCircle,
  X,
  Ellipsis,
  Lightbulb,
  Trash2,
  AlertTriangle,
  Lock
} from 'lucide-react';

// Smart DOM-based Pagination Engine to break Word HTML into authentic A4 Pages
const splitContentIntoPages = (htmlContent) => {
  if (!htmlContent || typeof htmlContent !== 'string') return [];
  const trimmed = htmlContent.trim();
  if (!trimmed) return [];

  // 1. If explicit page breaks exist in HTML, split by them
  if (trimmed.includes('word-page-break')) {
    const rawPages = trimmed.split(/<div class="word-page-break"><\/div>/gi).filter(p => p.trim());
    if (rawPages.length > 1) return rawPages;
  }

  if (typeof window === 'undefined' || !window.document) return [trimmed];

  // 2. Parse HTML string into DOM nodes
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<body>${trimmed}</body>`, 'text/html');
  const children = Array.from(doc.body.children);

  if (children.length === 0) return [trimmed];

  // 3. Create or reuse invisible offscreen measuring container
  let measurer = document.getElementById('a4-page-measurer');
  if (!measurer) {
    measurer = document.createElement('div');
    measurer.id = 'a4-page-measurer';
    measurer.className = 'word-paper-sheet';
    measurer.style.position = 'absolute';
    measurer.style.visibility = 'hidden';
    measurer.style.left = '-9999px';
    measurer.style.top = '-9999px';
    measurer.style.width = '790px';
    measurer.style.padding = '44px 52px';
    measurer.style.boxSizing = 'border-box';
    measurer.style.fontFamily = "'Times New Roman', Times, serif";
    measurer.style.fontSize = "13pt";
    measurer.style.lineHeight = "1.5";
    document.body.appendChild(measurer);
  }

  // Force min-height 0 and height auto so height reflects exact content size
  measurer.style.setProperty('min-height', '0px', 'important');
  measurer.style.setProperty('height', 'auto', 'important');

  // Target printable height per A4 page inside container (approx 1000px)
  const MAX_PAGE_HEIGHT = 1000;

  const pages = [];
  let currentPageNodes = [];
  measurer.innerHTML = '';

  for (let i = 0; i < children.length; i++) {
    const node = children[i];
    const clone = node.cloneNode(true);
    measurer.appendChild(clone);

    // If adding this top-level element causes printable height to exceed MAX_PAGE_HEIGHT
    if (measurer.offsetHeight > MAX_PAGE_HEIGHT && currentPageNodes.length > 0) {
      measurer.removeChild(measurer.lastChild);

      const pageContainer = document.createElement('div');
      currentPageNodes.forEach(n => pageContainer.appendChild(n.cloneNode(true)));
      pages.push(pageContainer.innerHTML);

      measurer.innerHTML = '';
      currentPageNodes = [node.cloneNode(true)];
      measurer.appendChild(node.cloneNode(true));
    } else {
      currentPageNodes.push(clone);
    }
  }

  if (currentPageNodes.length > 0) {
    const pageContainer = document.createElement('div');
    currentPageNodes.forEach(n => pageContainer.appendChild(n.cloneNode(true)));
    pages.push(pageContainer.innerHTML);
  }

  measurer.innerHTML = '';
  return pages.length > 0 ? pages : [trimmed];
};

export const TemplatesPage = () => {
  const { user } = useAuth();
  const { confirm } = useConfirm();
  const isAdmin = user?.role === 'ORGANIZATION_ADMIN' || user?.role === 'SUPER_ADMIN';
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState('editor'); // 'editor' | 'preview'

  // Template Form State
  const [createForm, setCreateForm] = useState({
    name: '',
    category: 'Lao động',
    description: '',
    templateContentHtml: '',
    templateContentText: '',
  });

  const [fields, setFields] = useState([]);
  const [newField, setNewField] = useState({
    key: '',
    label: '',
    type: 'TEXT',
    required: true,
  });

  const [uploadedFileName, setUploadedFileName] = useState('');
  const [parsingFile, setParsingFile] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const textareaRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.scrollTop = 0;
    }
  }, [createForm.templateContentHtml, showCreateModal]);

  // Custom Confirmation / Alert Dialog State (Replaces native browser alert)
  const [dialogConfig, setDialogConfig] = useState({
    show: false,
    title: '',
    message: '',
    type: 'info', // 'info' | 'warning' | 'error' | 'success'
  });

  const showNotification = (title, message, type = 'info') => {
    setDialogConfig({ show: true, title, message, type });
  };

  // Custom Variable Creation Modal State (Replaces native browser prompt)
  const [variableModal, setVariableModal] = useState({
    show: false,
    selectedText: '',
    start: 0,
    end: 0,
    label: '',
    key: '',
    type: 'TEXT',
  });

  const sampleLaborContractHtml = `
<div style="font-family: 'Times New Roman', Times, serif; font-size: 13pt; line-height: 1.5; color: #000000; padding: 10px; background: #ffffff;">
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
    <tr>
      <td style="width: 40%; text-align: center; vertical-align: top; padding: 6px; border: 1px dashed #cbd5e1;">
        <p style="font-weight: bold; margin: 0; font-size: 13pt; text-indent: 0;">CTY TNHH SX&TM MAY VINA</p>
        <p style="font-style: italic; margin: 4px 0 0 0; font-size: 12pt; text-indent: 0;">Số: 0112/2025/HĐLĐ-MVN</p>
      </td>
      <td style="width: 60%; text-align: center; vertical-align: top; padding: 6px; border: 1px dashed #cbd5e1;">
        <p style="font-weight: bold; margin: 0; font-size: 13pt; text-indent: 0; white-space: nowrap;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
        <p style="font-weight: bold; margin: 4px 0 0 0; font-size: 13pt; text-indent: 0; white-space: nowrap;">Độc lập – Tự do – Hạnh phúc</p>
      </td>
    </tr>
  </table>
  
  <p style="text-align: center; font-size: 18pt; font-weight: bold; margin-top: 24px; margin-bottom: 16px; text-indent: 0;">HỢP ĐỒNG LAO ĐỘNG</p>
  
  <p style="text-align: center; font-style: italic; margin: 4px 0; text-indent: 0;">Căn cứ vào Bộ luật Dân sự 2015;</p>
  <p style="text-align: center; font-style: italic; margin: 4px 0; text-indent: 0;">Căn cứ vào Luật Lao động 2019;</p>
  <p style="text-align: center; font-style: italic; margin: 4px 0 16px 0; text-indent: 0;">Căn cứ nhu cầu thực tế của các bên.</p>
  
  <p style="text-align: justify; text-indent: 1cm; margin-bottom: 14px; line-height: 1.5;">Hôm nay, ngày 01 tháng 12 năm 2025 tại Công Ty Trách Nhiệm Hữu Hạn Sản Xuất Và Thương Mại May Vina Chúng tôi gồm:</p>
  
  <p style="font-weight: bold; margin-top: 16px; margin-bottom: 8px; text-indent: 0;">BÊN NGƯỜI SỬ DỤNG LAO ĐỘNG (BÊN A):</p>
  <p style="margin: 4px 0;">Tên tổ chức: Công Ty Trách Nhiệm Hữu Hạn Sản Xuất Và Thương Mại May Vina.</p>
  <p style="margin: 4px 0;">Địa chỉ trụ sở: Số 55, ngõ 68, đường Phú Diễn, tổ 2, phường Phú Diễn, Hà Nội.</p>
  <p style="margin: 4px 0;">Mã số doanh nghiệp: 0110031226 do phòng đăng ký kinh doanh Sở kế hoạch và đầu tư thành phố Hà Nội cấp lần đầu ngày 15/06/2022.</p>
  <p style="margin: 4px 0 16px 0;">Người đại diện theo pháp luật là: Ông <strong>Trần Trọng Quý</strong>. &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Chức vụ: <strong>Giám đốc</strong>.</p>
  
  <p style="font-weight: bold; margin-top: 16px; margin-bottom: 8px; text-indent: 0;">BÊN NGƯỜI LAO ĐỘNG (BÊN B):</p>
  <p style="margin: 4px 0;">Ông/Bà: <strong>{{employee.fullName}}</strong></p>
  <p style="margin: 4px 0;">Ngày sinh: {{employee.dob}}</p>
  <p style="margin: 4px 0;">Số CMND/CCCD: {{employee.idNumber}} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Ngày cấp: {{employee.idDate}}</p>
  <p style="margin: 4px 0;">Nơi cấp: Cục CS QLHC về TTXH</p>
  <p style="margin: 4px 0;">Hộ khẩu thường trú: Skjdjfkjhfjkljashgfsagffsasgsg</p>
  <p style="margin: 4px 0 12px 0;">Nơi ở hiện tại: Rsefswafojkhafolisahgf</p>
  
  <p style="text-align: justify; text-indent: 1cm; margin-top: 12px; margin-bottom: 16px; line-height: 1.5;">Hai bên thỏa thuận ký kết hợp đồng lao động và cam kết làm đúng những điều khoản sau đây:</p>

  <p style="font-weight: bold; margin-top: 16px; margin-bottom: 8px; text-indent: 0;">Điều 1: Thời hạn và công việc hợp đồng</p>
  <p style="margin: 4px 0 4px 16px;">- Loại hợp đồng lao động: Không kỳ hạn.</p>
  <p style="margin: 4px 0 4px 16px;">- Địa điểm làm việc: 18BT7, Foresa 6A, KĐT Foresa Xuân Phương, phường Xuân Phương Hà Nội.</p>
  <p style="margin: 4px 0 4px 16px;">- Chức danh chuyên môn: <strong>{{employee.position}}</strong></p>
  <p style="margin: 4px 0 4px 16px;">- Công việc phải làm: Tư vấn, giới thiệu và bán sản phẩm quần áo trẻ em; tìm kiếm khách hàng, chăm sóc khách hàng...</p>
  <p style="margin: 4px 0 4px 16px;">- Nhiệm vụ công việc khác:</p>
  <p style="margin: 4px 0 4px 32px;">+ Thực hiện các công việc chuyên môn theo đúng chức danh dưới sự quản lý, điều hành của Công ty hoặc cá nhân được giao.</p>
  <p style="margin: 4px 0 4px 32px;">+ Tư vấn sản phẩm, giải đáp thắc mắc, hỗ trợ khách hàng trong quá trình mua hàng và sau bán hàng.</p>
  <p style="margin: 4px 0 4px 32px;">+ Phối hợp với các bộ phận liên quan để xử lý đơn hàng, theo dõi tiến độ giao hàng và chăm sóc khách hàng.</p>
  <p style="margin: 4px 0 4px 32px;">+ Thực hiện báo cáo công việc, doanh số và tình hình khách hàng theo yêu cầu của Công ty.</p>
  <p style="margin: 4px 0 4px 32px;">+ Nghiên cứu thị trường, cập nhật xu hướng tiêu dùng và đề xuất các giải pháp nhằm nâng cao hiệu quả kinh doanh.</p>
  <p style="margin: 4px 0 4px 32px;">+ Thực hiện các công việc khác có liên quan theo yêu cầu của Công ty hoặc cá nhân được bổ nhiệm, ủy quyền phụ trách.</p>

  <p style="font-weight: bold; margin-top: 16px; margin-bottom: 8px; text-indent: 0;">Điều 2: Chế độ làm việc</p>
  <p style="margin: 4px 0 4px 16px;">- Thời giờ làm việc: 8 giờ/ngày.</p>
  <p style="margin: 4px 0 4px 16px;">- Từ ngày Thứ 2 đến ngày Thứ 7 hàng tuần.</p>
  <p style="margin: 4px 0 4px 32px;">+ Buổi sáng: 8h00 - 12h00;</p>
  <p style="margin: 4px 0 4px 32px;">+ Buổi chiều: 13h30 - 17h30.</p>
  <table style="width: 100%; margin-top: 36px; border-collapse: collapse;">
    <tr>
      <td style="width: 50%; text-align: center; vertical-align: top; padding: 4px 8px;">
        <p style="font-weight: bold; margin-bottom: 4px; text-indent: 0;">ĐẠI DIỆN BÊN A</p>
        <p style="font-style: italic; font-size: 11pt; color: #555; text-indent: 0;">(Ký, đóng dấu và ghi rõ họ tên)</p>
      </td>
      <td style="width: 50%; text-align: center; vertical-align: top; padding: 4px 8px;">
        <p style="font-weight: bold; margin-bottom: 4px; text-indent: 0;">ĐẠI DIỆN BÊN B</p>
        <p style="font-style: italic; font-size: 11pt; color: #555; text-indent: 0;">(Ký và ghi rõ họ tên)</p>
      </td>
    </tr>
  </table>
</div>
  `.trim();

  const sampleServiceContractHtml = `
<div style="font-family: 'Times New Roman', Times, serif; font-size: 13pt; line-height: 1.6; color: #000; padding: 10px; background: #ffffff;">
  <table style="width: 100%; border-collapse: collapse; table-layout: fixed; margin-bottom: 20px;">
    <tr>
      <td style="width: 50%; text-align: center; vertical-align: top; padding: 4px 8px;">
        <p style="font-weight: bold; margin-bottom: 2px; font-size: 13pt;">CÔNG TY DỊCH VỤ PHẦN MỀM</p>
        <p style="font-style: italic; margin-top: 0; font-size: 12pt;">Số: {{ma_hop_dong}}</p>
      </td>
      <td style="width: 50%; text-align: center; vertical-align: top; padding: 4px 8px;">
        <p style="font-weight: bold; margin-bottom: 2px; font-size: 13pt;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
        <p style="font-weight: bold; text-decoration: underline; margin-top: 0; font-size: 13pt;">Độc lập – Tự do – Hạnh phúc</p>
      </td>
    </tr>
  </table>

  <p style="text-align: center; font-size: 16pt; font-weight: bold; margin-top: 10px; margin-bottom: 4px;">HỢP ĐỒNG CUNG CẤP DỊCH VỤ CNTT & PHẦN MỀM</p>
  <p style="text-align: center; font-style: italic; margin-top: 0;">Số: {{ma_hop_dong}}</p>
  
  <p style="margin-top: 16px;"><strong>Bên cung cấp dịch vụ (Bên A):</strong> {{ten_cong_ty_cung_cap}}</p>
  <p style="margin-top: 6px;"><strong>Bên sử dụng dịch vụ (Bên B):</strong> {{ten_khach_hang}}</p>
  <p style="margin-top: 6px;"><strong>Mã số thuế / DKKD:</strong> {{ma_so_thue_khach_hang}}</p>
  
  <p style="font-weight: bold; margin-top: 16px; margin-bottom: 6px;">NỘI DUNG DỊCH VỤ THỎA THUẬN:</p>
  <p style="margin: 4px 0 4px 20px;">- Tên gói sản phẩm: <strong>{{ten_goi_dich_vu}}</strong></p>
  <p style="margin: 4px 0 4px 20px;">- Thời hạn hợp đồng: <strong>{{thoi_han_thang}}</strong> tháng</p>
  <p style="margin: 4px 0 4px 20px;">- Tổng giá trị thanh toán: <strong>{{tong_gia_tri}}</strong> VNĐ</p>
  <p style="margin: 4px 0 4px 20px;">- Ngày ký kết hiệu lực: {{ngay_ky}}</p>
  
  <table style="width: 100%; margin-top: 36px; border-collapse: collapse; table-layout: fixed;">
    <tr>
      <td style="width: 50%; text-align: center; vertical-align: top; padding: 4px 8px;">
        <p style="font-weight: bold; margin-bottom: 4px;">ĐẠI DIỆN BÊN A</p>
      </td>
      <td style="width: 50%; text-align: center; vertical-align: top; padding: 4px 8px;">
        <p style="font-weight: bold; margin-bottom: 4px;">ĐẠI DIỆN BÊN B</p>
      </td>
    </tr>
  </table>
</div>
  `.trim();

  const fetchTemplates = async () => {
    try {
      const res = await api.get('/templates');
      setTemplates(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  // Clean raw text parser helper
  const cleanRawText = (raw) => {
    if (!raw) return '';
    let text = raw;

    text = text.replace(/<\/(p|tr|div|h1|h2|h3|h4|h5|h6|li|td|table)>/gi, '\n');
    text = text.replace(/<br\s*\/?>/gi, '\n');

    text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    text = text.replace(/<[^>]+>/g, '');

    text = text.replace(/&nbsp;/gi, ' ');
    text = text.replace(/&amp;/gi, '&');
    text = text.replace(/&lt;/gi, '<');
    text = text.replace(/&gt;/gi, '>');
    text = text.replace(/&quot;/gi, '"');
    text = text.replace(/&#39;/gi, "'");

    text = text.replace(/_Hlk\d+/g, '');
    text = text.replace(/_heading=[a-z0-9\._]+/gi, '');

    const lines = text.split('\n').map(line => line.trim());
    text = lines.join('\n').replace(/\n{3,}/g, '\n\n');

    return text.trim();
  };

  // Helper to format table cell tag styles cleanly without broken attributes or stray > characters
  const formatTagStyles = (htmlStr, defaultStyles) => {
    return htmlStr.replace(/<(td|th)([^>]*)>/gi, (fullMatch, tagName, attrs) => {
      let attrString = attrs || '';
      let existingStyle = '';
      
      const styleMatch = attrString.match(/style="([^"]*)"/i);
      if (styleMatch) {
        existingStyle = styleMatch[1];
        attrString = attrString.replace(/style="[^"]*"/gi, '');
      }

      const styleMap = {};
      if (existingStyle) {
        existingStyle.split(';').forEach(rule => {
          const parts = rule.split(':');
          if (parts.length === 2) {
            const key = parts[0].trim().toLowerCase();
            const val = parts[1].trim();
            if (key && val) styleMap[key] = val;
          }
        });
      }

      Object.keys(defaultStyles).forEach(key => {
        if (defaultStyles[key] === 'none' && key === 'border') {
          styleMap[key] = 'none';
        } else if (!styleMap[key]) {
          styleMap[key] = defaultStyles[key];
        }
      });

      const newStyleStr = Object.keys(styleMap)
        .map(k => `${k}: ${styleMap[k]}`)
        .join('; ');

      const cleanAttrs = attrString.trim();
      const attrsFormatted = cleanAttrs ? ` ${cleanAttrs}` : '';

      return `<${tagName}${attrsFormatted} style="${newStyleStr}">`;
    });
  };

  // Clean Word HTML artifacts while preserving 100% exact DOCX formatting, table borders & paragraph alignment
  const cleanWordHtml = (html) => {
    if (!html) return '';
    let cleaned = html;

    // 1. Remove Word bookmark anchor tags & empty spans, convert Page Breaks to visual A4 dividers
    cleaned = cleaned.replace(/<a\s+id="[^"]*"\s*><\/a>/gi, '');
    cleaned = cleaned.replace(/<a\s+id="[^"]*"\s*>/gi, '');
    cleaned = cleaned.replace(/<\/a>/gi, '');
    cleaned = cleaned.replace(/<span>\s*<\/span>/gi, '');
    cleaned = cleaned.replace(/<(div|hr|br|p)[^>]*(page-break-after|page-break-before)[^>]*>/gi, '<div class="word-page-break"></div>');

    // 2. Convert paragraph alignment classes generated by Mammoth into inline CSS styles & preserve classes
    const applyClassStyle = (htmlStr, className, styleStr) => {
      const tagRegex = new RegExp(`<(p|h1|h2|h3|h4|h5|h6|div|td|th)([^>]*)class="([^"]*\\b${className}\\b[^"]*)"([^>]*)>`, 'gi');
      return htmlStr.replace(tagRegex, (match, tag, before, classAttr, after) => {
        let combined = (before + ' ' + after).replace(/\s+/g, ' ').trim();
        if (/style="[^"]*"/i.test(combined)) {
          combined = combined.replace(/style="([^"]*)"/i, (m, s) => `style="${styleStr} ${s}"`);
        } else {
          combined = combined ? `style="${styleStr}" ${combined}` : `style="${styleStr}"`;
        }
        return `<${tag} class="${classAttr}" ${combined}>`;
      });
    };

    cleaned = applyClassStyle(cleaned, 'text-center', 'text-align: center; text-indent: 0;');
    cleaned = applyClassStyle(cleaned, 'text-right', 'text-align: right; text-indent: 0;');
    cleaned = applyClassStyle(cleaned, 'text-justify', 'text-align: justify;');
    cleaned = applyClassStyle(cleaned, 'text-indent', 'text-indent: 1cm; text-align: justify;');
    cleaned = applyClassStyle(cleaned, 'text-indent-justify', 'text-indent: 1cm; text-align: justify;');

    // Reset text-indent: 0 on numbered headings so section titles don't inherit paragraph indent
    cleaned = cleaned.replace(/<p([^>]*)>\s*(\d+[\.\)])/gi, (match, attrs, num) => {
      let cleanAttrs = attrs || '';
      if (cleanAttrs.includes('style="')) {
        cleanAttrs = cleanAttrs.replace(/style="([^"]*)"/i, 'style="text-indent: 0 !important; $1"');
      } else {
        cleanAttrs = ' style="text-indent: 0 !important;"' + cleanAttrs;
      }
      return `<p${cleanAttrs}>${num}`;
    });

    // 3. Organization Names & Quốc Hiệu Formatting
    cleaned = cleaned.replace(/(TRƯỜNG ĐẠI HỌC [^<\n]+|BỘ GIÁO DỤC [^<\n]+|SỞ GIÁO DỤC [^<\n]+)/gi, (m) => {
      return `<span style="white-space: nowrap; font-weight: bold;">${m.trim()}</span>`;
    });
    cleaned = cleaned.replace(/(CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM)/gi, '<span style="white-space: nowrap; font-weight: bold;">$1</span>');
    cleaned = cleaned.replace(/(Độc lập – Tự do – Hạnh phúc|Độc lập - Tự do - Hạnh phúc)/gi, '<span style="white-space: nowrap; font-weight: bold; border-bottom: 1.5px solid #000000; padding-bottom: 1px; display: inline-block;">$1</span>');

    // 4. Smart Table Processor: Detect borderless layout tables vs bordered data tables
    cleaned = cleaned.replace(/<table([\s\S]*?)<\/table>/gi, (tableHtml) => {
      const isQuocHieuTable = tableHtml.includes('CỘNG HÒA') || tableHtml.includes('Độc lập') || tableHtml.includes('TRƯỜNG') || tableHtml.includes('VICTORIA') || tableHtml.includes('BỘ GIÁO DỤC') || tableHtml.includes('SỞ GIÁO DỤC');
      const isSignatureTable = tableHtml.includes('trách nhiệm') || tableHtml.includes('ghi rõ họ tên') || tableHtml.includes('Ký, đóng dấu') || tableHtml.includes('Ký và ghi') || tableHtml.includes('Giảng viên 1') || tableHtml.includes('Giảng viên 2');
      const isCheckboxTable = tableHtml.includes('☐') || tableHtml.includes('☒') || tableHtml.includes('☑') || tableHtml.includes('[ ]') || tableHtml.includes('[x]');
      const isFormTable = tableHtml.includes('Đơn vị công tác:') || tableHtml.includes('Số điện thoại:') || tableHtml.includes('Họ và tên:') || tableHtml.includes('................') || tableHtml.includes('.......');
      const isExplicitBorderless = tableHtml.includes('border: none') || tableHtml.includes('border:none') || tableHtml.includes('border="0"') || tableHtml.includes('dashed') || tableHtml.includes('dotted');

      // Quốc hiệu header tables & Signature tables (2-column layout tables split 50/50)
      if (isQuocHieuTable || isSignatureTable) {
        let tableFormatted = tableHtml.replace(/<table[^>]*>/i, () => {
          return '<table style="width: 100%; border-collapse: collapse; margin: 8px 0 16px 0; table-layout: fixed; border: none;">';
        });
        tableFormatted = formatTagStyles(tableFormatted, { border: 'none', padding: '4px 6px', 'vertical-align': 'top', width: '50%' });
        return tableFormatted;
      }

      const isBorderless = isCheckboxTable || isFormTable || isExplicitBorderless;

      if (isBorderless) {
        let tableFormatted = tableHtml.replace(/<table[^>]*>/i, (m) => {
          if (m.includes('style=')) {
            return m.replace(/style="([^"]*)"/i, (sm, s) => `style="width: 100%; border-collapse: collapse; margin: 8px 0 12px 0; table-layout: auto; border: none; ${s}"`);
          }
          return '<table style="width: 100%; border-collapse: collapse; margin: 8px 0 12px 0; table-layout: auto; border: none;">';
        });

        tableFormatted = formatTagStyles(tableFormatted, { border: 'none', padding: '4px 6px', 'vertical-align': 'top' });
        return tableFormatted;
      }

      // Bordered Data Table
      let tableFormatted = tableHtml.replace(/<table[^>]*>/i, (m) => {
        if (m.includes('style=')) {
          return m.replace(/style="([^"]*)"/i, (sm, s) => `style="width: 100%; border-collapse: collapse; margin: 12px 0; table-layout: auto; border: 1px solid #000000; ${s}"`);
        }
        return '<table style="width: 100%; border-collapse: collapse; margin: 12px 0; table-layout: auto; border: 1px solid #000000;">';
      });

      tableFormatted = formatTagStyles(tableFormatted, { border: '1px solid #000000', padding: '6px 8px', 'vertical-align': 'top', 'word-break': 'normal' });
      return tableFormatted;
    });

    // 5. Sequential List Fixer: Ensure continuous numbering across <ol> lists split by tables or block elements
    let olSequenceCounter = 0;
    cleaned = cleaned.replace(/<ol([^>]*)>([\s\S]*?)<\/ol>/gi, (match, attrs, content) => {
      const liCount = (content.match(/<li[\s>]/gi) || []).length;
      let newAttrs = attrs || '';
      if (olSequenceCounter > 0) {
        const startVal = olSequenceCounter + 1;
        if (/start="[^"]*"/i.test(newAttrs)) {
          newAttrs = newAttrs.replace(/start="[^"]*"/i, `start="${startVal}"`);
        } else {
          newAttrs = ` start="${startVal}"${newAttrs}`;
        }
      }
      olSequenceCounter += liCount;
      return `<ol${newAttrs}>${content}</ol>`;
    });

    // 6. Fix paragraph section numbers if docx outputted hardcoded numbered paragraphs that reset after tables
    let maxSectionNum = 0;
    cleaned = cleaned.replace(/<p([^>]*)>\s*(<strong>|<b>)?\s*(\d+)[\.\)]\s*(?:<\/strong>|<\/b>)?\s*([^<\n]+)/gi, (match, attrs, boldOpen, numStr, textRest) => {
      let num = parseInt(numStr, 10);
      if (num <= maxSectionNum && num === 1 && maxSectionNum >= 2) {
        num = maxSectionNum + 1;
      }
      if (num > maxSectionNum) {
        maxSectionNum = num;
      }
      let cleanAttrs = attrs || '';
      if (cleanAttrs.includes('style="')) {
        cleanAttrs = cleanAttrs.replace(/style="([^"]*)"/i, 'style="text-indent: 0 !important; $1"');
      } else {
        cleanAttrs = ' style="text-indent: 0 !important;"' + cleanAttrs;
      }
      const boldPrefix = boldOpen || '<strong>';
      const boldSuffix = boldOpen ? (boldOpen.includes('strong') ? '</strong>' : '</b>') : '</strong>';
      return `<p${cleanAttrs}>${boldPrefix}${num}.${boldSuffix} ${textRest}`;
    });

    return cleaned;
  };

  // Manual 1-click HTML cleaning action
  const handleCleanHtmlContent = () => {
    if (!createForm.templateContentText) return;
    const cleaned = cleanRawText(createForm.templateContentText);
    setCreateForm(prev => ({ ...prev, templateContentText: cleaned }));
    autoDetectFields(cleaned);
  };

  // Scan text for {{placeholder}} keys and auto populate fields
  const autoDetectFields = (content) => {
    if (!content) return;
    const regex = /\{\{([a-zA-Z0-9_\.]+)\}\}/g;
    let match;
    const detectedKeys = new Set();
    while ((match = regex.exec(content)) !== null) {
      detectedKeys.add(match[1]);
    }

    const newFieldsList = [...fields];
    detectedKeys.forEach(key => {
      if (!newFieldsList.some(f => f.key === key)) {
        let label = key.replace(/_/g, ' ').replace(/\./g, ' ');
        label = label.charAt(0).toUpperCase() + label.slice(1);

        let type = 'TEXT';
        if (key.includes('luong') || key.includes('gia_tri') || key.includes('tien')) type = 'CURRENCY';
        else if (key.includes('ngay') || key.includes('date')) type = 'DATE';
        else if (key.includes('email')) type = 'EMAIL';

        newFieldsList.push({
          id: `f_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          key,
          label,
          type,
          required: true,
        });
      }
    });

    setFields(newFieldsList);
  };

  // Handle docx / pdf file upload preserving EXACT Word rich formatting (font, bold, tables, alignment)
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadedFileName(file.name);
    setParsingFile(true);

    try {
      if (file.name.endsWith('.docx')) {
        const arrayBuffer = await file.arrayBuffer();

        const mammothOptions = {
          styleMap: [
            "p[style-name='Centered'] => p.text-center:fresh",
            "p[style-name='RightAligned'] => p.text-right:fresh",
            "p[style-name='Justified'] => p.text-justify:fresh",
            "p[style-name='Indented'] => p.text-indent:fresh",
            "p[style-name='IndentedJustified'] => p.text-indent-justify:fresh",
            "h1[style-name='Centered'] => h1.text-center:fresh",
            "h2[style-name='Centered'] => h2.text-center:fresh",
            "h3[style-name='Centered'] => h3.text-center:fresh",
            "h4[style-name='Centered'] => h4.text-center:fresh",
          ],
          transformDocument: mammoth.transforms.paragraph(paragraph => {
            const isCenter = paragraph.alignment === 'center';
            const isRight = paragraph.alignment === 'right';
            const isJustify = paragraph.alignment === 'justify' || paragraph.alignment === 'both';
            const hasIndent = paragraph.indent && (
              (paragraph.indent.firstLine && parseFloat(paragraph.indent.firstLine) !== 0) ||
              (paragraph.indent.left && parseFloat(paragraph.indent.left) !== 0) ||
              (paragraph.indent.start && parseFloat(paragraph.indent.start) !== 0)
            );

            if (isCenter) {
              return { ...paragraph, styleId: 'Centered', styleName: 'Centered' };
            }
            if (isRight) {
              return { ...paragraph, styleId: 'RightAligned', styleName: 'RightAligned' };
            }
            if (isJustify && hasIndent) {
              return { ...paragraph, styleId: 'IndentedJustified', styleName: 'IndentedJustified' };
            }
            if (isJustify) {
              return { ...paragraph, styleId: 'Justified', styleName: 'Justified' };
            }
            if (hasIndent) {
              return { ...paragraph, styleId: 'Indented', styleName: 'Indented' };
            }
            return paragraph;
          })
        };

        // Extract rich HTML from Word (.docx) preserving bold, headings, center alignment, tables, fonts
        const htmlResult = await mammoth.convertToHtml({ arrayBuffer }, mammothOptions);
        const rawTextResult = await mammoth.extractRawText({ arrayBuffer });

        const richHtml = cleanWordHtml(htmlResult.value || '');
        const cleanText = cleanRawText(rawTextResult.value || richHtml);

        setCreateForm(prev => ({
          ...prev,
          name: prev.name || file.name.replace(/\.[^/.]+$/, ''),
          templateContentHtml: richHtml,
          templateContentText: cleanText,
        }));
        autoDetectFields(cleanText);
      } else {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target.result || '';
          const cleanText = cleanRawText(content);
          const styledHtml = `<div style="font-family: 'Times New Roman', Times, serif; font-size: 13pt; line-height: 1.6; color: #000; padding: 24px; white-space: pre-wrap;">${content}</div>`;
          setCreateForm(prev => ({
            ...prev,
            name: prev.name || file.name.replace(/\.[^/.]+$/, ''),
            templateContentHtml: styledHtml,
            templateContentText: cleanText,
          }));
          autoDetectFields(cleanText);
        };
        reader.readAsText(file);
      }
    } catch (err) {
      showNotification('Lỗi Đọc File', 'Lỗi đọc nội dung file: ' + err.message, 'error');
    } finally {
      setParsingFile(false);
    }
  };

  // Convert currently selected text in editor or paper preview into a dynamic variable tag via custom modal
  const handleConvertSelectionToVariable = () => {
    let selectedText = '';
    const sel = window.getSelection();
    if (sel && sel.toString().trim()) {
      selectedText = sel.toString().trim();
    } else if (textareaRef.current) {
      const ta = textareaRef.current;
      selectedText = ta.value.substring(ta.selectionStart, ta.selectionEnd).trim();
    }

    if (!selectedText) {
      showNotification(
        'Bôi Đen Chọn Chữ',
        'Vui lòng dùng chuột bôi đen đoạn chữ trên trang giấy Word (ví dụ: bôi đen họ tên hoặc mã số) rồi bấm nút này để chuyển thành ô nhập liệu.',
        'info'
      );
      return;
    }

    const defaultKey = selectedText.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    let initialType = 'TEXT';
    if (defaultKey.includes('luong') || defaultKey.includes('gia_tri') || defaultKey.includes('tien')) initialType = 'CURRENCY';
    else if (defaultKey.includes('ngay') || defaultKey.includes('date')) initialType = 'DATE';

    setVariableModal({
      show: true,
      selectedText,
      start: 0,
      end: 0,
      label: selectedText,
      key: defaultKey,
      type: initialType,
    });
  };

  // Confirm and apply variable replacement from custom modal preserving 100% Word HTML
  const handleConfirmCreateVariable = (e) => {
    e.preventDefault();
    if (!variableModal.label || !variableModal.key) {
      showNotification('Thiếu Thông Tin', 'Vui lòng nhập Tên nhãn và Mã nhận diện ngắn!', 'warning');
      return;
    }

    const { selectedText, label, key, type } = variableModal;
    const varKey = key.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    const tag = `{{${varKey}}}`;

    let updatedHtml = createForm.templateContentHtml || '';
    if (updatedHtml && updatedHtml.includes(selectedText)) {
      updatedHtml = updatedHtml.replace(selectedText, tag);
    } else {
      const currentText = createForm.templateContentText || '';
      const newText = currentText.replace(selectedText, tag);
      updatedHtml = `<div style="font-family: 'Times New Roman', Times, serif; font-size: 13pt; line-height: 1.5; color: #000; padding: 10px;">${newText}</div>`;
    }

    setCreateForm(prev => ({
      ...prev,
      templateContentHtml: updatedHtml,
      templateContentText: cleanRawText(updatedHtml),
    }));

    if (!fields.some(f => f.key === varKey)) {
      setFields(prev => [
        ...prev,
        {
          id: `f_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          key: varKey,
          label: label.trim(),
          type,
          required: true,
        }
      ]);
    }

    setVariableModal({ show: false, selectedText: '', start: 0, end: 0, label: '', key: '', type: 'TEXT' });
    showNotification('Đã Tạo Ô Nhập Liệu', `Đã chuyển "${selectedText}" thành {{${varKey}}} thành công! Định dạng Word gốc được giữ nguyên 100%.`, 'success');
  };

  const handleLoadPreset = (presetType) => {
    if (presetType === 'LABOR') {
      const plainText = cleanRawText(sampleLaborContractHtml);
      setCreateForm({
        name: 'Hợp Đồng Lao Động Chuẩn (Word DOCX)',
        category: 'Lao động',
        description: 'Mẫu hợp đồng lao động chuẩn Times New Roman với chữ đậm, căn giữa và bảng chữ ký',
        templateContentHtml: sampleLaborContractHtml,
        templateContentText: plainText,
      });
      setFields([]);
      setTimeout(() => autoDetectFields(plainText), 50);
    } else if (presetType === 'SERVICE') {
      const plainText = cleanRawText(sampleServiceContractHtml);
      setCreateForm({
        name: 'Hợp Đồng Dịch Vụ CNTT (Word DOCX)',
        category: 'Dịch vụ',
        description: 'Mẫu hợp đồng dịch vụ công nghệ thông tin & bảo trì',
        templateContentHtml: sampleServiceContractHtml,
        templateContentText: plainText,
      });
      setFields([]);
      setTimeout(() => autoDetectFields(plainText), 50);
    }
  };

  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    if (!createForm.name) {
      showNotification('Thiếu Thông Tin', 'Vui lòng nhập Tên Mẫu Hợp Đồng!', 'warning');
      return;
    }
    if (!createForm.templateContentText && !createForm.templateContentHtml) {
      showNotification('Thiếu Nội Dung', 'Vui lòng chọn file Word (.docx) hoặc dán nội dung văn bản hợp đồng!', 'warning');
      return;
    }

    try {
      const finalHtml = createForm.templateContentHtml ||
        `<div style="font-family: 'Times New Roman', Times, serif; font-size: 13pt; line-height: 1.6; color: #000; padding: 24px; white-space: pre-wrap;">${createForm.templateContentText}</div>`;

      await api.post('/templates', {
        name: createForm.name,
        category: createForm.category,
        description: createForm.description,
        templateContentHtml: finalHtml,
        fields,
      });

      setShowCreateModal(false);
      setCreateForm({ name: '', category: 'Lao động', description: '', templateContentHtml: '', templateContentText: '' });
      setFields([]);
      setUploadedFileName('');
      fetchTemplates();
      showNotification('Thành Công', 'Đã lưu Mẫu Hợp Đồng mới vào hệ thống!', 'success');
    } catch (err) {
      showNotification('Lỗi Lưu Mẫu', err.message, 'error');
    }
  };

  const handleAddField = () => {
    if (!newField || !newField.key || !newField.label) {
      showNotification('Thiếu Thông Tin', 'Vui lòng nhập Mã ngắn và Tên nhãn hiển thị cho ô mới!', 'warning');
      return;
    }

    const fieldKey = String(newField.key).trim().toLowerCase().replace(/\s+/g, '_');
    if (fields.some(f => f && f.key === fieldKey)) {
      showNotification('Mã Ô Đã Tồn Tại', `Mã '${fieldKey}' đã có trong danh sách ô nhập liệu!`, 'warning');
      return;
    }

    setFields([...fields, { ...newField, key: fieldKey, id: `f_${Date.now()}` }]);
    setNewField({ key: '', label: '', type: 'TEXT', required: true });
  };

  const handlePublish = async (id) => {
    try {
      await api.post(`/templates/${id}/publish`);
      fetchTemplates();
      showNotification('Đã Phê Duyệt', 'Đã duyệt và chuyển mẫu hợp đồng sang trạng thái ACTIVE!', 'success');
    } catch (err) {
      showNotification('Lỗi Duyệt', err.message, 'error');
    }
  };

  const handleArchive = async (id) => {
    try {
      await api.post(`/templates/${id}/archive`);
      fetchTemplates();
      showNotification('Đã Lưu Trữ', 'Đã chuyển mẫu hợp đồng sang trạng thái ARCHIVED!', 'info');
    } catch (err) {
      showNotification('Lỗi Lưu Trữ', err.message, 'error');
    }
  };

  const handleDeleteTemplate = async (id, name) => {
    const isConfirmed = await confirm({
      title: 'Xóa Vĩnh Viễn Mẫu Hợp Đồng',
      message: `Bạn có chắc chắn muốn xóa vĩnh viễn Mẫu Hợp Đồng "${name}" khỏi hệ thống không?`,
      subMessage: 'Thao tác này không thể hoàn tác.',
      confirmText: 'Xóa Vĩnh Viễn',
      cancelText: 'Hủy Bỏ',
      type: 'danger'
    });
    if (!isConfirmed) return;
    try {
      await api.delete(`/templates/${id}`);
      fetchTemplates();
      showNotification('Đã Xóa Mẫu', `Đã xóa thành công mẫu hợp đồng "${name}"!`, 'success');
    } catch (err) {
      showNotification('Lỗi Xóa Mẫu', err.message, 'error');
    }
  };

  // Modern Clean Expanded Modal Renderer (Optimized for Laptop & Desktop Display)
  const renderModalContent = () => {
    const hasHtmlTags = /<[a-z][\s\S]*>/i.test(createForm.templateContentText || '');

    return (
      <div className="modal-overlay" style={{ padding: '16px' }}>
        <div className="modal-content animate-fade-in" style={{ maxWidth: '1440px', width: '95vw', height: '92vh', maxHeight: '92vh', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '12px', borderRadius: '16px', boxShadow: '0 25px 60px rgba(15, 23, 42, 0.28)' }}>

          {/* Modal Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', flexShrink: 0 }}>
            <div>
              <h2 style={{ fontSize: '19px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FilePlus size={22} color="#0284c7" /> Số Hóa Mẫu Hợp Đồng Từ File Word (.DOCX)
              </h2>
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '1px' }}>
                Hệ thống tự động giữ nguyên phông chữ Times New Roman & định dạng bảng biểu 100% gốc Word.
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(false)}
              style={{ background: '#f1f5f9', border: 'none', color: '#64748b', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s ease' }}
              title="Đóng cửa sổ"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleCreateTemplate} style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, minHeight: 0 }}>

            {/* Top Compact Metadata Bar */}
            <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', flexShrink: 0 }}>

              {/* Upload Trigger Button */}
              <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <label
                  className="btn-action btn-info"
                  style={{ padding: '7px 15px', fontSize: '12px', borderRadius: '8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: '700' }}
                >
                  <Upload size={15} />
                  {parsingFile ? 'Đang đọc Word...' : uploadedFileName ? `Đổi File Word` : 'Tải File Word (.DOCX)'}
                  <input
                    type="file"
                    accept=".docx,.pdf,.txt"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                </label>
                {uploadedFileName && (
                  <span style={{ fontSize: '11.5px', color: '#0284c7', fontWeight: '700', background: '#e0f2fe', padding: '4px 10px', borderRadius: '6px', border: '1px solid #bae6fd', display: 'inline-flex', alignItems: 'center', gap: '4px', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={uploadedFileName}>
                    <FileText size={13} /> {uploadedFileName}
                  </span>
                )}
              </div>

              {/* Template Name Input */}
              <div style={{ flex: 1, minWidth: '240px' }}>
                <input
                  type="text"
                  required
                  className="glass-input"
                  style={{ fontSize: '12.5px', padding: '7px 12px', background: '#ffffff', border: '1px solid #cbd5e1' }}
                  placeholder="Tên Mẫu Hợp Đồng * (Ví dụ: Hợp Đồng Lao Động Công Ty 2026)"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                />
              </div>

              {/* Category Select */}
              <div style={{ width: '160px' }}>
                <select className="glass-input" style={{ fontSize: '12.5px', padding: '7px 10px', background: '#ffffff', border: '1px solid #cbd5e1' }} value={createForm.category} onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}>
                  <option value="Lao động">Loại: Lao động</option>
                  <option value="Dịch vụ">Loại: Dịch vụ</option>
                  <option value="Mua bán">Loại: Mua bán</option>
                  <option value="Hợp tác">Loại: Hợp tác</option>
                </select>
              </div>

              {/* Presets Quick Loaders */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11.5px', color: '#0369a1', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Sparkles size={13} color="#0284c7" /> Mẫu thử:
                </span>
                <button type="button" className="btn-action btn-secondary" style={{ padding: '5px 10px', fontSize: '11px', borderRadius: '6px' }} onClick={() => handleLoadPreset('LABOR')}>
                  HĐ Lao Động
                </button>
                <button type="button" className="btn-action btn-secondary" style={{ padding: '5px 10px', fontSize: '11px', borderRadius: '6px' }} onClick={() => handleLoadPreset('SERVICE')}>
                  HĐ Dịch Vụ
                </button>
              </div>

            </div>

            {/* Main Studio Workspace Grid: Paper Canvas (Left 1fr) & Sidebar (Right 340px) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '14px', flex: 1, minHeight: 0 }}>

              {/* Left Column: Paper Studio Canvas */}
              <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px', height: '100%', minHeight: 0 }}>

                {/* Studio Toolbar Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap', background: '#f8fafc', padding: '6px 10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>

                  <div style={{ display: 'flex', gap: '6px', background: '#e2e8f0', padding: '3px', borderRadius: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setActiveTab('preview')}
                      style={{
                        padding: '5px 10px',
                        borderRadius: '5px',
                        border: 'none',
                        background: activeTab === 'preview' ? '#ffffff' : 'transparent',
                        color: activeTab === 'preview' ? '#0284c7' : '#64748b',
                        fontWeight: '700',
                        fontSize: '11.5px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        boxShadow: activeTab === 'preview' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                      }}
                    >
                      <Eye size={13} /> Xem Bản Gốc (Word A4)
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('editor')}
                      style={{
                        padding: '5px 10px',
                        borderRadius: '5px',
                        border: 'none',
                        background: activeTab === 'editor' ? '#ffffff' : 'transparent',
                        color: activeTab === 'editor' ? '#0284c7' : '#64748b',
                        fontWeight: '700',
                        fontSize: '11.5px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        boxShadow: activeTab === 'editor' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                      }}
                    >
                      <Edit3 size={13} /> Giấy Số Hóa ({fields.length} vị trí)
                    </button>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* Responsive A4 Zoom Scaling Controls */}
                    <div style={{ display: 'flex', alignItems: 'center', background: '#ffffff', padding: '2px 6px', borderRadius: '6px', border: '1px solid #cbd5e1', gap: '4px' }}>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#475569', paddingRight: '2px' }}>Thu nhỏ A4:</span>
                      {[1, 0.9, 0.8, 0.75].map((scale) => (
                        <button
                          key={scale}
                          type="button"
                          onClick={() => setZoomScale(scale)}
                          style={{
                            padding: '2px 7px',
                            fontSize: '10.5px',
                            fontWeight: '700',
                            borderRadius: '4px',
                            border: 'none',
                            background: zoomScale === scale ? '#0284c7' : 'transparent',
                            color: zoomScale === scale ? '#ffffff' : '#475569',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {Math.round(scale * 100)}%
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={handleConvertSelectionToVariable}
                      className="btn-action"
                      style={{
                        padding: '6px 14px',
                        fontSize: '12px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontWeight: '800',
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        color: '#ffffff',
                        border: 'none',
                        boxShadow: '0 2px 8px rgba(245, 158, 11, 0.35)',
                        cursor: 'pointer'
                      }}
                      title="Bôi đen chữ trên tờ giấy Word rồi bấm nút này để cài đặt ô nhập liệu"
                    >
                      <Zap size={15} /> Bôi Đen Đổi Thành Ô Nhập Liệu
                    </button>
                  </div>
                </div>

                {/* Authentic Word A4 Document Paper Sheet Preview Canvas */}
                <div ref={canvasRef} className="word-paper-canvas" style={{ flex: 1, minHeight: 0 }}>
                  {(() => {
                    const rawHtml = createForm.templateContentHtml || (
                      createForm.templateContentText
                        ? createForm.templateContentText.split('\n\n').map(p => `<p class="text-justify">${p.trim()}</p>`).join('')
                        : ''
                    );

                    if (!rawHtml.trim()) {
                      return (
                        <div className="word-paper-page word-paper-sheet" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', color: '#94a3b8' }}>
                          <FileText size={48} color="#cbd5e1" style={{ marginBottom: '12px' }} />
                          <p style={{ fontWeight: '600', fontSize: '14px', color: '#64748b' }}>Chưa Có Nội Dung Hợp Đồng</p>
                          <p style={{ fontSize: '12px', marginTop: '4px' }}>Bấm nút <strong>"Tải File Word Mẫu"</strong> bên trên hoặc bấm <strong>"Nạp mẫu có sẵn (Presets)"</strong> để bắt đầu!</p>
                        </div>
                      );
                    }

                    const pages = splitContentIntoPages(rawHtml);

                    return pages.map((pageHtml, idx) => (
                      <div
                        key={idx}
                        className="word-paper-page word-paper-sheet"
                        style={{
                          transform: zoomScale !== 1 ? `scale(${zoomScale})` : 'none',
                          transformOrigin: 'top center',
                          marginBottom: zoomScale !== 1 ? `-${(1 - zoomScale) * 450}px` : '0'
                        }}
                      >
                        <div className="word-page-badge">Trang A4 {idx + 1} / {pages.length}</div>
                        <div className="word-page-crop-bottom-left"></div>
                        <div className="word-page-crop-bottom-right"></div>
                        <div
                          dangerouslySetInnerHTML={{
                            __html: pageHtml.replace(/\{\{([a-zA-Z0-9_\.]+)\}\}/g, '<mark style="background:#fef08a;color:#854d0e;padding:2px 6px;border-radius:4px;font-weight:bold;border:1px solid #fde047;">{{$1}}</mark>')
                          }}
                        />
                      </div>
                    ));
                  })()}
                </div>

              </div>

              {/* Right Column: Dynamic Fields Sidebar (Fixed 340px Width) */}
              <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px', height: '100%', minHeight: 0 }}>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                  <h3 style={{ fontSize: '13.5px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sliders size={15} color="#0284c7" /> Ô Nhập Liệu Thay Đổi
                  </h3>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#0284c7', background: '#e0f2fe', padding: '2px 8px', borderRadius: '10px', border: '1px solid #bae6fd' }}>
                    {fields.length} ô
                  </span>
                </div>

                {/* Manual Field Addition Input Group */}
                <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '10px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    <input type="text" className="glass-input" style={{ fontSize: '11.5px', padding: '6px 8px', background: '#ffffff' }} placeholder="Tên ô (Họ và Tên)" value={newField.label} onChange={(e) => setNewField({ ...newField, label: e.target.value, key: newField.key || e.target.value.toLowerCase().replace(/\s+/g, '_') })} />
                    <input type="text" className="glass-input" style={{ fontSize: '11.5px', padding: '6px 8px', background: '#ffffff' }} placeholder="Mã (ho_ten)" value={newField.key} onChange={(e) => setNewField({ ...newField, key: e.target.value })} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                    <select className="glass-input" style={{ fontSize: '11.5px', padding: '5px 8px', width: '150px', background: '#ffffff' }} value={newField.type} onChange={(e) => setNewField({ ...newField, type: e.target.value })}>
                      <option value="TEXT">Văn bản thường</option>
                      <option value="CURRENCY">Số tiền (VNĐ)</option>
                      <option value="DATE">Ngày tháng</option>
                      <option value="NUMBER">Số đếm</option>
                    </select>
                    <button type="button" className="btn-action btn-create" style={{ padding: '5px 12px', fontSize: '11.5px', borderRadius: '6px', fontWeight: '700' }} onClick={handleAddField}>
                      + Thêm Ô
                    </button>
                  </div>
                </div>

                {/* Registered Fields List Container */}
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', paddingRight: '2px' }}>
                  {fields.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px 10px', color: '#94a3b8', fontSize: '11.5px', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                      <HelpCircle size={22} color="#94a3b8" style={{ marginBottom: '4px' }} />
                      <p style={{ fontWeight: '700', color: '#64748b' }}>Chưa có ô nhập liệu nào</p>
                      <p style={{ fontSize: '10.5px', marginTop: '2px' }}>Hãy bôi đen chữ trong hợp đồng rồi bấm nút màu cam hoặc thêm tay ở phía trên.</p>
                    </div>
                  ) : (
                    fields.map((f) => (
                      <div key={f.id || f.key} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                        <div>
                          <span style={{ fontWeight: '800', color: '#0f172a', fontSize: '12px' }}>{f.label}</span>
                          <span style={{ fontSize: '10.5px', color: '#0284c7', display: 'block', marginTop: '1px', fontWeight: '600' }}>{`{{${f.key}}}`}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className="badge badge-role" style={{ fontSize: '9px', padding: '2px 6px' }}>{f.type}</span>
                          <button type="button" style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', padding: '3px', display: 'flex', alignItems: 'center' }} title="Xóa ô này" onClick={() => setFields(fields.filter(item => item.key !== f.key))}>
                            <Trash2 size={13} color="#ef4444" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Sidebar Bottom Guidance Banner */}
                <div style={{ fontSize: '11px', color: '#475569', background: '#fefce8', padding: '8px 10px', borderRadius: '6px', border: '1px solid #fef08a', display: 'flex', gap: '6px', marginTop: 'auto' }}>
                  <Lightbulb size={16} color="#eab308" style={{ flexShrink: 0, marginTop: '1px' }} />
                  <span><strong>Hướng dẫn:</strong> Bôi đen chữ trên tờ giấy A4 ➔ Bấm nút màu cam <strong>"Bôi Đen Đổi Thành Ô Nhập Liệu"</strong>.</span>
                </div>

              </div>

            </div>

            {/* Modal Actions Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #e2e8f0', paddingTop: '10px', flexShrink: 0 }}>
              <button type="button" className="btn-action btn-secondary" style={{ padding: '7px 18px', borderRadius: '8px', fontSize: '12.5px' }} onClick={() => setShowCreateModal(false)}>Hủy</button>
              <button type="submit" className="btn-action btn-create" style={{ padding: '7px 22px', borderRadius: '8px', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700' }}>
                <CheckCircle2 size={16} /> Lưu Mẫu Hợp Đồng Đã Số Hóa
              </button>
            </div>

          </form>
        </div>
      </div>
    );
  };

  /* Custom Beautiful Variable Creation Modal Component */
  const renderVariableModal = () => {
    if (!variableModal.show) return null;

    return (
      <div className="modal-overlay" style={{ zIndex: 10000 }}>
        <div className="modal-content animate-fade-in" style={{ maxWidth: '520px', width: '90vw', padding: '24px', borderRadius: '16px' }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
            <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={22} color="#f59e0b" /> Tạo Ô Nhập Liệu Tự Động
            </h3>
            <button
              onClick={() => setVariableModal({ ...variableModal, show: false })}
              style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleConfirmCreateVariable} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                Đoạn chữ được bôi đen trong hợp đồng:
              </label>
              <div style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', color: '#0f172a', fontStyle: 'italic', wordBreak: 'break-word' }}>
                "{variableModal.selectedText}"
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                Tên ô hiển thị cho người dùng (Label) <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                required
                className="glass-input"
                style={{ fontSize: '13.5px', padding: '9px 12px' }}
                placeholder="Ví dụ: Họ và Tên, Mức Lương, Tên Công Ty..."
                value={variableModal.label}
                onChange={(e) => {
                  const val = e.target.value;
                  const autoKey = val.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
                  setVariableModal(prev => ({ ...prev, label: val, key: autoKey }));
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                  Mã nhận diện ngắn (Key) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  className="glass-input"
                  style={{ fontSize: '13px', padding: '9px 12px', fontFamily: 'monospace' }}
                  placeholder="ho_ten, luong_co_ban"
                  value={variableModal.key}
                  onChange={(e) => setVariableModal(prev => ({ ...prev, key: e.target.value.toLowerCase().replace(/\s+/g, '_') }))}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                  Loại dữ liệu
                </label>
                <select
                  className="glass-input"
                  style={{ fontSize: '13px', padding: '9px 12px' }}
                  value={variableModal.type}
                  onChange={(e) => setVariableModal(prev => ({ ...prev, type: e.target.value }))}
                >
                  <option value="TEXT">Văn bản chữ</option>
                  <option value="CURRENCY">Số tiền (VNĐ)</option>
                  <option value="DATE">Ngày tháng</option>
                  <option value="NUMBER">Số đếm</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', borderTop: '1px solid #e2e8f0', paddingTop: '14px' }}>
              <button
                type="button"
                className="btn-action btn-secondary"
                onClick={() => setVariableModal({ ...variableModal, show: false })}
                style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '12.5px' }}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="btn-action btn-create"
                style={{ padding: '8px 20px', borderRadius: '8px', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <CheckCircle2 size={16} /> Tạo Ô Nhập Liệu & Thay Thế
              </button>
            </div>

          </form>

        </div>
      </div>
    );
  };

  /* Custom Beautiful Alert / Notification Dialog Component */
  const renderDialogModal = () => {
    if (!dialogConfig.show) return null;

    let Icon = Info;
    let iconColor = '#0284c7';
    let btnClass = 'btn-info';

    if (dialogConfig.type === 'warning') {
      Icon = AlertTriangle;
      iconColor = '#f59e0b';
      btnClass = 'btn-warning';
    } else if (dialogConfig.type === 'error') {
      Icon = AlertTriangle;
      iconColor = '#ef4444';
      btnClass = 'btn-danger';
    } else if (dialogConfig.type === 'success') {
      Icon = CheckCircle2;
      iconColor = '#10b981';
      btnClass = 'btn-create';
    }

    return (
      <div className="modal-overlay" style={{ zIndex: 10001 }}>
        <div className="modal-content animate-fade-in" style={{ maxWidth: '440px', width: '90vw', padding: '24px', borderRadius: '16px', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
            <div style={{ background: `${iconColor}15`, padding: '14px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={32} color={iconColor} />
            </div>
          </div>

          <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
            {dialogConfig.title}
          </h3>
          <p style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.5', marginBottom: '20px' }}>
            {dialogConfig.message}
          </p>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button
              type="button"
              className={`btn-action ${btnClass}`}
              style={{ padding: '9px 24px', borderRadius: '8px', fontSize: '13px', fontWeight: '700' }}
              onClick={() => setDialogConfig({ ...dialogConfig, show: false })}
            >
              Đã Hiểu
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: 'calc(100vh - 120px)', maxHeight: 'calc(100vh - 120px)', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText size={28} color="#0284c7" /> Quản Lý Mẫu Hợp Đồng Số Hóa (Templates)
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
            Tải file Word (.DOCX) lên & Thiết lập các vị trí thay đổi thông tin người dùng nhập vào
          </p>
        </div>

        <button className="btn-action btn-create" onClick={() => setShowCreateModal(true)} style={{ padding: '10px 20px', fontSize: '14px', borderRadius: '10px', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} /> Số Hóa Mẫu Mới Từ File Word
        </button>
      </div>

      {/* KPI Summary Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', flexShrink: 0 }}>
        <div className="glass-panel" style={{ padding: '14px 18px', background: '#ffffff', display: 'flex', alignItems: 'center', gap: '14px', borderLeft: '4px solid #0284c7' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileText size={20} />
          </div>
          <div>
            <span style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>{templates.length}</span>
            <p style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Tổng Mẫu Template</p>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '14px 18px', background: '#ffffff', display: 'flex', alignItems: 'center', gap: '14px', borderLeft: '4px solid #10b981' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#dcfce7', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={20} />
          </div>
          <div>
            <span style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>{templates.filter(t => t.status === 'ACTIVE').length}</span>
            <p style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Mẫu Đã Duyệt (Active)</p>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '14px 18px', background: '#ffffff', display: 'flex', alignItems: 'center', gap: '14px', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#fef3c7', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Edit3 size={20} />
          </div>
          <div>
            <span style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>{templates.filter(t => t.status === 'DRAFT').length}</span>
            <p style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Đang Bản Nháp (Draft)</p>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '14px 18px', background: '#ffffff', display: 'flex', alignItems: 'center', gap: '14px', borderLeft: '4px solid #8b5cf6' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#f3e8ff', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Ellipsis size={20} />
          </div>
          <div>
            <span style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>
              {templates.reduce((acc, t) => acc + (t.currentVersionData?.fields?.length || 0), 0)}
            </span>
            <p style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Tổng Ô Tự Điền Số Hóa</p>
          </div>
        </div>
      </div>

      {/* Templates List Table Container (Fixed height flex-1 panel) */}
      <div className="glass-panel" style={{ padding: '20px 24px', background: '#ffffff', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--text-muted)' }}>
            Đang tải danh sách Template...
          </div>
        ) : templates.length === 0 ? (
          <div style={{
            flex: 1,
            textAlign: 'center',
            padding: '30px 24px',
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
            borderRadius: '16px',
            border: '1px dashed #cbd5e1',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '14px'
          }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(2, 132, 199, 0.15)' }}>
              <BookOpen size={28} />
            </div>

            <div>
              <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a' }}>Chưa Có Mẫu Hợp Đồng Nào Trong Hệ Thống</h3>
              <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px', maxWidth: '520px' }}>
                Số hóa mẫu hợp đồng của bạn trong chưa đầy 30 giây. Giữ nguyên 100% phông chữ Times New Roman và định dạng bảng biểu Word!
              </p>
            </div>

            {/* Quick feature pill list */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <span style={{ fontSize: '11.5px', color: '#0369a1', background: '#ffffff', padding: '5px 12px', borderRadius: '20px', border: '1px solid #bae6fd', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}>
                <CheckCircle2 size={13} color="#0284c7" /> Tải file .DOCX 1-Click
              </span>
              <span style={{ fontSize: '11.5px', color: '#0369a1', background: '#ffffff', padding: '5px 12px', borderRadius: '20px', border: '1px solid #bae6fd', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}>
                <CheckCircle2 size={13} color="#0284c7" /> Giữ phông chữ Times New Roman
              </span>
              <span style={{ fontSize: '11.5px', color: '#0369a1', background: '#ffffff', padding: '5px 12px', borderRadius: '20px', border: '1px solid #bae6fd', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}>
                <CheckCircle2 size={13} color="#0284c7" /> Bôi đen tạo vị trí tự điền
              </span>
            </div>

            <button
              className="btn-action btn-create"
              onClick={() => setShowCreateModal(true)}
              style={{ padding: '10px 22px', fontSize: '13px', borderRadius: '10px', marginTop: '4px', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <Plus size={16} /> Số Hóa Mẫu Mới Từ File Word Ngay
            </button>
          </div>
        ) : (
          <div style={{ flex: 1, width: '100%', overflowY: 'auto' }}>
            <table className="custom-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Tên Mẫu Hợp Đồng</th>
                  <th>Phân Loại</th>
                  <th>Phiên Bản</th>
                  <th>Số Ô Nhập Liệu Thay Đổi</th>
                  <th>Trạng Thái Quản Lý</th>
                  <th>Ngày Tạo</th>
                  <th style={{ textAlign: 'right' }}>Thao Tác Duyệt</th>
                </tr>
              </thead>
              <tbody>
                {templates.map(tpl => {
                  const fieldsCount = tpl.currentVersionData?.fields?.length || 0;
                  return (
                    <tr key={tpl._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FileText size={18} />
                          </div>
                          <div>
                            <span style={{ fontWeight: '800', color: '#0f172a', fontSize: '14px' }}>{tpl.name}</span>
                            <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>{tpl.description || 'Mẫu hợp đồng số hóa'}</span>
                          </div>
                        </div>
                      </td>
                      <td><span className="badge badge-role">{tpl.category}</span></td>
                      <td><span className="badge badge-role">v{tpl.currentVersion}</span></td>
                      <td style={{ fontWeight: '700', color: '#0284c7' }}>{fieldsCount} ô nhập liệu</td>
                      <td>
                        {tpl.isLocked ? (
                          <span className="badge badge-archived" style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5' }}>
                            <Lock size={12} /> HẾT HẠN (Khóa)
                          </span>
                        ) : (
                          <span className={`badge badge-${tpl.status === 'ACTIVE' ? 'active' : tpl.status === 'DRAFT' ? 'draft' : 'archived'}`}>
                            {tpl.status === 'ACTIVE' ? 'ACTIVE (Đã duyệt)' : tpl.status === 'DRAFT' ? 'DRAFT (Nháp)' : 'ARCHIVED'}
                          </span>
                        )}
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{new Date(tpl.createdAt).toLocaleDateString('vi-VN')}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          {tpl.isLocked ? (
                            <span style={{ fontSize: '12px', color: '#dc2626', fontWeight: '700' }}>Cần gia hạn gói</span>
                          ) : (
                            <>
                              {isAdmin && tpl.status === 'DRAFT' && (
                                <button
                                  onClick={() => handlePublish(tpl._id)}
                                  className="btn-action btn-warning"
                                  style={{ padding: '5px 12px', fontSize: '12px' }}
                                >
                                  <CheckCircle size={14} /> Duyệt & Publish
                                </button>
                              )}
                              {isAdmin && tpl.status === 'ACTIVE' && (
                                <button
                                  onClick={() => handleArchive(tpl._id)}
                                  className="btn-action btn-secondary"
                                  style={{ padding: '5px 12px', fontSize: '12px' }}
                                >
                                  <Archive size={14} /> Lưu Trữ
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteTemplate(tpl._id, tpl.name)}
                                className="btn-action btn-danger"
                                style={{ padding: '5px 12px', fontSize: '12px' }}
                                title="Xóa mẫu hợp đồng này khỏi hệ thống"
                              >
                                <Trash2 size={14} /> Xóa Mẫu
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* RENDER MODALS VIA REACT PORTAL */}
      {showCreateModal && createPortal(renderModalContent(), document.body)}
      {variableModal.show && createPortal(renderVariableModal(), document.body)}
      {dialogConfig.show && createPortal(renderDialogModal(), document.body)}
    </div>
  );
};
