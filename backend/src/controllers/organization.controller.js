import { organizationService } from '../services/organization.service.js';
import { subscriptionPlanService } from '../services/subscription-plan.service.js';
import { auditLogService } from '../services/audit-log.service.js';
import { sendSuccess } from '../utils/response.util.js';

export const createOrganization = async (req, res, next) => {
  try {
    const { name, code, parentOrganizationId, managerName, managerEmail } = req.body;
    const org = await organizationService.createOrganization(
      { name, code, managerName, managerEmail },
      parentOrganizationId || null,
      req.tenantContext
    );

    await auditLogService.logAction(req, 'ORGANIZATION_CREATED', 'organization', org._id, org._id);
    return sendSuccess(res, 201, 'Tạo tổ chức mới thành công', org);
  } catch (error) {
    next(error);
  }
};

export const getMyPendingInvitations = async (req, res, next) => {
  try {
    const invitations = await organizationService.getMyPendingInvitations(req.user?.email);
    return sendSuccess(res, 200, 'Lấy danh sách lời mời quản lý tổ chức thành công', invitations);
  } catch (error) {
    next(error);
  }
};

export const approveOrganization = async (req, res, next) => {
  try {
    const { id } = req.params;
    const org = await organizationService.approveOrganization(id, req.user);

    await auditLogService.logAction(req, 'ORGANIZATION_APPROVED', 'organization', org._id, org._id);
    return sendSuccess(res, 200, 'Xác nhận và Kích hoạt Chi Nhánh Tổ Chức Con thành công!', org);
  } catch (error) {
    next(error);
  }
};

export const rejectOrganization = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body || {};
    const org = await organizationService.rejectOrganization(id, reason, req.user);

    await auditLogService.logAction(req, 'ORGANIZATION_REJECTED', 'organization', org._id, org._id);
    return sendSuccess(res, 200, 'Đã từ chối quyền quản lý chi nhánh thành công', org);
  } catch (error) {
    next(error);
  }
};

export const updateOrganization = async (req, res, next) => {
  try {
    const { id } = req.params;
    const org = await organizationService.updateOrganization(id, req.body, req.tenantContext);
    
    await auditLogService.logAction(req, 'ORGANIZATION_UPDATED', 'organization', org._id, org._id);
    return sendSuccess(res, 200, 'Cập nhật tổ chức thành công', org);
  } catch (error) {
    next(error);
  }
};

export const deleteOrganization = async (req, res, next) => {
  try {
    const { id } = req.params;
    await organizationService.deleteOrganization(id, req.tenantContext);
    await auditLogService.logAction(req, 'ORGANIZATION_DELETED', 'organization', id);
    return sendSuccess(res, 200, 'Xóa tổ chức thành công');
  } catch (error) {
    next(error);
  }
};

export const getOrganizationTree = async (req, res, next) => {
  try {
    const tree = await organizationService.getOrganizationTree(req.tenantContext);
    return sendSuccess(res, 200, 'Lấy danh sách cây tổ chức thành công', tree);
  } catch (error) {
    next(error);
  }
};

export const grantPermission = async (req, res, next) => {
  try {
    const { granteeOrganizationId, resource, action, scope } = req.body;
    const grant = await organizationService.grantPermission(
      req.tenantContext.organizationId,
      granteeOrganizationId,
      resource,
      action,
      scope || 'SELF',
      req.user._id
    );

    await auditLogService.logAction(req, 'PERMISSION_GRANTED', 'permission_grant', grant._id);
    return sendSuccess(res, 201, 'Cấp quyền truy cập liên tổ chức thành công', grant);
  } catch (error) {
    next(error);
  }
};

export const renewSubscription = async (req, res, next) => {
  try {
    const { planName, orgId: targetOrgId } = req.body;
    const orgId = targetOrgId || req.tenantContext.organizationId;
    const org = await organizationService.renewSubscription(orgId, planName, req.tenantContext);

    await auditLogService.logAction(req, 'SUBSCRIPTION_RENEWED', 'organization', orgId);
    return sendSuccess(res, 200, `Gia hạn thành công gói ${planName} cho tổ chức!`, org);
  } catch (error) {
    next(error);
  }
};

export const getSubscriptionPlans = async (req, res, next) => {
  try {
    const plans = await subscriptionPlanService.getAllPlans();
    return sendSuccess(res, 200, 'Lấy danh sách gói cước thành công', plans);
  } catch (error) {
    next(error);
  }
};

export const updateSubscriptionPlan = async (req, res, next) => {
  try {
    const { code } = req.params;
    const plan = await subscriptionPlanService.updatePlan(code, req.body);
    await auditLogService.logAction(req, 'PLAN_UPDATED', 'subscription_plan', code);
    return sendSuccess(res, 200, `Cập nhật cấu hình giá gói ${code} thành công`, plan);
  } catch (error) {
    next(error);
  }
};

