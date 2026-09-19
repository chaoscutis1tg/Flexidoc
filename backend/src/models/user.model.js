import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    default: null,
  },
  email: {
    type: String,
    required: [true, 'Email là bắt buộc'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  passwordHash: {
    type: String,
    required: [true, 'Mật khẩu là bắt buộc'],
    select: false,
  },
  fullName: {
    type: String,
    required: [true, 'Họ tên là bắt buộc'],
    trim: true,
  },
  role: {
    type: String,
    enum: ['SUPER_ADMIN', 'ORGANIZATION_ADMIN', 'STAFF', 'VIEWER'],
    default: 'STAFF',
  },
  authProvider: {
    type: String,
    enum: ['LOCAL', 'GOOGLE'],
    default: 'LOCAL',
  },
  permissions: [{
    type: String,
  }],
  status: {
    type: String,
    enum: ['ACTIVE', 'LOCKED', 'INVITED'],
    default: 'ACTIVE',
  },
  lastLoginAt: {
    type: Date,
    default: null,
  },
  googleId: {
    type: String,
    default: null,
  },
  deletedAt: {
    type: Date,
    default: null,
  }
}, {
  timestamps: true,
});

userSchema.index({ organizationId: 1, email: 1 }, { unique: true });
userSchema.index({ organizationId: 1, role: 1 });

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

userSchema.pre('save', async function(next) {
  if (!this.isModified('passwordHash')) return next();
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

export const User = mongoose.model('User', userSchema);
