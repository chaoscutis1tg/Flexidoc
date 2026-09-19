import { systemSettingRepository } from '../repositories/system-setting.repository.js';
import { auditLogService } from './audit-log.service.js';

export const DEFAULT_PAYMENT_CONFIG = {
  bankName: 'MB BANK',
  bankCode: 'MB',
  accountNumber: '5408092006',
  accountName: 'DO VAN KHOA',
  orderPrefix: 'MTCTMS',
  sepayApiKey: 'sepay_secret_key_mtctms_2026',
};

export class SystemSettingService {
  async getPaymentConfig() {
    const setting = await systemSettingRepository.getByKey('PAYMENT_CONFIG');
    if (!setting || !setting.value) {
      return DEFAULT_PAYMENT_CONFIG;
    }
    return {
      ...DEFAULT_PAYMENT_CONFIG,
      ...setting.value,
    };
  }

  async updatePaymentConfig(newConfig, adminUser) {
    const current = await this.getPaymentConfig();
    const updatedValue = {
      ...current,
      ...newConfig,
      bankName: newConfig.bankName ? String(newConfig.bankName).trim() : current.bankName,
      bankCode: newConfig.bankCode ? String(newConfig.bankCode).trim().toUpperCase() : current.bankCode,
      accountNumber: newConfig.accountNumber ? String(newConfig.accountNumber).trim() : current.accountNumber,
      accountName: newConfig.accountName ? String(newConfig.accountName).trim().toUpperCase() : current.accountName,
      orderPrefix: newConfig.orderPrefix ? String(newConfig.orderPrefix).trim().toUpperCase() : current.orderPrefix,
      sepayApiKey: newConfig.sepayApiKey ? String(newConfig.sepayApiKey).trim() : current.sepayApiKey,
    };

    const result = await systemSettingRepository.setKey('PAYMENT_CONFIG', updatedValue, adminUser._id);

    // Audit Log
    if (adminUser) {
      const orgId = adminUser.organizationId ? (adminUser.organizationId._id || adminUser.organizationId) : null;
      await auditLogService.logAction(
        { user: adminUser, tenantContext: { organizationId: orgId } },
        'SYSTEM_SETTING_UPDATED',
        'systemSetting',
        result._id
      );
    }

    return updatedValue;
  }
}

export const systemSettingService = new SystemSettingService();
