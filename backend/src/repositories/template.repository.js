import { BaseRepository } from './base.repository.js';
import { Template } from '../models/template.model.js';
import { TemplateVersion } from '../models/template-version.model.js';

export class TemplateRepository extends BaseRepository {
  constructor() {
    super(Template);
  }

  async findVersion(templateId, versionNumber) {
    return await TemplateVersion.findOne({ templateId, version: versionNumber });
  }

  async findLatestVersion(templateId) {
    return await TemplateVersion.findOne({ templateId }).sort({ version: -1 });
  }

  async createVersion(versionData) {
    const doc = new TemplateVersion(versionData);
    return await doc.save();
  }

  async findVersions(templateId) {
    return await TemplateVersion.find({ templateId }).sort({ version: -1 });
  }

  async deleteVersionsByTemplateId(templateId) {
    return await TemplateVersion.deleteMany({ templateId });
  }
}

export const templateRepository = new TemplateRepository();
