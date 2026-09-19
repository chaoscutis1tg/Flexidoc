import { SystemSetting } from '../models/system-setting.model.js';

export class SystemSettingRepository {
  async getByKey(key) {
    return await SystemSetting.findOne({ key }).lean();
  }

  async setKey(key, value, updatedBy = null) {
    return await SystemSetting.findOneAndUpdate(
      { key },
      { key, value, updatedBy },
      { upsert: true, new: true, runValidators: true }
    );
  }
}

export const systemSettingRepository = new SystemSettingRepository();
