import { templateService } from '../services/template.service.js';
import { auditLogService } from '../services/audit-log.service.js';
import { sendSuccess } from '../utils/response.util.js';

export const createTemplate = async (req, res, next) => {
  try {
    const { name, category, description, templateContentHtml, fields } = req.body;
    const result = await templateService.createTemplate(
      { name, category, description, templateContentHtml },
      fields || [],
      req.tenantContext
    );

    await auditLogService.logAction(req, 'TEMPLATE_CREATED', 'template', result.template._id);
    return sendSuccess(res, 201, 'Tạo Template mẫu hợp đồng thành công', result);
  } catch (error) {
    next(error);
  }
};

export const addFieldsToTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { fields } = req.body;
    const result = await templateService.addFieldsToTemplate(id, fields, req.tenantContext);

    await auditLogService.logAction(req, 'TEMPLATE_FIELDS_UPDATED', 'template', id);
    return sendSuccess(res, 200, 'Cập nhật danh sách Dynamic Field cho Template thành công', result);
  } catch (error) {
    next(error);
  }
};

export const publishTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const template = await templateService.publishTemplate(id, req.tenantContext);

    await auditLogService.logAction(req, 'TEMPLATE_PUBLISHED', 'template', id);
    return sendSuccess(res, 200, 'Publish Template thành công (chuyển sang trạng thái ACTIVE)', template);
  } catch (error) {
    next(error);
  }
};

export const archiveTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const template = await templateService.archiveTemplate(id, req.tenantContext);

    await auditLogService.logAction(req, 'TEMPLATE_ARCHIVED', 'template', id);
    return sendSuccess(res, 200, 'Archive Template thành công', template);
  } catch (error) {
    next(error);
  }
};

export const deleteTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;
    await templateService.deleteTemplate(id, req.tenantContext);

    await auditLogService.logAction(req, 'TEMPLATE_DELETED', 'template', id);
    return sendSuccess(res, 200, 'Xóa Mẫu Hợp Đồng thành công');
  } catch (error) {
    next(error);
  }
};

export const getTemplates = async (req, res, next) => {
  try {
    const templates = await templateService.getTemplates({}, req.tenantContext);
    return sendSuccess(res, 200, 'Lấy danh sách Template thành công', templates);
  } catch (error) {
    next(error);
  }
};

export const getTemplateDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const details = await templateService.getTemplateDetails(id, req.tenantContext);
    return sendSuccess(res, 200, 'Lấy chi tiết Template thành công', details);
  } catch (error) {
    next(error);
  }
};

export const parseDocx = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp file DOCX' });
    }
    const placeholders = templateService.parseDocxPlaceholders(req.file.buffer);
    return sendSuccess(res, 200, 'Parse file DOCX thành công', { placeholders });
  } catch (error) {
    next(error);
  }
};
