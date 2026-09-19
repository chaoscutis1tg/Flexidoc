import { BaseRepository } from './base.repository.js';
import { Contract } from '../models/contract.model.js';
import { ContractVersion } from '../models/contract-version.model.js';

export class ContractRepository extends BaseRepository {
  constructor() {
    super(Contract);
  }

  async findByCode(code, tenantContext = null) {
    return await this.findOne({ code }, tenantContext);
  }

  async findVersion(contractId, versionNumber) {
    return await ContractVersion.findOne({ contractId, version: versionNumber });
  }

  async findLatestVersion(contractId) {
    return await ContractVersion.findOne({ contractId }).sort({ version: -1 });
  }

  async createVersion(versionData) {
    const doc = new ContractVersion(versionData);
    return await doc.save();
  }

  async findVersions(contractId) {
    return await ContractVersion.find({ contractId }).sort({ version: -1 }).populate('editedBy', 'fullName email');
  }
}

export const contractRepository = new ContractRepository();
