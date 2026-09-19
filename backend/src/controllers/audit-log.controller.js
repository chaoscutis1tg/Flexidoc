import { auditLogService } from '../services/audit-log.service.js';
import { sendSuccess } from '../utils/response.util.js';

export const getAuditLogs = async (req, res, next) => {
  try {
    const { action, resource } = req.query;
    const filter = {};
    if (action) filter.action = action;
    if (resource) filter.resource = resource;

    const logs = await auditLogService.getLogs(filter, req.tenantContext, 100, 0);
    return sendSuccess(res, 200, 'Lấy danh sách Audit Log thành công', logs);
  } catch (error) {
    next(error);
  }
};
