import mongoose from 'mongoose';

const subscriptionPlanSchema = new mongoose.Schema({
  code: {
    type: String,
    enum: ['FREE', 'BASIC', 'PRO', 'VIP'],
    required: true,
    unique: true,
  },
  title: {
    type: String,
    required: true,
  },
  subtitle: {
    type: String,
    default: '',
  },
  price: {
    type: Number,
    required: true,
    default: 0,
  },
  formattedPrice: {
    type: String,
    required: true,
  },
  billingCycle: {
    type: String,
    default: '/ tháng',
  },
  badge: {
    type: String,
    default: '',
  },
  popular: {
    type: Boolean,
    default: false,
  },
  popularBadgeText: {
    type: String,
    default: '',
  },
  maxTemplates: {
    type: Number,
    default: 10,
  },
  allowEditDelete: {
    type: Boolean,
    default: true,
  },
  features: [{
    type: String,
  }],
  sortOrder: {
    type: Number,
    default: 0,
  }
}, {
  timestamps: true,
});

export const SubscriptionPlan = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
