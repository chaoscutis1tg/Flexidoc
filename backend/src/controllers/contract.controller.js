import { contractService } from '../services/contract.service.js';
import { auditLogService } from '../services/audit-log.service.js';
import { sendSuccess } from '../utils/response.util.js';

export const createContract = async (req, res, next) => {
  try {
    const result = await contractService.createContract(req.body, req.tenantContext);
    await auditLogService.logAction(req, 'CONTRACT_CREATED', 'contract', result.contract._id);
    return sendSuccess(res, 201, 'Sinh Hợp đồng mới thành công', result);
  } catch (error) {
    next(error);
  }
};

export const getContracts = async (req, res, next) => {
  try {
    const contracts = await contractService.getContracts({}, req.tenantContext);
    return sendSuccess(res, 200, 'Lấy danh sách Hợp đồng thành công', contracts);
  } catch (error) {
    next(error);
  }
};

export const getContractDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const details = await contractService.getContractDetails(id, req.tenantContext);
    return sendSuccess(res, 200, 'Lấy chi tiết Hợp đồng thành công', details);
  } catch (error) {
    next(error);
  }
};

export const updateContractData = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { inputData } = req.body;
    const result = await contractService.updateContractData(id, inputData, req.tenantContext);

    await auditLogService.logAction(req, 'CONTRACT_UPDATED', 'contract', id);
    return sendSuccess(res, 200, 'Cập nhật Hợp đồng thành công (tạo Version mới)', result);
  } catch (error) {
    next(error);
  }
};

export const downloadContractPdf = async (req, res, next) => {
  try {
    const { id } = req.params;
    const details = await contractService.getContractDetails(id, req.tenantContext);
    const pdfBuffer = await contractService.generatePdfBuffer(details.currentVersionData.renderedContent);

    await auditLogService.logAction(req, 'CONTRACT_DOWNLOADED_PDF', 'contract', id);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Contract_${details.contract.code}.pdf"`);
    return res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

export const downloadContractDocx = async (req, res, next) => {
  try {
    const { id } = req.params;
    const details = await contractService.getContractDetails(id, req.tenantContext);
    const docxBuffer = await contractService.generateDocxBuffer(id, req.tenantContext);

    await auditLogService.logAction(req, 'CONTRACT_DOWNLOADED_DOCX', 'contract', id);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="Contract_${details.contract.code}.docx"`);
    return res.send(docxBuffer);
  } catch (error) {
    next(error);
  }
};

