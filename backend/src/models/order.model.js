import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  orderCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  plan: {
    type: String,
    enum: ['FREE', 'BASIC', 'PRO', 'VIP'],
    required: true,
  },
  durationMonths: {
    type: Number,
    required: true,
    default: 1,
  },
  amount: {
    type: Number,
    required: true,
    default: 0,
  },
  status: {
    type: String,
    enum: ['PENDING', 'SUCCESS', 'REJECTED', 'CANCELLED'],
    default: 'PENDING',
  },
  paymentMethod: {
    type: String,
    enum: ['SEPAY_WEBHOOK', 'MANUAL_ADMIN', 'FREE_UPGRADE'],
    default: 'SEPAY_WEBHOOK',
  },
  paymentRef: {
    type: String,
    default: '',
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  approvedAt: {
    type: Date,
    default: null,
  },
  rejectionReason: {
    type: String,
    default: '',
  },
  notes: {
    type: String,
    default: '',
  }
}, {
  timestamps: true,
});

orderSchema.index({ orderCode: 1 }, { unique: true });
orderSchema.index({ organizationId: 1, createdAt: -1 });
orderSchema.index({ status: 1 });

export const Order = mongoose.model('Order', orderSchema);
