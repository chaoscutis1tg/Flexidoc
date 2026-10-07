import { systemSettingRepository } from '../repositories/system-setting.repository.js';
import { auditLogService } from './audit-log.service.js';
import { Organization } from '../models/organization.model.js';
import { User } from '../models/user.model.js';
import { Contract } from '../models/contract.model.js';
import { Template } from '../models/template.model.js';
import { MasterData } from '../models/master-data.model.js';
import { ContractVersion } from '../models/contract-version.model.js';
import { TemplateVersion } from '../models/template-version.model.js';

export const DEFAULT_PAYMENT_CONFIG = {
  bankName: 'MB BANK',
  bankCode: 'MB',
  accountNumber: '5408092006',
  accountName: 'DO VAN KHOA',
  orderPrefix: 'FDDH',
  sepayApiKey: 'sepay_secret_key_flexidoc_2026',
  serverBaseUrl: process.env.SERVER_BASE_URL || 'http://localhost:5000',
  sepayWebhookPath: process.env.SEPAY_WEBHOOK_PATH || '/api/v1/payments/sepay-webhook',
};

export const DEFAULT_SYSTEM_CONFIG = {
  enableResponseEncryption: true,
  enableSepayHeaderAuth: true,
  tokenExpiryHours: 24,
  allowPublicOrgRegistration: true,
  defaultFreeContractLimit: 10,
};

export const DEFAULT_PRICING_CONFIG = {
  starterPrice: 0,
  basicMonthlyPrice: 199000,
  proMonthlyPrice: 299000,
  vipMonthlyPrice: 999000,
  discount3MonthsPercent: 5,
  discount6MonthsPercent: 10,
  yearlyDiscountPercent: 20,
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
      serverBaseUrl: newConfig.serverBaseUrl !== undefined ? String(newConfig.serverBaseUrl).trim() : current.serverBaseUrl,
      sepayWebhookPath: newConfig.sepayWebhookPath ? String(newConfig.sepayWebhookPath).trim() : current.sepayWebhookPath,
    };

    const result = await systemSettingRepository.setKey('PAYMENT_CONFIG', updatedValue, adminUser?._id);

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

  async getSystemConfig() {
    const setting = await systemSettingRepository.getByKey('SYSTEM_CONFIG');
    if (!setting || !setting.value) {
      return DEFAULT_SYSTEM_CONFIG;
    }
    return {
      ...DEFAULT_SYSTEM_CONFIG,
      ...setting.value,
    };
  }

  async updateSystemConfig(newConfig, adminUser) {
    const current = await this.getSystemConfig();
    const updatedValue = {
      ...current,
      ...newConfig,
    };

    const result = await systemSettingRepository.setKey('SYSTEM_CONFIG', updatedValue, adminUser?._id);

    if (adminUser) {
      const orgId = adminUser.organizationId ? (adminUser.organizationId._id || adminUser.organizationId) : null;
      await auditLogService.logAction(
        { user: adminUser, tenantContext: { organizationId: orgId } },
        'SYSTEM_SECURITY_SETTING_UPDATED',
        'systemSetting',
        result._id
      );
    }

    return updatedValue;
  }

  async getPricingConfig() {
    const setting = await systemSettingRepository.getByKey('PRICING_CONFIG');
    if (!setting || !setting.value) {
      return DEFAULT_PRICING_CONFIG;
    }
    return {
      ...DEFAULT_PRICING_CONFIG,
      ...setting.value,
    };
  }

  async updatePricingConfig(newConfig, adminUser) {
    const current = await this.getPricingConfig();
    const updatedValue = {
      ...current,
      ...newConfig,
      starterPrice: Number(newConfig.starterPrice ?? current.starterPrice),
      basicMonthlyPrice: Number(newConfig.basicMonthlyPrice ?? current.basicMonthlyPrice ?? 199000),
      proMonthlyPrice: Number(newConfig.proMonthlyPrice ?? current.proMonthlyPrice),
      vipMonthlyPrice: Number(newConfig.vipMonthlyPrice ?? current.vipMonthlyPrice),
      discount3MonthsPercent: Number(newConfig.discount3MonthsPercent ?? current.discount3MonthsPercent ?? 5),
      discount6MonthsPercent: Number(newConfig.discount6MonthsPercent ?? current.discount6MonthsPercent ?? 10),
      yearlyDiscountPercent: Number(newConfig.yearlyDiscountPercent ?? current.yearlyDiscountPercent ?? 20),
    };

    const result = await systemSettingRepository.setKey('PRICING_CONFIG', updatedValue, adminUser?._id);

    if (adminUser) {
      const orgId = adminUser.organizationId ? (adminUser.organizationId._id || adminUser.organizationId) : null;
      await auditLogService.logAction(
        { user: adminUser, tenantContext: { organizationId: orgId } },
        'PRICING_SETTING_UPDATED',
        'systemSetting',
        result._id
      );
    }

    return updatedValue;
  }

  async getAllSettings() {
    const payment = await this.getPaymentConfig();
    const system = await this.getSystemConfig();
    const pricing = await this.getPricingConfig();
    return {
      payment,
      system,
      pricing,
    };
  }

  async cleanupDeletedData() {
    const filter = { deletedAt: { $ne: null } };
    const results = {};

    results.organizations = (await Organization.deleteMany(filter)).deletedCount || 0;
    results.users = (await User.deleteMany(filter)).deletedCount || 0;
    results.contracts = (await Contract.deleteMany(filter)).deletedCount || 0;
    results.templates = (await Template.deleteMany(filter)).deletedCount || 0;
    results.masterData = (await MasterData.deleteMany(filter)).deletedCount || 0;
    results.contractVersions = (await ContractVersion.deleteMany(filter)).deletedCount || 0;
    results.templateVersions = (await TemplateVersion.deleteMany(filter)).deletedCount || 0;

    return results;
  }
}

export const systemSettingService = new SystemSettingService();

