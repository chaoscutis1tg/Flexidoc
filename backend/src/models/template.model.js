import mongoose from 'mongoose';

const templateSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  name: {
    type: String,
    required: [true, 'Tên Template là bắt buộc'],
    trim: true,
  },
  category: {
    type: String,
    default: 'Chung',
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['DRAFT', 'ACTIVE', 'ARCHIVED'],
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

templateSchema.index({ organizationId: 1, status: 1 });
templateSchema.index({ organizationId: 1, name: 1 });

export const Template = mongoose.model('Template', templateSchema);
