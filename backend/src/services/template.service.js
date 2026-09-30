import fs from 'fs';
import path from 'path';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { templateRepository } from '../repositories/template.repository.js';
import { organizationRepository } from '../repositories/organization.repository.js';
import { AppError } from '../utils/app-error.js';
import { parseDocx } from '../lib/docx-parser/index.js';

const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');

export class TemplateService {
  _ensureStorageDirs() {
    const origDir = path.join(UPLOADS_DIR, 'templates', 'original');
    const imgDir = path.join(UPLOADS_DIR, 'templates', 'images');
    if (!fs.existsSync(origDir)) fs.mkdirSync(origDir, { recursive: true });
    if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir, { recursive: true });
    return { origDir, imgDir };
  }

  async _checkPlanLimits(tenantContext, actionType = 'CREATE') {
    if (!tenantContext || !tenantContext.organizationId || tenantContext.role === 'SUPER_ADMIN') return;

    const org = await organizationRepository.findById(tenantContext.organizationId);
    if (!org) return;

    const plan = org.plan || 'FREE';
    const now = new Date();
    const isExpired = plan !== 'FREE' && org.planExpiresAt && new Date(org.planExpiresAt) < now;

    // 1. FREE Plan restriction: Cannot edit or delete templates
    if (plan === 'FREE' && (actionType === 'EDIT' || actionType === 'DELETE')) {
      throw new AppError('Gói Miễn Phí (FREE) chỉ cho phép tạo tối đa 2 mẫu hợp đồng và không hỗ trợ sửa hoặc xóa. Vui lòng nâng cấp gói cước!', 403);
    }

    // 2. Expired Plan restriction: Lock all CREATE, EDIT, DELETE actions
    if (isExpired) {
      const expDate = org.planExpiresAt ? new Date(org.planExpiresAt).toLocaleDateString('vi-VN') : 'gần đây';
      if (actionType === 'CREATE') {
        throw new AppError(`Gói dịch vụ '${plan}' của tổ chức bạn đã HẾT HẠN ngày ${expDate}. Tất cả dữ liệu hợp đồng và mẫu cũ đã được bảo toàn ở chế độ Chỉ Xem (Read-Only). Vui lòng gia hạn gói dịch vụ để tiếp tục tạo mới!`, 403);
      } else {
        throw new AppError(`Gói dịch vụ '${plan}' của tổ chức bạn đã HẾT HẠN ngày ${expDate}. Các mẫu cũ đã được bảo toàn an toàn ở chế độ Chỉ Xem. Vui lòng gia hạn gói dịch vụ để chỉnh sửa hoặc xóa!`, 403);
      }
    }

    // 3. Plan Template Count Limit on Create
    if (actionType === 'CREATE') {
      const existingCount = await templateRepository.count({ deletedAt: null }, tenantContext);
      let maxLimit = 2;
      if (plan === 'FREE') maxLimit = 2;
      else if (plan === 'BASIC') maxLimit = 10;
      else if (plan === 'PRO') maxLimit = 20;
      else if (plan === 'VIP') maxLimit = Infinity;

      if (existingCount >= maxLimit) {
        throw new AppError(`Tổ chức của bạn (Gói ${plan}) đã đạt giới hạn tối đa ${maxLimit} mẫu hợp đồng. Vui lòng nâng cấp gói cước để tạo thêm!`, 403);
      }
    }
  }

  async createTemplate(templateData, initialFields = [], tenantContext = null, fileBuffer = null, fileName = null) {
    await this._checkPlanLimits(tenantContext, 'CREATE');

    // 1. Create Template metadata
    const template = await templateRepository.create({
      name: templateData.name,
      category: templateData.category || 'Chung',
      description: templateData.description || '',
      status: 'DRAFT',
      currentVersion: 1,
      createdBy: tenantContext.userId,
    }, tenantContext);

    let originalFileKey = '';
    let documentModel = templateData.documentModel || null;
    let images = [];

    // Save uploaded DOCX file and process images if provided
    if (fileBuffer) {
      const { origDir, imgDir } = this._ensureStorageDirs();
      const safeName = `${template.organizationId}_${template._id}_v1.docx`;
      originalFileKey = path.join('uploads', 'templates', 'original', safeName);
      const fullPath = path.join(origDir, safeName);
      fs.writeFileSync(fullPath, fileBuffer);

      // Parse with docx-parser if documentModel not provided
      if (!documentModel) {
        try {
          const parsed = parseDocx(fileBuffer);
          documentModel = parsed.documentModel;
          
          // Extract & save media images
          if (parsed.mediaFiles && Object.keys(parsed.mediaFiles).length > 0) {
            const versionImgDir = path.join(imgDir, `${template._id}_v1`);
            if (!fs.existsSync(versionImgDir)) fs.mkdirSync(versionImgDir, { recursive: true });

            for (const [mediaPath, buf] of Object.entries(parsed.mediaFiles)) {
              const imgFileName = path.basename(mediaPath);
              const imgDiskPath = path.join(versionImgDir, imgFileName);
              fs.writeFileSync(imgDiskPath, buf);

              const relItem = parsed.images.find(i => i.mediaPath === mediaPath);
              images.push({
                relationshipId: relItem ? relItem.relationshipId : imgFileName,
                fileKey: path.join('uploads', 'templates', 'images', `${template._id}_v1`, imgFileName),
                contentType: imgFileName.endsWith('.png') ? 'image/png' : 'image/jpeg',
                width: relItem ? relItem.width : undefined,
                height: relItem ? relItem.height : undefined,
              });
            }
          }
        } catch (err) {
          console.warn('Docx parsing error during upload:', err.message);
        }
      }
    }

    // 2. Create TemplateVersion 1
    const version = await templateRepository.createVersion({
      templateId: template._id,
      organizationId: template.organizationId,
      version: 1,
      fields: initialFields,
      templateContentHtml: templateData.templateContentHtml || '',
      originalFileKey,
      documentModel,
      images,
      createdBy: tenantContext.userId,
    });

    return { template, version };
  }

  async addFieldsToTemplate(templateId, fields, tenantContext = null) {
    await this._checkPlanLimits(tenantContext, 'EDIT');

    const template = await templateRepository.findById(templateId, tenantContext);
    if (!template) {
      throw new AppError('Template không tồn tại.', 404);
    }

    if (template.status === 'ARCHIVED') {
      throw new AppError('Không thể chỉnh sửa Template đã lưu trữ (ARCHIVED - BR-017).', 400);
    }

    // Validate key uniqueness (BR-016)
    const keySet = new Set();
    fields.forEach(f => {
      if (keySet.has(f.key)) {
        throw new AppError(`Field key '${f.key}' bị trùng lặp trong Template (BR-016).`, 400);
      }
      keySet.add(f.key);
    });

    const currentVersion = await templateRepository.findVersion(template._id, template.currentVersion);

    // Create new Version for template
    const newVersionNumber = template.currentVersion + 1;
    const version = await templateRepository.createVersion({
      templateId: template._id,
      organizationId: template.organizationId,
      version: newVersionNumber,
      fields: fields,
      originalFileKey: currentVersion?.originalFileKey || '',
      documentModel: currentVersion?.documentModel || null,
      templateContentHtml: currentVersion?.templateContentHtml || '',
      images: currentVersion?.images || [],
      createdBy: tenantContext.userId,
    });

    template.currentVersion = newVersionNumber;
    await template.save();

    return { template, version };
  }

  async updateTemplateDocument(templateId, documentModel, fields = null, tenantContext = null) {
    await this._checkPlanLimits(tenantContext, 'EDIT');

    const template = await templateRepository.findById(templateId, tenantContext);
    if (!template) {
      throw new AppError('Template không tồn tại.', 404);
    }

    const currentVersion = await templateRepository.findVersion(template._id, template.currentVersion);
    const updatedFields = fields || currentVersion?.fields || [];

    const newVersionNumber = template.currentVersion + 1;
    const version = await templateRepository.createVersion({
      templateId: template._id,
      organizationId: template.organizationId,
      version: newVersionNumber,
      fields: updatedFields,
      originalFileKey: currentVersion?.originalFileKey || '',
      documentModel: documentModel,
      templateContentHtml: currentVersion?.templateContentHtml || '',
      images: currentVersion?.images || [],
      createdBy: tenantContext.userId,
    });

    template.currentVersion = newVersionNumber;
    await template.save();

    return { template, version };
  }

  async publishTemplate(templateId, tenantContext = null) {
    const template = await templateRepository.findById(templateId, tenantContext);
    if (!template) {
      throw new AppError('Template không tồn tại.', 404);
    }

    if (template.status === 'ARCHIVED') {
      throw new AppError('Không thể Publish Template đã lưu trữ (BR-017).', 400);
    }

    const latestVersion = await templateRepository.findVersion(template._id, template.currentVersion);
    if (!latestVersion || !latestVersion.fields || latestVersion.fields.length === 0) {
      throw new AppError('Không thể Publish Template khi chưa có ít nhất một Dynamic Field hợp lệ (BR-017).', 400);
    }

    template.status = 'ACTIVE';
    await template.save();
    return template;
  }

  async archiveTemplate(templateId, tenantContext = null) {
    await this._checkPlanLimits(tenantContext, 'EDIT');
    const template = await templateRepository.findById(templateId, tenantContext);
    if (!template) {
      throw new AppError('Template không tồn tại.', 404);
    }

    template.status = 'ARCHIVED';
    await template.save();
    return template;
  }

  async unarchiveTemplate(templateId, tenantContext = null) {
    await this._checkPlanLimits(tenantContext, 'EDIT');
    const template = await templateRepository.findById(templateId, tenantContext);
    if (!template) {
      throw new AppError('Template không tồn tại.', 404);
    }

    // Restore back to ACTIVE status
    template.status = 'ACTIVE';
    await template.save();
    return template;
  }

  async deleteTemplate(templateId, tenantContext = null) {
    await this._checkPlanLimits(tenantContext, 'DELETE');
    const template = await templateRepository.findById(templateId, tenantContext);
    if (!template) {
      throw new AppError('Template không tồn tại.', 404);
    }

    const { Contract } = await import('../models/contract.model.js');

    await templateRepository.deleteById(templateId, tenantContext);
    await templateRepository.deleteVersionsByTemplateId(templateId);

    // Cascade: set templateId to null for contracts linked to this template
    await Contract.updateMany(
      { templateId },
      { $set: { templateId: null } }
    );

    return true;
  }

  async getTemplates(filter = {}, tenantContext = null) {
    const templates = await templateRepository.find(filter, tenantContext, { sort: { createdAt: 1 } });
    
    // Check if organization plan is EXPIRED
    if (tenantContext && tenantContext.organizationId) {
      const org = await organizationRepository.findById(tenantContext.organizationId);
      if (org && org.plan !== 'FREE' && org.planExpiresAt && new Date(org.planExpiresAt) < new Date()) {
        // Mark 3rd template onwards as locked
        return templates.map((t, idx) => {
          const tObj = t.toObject ? t.toObject() : { ...t };
          if (idx >= 2) {
            tObj.isLocked = true;
            tObj.lockReason = 'Gói dịch vụ đã hết hạn. Vui lòng gia hạn để mở khóa!';
          }
          return tObj;
        });
      }
    }

    return templates;
  }

  async getTemplateDetails(templateId, tenantContext = null) {
    const template = await templateRepository.findById(templateId, tenantContext);
    if (!template) {
      throw new AppError('Template không tồn tại.', 404);
    }

    const version = await templateRepository.findVersion(template._id, template.currentVersion);
    const versionsHistory = await templateRepository.findVersions(template._id);

    return {
      template,
      currentVersionData: version,
      versionsHistory,
    };
  }

  // Parses uploaded DOCX buffer into full Document Model + extracted fields
  parseDocxFile(fileBuffer) {
    try {
      const parsed = parseDocx(fileBuffer);
      return parsed;
    } catch (err) {
      throw new AppError('Không thể đọc file DOCX mẫu: ' + err.message, 400);
    }
  }

  // Legacy fallback for extracting placeholders only
  parseDocxPlaceholders(fileBuffer) {
    try {
      const { placeholders } = parseDocx(fileBuffer);
      return placeholders;
    } catch (err) {
      // Fallback to Docxtemplater if docx-parser fails
      try {
        const zip = new PizZip(fileBuffer);
        const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
        const text = doc.getFullText();

        const regex = /\{\{([a-zA-Z0-9_.]+)\}\}/g;
        const matches = new Set();
        let match;
        while ((match = regex.exec(text)) !== null) {
          matches.add(match[1]);
        }
        return Array.from(matches);
      } catch (innerErr) {
        throw new AppError('Không thể đọc file DOCX mẫu: ' + err.message, 400);
      }
    }
  }
}

export const templateService = new TemplateService();

