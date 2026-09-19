import { masterDataRepository } from '../repositories/master-data.repository.js';
import { AppError } from '../utils/app-error.js';

export class MasterDataService {
  async createMasterData(type, code, data, tenantContext = null) {
    if (code) {
      const cleanCode = String(code).trim();
      const existing = await masterDataRepository.findOne({ code: cleanCode }, tenantContext);
      if (existing) {
        throw new AppError(`Mã định danh "${cleanCode}" đã tồn tại trong tổ chức. Vui lòng nhập mã khác.`, 400);
      }
    }

    return await masterDataRepository.create({
      type,
      code: code ? String(code).trim() : code,
      data,
    }, tenantContext);
  }

  async getMasterDataList(type, searchKeyword, department, tenantContext = null) {
    return await masterDataRepository.searchMasterData(type, searchKeyword, department, tenantContext);
  }

  async getMasterDataById(id, tenantContext = null) {
    const item = await masterDataRepository.findById(id, tenantContext);
    if (!item) {
      throw new AppError('Bản ghi MasterData không tồn tại.', 404);
    }
    return item;
  }

  async updateMasterData(id, updateData, tenantContext = null) {
    if (updateData.code) {
      const cleanCode = String(updateData.code).trim();
      const existing = await masterDataRepository.findOne({ code: cleanCode, _id: { $ne: id } }, tenantContext);
      if (existing) {
        throw new AppError(`Mã định danh "${cleanCode}" đã trùng với một bản ghi khác trong tổ chức.`, 400);
      }
    }

    const item = await masterDataRepository.updateById(id, { data: updateData }, tenantContext);
    if (!item) {
      throw new AppError('Không thể cập nhật MasterData.', 404);
    }
    return item;
  }

  async deleteMasterData(id, tenantContext = null) {
    return await masterDataRepository.softDeleteById(id, tenantContext);
  }
}

export const masterDataService = new MasterDataService();
