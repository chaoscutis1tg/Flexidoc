import mongoose from 'mongoose';

const organizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Tên tổ chức là bắt buộc'],
    trim: true,
  },
  code: {
    type: String,
    required: [true, 'Mã tổ chức là bắt buộc'],
    unique: true,
    uppercase: true,
    trim: true,
  },
  parentOrganizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    default: null,
  },
  ancestors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
  }],
  level: {
    type: Number,
    default: 0,
  },
  managerName: {
    type: String,
    trim: true,
    default: '',
  },
  managerEmail: {
    type: String,
    trim: true,
    lowercase: true,
    default: '',
  },
  managerUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'PENDING_APPROVAL', 'EXPIRED', 'SUSPENDED', 'LOCKED', 'REJECTED_BY_MANAGER'],
    default: 'ACTIVE',
  },
  rejectionReason: {
    type: String,
    default: '',
  },
  plan: {
    type: String,
    enum: ['FREE', 'BASIC', 'PRO', 'VIP'],
    default: 'FREE',
  },
  planExpiresAt: {
    type: Date,
    default: null,
  },
  deletedAt: {
    type: Date,
    default: null,
  }
}, {
  timestamps: true,
});

organizationSchema.index({ code: 1 }, { unique: true });
organizationSchema.index({ parentOrganizationId: 1 });
organizationSchema.index({ ancestors: 1 });
organizationSchema.index({ status: 1, deletedAt: 1 });

export const Organization = mongoose.model('Organization', organizationSchema);
