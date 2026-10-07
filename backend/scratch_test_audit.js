import { connectDB } from './src/config/db.js';
import { auditLogService } from './src/services/audit-log.service.js';
import mongoose from 'mongoose';

const testAudit = async () => {
  try {
    await connectDB();
    const req = {
      user: { _id: new mongoose.Types.ObjectId() },
      tenantContext: {
        organizationId: ""
      },
      headers: {},
      socket: {}
    };
    console.log('Testing audit log with organizationId: ""');
    await auditLogService.logAction(req, 'PASSWORD_CHANGED', 'user', req.user._id);
    console.log('Audit log successfully created');
  } catch (error) {
    console.error('Audit Log Error caught at top level:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};
testAudit();
