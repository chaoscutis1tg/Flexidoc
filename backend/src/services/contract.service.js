import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import puppeteer from 'puppeteer';
import fs from 'fs';
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
        const val = inputData[field.key] !== undefined ? inputData[field.key] : '';
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
              table-layout: fixed !important;
              margin-bottom: 12px;
            }
            td, th {
              vertical-align: top;
              padding: 4px 6px;
              word-break: break-word;
            }
            p {
              margin-top: 4px;
              margin-bottom: 4px;
            }
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
}

export const contractService = new ContractService();
