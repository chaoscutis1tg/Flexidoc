/**
 * BaseRepository tự động áp dụng Tenant Scoping (organizationId) cho mọi thao tác đọc/ghi.
 * Giúp đảm bảo dữ liệu giữa các tổ chức được cách ly hoàn toàn, chống rò rỉ dữ liệu chéo (Cross-tenant data leakage).
 */
export class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  /**
   * Tạo query filter kết hợp phạm vi được phép (allowedScope) của User hiện tại.
   */
  _buildScopeFilter(filter = {}, tenantContext = null) {
    const finalFilter = { ...filter, deletedAt: null };

    // Nếu không có tenantContext hoặc là SUPER_ADMIN không chọn tổ chức cụ thể
    if (!tenantContext || (tenantContext.role === 'SUPER_ADMIN' && !tenantContext.organizationId && (!tenantContext.allowedOrgIds || tenantContext.allowedOrgIds.length === 0))) {
      return finalFilter;
    }

    const allowedOrgIds = (tenantContext.allowedOrgIds && tenantContext.allowedOrgIds.length > 0)
      ? tenantContext.allowedOrgIds
      : (tenantContext.organizationId ? [tenantContext.organizationId] : []);

    if (allowedOrgIds.length === 1) {
      finalFilter.organizationId = allowedOrgIds[0];
    } else if (allowedOrgIds.length > 1) {
      finalFilter.organizationId = { $in: allowedOrgIds };
    }

    return finalFilter;
  }

  async find(filter = {}, tenantContext = null, options = {}) {
    const scopeFilter = this._buildScopeFilter(filter, tenantContext);
    let query = this.model.find(scopeFilter);

    if (options.select) query = query.select(options.select);
    if (options.populate) query = query.populate(options.populate);
    if (options.sort) query = query.sort(options.sort);
    if (options.limit) query = query.limit(options.limit);
    if (options.skip) query = query.skip(options.skip);

    return await query.exec();
  }

  async count(filter = {}, tenantContext = null) {
    const scopeFilter = this._buildScopeFilter(filter, tenantContext);
    return await this.model.countDocuments(scopeFilter);
  }

  async findOne(filter = {}, tenantContext = null, options = {}) {
    const scopeFilter = this._buildScopeFilter(filter, tenantContext);
    let query = this.model.findOne(scopeFilter);

    if (options.select) query = query.select(options.select);
    if (options.populate) query = query.populate(options.populate);

    return await query.exec();
  }

  async findById(id, tenantContext = null, options = {}) {
    return await this.findOne({ _id: id }, tenantContext, options);
  }

  async create(data, tenantContext = null) {
    if (tenantContext && tenantContext.role !== 'SUPER_ADMIN' && tenantContext.organizationId) {
      data.organizationId = tenantContext.organizationId;
    }
    const doc = new this.model(data);
    return await doc.save();
  }

  async updateById(id, data, tenantContext = null) {
    const scopeFilter = this._buildScopeFilter({ _id: id }, tenantContext);
    return await this.model.findOneAndUpdate(scopeFilter, data, { new: true, runValidators: true });
  }

  async softDeleteById(id, tenantContext = null) {
    const scopeFilter = this._buildScopeFilter({ _id: id }, tenantContext);
    return await this.model.findOneAndUpdate(scopeFilter, { deletedAt: new Date() }, { new: true });
  }

  async updateMany(filter = {}, data, tenantContext = null) {
    const scopeFilter = this._buildScopeFilter(filter, tenantContext);
    return await this.model.updateMany(scopeFilter, data);
  }

  async deleteMany(filter = {}, tenantContext = null) {
    const scopeFilter = this._buildScopeFilter(filter, tenantContext);
    return await this.model.deleteMany(scopeFilter);
  }

  async deleteById(id, tenantContext = null) {
    const scopeFilter = this._buildScopeFilter({ _id: id }, tenantContext);
    return await this.model.findOneAndDelete(scopeFilter);
  }
}
