import { connectDB } from './src/config/db.js';
import { User } from './src/models/user.model.js';
import { Organization } from './src/models/organization.model.js';
import { userRepository } from './src/repositories/user.repository.js';
import { authService } from './src/services/auth.service.js';
import { auditLogService } from './src/services/audit-log.service.js';
import jwt from 'jsonwebtoken';
import { config } from './src/config/env.js';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const testFullFlow = async () => {
  try {
    await connectDB();
    const user = await User.findOne({ email: 'admin@gmail.com' });
    const token = jwt.sign({ id: user._id, email: user.email, role: user.role, organizationId: null }, config.jwtSecret);
    
    const req = {
      headers: { 'x-organization-id': '' },
      socket: { remoteAddress: '127.0.0.1' },
      body: { oldPassword: 'newhash', newPassword: 'newpassword123' }
    };

    const decoded = jwt.verify(token, config.jwtSecret);
    const fetchedUser = await userRepository.findById(decoded.id, null, { populate: 'organizationId' });
    req.user = fetchedUser;

    const activeOrgId = req.headers['x-organization-id'] || (fetchedUser.organizationId ? (fetchedUser.organizationId._id || fetchedUser.organizationId) : null);
    req.tenantContext = {
      userId: fetchedUser._id,
      organizationId: activeOrgId,
      role: fetchedUser.role,
      permissions: fetchedUser.permissions || [],
      allowedOrgIds: [],
    };
    
    console.log('Changing password...');
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('newhash', salt);
    await User.updateOne({ _id: user._id }, { $set: { passwordHash: hash } });

    await authService.changePassword(req.user._id, 'newhash', 'newpassword123');
    console.log('Password changed! Logging action...');
    
    await auditLogService.logAction(req, 'PASSWORD_CHANGED', 'user', req.user._id);

    console.log('Full flow success!');
  } catch (error) {
    console.error('Flow Error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};
testFullFlow();
