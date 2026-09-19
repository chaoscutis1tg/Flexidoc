import { masterDataService } from '../services/master-data.service.js';
import { auditLogService } from '../services/audit-log.service.js';
import { sendSuccess } from '../utils/response.util.js';

export const createMasterData = async (req, res, next) => {
  try {
    const { type, code, data } = req.body;
    const item = await masterDataService.createMasterData(type, code, data, req.tenantContext);
    await auditLogService.logAction(req, 'MASTERDATA_CREATED', 'master_data', item._id);
    return sendSuccess(res, 201, 'Tạo bản ghi Master Data thành công', item);
  } catch (error) {
    next(error);
  }
};

export const getMasterDataList = async (req, res, next) => {
  try {
    const { type, search, department } = req.query;
    const items = await masterDataService.getMasterDataList(type, search, department, req.tenantContext);
    return sendSuccess(res, 200, 'Lấy danh sách Master Data thành công', items);
  } catch (error) {
    next(error);
  }
};

export const updateMasterData = async (req, res, next) => {
  try {
    const item = await masterDataService.updateMasterData(req.params.id, req.body.data, req.tenantContext);
    await auditLogService.logAction(req, 'MASTERDATA_UPDATED', 'master_data', item._id);
    return sendSuccess(res, 200, 'Cập nhật Master Data thành công', item);
  } catch (error) {
    next(error);
  }
};

export const deleteMasterData = async (req, res, next) => {
  try {
    const item = await masterDataService.deleteMasterData(req.params.id, req.tenantContext);
    await auditLogService.logAction(req, 'MASTERDATA_DELETED', 'master_data', item._id);
    return sendSuccess(res, 200, 'Xóa Master Data thành công', item);
  } catch (error) {
    next(error);
  }
};
