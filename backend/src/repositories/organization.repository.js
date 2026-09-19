import { BaseRepository } from './base.repository.js';
import { Organization } from '../models/organization.model.js';

export class OrganizationRepository extends BaseRepository {
  constructor() {
    super(Organization);
  }

  _buildScopeFilter(filter = {}, tenantContext = null) {
    const finalFilter = { ...filter, deletedAt: null };

    if (!tenantContext || tenantContext.role === 'SUPER_ADMIN') {
      return finalFilter;
    }

    const allowedOrgIds = tenantContext.allowedOrgIds && tenantContext.allowedOrgIds.length > 0
      ? tenantContext.allowedOrgIds
      : (tenantContext.organizationId ? [tenantContext.organizationId] : []);

    if (allowedOrgIds.length > 0 && !finalFilter._id) {
      finalFilter._id = allowedOrgIds.length === 1 ? allowedOrgIds[0] : { $in: allowedOrgIds };
    }

    return finalFilter;
  }

  async findByCode(code) {
    return await this.model.findOne({ code: code.toUpperCase(), deletedAt: null });
  }

  async findSubtree(orgId) {
    return await this.model.find({
      $or: [
        { _id: orgId },
        { ancestors: orgId },
      ],
      deletedAt: null,
    });
  }

  async findDirectChildren(orgId) {
    return await this.model.find({
      parentOrganizationId: orgId,
      deletedAt: null,
    });
  }
}

export const organizationRepository = new OrganizationRepository();
