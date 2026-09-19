import { BaseRepository } from './base.repository.js';
import { MasterData } from '../models/master-data.model.js';

export class MasterDataRepository extends BaseRepository {
  constructor() {
    super(MasterData);
  }

  async searchMasterData(type, searchKeyword, department, tenantContext = null) {
    const filter = {};
    if (type) filter.type = type;
    if (department && department !== 'ALL' && department !== 'Tất cả') {
      filter['data.department'] = department;
    }
    if (searchKeyword) {
      filter.$or = [
        { code: { $regex: searchKeyword, $options: 'i' } },
        { searchText: { $regex: searchKeyword, $options: 'i' } },
        { 'data.fullName': { $regex: searchKeyword, $options: 'i' } },
        { 'data.representative': { $regex: searchKeyword, $options: 'i' } },
        { 'data.email': { $regex: searchKeyword, $options: 'i' } },
        { 'data.idNumber': { $regex: searchKeyword, $options: 'i' } },
        { 'data.companyName': { $regex: searchKeyword, $options: 'i' } },
        { 'data.position': { $regex: searchKeyword, $options: 'i' } },
        { 'data.department': { $regex: searchKeyword, $options: 'i' } },
      ];
    }
    return await this.find(filter, tenantContext, { limit: 100, sort: { createdAt: -1 } });
  }
}

export const masterDataRepository = new MasterDataRepository();
