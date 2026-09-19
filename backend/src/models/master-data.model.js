import mongoose from 'mongoose';

const masterDataSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  type: {
    type: String,
    enum: ['EMPLOYEE', 'CUSTOMER', 'PARTNER'],
    required: true,
  },
  code: {
    type: String,
    trim: true,
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
    default: {},
  },
  searchText: {
    type: String,
    default: '',
  },
  deletedAt: {
    type: Date,
    default: null,
  }
}, {
  timestamps: true,
});

masterDataSchema.index({ organizationId: 1, type: 1 });
masterDataSchema.index({ organizationId: 1, searchText: 'text' });

masterDataSchema.pre('save', function(next) {
  if (this.data && typeof this.data === 'object') {
    this.searchText = Object.values(this.data)
      .filter(val => typeof val === 'string' || typeof val === 'number')
      .join(' ')
      .toLowerCase();
  }
  next();
});

export const MasterData = mongoose.model('MasterData', masterDataSchema);
