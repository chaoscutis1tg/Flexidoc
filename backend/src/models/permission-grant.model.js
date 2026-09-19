import mongoose from 'mongoose';

const permissionGrantSchema = new mongoose.Schema({
  granterOrganizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  granteeOrganizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  resource: {
    type: String,
    required: true, // e.g., 'contract', 'template', 'user'
  },
  action: {
    type: String,
    required: true, // e.g., 'view', 'manage'
  },
  scope: {
    type: String,
    enum: ['SELF', 'CHILDREN', 'DESCENDANTS'],
    default: 'SELF',
  },
  grantedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  expiresAt: {
    type: Date,
    default: null,
  }
}, {
  timestamps: true,
});

permissionGrantSchema.index({ granteeOrganizationId: 1, resource: 1, action: 1 });
permissionGrantSchema.index({ granterOrganizationId: 1 });

export const PermissionGrant = mongoose.model('PermissionGrant', permissionGrantSchema);
