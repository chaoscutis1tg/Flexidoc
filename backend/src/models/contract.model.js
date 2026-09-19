import mongoose from 'mongoose';

const contractSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  code: {
    type: String,
    required: [true, 'Mã hợp đồng là bắt buộc'],
    trim: true,
  },
  title: {
    type: String,
    required: [true, 'Tiêu đề hợp đồng là bắt buộc'],
    trim: true,
  },
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Template',
    required: true,
  },
  templateVersion: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['DRAFT', 'GENERATED', 'COMPLETED', 'CANCELLED'],
    default: 'DRAFT',
  },
  currentVersion: {
    type: Number,
    default: 1,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  deletedAt: {
    type: Date,
    default: null,
  }
}, {
  timestamps: true,
});

contractSchema.index({ organizationId: 1, code: 1 }, { unique: true });
contractSchema.index({ organizationId: 1, status: 1, createdAt: -1 });

export const Contract = mongoose.model('Contract', contractSchema);
