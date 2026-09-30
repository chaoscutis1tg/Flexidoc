import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';
import { contractRepository } from '../repositories/contract.repository.js';
import { templateRepository } from '../repositories/template.repository.js';
import { organizationRepository } from '../repositories/organization.repository.js';
import { AppError } from '../utils/app-error.js';

let browserPromise = null;

async function getPuppeteerBrowser() {
  if (!browserPromise) {
    let executablePath = process.env.CHROME_PATH || process.env.CHROME_BIN;
    if (!executablePath) {
      if (fs.existsSync('/usr/bin/chromium-browser')) {
        executablePath = '/usr/bin/chromium-browser';
      } else if (fs.existsSync('/usr/bin/chromium')) {
        executablePath = '/usr/bin/chromium';
      } else if (fs.existsSync('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe')) {
        executablePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
      } else if (fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')) {
        executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
      }
    }

    const launchOpts = {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
    };
    if (executablePath) {
      launchOpts.executablePath = executablePath;
    }

    browserPromise = puppeteer.launch(launchOpts).catch(err => {
      console.error('Puppeteer launch failed with custom path, attempting fallback:', err);
      browserPromise = null;
      return puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
    });
  }

  const browser = await browserPromise;
  if (!browser || !browser.connected) {
    browserPromise = null;
    return getPuppeteerBrowser();
  }
  return browser;
}

export class ContractService {
  async _checkPlanLimits(tenantContext, actionType = 'CREATE') {
    if (!tenantContext || !tenantContext.organizationId || tenantContext.role === 'SUPER_ADMIN') return;

    const org = await organizationRepository.findById(tenantContext.organizationId);
    if (!org) return;

    const plan = org.plan || 'FREE';
    const now = new Date();
    const isExpired = plan !== 'FREE' && org.planExpiresAt && new Date(org.planExpiresAt) < now;

    if (isExpired) {
      const expDate = org.planExpiresAt ? new Date(org.planExpiresAt).toLocaleDateString('vi-VN') : 'gần đây';
      if (actionType === 'CREATE') {
        throw new AppError(`Gói dịch vụ '${plan}' của tổ chức bạn đã HẾT HẠN ngày ${expDate}. Tất cả hợp đồng cũ đã được bảo toàn an toàn ở chế độ Chỉ Xem (Read-Only). Vui lòng gia hạn gói dịch vụ để tiếp tục tạo hợp đồng mới!`, 403);
      } else {
        throw new AppError(`Gói dịch vụ '${plan}' của tổ chức bạn đã HẾT HẠN ngày ${expDate}. Các hợp đồng cũ đã được bảo toàn ở chế độ Chỉ Xem. Vui lòng gia hạn gói dịch vụ để tiếp tục chỉnh sửa hoặc xóa!`, 403);
      }
    }
  }

  /**
   * Validate inputData against template fields schema.
   */
  validateInputData(fields = [], inputData = {}) {
    const errors = [];
    fields.forEach(field => {
      const value = inputData[field.key];
      if (field.required && (value === undefined || value === null || String(value).trim() === '')) {
        errors.push(`Trường '${field.label}' (${field.key}) là bắt buộc nhập.`);
      }

      if (value !== undefined && value !== null && String(value).trim() !== '') {
        if (field.type === 'NUMBER' || field.type === 'CURRENCY') {
          const cleanNum = String(value).replace(/,/g, '').trim();
          if (isNaN(Number(cleanNum))) {
            errors.push(`Trường '${field.label}' phải là định dạng số.`);
          }
        }
        if (field.type === 'EMAIL') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(String(value).trim())) {
            errors.push(`Trường '${field.label}' không đúng định dạng Email.`);
          }
        }
      }
    });

    if (errors.length > 0) {
      throw new AppError(errors.join(' '), 400, errors);
    }
  }

  async createContract(data, tenantContext = null) {
    await this._checkPlanLimits(tenantContext, 'CREATE');
    const { title, code, templateId, inputData = {} } = data;

    // 1. Fetch Template and current version
    const template = await templateRepository.findById(templateId, tenantContext);
    if (!template) {
      throw new AppError('Template không tồn tại.', 404);
    }

    if (template.status !== 'ACTIVE') {
      throw new AppError('Chỉ có thể tạo Hợp đồng từ Template ở trạng thái ACTIVE.', 400);
    }

    const templateVersionObj = await templateRepository.findVersion(template._id, template.currentVersion);
    if (!templateVersionObj) {
      throw new AppError('Không tìm thấy phiên bản Template tương ứng.', 404);
    }

    // 2. Validate inputData
    this.validateInputData(templateVersionObj.fields, inputData);

    // 3. Create Contract document
    const contractCode = code || `HD-${Date.now().toString().slice(-6)}`;
    const contract = await contractRepository.create({
      code: contractCode,
      title: title || `Hợp đồng ${template.name}`,
      templateId: template._id,
      templateVersion: templateVersionObj.version,
      status: 'GENERATED',
      currentVersion: 1,
      createdBy: tenantContext.userId,
    }, tenantContext);

    // 4. Render document content
    const renderedContent = this.renderContractText(templateVersionObj.fields, inputData, templateVersionObj.templateContentHtml || '');

    // 5. Persist Immutable Contract Snapshot (BR-009, BR-010)
    const contractVersion = await contractRepository.createVersion({
      contractId: contract._id,
      organizationId: contract.organizationId,
      version: 1,
      inputData,
      fieldsSnapshot: templateVersionObj.fields.map(f => ({
        key: f.key,
        label: f.label,
        type: f.type,
        required: f.required,
      })),
      renderedContent,
      editedBy: tenantContext.userId,
    });

    return { contract, contractVersion };
  }

  renderContractText(fields, inputData, templateContentHtml = '') {
    if (templateContentHtml) {
      let content = templateContentHtml;
      fields.forEach(field => {
        let val = inputData[field.key] !== undefined ? inputData[field.key] : '';
        // Format DATE_VN: yyyy-mm-dd → "ngày DD tháng MM năm YYYY"
        if (field.type === 'DATE_VN' && val && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
          const [year, month, day] = val.split('-');
          val = `ngày ${day} tháng ${month} năm ${year}`;
        }
        const regex = new RegExp(`\\{\\{${field.key}\\}\\}`, 'g');
        content = content.replace(regex, val);
      });
      return content;
    }

    // Default structured render text
    let output = 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc\n\nTHÔNG TIN HỢP ĐỒNG\n\n';
    fields.forEach(field => {
      const val = inputData[field.key] !== undefined ? inputData[field.key] : '---';
      output += `- ${field.label}: ${val}\n`;
    });
    return output;
  }

  async generatePdfBuffer(contractText) {
    let page = null;
    try {
      const browser = await getPuppeteerBrowser();
      page = await browser.newPage();

      const htmlDocument = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            @page {
              size: A4;
              margin: 15mm 15mm 15mm 15mm;
            }
            body {
              font-family: 'Times New Roman', Times, serif, 'Segoe UI', Roboto;
              font-size: 13pt;
              line-height: 1.5;
              color: #000000;
              margin: 0;
              padding: 0;
              background-color: #ffffff;
              -webkit-print-color-adjust: exact;
            }
            table {
              width: 100% !important;
              border-collapse: collapse !important;
              table-layout: auto !important;
              margin-top: 8px;
              margin-bottom: 12px;
            }
            table:not([style*="border: none"]) td,
            table:not([style*="border: none"]) th {
              border: 1px solid #000000;
              vertical-align: top;
              padding: 6px 8px;
              word-break: normal !important;
              overflow-wrap: normal !important;
            }
            td[style*="border: none"],
            th[style*="border: none"] {
              border: none !important;
            }
            p {
              margin-top: 4px;
              margin-bottom: 6px;
              line-height: 1.5;
              word-break: normal !important;
              overflow-wrap: normal !important;
            }
            .text-center { text-align: center !important; text-indent: 0 !important; }
            .text-right { text-align: right !important; text-indent: 0 !important; }
            .text-justify { text-align: justify !important; }
            .text-indent { text-indent: 1cm !important; text-align: justify !important; }
            .text-indent-justify { text-indent: 1cm !important; text-align: justify !important; }
            mark {
              background: transparent !important;
              color: inherit !important;
              border: none !important;
              padding: 0 !important;
              font-weight: inherit !important;
            }
            .word-paper-sheet, .word-paper-canvas {
              box-shadow: none !important;
              border: none !important;
              padding: 0 !important;
              margin: 0 !important;
              width: 100% !important;
              max-width: 100% !important;
            }
          </style>
        </head>
        <body>
          ${contractText || ''}
        </body>
        </html>
      `;

      await page.setContent(htmlDocument, { waitUntil: 'domcontentloaded' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '15mm',
          right: '15mm',
          bottom: '15mm',
          left: '15mm',
        },
      });

      return Buffer.from(pdfBuffer);
    } catch (err) {
      console.error('Puppeteer PDF generation failed, executing fallback:', err);
      return this.generatePdfBufferFallback(contractText);
    } finally {
      if (page) {
        await page.close().catch(() => {});
      }
    }
  }

  async generatePdfBufferFallback(contractText) {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let page = pdfDoc.addPage([595.28, 841.89]); // Standard A4 dimensions
    let y = 790;

    // Clean structural block tags to newlines and strip HTML tags cleanly
    let cleanText = (contractText || '')
      .replace(/<\/(p|tr|div|h1|h2|h3|h4|h5|h6|li|table)>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"');

    // Convert Vietnamese accented unicode characters to ASCII for pdf-lib standard font fallback
    const sanitizeVietnameseForPdf = (str) => {
      if (!str) return '';
      return str
        .replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a')
        .replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, 'A')
        .replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e')
        .replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, 'E')
        .replace(/ì|í|ị|ỉ|ĩ/g, 'i')
        .replace(/Ì|Í|Ị|Ỉ|Ĩ/g, 'I')
        .replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o')
        .replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, 'O')
        .replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u')
        .replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, 'U')
        .replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y')
        .replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, 'Y')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\x00-\x7F]/g, '');
    };

    const lines = cleanText.split('\n');
    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) {
        y -= 8;
        return;
      }
      if (y < 50) {
        page = pdfDoc.addPage([595.28, 841.89]);
        y = 790;
      }

      const isTitle = trimmed.toUpperCase().includes('CONG HOA XA HOI') || trimmed.toUpperCase().includes('HOP DONG');
      const isHeader = isTitle || trimmed.startsWith('I.') || trimmed.startsWith('II.') || trimmed.startsWith('III.') || trimmed.startsWith('IV.');
      
      const currentFont = isHeader ? boldFont : font;
      const fontSize = trimmed.toUpperCase().includes('HOP DONG') ? 14 : isHeader ? 11 : 10;
      
      const safeText = sanitizeVietnameseForPdf(trimmed);
      if (!safeText) return;

      let x = 50;
      if (isTitle) {
        try {
          const textWidth = currentFont.widthOfTextAtSize(safeText, fontSize);
          x = Math.max(50, (595.28 - textWidth) / 2);
        } catch (e) {
          x = 120;
        }
      }

      try {
        page.drawText(safeText, {
          x,
          y,
          size: fontSize,
          font: currentFont,
          color: rgb(0.05, 0.05, 0.05),
        });
      } catch (e) {
        console.warn('Fallback PDF drawText skipped unencodable line:', e.message);
      }
      y -= (fontSize + 6);
    });

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }

  async getContracts(filter = {}, tenantContext = null) {
    return await contractRepository.find(filter, tenantContext, {
      sort: { createdAt: -1 },
      populate: [
        { path: 'templateId', select: 'name category' },
        { path: 'createdBy', select: 'fullName email' },
        { path: 'organizationId', select: 'name code' }
      ]
    });
  }

  async getContractDetails(contractId, tenantContext = null) {
    const contract = await contractRepository.findById(contractId, tenantContext, {
      populate: [
        { path: 'templateId', select: 'name category' },
        { path: 'createdBy', select: 'fullName email' },
        { path: 'organizationId', select: 'name code' }
      ]
    });
    if (!contract) {
      throw new AppError('Hợp đồng không tồn tại.', 404);
    }

    const currentVersionData = await contractRepository.findVersion(contract._id, contract.currentVersion);
    const versionsHistory = await contractRepository.findVersions(contract._id);

    return {
      contract,
      currentVersionData,
      versionsHistory,
    };
  }

  async updateContractData(contractId, inputData, tenantContext = null) {
    await this._checkPlanLimits(tenantContext, 'EDIT');
    const contract = await contractRepository.findById(contractId, tenantContext);
    if (!contract) {
      throw new AppError('Hợp đồng không tồn tại.', 404);
    }

    const templateVersionObj = await templateRepository.findVersion(contract.templateId, contract.templateVersion);
    this.validateInputData(templateVersionObj.fields, inputData);

    const newVersionNum = contract.currentVersion + 1;
    const renderedContent = this.renderContractText(templateVersionObj.fields, inputData, templateVersionObj.templateContentHtml || '');

    const contractVersion = await contractRepository.createVersion({
      contractId: contract._id,
      organizationId: contract.organizationId,
      version: newVersionNum,
      inputData,
      fieldsSnapshot: templateVersionObj.fields.map(f => ({
        key: f.key,
        label: f.label,
        type: f.type,
        required: f.required,
      })),
      renderedContent,
      editedBy: tenantContext.userId,
    });

    contract.currentVersion = newVersionNum;
    await contract.save();

    return { contract, contractVersion };
  }

  async generateDocxBuffer(contractId, tenantContext = null) {
    const details = await this.getContractDetails(contractId, tenantContext);
    const contract = details.contract;
    const versionData = details.currentVersionData;
    const inputData = versionData.inputData || {};

    console.log('[DOCX-GEN] ========= Generating DOCX for contract:', contractId);
    console.log('[DOCX-GEN] inputData keys:', Object.keys(inputData));
    console.log('[DOCX-GEN] inputData:', JSON.stringify(inputData).substring(0, 500));

    const templateVersionObj = await templateRepository.findVersion(contract.templateId, contract.templateVersion);

    console.log('[DOCX-GEN] templateId:', contract.templateId, 'templateVersion:', contract.templateVersion);
    console.log('[DOCX-GEN] templateVersionObj exists:', !!templateVersionObj);
    console.log('[DOCX-GEN] originalFileKey:', templateVersionObj?.originalFileKey);
    console.log('[DOCX-GEN] file exists:', templateVersionObj?.originalFileKey ? fs.existsSync(templateVersionObj.originalFileKey) : 'N/A');
    console.log('[DOCX-GEN] fields count:', templateVersionObj?.fields?.length);
    console.log('[DOCX-GEN] field keys:', templateVersionObj?.fields?.map(f => f.key));

    if (templateVersionObj && templateVersionObj.originalFileKey && fs.existsSync(templateVersionObj.originalFileKey)) {
      const fileBuffer = fs.readFileSync(templateVersionObj.originalFileKey);
      console.log('[DOCX-GEN] File read OK, size:', fileBuffer.length, 'bytes');

      const zip = new PizZip(fileBuffer);

      // Build formatted data with proper type formatting
      const formattedData = {};
      (templateVersionObj.fields || []).forEach(f => {
        let val = inputData[f.key] !== undefined ? inputData[f.key] : '';
        if (f.type === 'DATE_VN' && val && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
          const [year, month, day] = val.split('-');
          val = `ngày ${day} tháng ${month} năm ${year}`;
        } else if (f.type === 'CURRENCY' && val && !isNaN(Number(val))) {
          val = Number(val).toLocaleString('vi-VN') + ' VNĐ';
        } else if (f.type === 'NUMBER' && val && !isNaN(Number(val))) {
          val = Number(val).toLocaleString('vi-VN');
        }
        formattedData[f.key] = val;
      });

      console.log('[DOCX-GEN] formattedData:', JSON.stringify(formattedData).substring(0, 500));

      // List all files in the DOCX zip
      const allZipFiles = Object.keys(zip.files);
      console.log('[DOCX-GEN] ZIP files:', allZipFiles.filter(n => n.startsWith('word/')));

      // Direct XML replacement — handles Word splitting {{key}} across multiple runs
      for (const fileName of allZipFiles) {
        if (!/^word\/(document|header\d*|footer\d*)\.xml$/.test(fileName)) continue;
        if (zip.files[fileName].dir) continue;

        let xml = zip.files[fileName].asText();

        // Extract text-only content for debugging
        const rawTextBefore = xml.replace(/<[^>]+>/g, '');
        // Find all {{...}} patterns in the raw text
        const foundPlaceholders = rawTextBefore.match(/\{\{[^}]+\}\}/g) || [];
        console.log(`[DOCX-GEN] ${fileName}: text length=${rawTextBefore.length}, found placeholders:`, foundPlaceholders);

        // Show a sample of the raw text around {{ characters
        const braceIdx = rawTextBefore.indexOf('{{');
        if (braceIdx >= 0) {
          console.log(`[DOCX-GEN] Text around first {{:`, JSON.stringify(rawTextBefore.substring(Math.max(0, braceIdx - 30), braceIdx + 80)));
        } else {
          console.log(`[DOCX-GEN] No {{ found in text-only content of ${fileName}`);
          // Also check for single braces that might indicate split issues
          const singleBrace = rawTextBefore.indexOf('{');
          if (singleBrace >= 0) {
            console.log(`[DOCX-GEN] First { at position ${singleBrace}:`, JSON.stringify(rawTextBefore.substring(Math.max(0, singleBrace - 10), singleBrace + 40)));
          }
        }

        let replacementCount = 0;

        // Phase 1: Direct replacement for tags fully within a single <w:t> element
        for (const f of (templateVersionObj.fields || [])) {
          const key = f.key;
          const value = formattedData[key];
          const safeVal = this._escapeXml(String(value || ''));

          // 1. Thay thế {{key}}
          const regex1 = new RegExp(`\\{\\{${this._escapeRegex(key)}\\}\\}`, 'g');
          const matches1 = xml.match(regex1);
          if (matches1) {
            replacementCount += matches1.length;
            console.log(`[DOCX-GEN] Phase 1: Replacing {{${key}}} → "${String(value || '').substring(0, 50)}" (${matches1.length} times)`);
          }
          xml = xml.replace(regex1, safeVal);

          // 2. Thay thế originalText (từ vựng gốc được bôi đen trên web)
          if (f.originalText && f.originalText.trim()) {
            const regex2 = new RegExp(this._escapeRegex(f.originalText.trim()), 'g');
            const matches2 = xml.match(regex2);
            if (matches2) {
              replacementCount += matches2.length;
              console.log(`[DOCX-GEN] Phase 1: Replacing originalText "${f.originalText}" → "${String(value || '').substring(0, 50)}" (${matches2.length} times)`);
            }
            xml = xml.replace(regex2, safeVal);
          }
        }

        console.log(`[DOCX-GEN] Phase 1 total replacements: ${replacementCount}`);

        // Phase 2: Handle tags or original texts split across multiple <w:t> elements by Word
        const textOnly = xml.replace(/<[^>]+>/g, '');
        
        const stillHasTags = (templateVersionObj.fields || []).some(f => {
          if (textOnly.includes(`{{${f.key}}}`)) return true;
          if (f.originalText && f.originalText.trim() && textOnly.includes(f.originalText.trim())) return true;
          return false;
        });

        if (stillHasTags) {
          const unreplacedKeys = (templateVersionObj.fields || []).filter(f => {
             return textOnly.includes(`{{${f.key}}}`) || (f.originalText && f.originalText.trim() && textOnly.includes(f.originalText.trim()));
          }).map(f => f.key);
          console.log(`[DOCX-GEN] Phase 2: Still has unreplaced tags/text for:`, unreplacedKeys);
          xml = this._fixSplitPlaceholders(xml, formattedData, templateVersionObj.fields);
        } else {
          console.log(`[DOCX-GEN] Phase 2: No split tags remaining`);
        }

        zip.file(fileName, xml);
      }

      console.log('[DOCX-GEN] ========= DOCX generation complete');
      return zip.generate({ type: 'nodebuffer' });
    }

    console.log('[DOCX-GEN] ========= ERROR: Template DOCX file not found');
    throw new AppError('Mẫu file DOCX gốc không tìm thấy để sinh file DOCX.', 404);
  }

  /**
   * Fix {{key}} or original text placeholders that Word split across multiple XML <w:t> elements.
   */
  _fixSplitPlaceholders(xml, data, fields = []) {
    return xml.replace(/<w:p[ >][\s\S]*?<\/w:p>/g, (para) => {
      // Collect all <w:t> text pieces with their exact positions in the paragraph
      const pieces = [];
      const regex = /<w:t(?:[^>]*)>([^<]*)<\/w:t>/g;
      let m;
      while ((m = regex.exec(para)) !== null) {
        pieces.push({
          text: m[1],
          fullMatch: m[0],
          index: m.index,
          length: m[0].length,
        });
      }

      if (pieces.length < 2) return para;

      // Concatenate all text from this paragraph
      const fullText = pieces.map(p => p.text).join('');
      
      const hasTag = fields.some(f => {
        if (fullText.includes(`{{${f.key}}}`)) return true;
        if (f.originalText && f.originalText.trim() && fullText.includes(f.originalText.trim())) return true;
        return false;
      });
      
      if (!hasTag) return para;

      // Replace tags and originalText in the concatenated text
      let replaced = fullText;
      for (const f of fields) {
        const key = f.key;
        const value = data[key];
        const safeVal = this._escapeXml(String(value || ''));
        
        // 1. Replace {{key}}
        replaced = replaced.replace(
          new RegExp(`\\{\\{${this._escapeRegex(key)}\\}\\}`, 'g'),
          safeVal
        );
        
        // 2. Replace originalText
        if (f.originalText && f.originalText.trim()) {
          replaced = replaced.replace(
            new RegExp(this._escapeRegex(f.originalText.trim()), 'g'),
            safeVal
          );
        }
      }

      // Rebuild paragraph: put all replaced text in first <w:t>, empty others
      let result = para;
      for (let i = pieces.length - 1; i >= 0; i--) {
        const p = pieces[i];
        const newText = i === 0 ? replaced : '';
        const tagEnd = p.fullMatch.indexOf('>') + 1;
        const closingStart = p.fullMatch.lastIndexOf('</');
        const newMatch = p.fullMatch.substring(0, tagEnd) + newText + p.fullMatch.substring(closingStart);
        result = result.substring(0, p.index) + newMatch + result.substring(p.index + p.length);
      }

      return result;
    });
  }

  /** Escape special XML characters in replacement values */
  _escapeXml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /** Escape special regex characters in field keys */
  _escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Generate PDF from original DOCX template using LibreOffice conversion.
   * This produces pixel-perfect output matching the Word format exactly.
   * Falls back to Puppeteer HTML-based PDF if LibreOffice is not available.
   */
  async generatePdfFromDocx(contractId, tenantContext = null) {
    try {
      // Generate the filled DOCX buffer first
      const docxBuffer = await this.generateDocxBuffer(contractId, tenantContext);

      // Write to temp file
      const tmpDir = os.tmpdir();
      const tmpDocx = path.join(tmpDir, `contract_${contractId}_${Date.now()}.docx`);
      const tmpPdf = tmpDocx.replace('.docx', '.pdf');

      fs.writeFileSync(tmpDocx, docxBuffer);

      try {
        // Convert DOCX to PDF using LibreOffice
        execSync(
          `libreoffice --headless --convert-to pdf --outdir "${tmpDir}" "${tmpDocx}"`,
          { timeout: 30000, stdio: 'pipe' }
        );

        if (fs.existsSync(tmpPdf)) {
          const pdfBuffer = fs.readFileSync(tmpPdf);
          // Cleanup temp files
          try { fs.unlinkSync(tmpDocx); } catch {}
          try { fs.unlinkSync(tmpPdf); } catch {}
          return pdfBuffer;
        }
      } catch (libreErr) {
        console.warn('LibreOffice conversion failed, falling back to Puppeteer:', libreErr.message);
      }

      // Cleanup docx temp
      try { fs.unlinkSync(tmpDocx); } catch {}

      // Fallback: use Puppeteer with renderedContent
      const details = await this.getContractDetails(contractId, tenantContext);
      return this.generatePdfBuffer(details.currentVersionData?.renderedContent || '');
    } catch (err) {
      console.error('generatePdfFromDocx failed:', err);
      // Ultimate fallback
      const details = await this.getContractDetails(contractId, tenantContext);
      return this.generatePdfBuffer(details.currentVersionData?.renderedContent || '');
    }
  }
}

export const contractService = new ContractService();

