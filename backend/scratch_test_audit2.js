import { connectDB } from './src/config/db.js';
import { auditLogService } from './src/services/audit-log.service.js';
import mongoose from 'mongoose';

const testAuditNull = async () => {
  try {
    await connectDB();
    const req = {
      user: { _id: new mongoose.Types.ObjectId() },
      tenantContext: {
        organizationId: "null"
      },
      headers: {},
      socket: {}
    };
    await auditLogService.logAction(req, 'PASSWORD_CHANGED', 'user', req.user._id);
  } catch (error) {
    console.error('Audit Log Error caught at top level:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};
testAuditNull();
