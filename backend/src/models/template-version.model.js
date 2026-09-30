import mongoose from 'mongoose';

const fieldSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  key: {
    type: String,
    required: [true, 'Field key là bắt buộc'],
    trim: true,
  },
  label: {
    type: String,
    required: [true, 'Field label là bắt buộc'],
    trim: true,
  },
  originalText: {
    type: String,
    default: '',
  },
  type: {
    type: String,
    enum: ['TEXT', 'TEXTAREA', 'NUMBER', 'CURRENCY', 'DATE', 'DATETIME', 'EMAIL', 'PHONE', 'ADDRESS', 'SELECT', 'RADIO', 'CHECKBOX', 'BOOLEAN'],
    default: 'TEXT',
  },
  required: {
    type: Boolean,
    default: false,
  },
  defaultValue: {
    type: mongoose.Schema.Types.Mixed,
    default: '',
  },
  placeholder: {
    type: String,
    default: '',
  },
  options: [{
    label: String,
    value: String,
  }],
  validation: {
    min: Number,
    max: Number,
    minLength: Number,
    maxLength: Number,
    pattern: String,
    customMessage: String,
  },
  order: {
    type: Number,
    default: 0,
  },
  masterDataBinding: {
    type: {
      type: String,
      enum: ['EMPLOYEE', 'CUSTOMER', 'PARTNER', null],
      default: null,
    },
    sourceField: String,
  }
}, { _id: false });

const templateVersionSchema = new mongoose.Schema({
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Template',
    required: true,
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  version: {
    type: Number,
    required: true,
  },
  fields: [fieldSchema],
  fileKey: {
    type: String,
    default: '',
  },
  originalFileKey: {
    type: String,
    default: '',
  },
  documentModel: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  templateContentHtml: {
    type: String,
    default: '',
  },
  images: [{
    relationshipId: String,
    fileKey: String,
    contentType: String,
    width: Number,
    height: Number,
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }
}, {
  timestamps: true,
});

templateVersionSchema.index({ templateId: 1, version: -1 }, { unique: true });
templateVersionSchema.index({ organizationId: 1 });

export const TemplateVersion = mongoose.model('TemplateVersion', templateVersionSchema);
