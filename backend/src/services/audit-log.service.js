import { auditLogRepository } from '../repositories/audit-log.repository.js';

export class AuditLogService {
  async logAction(req, action, resource, resourceId = null, targetOrganizationId = null, metadata = {}) {
    try {
      const userId = req.user ? (req.user._id || req.user) : null;
      let organizationId = req.tenantContext ? req.tenantContext.organizationId : null;
      if (organizationId === "" || organizationId === "null" || organizationId === "undefined") organizationId = null;
      if (organizationId && typeof organizationId === 'object' && organizationId._id) {
        organizationId = organizationId._id;
      }
      
      if (targetOrganizationId === "" || targetOrganizationId === "null" || targetOrganizationId === "undefined") targetOrganizationId = null;
      if (targetOrganizationId && typeof targetOrganizationId === 'object' && targetOrganizationId._id) {
        targetOrganizationId = targetOrganizationId._id;
      }
      const ip = req.headers ? (req.headers['x-forwarded-for'] || (req.socket ? req.socket.remoteAddress : '127.0.0.1')) : '127.0.0.1';
      const userAgent = req.headers ? (req.headers['user-agent'] || 'Unknown') : 'Unknown';

      if (!userId) return;

      await auditLogRepository.createLog({
        userId,
        organizationId,
        targetOrganizationId,
        action,
        resource,
        resourceId,
        ip,
        userAgent,
        metadata,
      });
    } catch (err) {
      console.error('[AuditLog Error]', err);
    }
  }

  async getLogs(filter, tenantContext, limit, skip) {
    return await auditLogRepository.findLogs(filter, tenantContext, limit, skip);
  }
}

export const auditLogService = new AuditLogService();
