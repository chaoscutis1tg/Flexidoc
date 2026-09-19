import { auditLogService } from '../services/audit-log.service.js';
import { sendSuccess } from '../utils/response.util.js';

export const getAuditLogs = async (req, res, next) => {
  try {
    const { action, resource, limit, page } = req.query;
    const filter = {};
    if (action) filter.action = action;
    if (resource) filter.resource = resource;

    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const skip = (pageNum - 1) * limitNum;

    const logs = await auditLogService.getLogs(filter, req.tenantContext, limitNum, skip);
    return sendSuccess(res, 200, 'Lấy danh sách Audit Log thành công', logs);
  } catch (error) {
    next(error);
  }
};
