import { BaseRepository } from './base.repository.js';
import { AuditLog } from '../models/audit-log.model.js';

export class AuditLogRepository extends BaseRepository {
  constructor() {
    super(AuditLog);
  }

  async createLog(logData) {
    const log = new AuditLog(logData);
    return await log.save();
  }

  async findLogs(filter = {}, tenantContext = null, limit = 50, skip = 0) {
    const scopeFilter = this._buildScopeFilter(filter, tenantContext);
    return await this.model.find(scopeFilter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'fullName email role')
      .populate('organizationId', 'name code')
      .exec();
  }
}

export const auditLogRepository = new AuditLogRepository();
